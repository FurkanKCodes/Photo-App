  import React, { useState, useEffect, useCallback } from 'react';
  import { View, Text, Image, TouchableOpacity, StatusBar, Alert, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
  import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
  import { Ionicons } from '@expo/vector-icons';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import API_URL from '../config'; 
  import profileStyles from '../styles/profileStyles';
  
  const defaultProfileImage = require('../assets/no-pic.jpg');
  
  export default function ProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userId = params.userId;
  
    const [username, setUsername] = useState("Yükleniyor..."); 
    const [profilePic, setProfilePic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(0); 
    
    // Blocked Users Logic
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockedModalVisible, setBlockedModalVisible] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null); // For 3 dots in list
  
    // --- FETCH USER DATA ---
    useFocusEffect(
      useCallback(() => {
        const fetchUserData = async () => {
          try {
            const response = await fetch(`${API_URL}/get-user?user_id=${userId}`, {
               headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            const data = await response.json();
  
            if (response.ok) {
              setUsername(data.username);
              setIsSuperAdmin(data.is_super_admin); 
  
              if (data.thumbnail_url) {
                  setProfilePic(data.thumbnail_url); 
              } else if (data.profile_image) {
                  setProfilePic(`${API_URL}/uploads/${data.profile_image}`);
              } else {
                  setProfilePic(null);
              }
            }
          } catch (error) {
            console.error("Connection error:", error);
          } finally {
            setLoading(false);
          }
        };
  
        if (userId) {
          fetchUserData();
        }
      }, [userId])
    );
  
    // --- FETCH BLOCKED USERS ---
    const fetchBlockedUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/get-blocked-users?user_id=${userId}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if(res.ok) {
                setBlockedUsers(await res.json());
            }
        } catch(e) { console.error(e); }
    };
  
    const handleOpenBlockedUsers = () => {
        fetchBlockedUsers();
        setBlockedModalVisible(true);
    };
  
    const handleUnblockUser = (blockedId) => {
        setActiveMenuId(null);
        Alert.alert(
            "Engeli Kaldır",
            "Kişinin engelini kaldırmak istediğinize emin misiniz?",
            [
                { text: "Hayır", style: "cancel" },
                { text: "Evet", onPress: () => performUnblock(blockedId) }
            ]
        );
    };
  
    const performUnblock = async (blockedId) => {
        try {
            const res = await fetch(`${API_URL}/unblock-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ blocker_id: userId, blocked_id: blockedId })
            });
            if(res.ok) {
                fetchBlockedUsers(); // Refresh list
                Alert.alert("Başarılı", "Engel kaldırıldı.");
            }
        } catch(e) { console.error(e); }
    };
  
    // --- ACTIONS ---
    const handleEditProfile = () => {
      router.push({ pathname: '/edit-profile', params: { userId: userId } });
    };
  
    const handleChangePassword = () => {
      router.push({ pathname: '/change-password', params: { userId: userId } });
    };
  
    const handleLogout = () => {
      Alert.alert(
          "Çıkış Yap",
          "Çıkış yapmak istediğinize emin misiniz?",
          [
              { text: "Hayır", style: "cancel" },
              { 
                  text: "Evet", 
                  style: "destructive",
                  onPress: async () => {
                      try {
                          await AsyncStorage.removeItem('user_session');
                          Alert.alert("Bilgi", "Başarıyla çıkış yapıldı.");
                          router.replace('/'); 
                      } catch (e) {
                          console.error("Logout Error:", e);
                      }
                  }
              }
          ]
      );
    };
  
    const handleDeleteAccount = () => {
      Alert.alert(
          "Hesabı Sil",
          "Emin misiniz? Bu işlem geri alınamaz.",
          [
              { text: "Hayır", style: "cancel" },
              { 
                  text: "Evet, Sil", 
                  style: "destructive",
                  onPress: confirmDeleteAccount
              }
          ]
      );
    };
  
    const confirmDeleteAccount = async () => {
      try {
          const response = await fetch(`${API_URL}/delete-account?user_id=${userId}`, {
              method: 'DELETE',
              headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          
          if (response.ok) {
              await AsyncStorage.removeItem('user_session');
              Alert.alert("Başarılı", "Hesabınız silindi.", [{ text: "Tamam", onPress: () => router.replace('/') }]);
          } else {
              Alert.alert("Hata", "Hesap silinemedi.");
          }
      } catch (error) {
          console.error(error);
          Alert.alert("Hata", "Sunucu hatası.");
      }
    };
  
    // Render Blocked User Item
    const renderBlockedItem = ({ item }) => {
        const isMenuOpen = activeMenuId === item.blocked_id;
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image 
                      source={item.thumbnail_url ? { uri: item.thumbnail_url } : defaultProfileImage} 
                      style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, backgroundColor: '#eee' }}
                    />
                    <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.username}</Text>
                </View>
                
                <View style={{ position: 'relative' }}>
                    <TouchableOpacity onPress={() => setActiveMenuId(isMenuOpen ? null : item.blocked_id)}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#888" />
                    </TouchableOpacity>
                    
                    {isMenuOpen && (
                        <View style={{
                            position: 'absolute', right: 25, top: 0, backgroundColor: 'white', 
                            padding: 10, borderRadius: 5, elevation: 5, zIndex: 10, minWidth: 100,
                            shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:0.2
                        }}>
                            <TouchableOpacity onPress={() => handleUnblockUser(item.blocked_id)}>
                                <Text style={{ color: 'red' }}>Engeli Kaldır</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };
  
    return (
      <View style={profileStyles.container}>
        <StatusBar backgroundColor="#007AFF" barStyle="light-content" />
  
        {/* --- HEADER --- */}
        <View style={profileStyles.headerContainer}>
          <TouchableOpacity style={profileStyles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={profileStyles.headerTitle}>Profilim</Text>
          <View style={{ width: 40 }} />
        </View>
  
        <ScrollView>
          <View style={profileStyles.profileInfoContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <>
                <Image 
                  source={profilePic ? { uri: profilePic } : defaultProfileImage} 
                  style={profileStyles.largeProfileImage}
                />
                <Text style={profileStyles.usernameText}>{username}</Text>
                <TouchableOpacity onPress={handleEditProfile}>
                  <Text style={profileStyles.editProfileText}>Profili Düzenle</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
  
          {/* --- SETTINGS LIST --- */}
          <View style={profileStyles.settingsContainer}>
            
            {/* BLOCKED USERS */}
            <TouchableOpacity style={profileStyles.settingItem} onPress={handleOpenBlockedUsers}>
              <View style={profileStyles.settingLeft}>
                <Ionicons name="ban-outline" size={24} color="#555" style={profileStyles.settingIcon} />
                <Text style={profileStyles.settingText}>Engellenen Kullanıcılar</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
  
            <TouchableOpacity style={profileStyles.settingItem} onPress={handleChangePassword}>
              <View style={profileStyles.settingLeft}>
                <Ionicons name="lock-closed-outline" size={24} color="#555" style={profileStyles.settingIcon} />
                <Text style={profileStyles.settingText}>Şifreyi Değiştir</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
  
            <TouchableOpacity style={profileStyles.settingItem} onPress={handleLogout}>
              <View style={profileStyles.settingLeft}>
                <Ionicons name="log-out-outline" size={24} color="#007AFF" style={profileStyles.settingIcon} />
                <Text style={[profileStyles.settingText, {color: '#007AFF'}]}>Çıkış Yap</Text>
              </View>
            </TouchableOpacity>
  
            <TouchableOpacity style={profileStyles.settingItem} onPress={handleDeleteAccount}>
              <View style={profileStyles.settingLeft}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" style={profileStyles.settingIcon} />
                <Text style={[profileStyles.settingText, profileStyles.deleteAccountText]}>Hesabı Sil</Text>
              </View>
            </TouchableOpacity>
  
            {/* --- ADMIN PANEL BUTTON --- */}
            {isSuperAdmin === 1 && (
               <TouchableOpacity 
                  style={[profileStyles.settingItem, { borderTopWidth: 1, borderColor: '#eee', marginTop: 20 }]}
                  onPress={() => router.push({ pathname: '/admin-panel', params: { userId } })}
               >
                  <View style={profileStyles.settingLeft}>
                      <Ionicons name="shield-checkmark-outline" size={24} color="#FF3B30" style={profileStyles.settingIcon} />
                      <Text style={[profileStyles.settingText, { color: '#FF3B30', fontWeight: 'bold' }]}>
                          Yönetici Paneli
                      </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
               </TouchableOpacity>
            )}
  
          </View>
        </ScrollView>
  
        {/* --- BLOCKED USERS MODAL --- */}
        <Modal visible={blockedModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBlockedModalVisible(false)}>
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ padding: 15, paddingTop: 60, flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF' }}>
                    <TouchableOpacity onPress={() => setBlockedModalVisible(false)}>
                        <Ionicons name="chevron-back" size={30} color="#fff" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold', marginLeft: 20 }}>Engellenen Kullanıcılar</Text>
                </View>
                
                {blockedUsers.length > 0 ? (
                    <FlatList 
                        data={blockedUsers}
                        keyExtractor={(item) => item.blocked_id.toString()}
                        renderItem={renderBlockedItem}
                    />
                ) : (
                    <Text style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>Engellenmiş kullanıcı bulunmamaktadır.</Text>
                )}
            </View>
        </Modal>
  
      </View>
    );
  }