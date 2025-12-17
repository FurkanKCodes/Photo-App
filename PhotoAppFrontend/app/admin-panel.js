import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, Modal, Image, Alert, 
  ActivityIndicator, StatusBar, TouchableWithoutFeedback, ScrollView, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av'; // VIDEO IMPORT EKLENDI
import API_URL from '../config';
import adminPanelStyles from '../styles/adminPanelStyles';

export default function AdminPanel() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentUserId = params.userId;

  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // States for Manual Ban
  const [manualBanId, setManualBanId] = useState('');
  const [manualBanPhone, setManualBanPhone] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [banModalVisible, setBanModalVisible] = useState(false);
  const [selectedBannedUser, setSelectedBannedUser] = useState(null);

  useEffect(() => {
    if(currentUserId) {
        if (activeTab === 'reports') fetchReports();
        else if (activeTab === 'banned') fetchBannedUsers();
    }
  }, [currentUserId, activeTab]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/get-reports?admin_id=${currentUserId}`, { headers: { 'ngrok-skip-browser-warning': 'true' }});
      const data = await response.json();
      if (response.ok) setReports(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const fetchBannedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/get-banned-users?admin_id=${currentUserId}`, { headers: { 'ngrok-skip-browser-warning': 'true' }});
      const data = await response.json();
      if (response.ok) setBannedUsers(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleResolveReport = async (action) => {
      if (!selectedReport) return;
      
      if (action === 'ban_user') {
          Alert.alert("DİKKAT", "Kullanıcı tamamen silinecek ve numarası engellenecek. Emin misiniz?", [
              { text: "İptal", style: "cancel" },
              { text: "BANLA VE SİL", style: 'destructive', onPress: () => executeReportAction(action) }
          ]);
      } else {
          executeReportAction(action);
      }
  };

  const executeReportAction = async (action) => {
    try {
        const res = await fetch(`${API_URL}/admin/resolve-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({
                admin_id: currentUserId,
                report_id: selectedReport.report_id,
                action: action
            })
        });
        
        if (res.ok) {
            setReportModalVisible(false);
            fetchReports();
            Alert.alert("Başarılı", "İşlem tamamlandı.");
        } else {
            Alert.alert("Hata", "İşlem başarısız.");
        }
    } catch (e) { console.error(e); }
  };

  const handleUnbanUser = async () => {
      if (!selectedBannedUser) return;
      try {
          const res = await fetch(`${API_URL}/admin/unban-user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
              body: JSON.stringify({
                  admin_id: currentUserId,
                  banned_id: selectedBannedUser.id
              })
          });
          
          if (res.ok) {
              setBanModalVisible(false);
              fetchBannedUsers();
              Alert.alert("Başarılı", "Kullanıcının banı kaldırıldı.");
          }
      } catch (e) { console.error(e); }
  };

  const handleManualBan = async () => {
      if (!manualBanId && !manualBanPhone) {
          Alert.alert("Hata", "Lütfen ID veya Telefon numarası girin.");
          return;
      }

      setManualLoading(true);
      try {
          const res = await fetch(`${API_URL}/admin/manual-ban`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
              body: JSON.stringify({
                  admin_id: currentUserId,
                  target_id: manualBanId,
                  phone: manualBanPhone
              })
          });
          
          const data = await res.json();
          if (res.ok) {
              Alert.alert("Başarılı", "Kullanıcı banlandı ve silindi.");
              setManualBanId('');
              setManualBanPhone('');
          } else {
              Alert.alert("Hata", data.error || "İşlem başarısız.");
          }
      } catch (e) { console.error(e); }
      finally { setManualLoading(false); }
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity 
        style={adminPanelStyles.row} 
        onPress={() => { setSelectedReport(item); setReportModalVisible(true); }}
    >
        <Ionicons name="alert-circle" size={24} color="#FF9500" style={{ marginRight: 10 }} />
        <View style={adminPanelStyles.rowInfo}>
            <Text style={adminPanelStyles.mainText} numberOfLines={1}>{item.reason}</Text>
            <Text style={adminPanelStyles.subText}>Raporlayan: {item.reporter_username}</Text>
            <Text style={[adminPanelStyles.subText, {color: 'red'}]}>Şüpheli: {item.uploader_username}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderBannedUserItem = ({ item }) => (
    <TouchableOpacity 
        style={adminPanelStyles.row} 
        onPress={() => { setSelectedBannedUser(item); setBanModalVisible(true); }}
    >
        <Ionicons name="ban" size={24} color="#FF3B30" style={{ marginRight: 10 }} />
        <View style={adminPanelStyles.rowInfo}>
            <Text style={adminPanelStyles.mainText}>{item.username || "Bilinmeyen Kullanıcı"}</Text>
            <Text style={adminPanelStyles.subText}>Tarih: {new Date(item.banned_at).toLocaleDateString()}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={adminPanelStyles.container}>
      <StatusBar backgroundColor="#007AFF" barStyle="light-content" />
      
      <View style={adminPanelStyles.headerContainer}>
          <TouchableOpacity style={adminPanelStyles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={adminPanelStyles.headerTitle}>Admin Sayfası</Text>
      </View>

      <View style={adminPanelStyles.tabContainer}>
          <TouchableOpacity 
            style={[adminPanelStyles.tabButton, activeTab === 'reports' && adminPanelStyles.activeTab]}
            onPress={() => setActiveTab('reports')}
          >
              <Text style={[adminPanelStyles.tabText, activeTab === 'reports' && adminPanelStyles.activeTabText]}>Raporlar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[adminPanelStyles.tabButton, activeTab === 'banned' && adminPanelStyles.activeTab]}
            onPress={() => setActiveTab('banned')}
          >
              <Text style={[adminPanelStyles.tabText, activeTab === 'banned' && adminPanelStyles.activeTabText]}>Banlananlar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[adminPanelStyles.tabButton, activeTab === 'manual_ban' && adminPanelStyles.activeTab]}
            onPress={() => setActiveTab('manual_ban')}
          >
              <Text style={[adminPanelStyles.tabText, activeTab === 'manual_ban' && adminPanelStyles.activeTabText]}>Kullanıcı Banla</Text>
          </TouchableOpacity>
      </View>

      {/* CONTENT AREA */}
      <View style={{ flex: 1 }}>
          {activeTab === 'manual_ban' ? (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                  <ScrollView contentContainerStyle={adminPanelStyles.formContent}>
                      <Text style={adminPanelStyles.formTitle}>Manuel Kullanıcı Banlama</Text>
                      <Text style={adminPanelStyles.formDesc}>Kullanıcıyı ID veya Telefon numarası ile banlayıp silebilirsiniz.</Text>
                      
                      <View style={adminPanelStyles.inputGroup}>
                          <Text style={adminPanelStyles.label}>Kullanıcı ID:</Text>
                          <TextInput 
                              style={adminPanelStyles.input} 
                              placeholder="Örn: 15" 
                              value={manualBanId}
                              onChangeText={setManualBanId}
                              keyboardType="numeric"
                          />
                      </View>

                      <View style={adminPanelStyles.separator}><Text style={{color:'#999'}}>VEYA</Text></View>

                      <View style={adminPanelStyles.inputGroup}>
                          <Text style={adminPanelStyles.label}>Telefon Numarası:</Text>
                          <TextInput 
                              style={adminPanelStyles.input} 
                              placeholder="Örn: +905..." 
                              value={manualBanPhone}
                              onChangeText={setManualBanPhone}
                              keyboardType="phone-pad"
                          />
                      </View>

                      <TouchableOpacity style={[adminPanelStyles.btn, adminPanelStyles.btnBan, { marginTop: 30 }]} onPress={handleManualBan}>
                          {manualLoading ? <ActivityIndicator color="#fff" /> : <Text style={adminPanelStyles.btnText}>Kullanıcıyı Banla ve Sil</Text>}
                      </TouchableOpacity>
                  </ScrollView>
              </KeyboardAvoidingView>
          ) : (
              loading ? <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 50}} /> : (
                  <FlatList
                    data={activeTab === 'reports' ? reports : bannedUsers}
                    keyExtractor={item => (activeTab === 'reports' ? `rep_${item.report_id}` : `ban_${item.id}`)}
                    renderItem={activeTab === 'reports' ? renderReportItem : renderBannedUserItem}
                    contentContainerStyle={adminPanelStyles.listContent}
                    ListEmptyComponent={<Text style={adminPanelStyles.emptyText}>{activeTab === 'reports' ? 'Bekleyen rapor yok.' : 'Banlanan kullanıcı yok.'}</Text>}
                  />
              )
          )}
      </View>

      {/* --- REPORT DETAIL MODAL --- */}
      <Modal visible={reportModalVisible} animationType="slide" transparent={true} onRequestClose={() => setReportModalVisible(false)}>
        <View style={adminPanelStyles.modalOverlay}>
            <View style={adminPanelStyles.modalContainer}>
                <ScrollView contentContainerStyle={{flexGrow: 1}}>
                    {selectedReport && (
                        <>
                            <View style={adminPanelStyles.modalHeader}>
                                <Text style={adminPanelStyles.modalTitle}>Rapor Detayı</Text>
                                <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            {/* --- MEDIA DISPLAY LOGIC (VIDEO OR IMAGE) --- */}
                            {selectedReport.media_type === 'video' ? (
                                <Video
                                    source={{ uri: selectedReport.photo_url }}
                                    style={adminPanelStyles.evidenceVideo}
                                    useNativeControls
                                    resizeMode={ResizeMode.CONTAIN}
                                    isLooping
                                />
                            ) : (
                                <Image source={{ uri: selectedReport.photo_url }} style={adminPanelStyles.evidenceImage} resizeMode="contain" />
                            )}

                            <View style={adminPanelStyles.detailRow}>
                                <Text style={adminPanelStyles.label}>Sebep:</Text>
                                <Text style={adminPanelStyles.value}>{selectedReport.reason}</Text>
                            </View>
                            <View style={adminPanelStyles.detailRow}>
                                <Text style={adminPanelStyles.label}>Şüpheli:</Text>
                                <Text style={[adminPanelStyles.value, {color:'red'}]}>{selectedReport.uploader_username}</Text>
                            </View>

                            <View style={adminPanelStyles.actionButtons}>
                                <TouchableOpacity style={[adminPanelStyles.btn, adminPanelStyles.btnDismiss]} onPress={() => handleResolveReport('dismiss')}>
                                    <Text style={adminPanelStyles.btnTextDark}>Yoksay</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[adminPanelStyles.btn, adminPanelStyles.btnDelete]} onPress={() => handleResolveReport('delete_content')}>
                                    <Text style={adminPanelStyles.btnText}>İçeriği Sil</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity style={[adminPanelStyles.btn, adminPanelStyles.btnBan]} onPress={() => handleResolveReport('ban_user')}>
                                <Text style={adminPanelStyles.btnText}>KULLANICIYI BANLA VE SİL</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </View>
        </View>
      </Modal>

      {/* --- BANNED USER POPUP --- */}
      <Modal visible={banModalVisible} animationType="fade" transparent={true} onRequestClose={() => setBanModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setBanModalVisible(false)}>
            <View style={adminPanelStyles.modalOverlay}>
                <TouchableWithoutFeedback>
                    <View style={adminPanelStyles.modalContainer}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                            {selectedBannedUser && (
                                <>
                                    <View style={adminPanelStyles.modalHeader}>
                                        <Text style={adminPanelStyles.modalTitle}>Ban Detayı</Text>
                                        <TouchableOpacity onPress={() => setBanModalVisible(false)}>
                                            <Ionicons name="close" size={24} color="#333" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={adminPanelStyles.detailRow}>
                                        <Text style={adminPanelStyles.label}>Kullanıcı Adı:</Text>
                                        <Text style={adminPanelStyles.value}>{selectedBannedUser.username || "-"}</Text>
                                    </View>
                                    
                                    <View style={adminPanelStyles.detailRow}>
                                        <Text style={adminPanelStyles.label}>Telefon:</Text>
                                        <Text style={adminPanelStyles.value}>{selectedBannedUser.phone_number}</Text>
                                    </View>

                                    <View style={adminPanelStyles.detailRow}>
                                        <Text style={adminPanelStyles.label}>Ban Sebebi:</Text>
                                        <Text style={adminPanelStyles.value}>{selectedBannedUser.reason}</Text>
                                    </View>

                                    <TouchableOpacity style={[adminPanelStyles.btn, adminPanelStyles.btnUnban]} onPress={handleUnbanUser}>
                                        <Text style={adminPanelStyles.btnText}>Banı Kaldır</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}