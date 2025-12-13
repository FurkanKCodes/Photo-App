import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, TouchableOpacity, StatusBar, 
  ScrollView, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Switch 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import * as Clipboard from 'expo-clipboard'; // Panoya kopyalama için
import API_URL from '../config';
import groupDetailsStyles from '../styles/groupDetailsStyles';

const defaultGroupImage = require('../assets/no-pic.jpg'); 
const defaultUserImage = require('../assets/no-pic.jpg');

export default function GroupDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { groupId, userId } = params;

  // --- DATA STATES ---
  const [groupDetails, setGroupDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // --- UI STATES ---
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Edit Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null); 
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // MENU POPUP STATE
  const [activeMenuMemberId, setActiveMenuMemberId] = useState(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const groupRes = await fetch(`${API_URL}/get-group-details?group_id=${groupId}`, { headers: { 'ngrok-skip-browser-warning': 'true' }});
      const groupData = await groupRes.json();
      if (groupRes.ok) setGroupDetails(groupData);

      const membersRes = await fetch(`${API_URL}/get-group-members?group_id=${groupId}&current_user_id=${userId}`, { headers: { 'ngrok-skip-browser-warning': 'true' }});
      const membersData = await membersRes.json();
      if (membersRes.ok) {
        setMembers(membersData);
        const currentUser = membersData.find(m => m.id.toString() === userId.toString());
        setIsAdmin(currentUser?.is_admin === 1);
      }

      const reqRes = await fetch(`${API_URL}/get-group-requests?group_id=${groupId}`, { headers: { 'ngrok-skip-browser-warning': 'true' }});
      if (reqRes.ok) setRequests(await reqRes.json());

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchData();
  }, [groupId, userId]);

  // --- COPY GROUP CODE ---
  const copyGroupCode = async () => {
      if (groupDetails?.group_code) {
          await Clipboard.setStringAsync(groupDetails.group_code);
          Alert.alert("Başarılı", "Grup kodu kopyalandı!");
      }
  };

  // --- ACTION HANDLERS ---
  const handleBlockUser = (targetMember) => {
    setActiveMenuMemberId(null);
    Alert.alert(
        "Kişiyi Engelle",
        "Kişiyi engellemek istediğinize emin misiniz? Karşılıklı olarak birbirinizin gönderdiği medyalara ulaşamayacaksınız.",
        [
            { text: "Hayır", style: "cancel" },
            { 
                text: "Evet", 
                style: "destructive",
                onPress: async () => {
                    try {
                        const response = await fetch(`${API_URL}/block-user`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                            body: JSON.stringify({
                                blocker_id: userId,
                                blocked_id: targetMember.id
                            })
                        });
                        if (response.ok) {
                            Alert.alert("Başarılı", "Kişi engellendi.");
                            fetchData();
                        } else {
                            Alert.alert("Hata", "İşlem başarısız.");
                        }
                    } catch (e) { console.error(e); }
                }
            }
        ]
    );
  };

  const handleUnblockUser = (targetMember) => {
    setActiveMenuMemberId(null);
    Alert.alert(
        "Engeli Kaldır",
        "Kişinin engelini kaldırmak istediğinize emin misiniz?",
        [
            { text: "Hayır", style: "cancel" },
            { 
                text: "Evet", 
                onPress: async () => {
                    try {
                        const response = await fetch(`${API_URL}/unblock-user`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                            body: JSON.stringify({
                                blocker_id: userId,
                                blocked_id: targetMember.id
                            })
                        });
                        if (response.ok) {
                            Alert.alert("Başarılı", "Engel kaldırıldı.");
                            fetchData();
                        } else {
                            Alert.alert("Hata", "İşlem başarısız.");
                        }
                    } catch (e) { console.error(e); }
                }
            }
        ]
    );
  };

  const handlePromoteUser = (targetMember) => {
      setActiveMenuMemberId(null);
      Alert.alert(
          "Onay",
          "Yönetici yapmak istediğinizden emin misiniz?",
          [
              { text: "Hayır", style: "cancel" },
              { text: "Evet", onPress: () => performMemberAction(targetMember.id, 'promote') }
          ]
      );
  };

  const handleKickUser = (targetMember) => {
      setActiveMenuMemberId(null);
      Alert.alert(
          "Onay",
          "Gruptan atmak istediğinize emin misiniz?",
          [
              { text: "Hayır", style: "cancel" },
              { text: "Evet", onPress: () => performMemberAction(targetMember.id, 'kick') }
          ]
      );
  };

  const performMemberAction = async (targetId, action) => {
      try {
          const response = await fetch(`${API_URL}/manage-member`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
              body: JSON.stringify({
                  admin_id: userId,
                  group_id: groupId,
                  target_user_id: targetId,
                  action: action
              })
          });
          if(response.ok) {
              fetchData(); 
              if(action === 'promote') Alert.alert("Başarılı", "Yöneticilik devredildi.");
          } else {
              Alert.alert("Hata", "İşlem başarısız.");
          }
      } catch(e) { console.error(e); }
  };

  const handleRequestAction = async (targetId, action) => {
      if(!isAdmin) { Alert.alert("Yetkisiz", "Sadece yöneticiler isteklere cevap verebilir"); return; }
      try {
          const res = await fetch(`${API_URL}/manage-request`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
              body: JSON.stringify({ admin_id: userId, group_id: groupId, target_user_id: targetId, action })
          });
          if(res.ok) fetchData();
      } catch(e) { console.error(e); }
  };

  const handleToggleJoining = async (value) => {
      if(!isAdmin) { Alert.alert("Yetkisiz", "Sadece yöneticiler değiştirebilir"); return; }
      try {
          const res = await fetch(`${API_URL}/toggle-joining`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
              body: JSON.stringify({ user_id: userId, group_id: groupId, status: value ? 1 : 0 })
          });
          if(res.ok) setGroupDetails(prev => ({ ...prev, is_joining_active: value ? 1 : 0 }));
      } catch(e) { console.error(e); }
  };

  const handleLeaveGroup = () => {
      Alert.alert("Gruptan Ayrıl", "Ayrılmak istediğinize emin misiniz?", [
          { text: "Vazgeç", style: "cancel" },
          { 
              text: "Ayrıl", style: "destructive",
              onPress: async () => {
                  try {
                      const res = await fetch(`${API_URL}/leave-group`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                          body: JSON.stringify({ user_id: userId, group_id: groupId })
                      });
                      if(res.ok) router.replace({ pathname: '/home', params: { userId } });
                  } catch(e) { console.error(e); }
              }
          }
      ]);
  };

  // --- EDIT GROUP ---
  const handleEditGroupPress = () => {
    setEditName(groupDetails?.group_name || '');
    setEditImage(null);
    setHasChanges(false);
    setEditModalVisible(true);
  };
  const onNameChange = (text) => { setEditName(text); checkChanges(text, editImage); };
  const handleEditImageOptions = () => { Alert.alert("Fotoğraf Seç", "Seçenekler:", [{ text: "Kamera", onPress: openCamera }, { text: "Galeri", onPress: openGallery }, { text: "İptal", style: "cancel" }]); };
  const openCamera = async () => { const { status } = await ImagePicker.requestCameraPermissionsAsync(); if (status !== 'granted') return; const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 }); if (!result.canceled) { setEditImage(result.assets[0].uri); checkChanges(editName, result.assets[0].uri); } };
  const openGallery = async () => { const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (status !== 'granted') return; const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 }); if (!result.canceled) { setEditImage(result.assets[0].uri); checkChanges(editName, result.assets[0].uri); } };
  const checkChanges = (newName, newImg) => { setHasChanges(newName.trim() !== groupDetails?.group_name || newImg !== null); };
  
  const handleSaveChanges = async () => { 
      if (!hasChanges) return; setSaving(true); 
      try { 
          const formData = new FormData(); 
          formData.append('user_id', userId); formData.append('group_id', groupId); formData.append('group_name', editName); 
          if (editImage) { 
              const filename = editImage.split('/').pop(); 
              const match = /\.(\w+)$/.exec(filename); const type = match ? `image/${match[1]}` : `image`; 
              formData.append('picture', { uri: editImage, name: filename, type }); 
          } 
          const response = await fetch(`${API_URL}/edit-group`, { method: 'POST', headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' }, body: formData }); 
          if (response.ok) { setEditModalVisible(false); fetchData(); } 
      } catch (error) { Alert.alert("Hata", "Sunucu hatası."); } finally { setSaving(false); } 
  };

  const handleImagePress = (imageUrl) => { 
    if (imageUrl) { 
        setSelectedImage({ uri: imageUrl }); 
        setImageModalVisible(true); 
    } 
  };

  // --- RENDER HELPERS ---
  const renderMemberItem = (item) => {
    const thumbUrl = item.thumbnail_url || item.profile_url;
    const fullImageUrl = item.profile_url || item.thumbnail_url;
    const memberPic = thumbUrl ? { uri: thumbUrl } : defaultUserImage;
    const isCurrentUser = item.id.toString() === userId.toString();
    const isMenuOpen = activeMenuMemberId === item.id;
    const isBlocked = item.is_blocked_by_me === 1;

    const toggleMenu = () => {
        if (isMenuOpen) setActiveMenuMemberId(null);
        else setActiveMenuMemberId(item.id);
    };

    return (
      <View key={item.id} style={[groupDetailsStyles.memberItem, isMenuOpen && { zIndex: 1000, elevation: 1000 }]}>
        <TouchableOpacity onPress={() => !isCurrentUser && fullImageUrl && handleImagePress(fullImageUrl)}>
            <Image source={memberPic} style={groupDetailsStyles.memberImage} />
        </TouchableOpacity>

        <View style={groupDetailsStyles.memberInfo}>
          <Text style={groupDetailsStyles.memberName}>
            {item.username} 
            {isCurrentUser && <Text style={groupDetailsStyles.youTag}> (Sen)</Text>}
            {isBlocked && <Text style={{color: 'red', fontSize: 14}}> (Engellendi)</Text>}
          </Text>
          {item.is_admin === 1 && <Text style={groupDetailsStyles.adminTag}>Yönetici</Text>}
        </View>

        {!isCurrentUser && (
            <View style={{ position: 'relative' }}>
                <TouchableOpacity onPress={toggleMenu} style={groupDetailsStyles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#888" />
                </TouchableOpacity>

                {/* POPUP MENU */}
                {isMenuOpen && (
                    <View style={groupDetailsStyles.popupMenu}>
                        {isBlocked ? (
                             <TouchableOpacity onPress={() => handleUnblockUser(item)} style={groupDetailsStyles.popupMenuItem}>
                                <Text style={groupDetailsStyles.popupMenuText}>Engeli Kaldır</Text>
                             </TouchableOpacity>
                        ) : (
                             <TouchableOpacity onPress={() => handleBlockUser(item)} style={groupDetailsStyles.popupMenuItem}>
                                <Text style={groupDetailsStyles.popupMenuText}>Kişiyi Engelle</Text>
                             </TouchableOpacity>
                        )}

                        {isAdmin && (
                            <>
                                <TouchableOpacity onPress={() => handleKickUser(item)} style={groupDetailsStyles.popupMenuItem}>
                                    <Text style={groupDetailsStyles.popupMenuText}>Gruptan At</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handlePromoteUser(item)} style={[groupDetailsStyles.popupMenuItem, { borderBottomWidth: 0 }]}>
                                    <Text style={groupDetailsStyles.popupMenuText}>Yönetici Yap</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>
        )}
      </View>
    );
  };

  const renderRequestItem = (item) => {
      const pic = item.thumbnail_url ? { uri: item.thumbnail_url } : defaultUserImage;
      return (
          <View key={item.request_id} style={groupDetailsStyles.requestItem}>
              <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                  <Image source={pic} style={groupDetailsStyles.requestImage} />
                  <Text style={groupDetailsStyles.requestName}>{item.username}</Text>
              </View>
              <View style={{flexDirection: 'row'}}>
                  <TouchableOpacity onPress={() => handleRequestAction(item.user_id, 'decline')} style={{marginRight: 15}}>
                      <Ionicons name="close-circle" size={32} color="red" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRequestAction(item.user_id, 'accept')}>
                      <Ionicons name="checkmark-circle" size={32} color="green" />
                  </TouchableOpacity>
              </View>
          </View>
      );
  };

  if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{flex:1}} />;

  const groupThumb = groupDetails?.thumbnail_url || groupDetails?.picture_url;
  const groupOriginal = groupDetails?.picture_url;
  const isJoiningOpen = groupDetails?.is_joining_active === 1;

  return (
    // SCROLL FIX: Removed global TouchableWithoutFeedback wrapper
    <View style={groupDetailsStyles.container}>
      <StatusBar backgroundColor="#007AFF" barStyle="light-content" />

      {/* HEADER */}
      <View style={groupDetailsStyles.headerContainer}>
        <TouchableOpacity style={groupDetailsStyles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={groupDetailsStyles.headerTitle}>{groupDetails?.group_name}</Text>
        <TouchableOpacity style={groupDetailsStyles.mediaButton} onPress={() => router.push({ pathname: '/media-gallery', params: { groupId, userId } })}>
            <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Medya</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 150 }} 
        // scrollEnabled={true} -> Scroll is enabled by default, no need to lock it anymore
      > 
        {/* 1. GROUP INFO */}
        <View style={groupDetailsStyles.groupInfoContainer}>
            <TouchableOpacity onPress={() => groupOriginal && handleImagePress(groupOriginal)}>
                <Image source={groupThumb ? { uri: groupThumb } : defaultGroupImage} style={groupDetailsStyles.largeGroupImage} />
            </TouchableOpacity>
            <Text style={groupDetailsStyles.groupNameText}>{groupDetails?.group_name}</Text>
            
            {/* GROUP CODE SECTION (NEW) */}
            <TouchableOpacity onPress={copyGroupCode} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginRight: 5 }}>
                    {groupDetails?.group_code}
                </Text>
                <Ionicons name="copy-outline" size={18} color="#000" />
            </TouchableOpacity>

            {isAdmin && (
                <TouchableOpacity onPress={handleEditGroupPress} style={groupDetailsStyles.editGroupButton}>
                    <Text style={groupDetailsStyles.editGroupText}>Grubu Düzenle</Text>
                </TouchableOpacity>
            )}
        </View>

        {/* 2. MEMBERS LIST */}
        <Text style={groupDetailsStyles.membersTitle}>Üyeler</Text>
        <View>
            {members.map(member => renderMemberItem(member))}
        </View>

        {/* 3. REQUESTS HEADER & TOGGLE */}
        <View style={groupDetailsStyles.sectionHeader}>
            <Text style={groupDetailsStyles.membersTitle}>İstekler</Text>
            <View style={groupDetailsStyles.toggleContainer}>
                <View style={{alignItems: 'center', marginRight: 10}}>
                    <Text style={groupDetailsStyles.toggleLabel}>Gruba Alımlar</Text>
                    <Text style={[groupDetailsStyles.toggleStatus, {color: isJoiningOpen ? 'green' : 'red'}]}>
                        {isJoiningOpen ? 'Açık' : 'Kapalı'}
                    </Text>
                </View>
                <Switch 
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isJoiningOpen ? "#007AFF" : "#f4f3f4"}
                    onValueChange={handleToggleJoining}
                    value={isJoiningOpen}
                />
            </View>
        </View>

        {/* 4. REQUESTS LIST */}
        <View>
            {requests.length > 0 ? (
                requests.map(req => renderRequestItem(req))
            ) : (
                <Text style={groupDetailsStyles.emptyText}>Şuan bir istek bulunmamaktadır</Text>
            )}
        </View>

        {/* 5. LEAVE BUTTON */}
        <View style={{ alignItems: 'flex-end', marginTop: 20, marginRight: 20 }}>
            <TouchableOpacity 
                style={[groupDetailsStyles.leaveButton, { marginHorizontal: 0, width: 180 }]} 
                onPress={handleLeaveGroup}
            >
                <Ionicons name="log-out-outline" size={24} color="#fff" />
                <Text style={groupDetailsStyles.leaveText}>Gruptan Ayrıl</Text>
            </TouchableOpacity>
        </View>
        
      </ScrollView>

      {/* --- MODALS --- */}
      <Modal visible={isImageModalVisible} transparent={true} animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
        <View style={groupDetailsStyles.modalContainer}>
            <TouchableOpacity style={groupDetailsStyles.modalCloseButton} onPress={() => setImageModalVisible(false)}>
                <Ionicons name="chevron-back" size={32} color="#fff" />
            </TouchableOpacity>
            {selectedImage && <Image source={selectedImage} style={groupDetailsStyles.fullScreenImage} />}
        </View>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalVisible(false)}>
        <View style={groupDetailsStyles.editModalContainer}>
            <View style={groupDetailsStyles.editModalHeader}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="chevron-back" size={30} color="#fff" /></TouchableOpacity>
                <Text style={groupDetailsStyles.editHeaderTitle}>Grubu Düzenle</Text>
                <TouchableOpacity onPress={handleSaveChanges} disabled={!hasChanges || saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={[groupDetailsStyles.saveText, hasChanges ? groupDetailsStyles.activeSave : groupDetailsStyles.inactiveSave]}>Kaydet</Text>}
                </TouchableOpacity>
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={groupDetailsStyles.editContent}>
                    <View style={groupDetailsStyles.editImageContainer}>
                        <TouchableOpacity onPress={() => editImage && handleImagePress(editImage)}>
                            <Image source={editImage ? { uri: editImage } : (groupThumb ? { uri: groupThumb } : defaultGroupImage)} style={groupDetailsStyles.editThumbnail} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleEditImageOptions}>
                            <Text style={groupDetailsStyles.changePhotoText}>Fotoğrafı Değiştir</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={groupDetailsStyles.inputContainer}>
                        <Text style={groupDetailsStyles.inputLabel}>Grup Adı:</Text>
                        <TextInput style={groupDetailsStyles.input} value={editName} onChangeText={onNameChange} placeholder="Grup adı" />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}