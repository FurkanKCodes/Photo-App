import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, Text, Image, TouchableOpacity, FlatList, Alert, 
  ActivityIndicator, StatusBar, Modal, Dimensions, ScrollView,
  TouchableWithoutFeedback, Platform, ActionSheetIOS, SectionList 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av'; 
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'; 

import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
// --- YENİ EKLENEN: Tarih sıfırlama için gerekli ---
import * as ImageManipulator from 'expo-image-manipulator';

import API_URL from '../config';
import mediaStyles from '../styles/mediaStyles';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');
const defaultUserImage = require('../assets/no-pic.jpg'); 

const COLUMN_OPTIONS = [2, 3, 4, 6, 8];

export default function MediaGalleryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { groupId, userId } = params;

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // --- FILTER STATES ---
  const [members, setMembers] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]); // Aktif filtre
  const [tempSelectedMemberIds, setTempSelectedMemberIds] = useState([]); // Modal içindeki geçici seçim

  // --- DYNAMIC COLUMNS STATE ---
  const [numColumns, setNumColumns] = useState(4); // Varsayılan 4

  // --- SCROLL BUBBLE STATES ---
  const [scrollDate, setScrollDate] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef(null);

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

  // --- PINCH GESTURE LOGIC ---
  const isZoomProcessed = useRef(false);
  
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      isZoomProcessed.current = false;
    })
    .onUpdate((e) => {
      if (isZoomProcessed.current) return;

      const scale = e.scale;
      const currentIndex = COLUMN_OPTIONS.indexOf(numColumns);

      // ZOOM IN (Büyütme -> Sütun Sayısı Azalır)
      if (scale > 1.5 && currentIndex > 0) {
         try {
             setNumColumns(COLUMN_OPTIONS[currentIndex - 1]);
             isZoomProcessed.current = true;
         } catch(err) {}
      }

      // ZOOM OUT (Küçültme -> Sütun Sayısı Artar)
      if (scale < 0.6 && currentIndex < COLUMN_OPTIONS.length - 1) {
         try {
             setNumColumns(COLUMN_OPTIONS[currentIndex + 1]);
             isZoomProcessed.current = true;
         } catch(err) {}
      }
    })
    .runOnJS(true);

  // --- INTERNET CHECK LOGIC ---
  useEffect(() => {
    NetInfo.fetch(); 
  }, []);

  const checkInternetConnection = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected === false) {
          Alert.alert("Bağlantı Hatası", "Lütfen bir internete bağlı olduğunuzdan emin olun.");
          return false;
      }
      return true;
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      // 1. Fotoları Çek
      const photoRes = await fetch(`${API_URL}/group-photos?group_id=${groupId}&user_id=${userId}`);
      if (photoRes.ok) {
        const data = await photoRes.json();
        setPhotos(data);
      }

      // 2. Üyeleri Çek (Filtreleme için)
      const memberRes = await fetch(`${API_URL}/get-group-members?group_id=${groupId}&current_user_id=${userId}`);
      if (memberRes.ok) {
          const memberData = await memberRes.json();
          memberData.sort((a, b) => a.username.localeCompare(b.username));
          setMembers(memberData);
          
          // Varsayılan: Herkes seçili
          const allIds = memberData.map(m => m.id.toString());
          setSelectedMemberIds(allIds);
          setTempSelectedMemberIds(allIds);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- TIMELINE GROUPING LOGIC (FİLTRELİ) ---
  const groupedPhotos = useMemo(() => {
    // 1. ADIM: Filtreleme
    const filteredPhotos = photos.filter(p => selectedMemberIds.includes(p.uploader_id.toString()));

    if (!filteredPhotos || filteredPhotos.length === 0) return [];

    const sections = [];
    const now = new Date();
    
    const buckets = {
        today: [],
        thisWeek: [],
        thisMonth: [],
        thisYear: [],
        older: {} 
    };

    filteredPhotos.forEach(photo => {
        const date = new Date(photo.date);
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (date.toDateString() === now.toDateString()) {
            buckets.today.push(photo);
        } else if (diffDays <= 7) {
            buckets.thisWeek.push(photo);
        } else if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            buckets.thisMonth.push(photo);
        } else if (date.getFullYear() === now.getFullYear()) {
            buckets.thisYear.push(photo);
        } else {
            const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (!buckets.older[key]) buckets.older[key] = [];
            buckets.older[key].push(photo);
        }
    });

    // Chunk array based on CURRENT numColumns state
    const chunkArray = (array, size) => {
        const results = [];
        for (let i = 0; i < array.length; i += size) {
            results.push(array.slice(i, i + size));
        }
        return results;
    };

    if (buckets.today.length > 0) {
        sections.push({ title: 'Bugün', data: chunkArray(buckets.today, numColumns) });
    }
    if (buckets.thisWeek.length > 0) {
        sections.push({ title: 'Bu Hafta', data: chunkArray(buckets.thisWeek, numColumns) });
    }
    if (buckets.thisMonth.length > 0) {
        sections.push({ title: 'Bu Ay', data: chunkArray(buckets.thisMonth, numColumns) });
    }
    if (buckets.thisYear.length > 0) {
        sections.push({ title: 'Bu Yıl', data: chunkArray(buckets.thisYear, numColumns) });
    }
    
    Object.keys(buckets.older).forEach(key => {
        sections.push({ title: key, data: chunkArray(buckets.older[key], numColumns) });
    });

    return sections;
  }, [photos, numColumns, selectedMemberIds]);

  // --- FILTER LOGIC ---
  const handleOpenFilter = () => {
      setTempSelectedMemberIds(selectedMemberIds); 
      setFilterModalVisible(true);
  };

  const toggleMemberFilter = (id) => {
      const idStr = id.toString();
      
      // "Herkes" seçeneği
      if (id === 'all') {
          const allIds = members.map(m => m.id.toString());
          if (tempSelectedMemberIds.length === members.length) {
              return; 
          } else {
              setTempSelectedMemberIds(allIds);
          }
          return;
      }

      // Tekil Seçim
      if (tempSelectedMemberIds.includes(idStr)) {
          if (tempSelectedMemberIds.length === 1) {
              Alert.alert("Uyarı", "En az bir kişi seçili olmalıdır.");
              return;
          }
          setTempSelectedMemberIds(tempSelectedMemberIds.filter(mid => mid !== idStr));
      } else {
          setTempSelectedMemberIds([...tempSelectedMemberIds, idStr]);
      }
  };

  const applyFilter = () => {
      setSelectedMemberIds(tempSelectedMemberIds);
      setFilterModalVisible(false);
  };

  const isAllSelected = tempSelectedMemberIds.length === members.length;

  // --- SCROLL HANDLERS ---
  const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
  };

  const handleScrollEnd = () => {
      scrollTimeout.current = setTimeout(() => {
          setIsScrolling(false);
      }, 1000); 
  };

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 10 }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
      if (viewableItems.length > 0) {
          const firstItem = viewableItems[0];
          if (firstItem.section && firstItem.section.title) {
              setScrollDate(firstItem.section.title);
          }
      }
  }).current;


  // --- UPLOAD HANDLER ---
  const handleUpload = async () => {
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
      fetchData(); 
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

  // --- GÜNCELLENEN FONKSİYON: GALERİYE KAYDETME (METADATA SIFIRLAMA) ---
  const saveFileToGallery = async (remoteUrl) => {
    // 1. İzin İste
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert("İzin Gerekli", "Galeriye kaydetmek için medya erişim izni vermelisiniz.");
        return false;
    }

    try {
        const extension = remoteUrl.split('.').pop();
        // Benzersiz bir dosya adı oluşturuyoruz
        const tempFilename = `temp_dl_${Date.now()}.${extension}`;
        const tempUri = FileSystem.documentDirectory + tempFilename;

        // 2. Dosyayı indir
        const { uri: downloadedUri } = await FileSystem.downloadAsync(remoteUrl, tempUri);
        
        let finalUri = downloadedUri;

        // 3. Metadata Sıfırlama (ImageManipulator Hilesi)
        // Bu işlem dosyanın yeni bir kopyasını oluşturur, böylece "Oluşturulma Tarihi" şu an olur.
        // Sadece resim formatları için geçerlidir.
        const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(extension.toLowerCase());

        if (isImage) {
            const manipulatedResult = await ImageManipulator.manipulateAsync(
                downloadedUri,
                [], // Hiçbir düzenleme yapmadan kopyala
                { format: ImageManipulator.SaveFormat.JPEG, compress: 1.0 } // %100 Kalite
            );
            finalUri = manipulatedResult.uri;
        }

        // 4. Galeriye Kaydet
        await MediaLibrary.createAssetAsync(finalUri);
        
        // 5. Temizlik
        // Oluşturduğumuz geçici dosyaları siliyoruz
        if (finalUri !== downloadedUri) {
            // Manipülasyon sonucu oluşan dosyayı sil (MediaLibrary zaten kopyasını aldı)
             await FileSystem.deleteAsync(downloadedUri, { idempotent: true });
        } else {
             await FileSystem.deleteAsync(downloadedUri, { idempotent: true });
        }
        
        return true;
    } catch (e) {
        console.error("Save Error:", e);
        return false;
    }
  };

  const handleBulkActionPress = () => {
      if (selectedIds.length === 0) return;

      Alert.alert(
          "Seçilenleri Yönet",
          "Ne yapmak istersiniz?",
          [
              { text: "İptal", style: "cancel" },
              { text: "Kaydet", onPress: handleBulkSave }, // Kaydet artık gerçek fonksiyonu çağırıyor
              { text: "Kaldır", style: 'destructive', onPress: handleBulkRemoveConfirmation }
          ]
      );
  };

  // --- YENİ EKLENEN: TOPLU KAYDETME ---
  const handleBulkSave = async () => {
      Alert.alert("İşlem Başladı", "Seçilen medyalar galeriye kaydediliyor...");
      
      let successCount = 0;
      for (const id of selectedIds) {
          const photo = photos.find(p => p.id === id);
          if (photo) {
              // Yüksek kaliteli URL (original url) kullanılır
              const result = await saveFileToGallery(photo.url); 
              if (result) successCount++;
          }
      }

      Alert.alert("Tamamlandı", `${successCount} adet medya galeriye başarıyla kaydedildi.`);
      toggleSelectionMode();
  };

  const handleBulkRemoveConfirmation = () => {
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

  const processBulkRemove = async (type) => {
      const hasInternet = await checkInternetConnection();
      if (!hasInternet) return;

      setLoading(true);
      try {
          const response = await fetch(`${API_URL}/bulk-action`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true' 
              },
              body: JSON.stringify({
                  user_id: userId,
                  photo_ids: selectedIds,
                  action_type: type 
              })
          });

          if (response.ok) {
              Alert.alert("Başarılı", "İşlem tamamlandı.");
              fetchData();
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

  // --- REPORT & SINGLE ACTIONS ---
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

  // --- YENİ EKLENEN: TEKLİ KAYDETME ---
  const handleSaveToGallery = async () => {
    setShowOptions(false); // Menüyü kapat
    const currentMedia = photos[currentIndex];
    
    if (!currentMedia) return;

    // İşlem başladığını hissettirmek için basit bir uyarı veya direkt işlem
    const success = await saveFileToGallery(currentMedia.url);

    if (success) {
        Alert.alert("Başarılı", "Medya galeriye kaydedildi.");
    } else {
        Alert.alert("Hata", "Kaydetme işlemi başarısız oldu.");
    }
  };

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

  const handlePostDeleteNavigation = (deletedId) => {
      const updatedPhotos = photos.filter(p => p.id !== deletedId);
      setPhotos(updatedPhotos);
      if (updatedPhotos.length === 0) {
          setViewerVisible(false);
      } else {
          if (currentIndex >= updatedPhotos.length) {
              setCurrentIndex(updatedPhotos.length - 1);
          }
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

  // --- RENDERERS ---
  
  const renderSectionHeader = ({ section: { title } }) => (
    <View style={mediaStyles.sectionHeaderContainer}>
        <Text style={mediaStyles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderRow = ({ item }) => {
      return (
          <View style={mediaStyles.rowContainer}>
              {item.map((photo) => {
                  const isSelected = selectedIds.includes(photo.id);
                  const itemWidth = width / numColumns;
                  
                  return (
                    <TouchableOpacity 
                        key={photo.id}
                        style={[mediaStyles.mediaItem, isSelected && mediaStyles.mediaItemSelected, { width: itemWidth, height: itemWidth }]} 
                        onPress={() => {
                            if (isSelectionMode) {
                                toggleSelection(photo.id);
                            } else {
                                const globalIndex = photos.findIndex(p => p.id === photo.id);
                                setCurrentIndex(globalIndex !== -1 ? globalIndex : 0);
                                setViewerVisible(true);
                                setControlsVisible(true);
                            }
                        }}
                    >
                        <Image source={{ uri: photo.thumbnail || photo.url }} style={mediaStyles.imageThumbnail} />
                        {photo.type === 'video' && (
                            <Ionicons name="play-circle" size={30} color="#fff" style={mediaStyles.playIconOverlay} />
                        )}
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
              })}
          </View>
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
    // Gesture Handler Root is required for gestures to work
    <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={mediaStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        
        {/* HEADER */}
        <View style={mediaStyles.headerContainer}>
            {isSelectionMode ? (
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
                <>
                    <TouchableOpacity style={mediaStyles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={32} color="#fff" />
                    </TouchableOpacity>
                    <Text style={mediaStyles.headerTitle}>Medya</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        {/* FİLTRE BUTONU */}
                        <TouchableOpacity style={{marginRight: 15}} onPress={handleOpenFilter}>
                            <Ionicons name="filter" size={24} color="#fff" />
                        </TouchableOpacity>

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

        {/* TIMELINE LIST (SectionList with Pinch Gesture) */}
        <View style={{ flex: 1 }}> 
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
            ) : (
                <GestureDetector gesture={pinchGesture}>
                    <SectionList
                        sections={groupedPhotos}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderRow}
                        renderSectionHeader={renderSectionHeader}
                        stickySectionHeadersEnabled={true}
                        
                        // SCROLL EVENTS FOR BUBBLE
                        onScroll={handleScroll}
                        onScrollBeginDrag={handleScroll}
                        onScrollEndDrag={handleScrollEnd}
                        onMomentumScrollEnd={handleScrollEnd}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}

                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View style={{alignItems:'center', marginTop: 50}}>
                                <Text style={{color:'#999'}}>Henüz medya yok.</Text>
                            </View>
                        }
                    />
                </GestureDetector>
            )}

            {/* --- DYNAMIC SCROLL DATE BUBBLE --- */}
            {isScrolling && scrollDate !== '' && (
                <View style={mediaStyles.scrollBubble}>
                    <Text style={mediaStyles.scrollBubbleText}>{scrollDate}</Text>
                </View>
            )}
        </View>

        {/* --- FILTER MODAL (YENİ EKLENDİ) --- */}
        <Modal 
            visible={filterModalVisible} 
            transparent={true} 
            animationType="slide"
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <View style={mediaStyles.filterModalOverlay}>
                <View style={mediaStyles.filterModalContainer}>
                    <View style={mediaStyles.filterHeader}>
                        <Text style={mediaStyles.filterTitle}>Yükleyen Kişi Filtresi</Text>
                        <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={mediaStyles.filterContent}>
                        {/* Everyone Option */}
                        <TouchableOpacity style={mediaStyles.filterRow} onPress={() => toggleMemberFilter('all')}>
                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                <View style={mediaStyles.filterAvatarPlaceholder}>
                                    <Ionicons name="people" size={20} color="#fff" />
                                </View>
                                <Text style={mediaStyles.filterName}>Herkes</Text>
                            </View>
                            <Ionicons 
                                name={isAllSelected ? "checkbox" : "square-outline"} 
                                size={24} 
                                color={isAllSelected ? "#007AFF" : "#ccc"} 
                            />
                        </TouchableOpacity>

                        <View style={mediaStyles.filterSeparator} />

                        {/* Members List */}
                        {members.map(member => {
                            const isSelected = tempSelectedMemberIds.includes(member.id.toString());
                            const thumb = member.thumbnail_url || member.profile_url;
                            return (
                                <TouchableOpacity key={member.id} style={mediaStyles.filterRow} onPress={() => toggleMemberFilter(member.id)}>
                                    <View style={{flexDirection:'row', alignItems:'center'}}>
                                        <Image source={thumb ? {uri: thumb} : defaultUserImage} style={mediaStyles.filterAvatar} />
                                        <Text style={mediaStyles.filterName}>{member.username}</Text>
                                    </View>
                                    <Ionicons 
                                        name={isSelected ? "checkbox" : "square-outline"} 
                                        size={24} 
                                        color={isSelected ? "#007AFF" : "#ccc"} 
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={mediaStyles.filterFooter}>
                        <TouchableOpacity style={mediaStyles.applyButton} onPress={applyFilter}>
                            <Text style={mediaStyles.applyButtonText}>Uygula</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        {/* FULL SCREEN VIEWER */}
        <Modal 
            visible={isViewerVisible} 
            transparent={true} 
            animationType="fade"
            onRequestClose={() => setViewerVisible(false)} 
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
    </GestureHandlerRootView>
  );
}