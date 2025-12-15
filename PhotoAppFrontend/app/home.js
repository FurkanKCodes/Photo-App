import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, Image, TouchableOpacity, FlatList, Alert, 
  ActivityIndicator, StatusBar, Modal, TextInput, Dimensions,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons'; 
import * as ImagePicker from 'expo-image-picker'; 
// EKLENDİ: İnternet kontrolü için kütüphane
import NetInfo from '@react-native-community/netinfo';
import API_URL from '../config'; 
import homeStyles from '../styles/homeStyles'; 

const defaultProfileImage = require('../assets/no-pic.jpg');
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId; 

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  // Store the profile thumbnail URL here
  const [userProfilePic, setUserProfilePic] = useState(null); 
  
  // UI States (Modals & Tabs)
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('create'); 
  
  // Form States
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupImage, setNewGroupImage] = useState(null); 
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Full Screen Image State
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedGroupImage, setSelectedGroupImage] = useState(null);

  // --- FETCH DATA (GROUPS & PROFILE) ---
  const fetchData = async () => {
    if (!userId) return;
    
    try {
      // 1. Fetch User Groups
      const groupsRes = await fetch(`${API_URL}/my-groups?user_id=${userId}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }

      // 2. Fetch User Profile (To get header thumbnail)
      const userRes = await fetch(`${API_URL}/get-user?user_id=${userId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        // Prioritize thumbnail, fallback to original, else null
        setUserProfilePic(userData.thumbnail_url || userData.profile_url);
      }

    } catch (error) {
      console.error("Connection Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when screen gains focus (e.g. returning from profile update)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [userId])
  );

  // --- IMAGE PICKER HANDLERS ---
  const handleGroupImageOptions = () => {
    Alert.alert(
      "Grup Fotoğrafı",
      "Seçenek Belirleyin:",
      [
        { text: "Kamerayı Aç", onPress: openCamera },
        { text: "Galeriden Seç", onPress: openGallery },
        { text: "İptal", style: "cancel" }
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert("Error", "Camera permission needed.");
        return;
    }
    const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
    });
    if (!result.canceled) {
        setNewGroupImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert("Error", "Gallery permission needed.");
        return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
        setNewGroupImage(result.assets[0].uri);
    }
  };

  // --- UI ACTION HANDLERS ---
  
  // Open Full Screen Image
  const handleImagePress = (originalUrl) => {
    if (originalUrl) {
        setSelectedGroupImage({ uri: originalUrl }); 
        setImageModalVisible(true);
    }
  };

  // --- KAMERA YÖNLENDİRME (GÜNCELLENDİ: İNTERNET KONTROLÜ) ---
  const handleCameraAction = async (groupId) => {
      // 1. İNTERNET KONTROLÜ
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
          Alert.alert("Bağlantı Hatası", "Lütfen bir internete bağlı olduğunuzdan emin olun.");
          return; // Fonksiyonu burada durdur
      }

      // ID kontrolü
      if (!groupId || !userId) {
          Alert.alert("Hata", "Grup veya kullanıcı bilgisi eksik.");
          return;
      }

      // Parametreleri router.push içine obje olarak ekliyoruz
      router.push({
          pathname: '/camera',
          params: { 
              groupId: groupId,
              userId: userId 
          }
      });
  };

  // --- CREATE GROUP LOGIC ---
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("Error", "Please enter group name.");
      return;
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('group_name', newGroupName);

      if (newGroupImage) {
        const filename = newGroupImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('picture', {
          uri: newGroupImage,
          name: filename,
          type: type,
        });
      }

      const response = await fetch(`${API_URL}/create-group`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'multipart/form-data', 
            'ngrok-skip-browser-warning': 'true' 
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", `Group created!\nCode: ${data.group_code}`);
        setModalVisible(false);
        setNewGroupName('');
        setNewGroupImage(null);
        fetchData(); // Refresh list
      } else {
        Alert.alert("Error", data.error || "Failed.");
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- JOIN GROUP LOGIC ---
  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      Alert.alert("Error", "Please enter code.");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/join-group`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify({ user_id: userId, group_code: joinCode }),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Info", data.message);
        setModalVisible(false);
        setJoinCode('');
        fetchData(); 
      } else {
        Alert.alert("Warning", data.message || "Error.");
      }
    } catch (error) {
        Alert.alert("Error", "Connection failed.");
    } finally {
        setActionLoading(false);
    }
  };

  // --- HEADER COMPONENT ---
  const CustomHeader = () => (
    <View style={homeStyles.headerContainer}>
      {/* Profile Image (Clickable) */}
      <TouchableOpacity onPress={() => router.push({ pathname: '/profile', params: { userId: userId } })}>
        <Image 
          source={userProfilePic ? { uri: userProfilePic } : defaultProfileImage} 
          style={homeStyles.profileImage} 
        />
      </TouchableOpacity>
      
      <Text style={homeStyles.headerTitle}>Moments</Text>
      
      {/* Add Button */}
      <TouchableOpacity style={homeStyles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  // --- LIST ITEM RENDERER ---
  const renderGroupItem = ({ item }) => {
    // Logic: Use Thumbnail for Grid, Original for Full Screen
    const thumbUrl = item.thumbnail_url || item.picture_url;
    const originalUrl = item.picture_url;

    return (
      <View style={homeStyles.groupCard}>
        
        {/* Left: Clickable Image (Opens Modal) */}
        <TouchableOpacity onPress={() => handleImagePress(originalUrl)}>
            {thumbUrl ? (
                <Image source={{ uri: thumbUrl }} style={homeStyles.groupImage} />
            ) : (
                <View style={homeStyles.groupIconPlaceholder}>
                    <Ionicons name="people" size={24} color="#fff" />
                </View>
            )}
        </TouchableOpacity>
        
        {/* Center: Clickable Info (Navigates to Details) */}
        <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 10 }} 
            onPress={() => router.push({ pathname: '/group-details', params: { groupId: item.id, userId: userId } })}
        >
            <View style={homeStyles.groupInfo}>
                <Text style={homeStyles.groupName}>{item.group_name}</Text>
            </View>
        </TouchableOpacity>

        {/* Right: Camera Icon */}
        <TouchableOpacity style={{ padding: 5 }} onPress={() => handleCameraAction(item.id)}>
            <Ionicons name="camera-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  if (!userId) {
      return <ActivityIndicator size="large" style={{flex: 1}} />;
  }

  return (
    <View style={homeStyles.container}>
      <StatusBar backgroundColor="#007AFF" barStyle="light-content" />
      <CustomHeader />

      {/* --- CREATE/JOIN MODAL (With Keyboard Avoidance) --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        {/* Changed View to KeyboardAvoidingView */}
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={homeStyles.modalOverlay}
        >
          <View style={homeStyles.modalContainer}>
            
            {/* Close Button */}
            <TouchableOpacity style={homeStyles.closeButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>

            {/* Tabs */}
            <View style={homeStyles.tabContainer}>
              <TouchableOpacity 
                style={[homeStyles.tabButton, activeTab === 'create' && homeStyles.activeTab]}
                onPress={() => setActiveTab('create')}
              >
                <Text style={[homeStyles.tabText, activeTab === 'create' && homeStyles.activeTabText]}>Grup Oluştur</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[homeStyles.tabButton, activeTab === 'join' && homeStyles.activeTab]}
                onPress={() => setActiveTab('join')}
              >
                <Text style={[homeStyles.tabText, activeTab === 'join' && homeStyles.activeTabText]}>Gruba Katıl</Text>
              </TouchableOpacity>
            </View>

            {/* Content (Inside ScrollView to allow scrolling when keyboard is up) */}
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View style={homeStyles.modalContent}>
                {activeTab === 'create' ? (
                    <View style={homeStyles.formContainer}>
                        <TouchableOpacity onPress={handleGroupImageOptions} style={homeStyles.imagePicker}>
                            {newGroupImage ? (
                                <Image source={{ uri: newGroupImage }} style={homeStyles.selectedImage} />
                            ) : (
                                <View style={homeStyles.defaultImagePlaceholder}>
                                    <Ionicons name="camera" size={30} color="#fff" />
                                </View>
                            )}
                            <Text style={homeStyles.selectPhotoText}>Fotoğraf Seçin</Text>
                        </TouchableOpacity>

                        <Text style={homeStyles.label}>Grup Adı:</Text>
                        <TextInput 
                            style={homeStyles.input}
                            placeholder="Örn: Tatil Fotoğrafları"
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                        />

                        <TouchableOpacity 
                            style={homeStyles.actionButton} 
                            onPress={handleCreateGroup}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={homeStyles.actionButtonText}>Oluştur</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={homeStyles.formContainer}>
                        <Text style={homeStyles.label}>Grup Kodu:</Text>
                        <TextInput 
                            style={homeStyles.input}
                            placeholder="Kodu buraya girin"
                            value={joinCode}
                            onChangeText={setJoinCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity 
                            style={homeStyles.actionButton} 
                            onPress={handleJoinGroup}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={homeStyles.actionButtonText}>Katıl</Text>}
                        </TouchableOpacity>
                    </View>
                )}
                </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- FULL SCREEN IMAGE MODAL --- */}
      <Modal visible={isImageModalVisible} transparent={true} animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity 
                style={{ position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 }} 
                onPress={() => setImageModalVisible(false)}
            >
                <Ionicons name="chevron-back" size={32} color="#fff" />
            </TouchableOpacity>
            
            {selectedGroupImage && (
                <Image 
                    source={selectedGroupImage} 
                    style={{ width: width, height: width, resizeMode: 'contain' }} 
                />
            )}
        </View>
      </Modal>

      {/* --- GROUP LIST --- */}
      <View style={homeStyles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderGroupItem}
            contentContainerStyle={homeStyles.listContainer}
            ListEmptyComponent={
              <View style={homeStyles.emptyContainer}>
                <Ionicons name="images-outline" size={64} color="#ccc" />
                <Text style={homeStyles.emptyText}>Grup bulunamadı.</Text>
                <Text style={homeStyles.emptySubText}>Sağ üstteki + butonuna basarak başlayın.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}