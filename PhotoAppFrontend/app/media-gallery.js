import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, Image, TouchableOpacity, FlatList, Alert, 
  ActivityIndicator, StatusBar, Modal, Dimensions, ScrollView,
  TouchableWithoutFeedback, Platform, ActionSheetIOS 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av'; 
import API_URL from '../config';
import mediaStyles from '../styles/mediaStyles';
// EKLENDİ: İnternet kontrolü için kütüphane
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');

export default function MediaGalleryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { groupId, userId } = params;

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Full Screen Viewer State
  const [isViewerVisible, setViewerVisible] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [areControlsVisible, setControlsVisible] = useState(true);
  
  // SELECTION MODE STATE
  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Current Media Index
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const fullScreenListRef = useRef(null);

  // --- INTERNET CHECK LOGIC ---
  useEffect(() => {
    NetInfo.fetch(); // Kütüphaneyi uyandır
  }, []);

  const checkInternetConnection = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected === false) {
          Alert.alert("Bağlantı Hatası", "Lütfen bir internete bağlı olduğunuzdan emin olun.");
          return false;
      }
      return true;
  };

  // --- FETCH PHOTOS ---
  const fetchPhotos = async () => {
    try {
      const response = await fetch(`${API_URL}/group-photos?group_id=${groupId}&user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // --- UPLOAD HANDLER (GÜNCELLENDİ: İNTERNET KONTROLÜ) ---
  const handleUpload = async () => {
    // 1. İNTERNET KONTROLÜ
    const hasInternet = await checkInternetConnection();
    if (!hasInternet) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("İzin Gerekli", "Galeri erişimi reddedildi.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, 
      allowsMultipleSelection: true, 
      quality: 1.0, 
    });

    if (!result.canceled) {
      setUploading(true);
      for (const asset of result.assets) {
        await uploadSingleFile(asset);
      }
      setUploading(false);
      fetchPhotos(); 
    }
  };

  const uploadSingleFile = async (asset) => {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('group_id', groupId);
      
      const filename = asset.uri.split('/').pop();
      let type = 'image/jpeg';
      
      if (asset.type === 'video' || filename.endsWith('.mp4') || filename.endsWith('.mov')) {
          type = 'video/mp4';
      }
      
      formData.append('photo', {
        uri: asset.uri,
        name: filename,
        type: type,
      });

      await fetch(`${API_URL}/upload-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // --- SELECTION LOGIC ---
  const toggleSelectionMode = () => {
      setSelectionMode(!isSelectionMode);
      setSelectedIds([]);
      setShowOptions(false); 
  };

  const toggleSelection = (id) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(item => item !== id));
      } else {
          if (selectedIds.length >= 30) {
              Alert.alert("Uyarı", "Maksimum 30 tane seçebilirsiniz.");
              return;
          }
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleBulkActionPress = () => {
      if (selectedIds.length === 0) return;

      Alert.alert(
          "Seçilenleri Yönet",
          "Ne yapmak istersiniz?",
          [
              { text: "İptal", style: "cancel" },
              { text: "Kaydet", onPress: handleBulkSave },
              { text: "Kaldır", style: 'destructive', onPress: handleBulkRemoveConfirmation }
          ]
      );
  };

  const handleBulkSave = () => {
      Alert.alert("Başarılı", `${selectedIds.length} medya kaydedildi.`);
      toggleSelectionMode();
  };

  const handleBulkRemoveConfirmation = () => {
      // Check ownership of ALL selected photos
      const selectedMedia = photos.filter(p => selectedIds.includes(p.id));
      const allMine = selectedMedia.every(p => p.uploader_id.toString() === userId.toString());

      if (allMine) {
          Alert.alert("Seçilenleri Kaldır", "Seçilen medyaları nasıl kaldırmak istersiniz?", [
              { text: "Vazgeç", style: "cancel" },
              { text: "Kendim için kaldır", onPress: () => processBulkRemove('hide') },
              { text: "Herkes için kaldır", style: 'destructive', onPress: () => processBulkRemove('delete') }
          ]);
      } else {
          Alert.alert("Seçilenleri Gizle", "Seçilen medyaları galerinizden kaldırmak istiyor musunuz? (Başkasına ait medyalar sadece sizin için gizlenir)", [
              { text: "Vazgeç", style: "cancel" },
              { text: "Evet, Kaldır", onPress: () => processBulkRemove('hide') }
          ]);
      }
  };

  // --- BULK ACTION VIA BACKEND ---
  const processBulkRemove = async (type) => {
      // BULK İŞLEMDE DE İNTERNET KONTROLÜ
      const hasInternet = await checkInternetConnection();
      if (!hasInternet) return;

      setLoading(true);
      try {
          // Optimized: Single Request to Backend
          const response = await fetch(`${API_URL}/bulk-action`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true' 
              },
              body: JSON.stringify({
                  user_id: userId,
                  photo_ids: selectedIds,
                  action_type: type // 'delete' or 'hide'
              })
          });

          if (response.ok) {
              Alert.alert("Başarılı", "İşlem tamamlandı.");
              fetchPhotos();
          } else {
              const err = await response.json();
              Alert.alert("Hata", err.error || "İşlem başarısız.");
          }
      } catch (error) {
          console.error(error);
          Alert.alert("Hata", "Sunucu hatası.");
      } finally {
          setLoading(false);
          toggleSelectionMode();
      }
  };

  // --- REPORT LOGIC (Standardized) ---
  const handleReport = () => {
    const currentMedia = photos[currentIndex];
    if (!currentMedia) return;

    const reportOptions = ["Şiddet / Tehlikeli", "Çıplaklık / Cinsellik", "Taciz / Zorbalık", "Nefret Söylemi", "Diğer"];

    if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["İptal", ...reportOptions],
            cancelButtonIndex: 0,
            title: "İçeriği Bildir",
            message: "Bu içeriği neden bildiriyorsunuz?"
          },
          (buttonIndex) => {
            if (buttonIndex !== 0) {
               submitReport(currentMedia.id, reportOptions[buttonIndex - 1]);
            }
          }
        );
    } else {
        Alert.alert(
            "İçeriği Bildir",
            "Bildirim sebebini seçiniz:",
            [
                ...reportOptions.map(opt => ({ text: opt, onPress: () => submitReport(currentMedia.id, opt) })),
                { text: "İptal", style: "cancel" }
            ]
        );
    }
  };

  const submitReport = async (photoId, reason) => {
    const hasInternet = await checkInternetConnection();
    if (!hasInternet) return;

    try {
        const response = await fetch(`${API_URL}/report-content`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true' 
            },
            body: JSON.stringify({
                reporter_id: userId,
                photo_id: photoId,
                reason: reason
            })
        });

        if (response.ok) {
            Alert.alert("Teşekkürler", "Bildiriminiz alındı.");
            setShowOptions(false);
        } else {
            Alert.alert("Hata", "Bildirim gönderilemedi.");
        }
    } catch (error) {
        console.error("Report error:", error);
        Alert.alert("Hata", "Sunucu hatası.");
    }
  };

  const handleSaveToGallery = async () => {
    setShowOptions(false);
    Alert.alert("Bilgi", "Galeriye kaydetme simülasyonu başarılı.");
  };

  // --- REMOVE / HIDE PHOTO LOGIC (UPDATED NAV) ---
  const handleRemove = () => {
    const currentMedia = photos[currentIndex];
    if (!currentMedia) return;
    setShowOptions(false); 

    const isOwner = currentMedia.uploader_id.toString() === userId.toString();

    if (isOwner) {
        Alert.alert(
            "Medyayı Kaldır",
            "Seçenekler:",
            [
                { text: "Vazgeç", style: "cancel" },
                { text: "Kendim için kaldır", onPress: () => performHidePhoto(currentMedia.id) },
                { text: "Herkes için kaldır", style: 'destructive', onPress: () => performDeletePhoto(currentMedia.id) }
            ]
        );
    } else {
        Alert.alert(
            "Medyayı Gizle",
            "Bu medyayı kaldırmak istiyor musunuz?",
            [
                { text: "Vazgeç", style: "cancel" },
                { text: "Evet, Kaldır", onPress: () => performHidePhoto(currentMedia.id) }
            ]
        );
    }
  };

  // --- IMPROVED NAVIGATION AFTER DELETE ---
  const handlePostDeleteNavigation = (deletedId) => {
      // 1. Remove from local list immediately
      const updatedPhotos = photos.filter(p => p.id !== deletedId);
      setPhotos(updatedPhotos);

      // 2. Navigation logic
      if (updatedPhotos.length === 0) {
          setViewerVisible(false); // Close if empty
      } else {
          // Adjust index if needed (if last item was deleted, go back one)
          if (currentIndex >= updatedPhotos.length) {
              setCurrentIndex(updatedPhotos.length - 1);
          }
          // If middle item deleted, currentIndex now points to the next item automatically
      }
  };

  const performHidePhoto = async (photoId) => {
    const hasInternet = await checkInternetConnection();
    if (!hasInternet) return;

    try {
        const response = await fetch(`${API_URL}/hide-photo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, photo_id: photoId })
        });
        if (response.ok) {
            handlePostDeleteNavigation(photoId); 
        }
    } catch (error) { console.error(error); }
  };

  const performDeletePhoto = async (photoId) => {
    const hasInternet = await checkInternetConnection();
    if (!hasInternet) return;

    try {
        const response = await fetch(`${API_URL}/delete-photo?user_id=${userId}&photo_id=${photoId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            handlePostDeleteNavigation(photoId);
        }
    } catch (error) { console.error(error); }
  };

  const toggleControls = () => {
    setControlsVisible(!areControlsVisible);
    if (showOptions) setShowOptions(false); 
  };

  const renderGridItem = ({ item, index }) => {
    const isSelected = selectedIds.includes(item.id);

    return (
        <TouchableOpacity 
          style={[mediaStyles.mediaItem, isSelected && mediaStyles.mediaItemSelected]} 
          onPress={() => {
            if (isSelectionMode) {
                toggleSelection(item.id);
            } else {
                setCurrentIndex(index);
                setViewerVisible(true);
                setControlsVisible(true);
            }
          }}
        >
          <Image source={{ uri: item.thumbnail || item.url }} style={mediaStyles.imageThumbnail} />
          {item.type === 'video' && (
              <Ionicons name="play-circle" size={30} color="#fff" style={mediaStyles.playIconOverlay} />
          )}
          
          {/* SELECTION OVERLAY */}
          {isSelectionMode && (
              <View style={mediaStyles.selectionOverlay}>
                  <Ionicons 
                    name={isSelected ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={isSelected ? "#007AFF" : "#fff"} 
                  />
              </View>
          )}
        </TouchableOpacity>
    );
  };

  const renderFullScreenItem = ({ item }) => {
    return (
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={mediaStyles.fullScreenContent}>
          {item.type === 'video' ? (
             <Video
                source={{ uri: item.url }} 
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true} 
                useNativeControls
                style={mediaStyles.fullVideo}
            />
          ) : (
            <ScrollView
                style={{ width, height }}
                contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}
                maximumZoomScale={3}
                minimumZoomScale={1}
                centerContent={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            >
               <TouchableWithoutFeedback onPress={toggleControls}>
                  <Image source={{ uri: item.url }} style={mediaStyles.fullImage} />
               </TouchableWithoutFeedback>
            </ScrollView>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <View style={mediaStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      
      {/* HEADER */}
      <View style={mediaStyles.headerContainer}>
        {isSelectionMode ? (
            // SELECTION MODE HEADER
            <>
                <TouchableOpacity onPress={toggleSelectionMode}>
                    <Text style={{color:'#fff', fontSize:16, fontWeight:'600'}}>İptal</Text>
                </TouchableOpacity>
                <Text style={mediaStyles.headerTitle}>{selectedIds.length} Seçildi</Text>
                <TouchableOpacity onPress={handleBulkActionPress}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                </TouchableOpacity>
            </>
        ) : (
            // NORMAL HEADER
            <>
                <TouchableOpacity style={mediaStyles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={mediaStyles.headerTitle}>Medya</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity style={{marginRight: 15}} onPress={toggleSelectionMode}>
                        <Text style={{color:'#fff', fontWeight: '600', fontSize: 16}}>Seç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={mediaStyles.addButton} onPress={handleUpload}>
                        {uploading ? <ActivityIndicator color="#fff" /> : <Ionicons name="add" size={32} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </>
        )}
      </View>

      {/* GRID LIST */}
      <View style={{ flex: 1 }}> 
        {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : (
            <FlatList
                data={photos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGridItem}
                numColumns={4}
                contentContainerStyle={{ paddingBottom: 100 }} 
            />
        )}
      </View>

      {/* FULL SCREEN VIEWER */}
      <Modal 
        visible={isViewerVisible} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)} // FIX: Android Back Button Logic
      >
        <View style={mediaStyles.fullScreenContainer}>
            {areControlsVisible && (
                <View style={mediaStyles.topControls}>
                    <TouchableOpacity style={mediaStyles.controlButton} onPress={() => setViewerVisible(false)}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={mediaStyles.controlButton} onPress={() => setShowOptions(!showOptions)}>
                        <Ionicons name="ellipsis-vertical" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

            {showOptions && areControlsVisible && (
                <View style={mediaStyles.optionsMenu}>
                    <TouchableOpacity style={mediaStyles.optionItem} onPress={handleSaveToGallery}>
                        <Text style={mediaStyles.optionText}>Kaydet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={mediaStyles.optionItem} onPress={handleRemove}>
                        <Text style={mediaStyles.optionText}>Kaldır</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[mediaStyles.optionItem, { borderBottomWidth: 0 }]} onPress={handleReport}>
                        <Text style={[mediaStyles.optionText, mediaStyles.reportText]}>Bildir</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                ref={fullScreenListRef}
                data={photos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderFullScreenItem}
                horizontal
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={currentIndex} 
                onViewableItemsChanged={onViewRef.current}
                viewabilityConfig={viewConfigRef.current}
                getItemLayout={(data, index) => (
                    {length: width, offset: width * index, index}
                )}
            />

            {areControlsVisible && (
                <View style={mediaStyles.bottomInfo}>
                    <Text style={mediaStyles.infoText}>
                        {photos[currentIndex]?.uploaded_by}
                    </Text>
                    <Text style={mediaStyles.dateText}>
                        {photos[currentIndex] ? new Date(photos[currentIndex].date).toLocaleDateString() : ''}
                    </Text>
                </View>
            )}
        </View>
      </Modal>
    </View>
  );
}