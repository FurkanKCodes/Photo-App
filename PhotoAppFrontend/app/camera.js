import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import API_URL from '../config'; 
import cameraStyles from '../styles/cameraStyles';

const { width } = Dimensions.get('window');

// ZOOM YAPILANDIRMASI
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5.0;
const START_ZOOM = 1.2; 

export default function CameraScreen() {
  const router = useRouter();
  const { groupId, userId } = useLocalSearchParams();

  // --- İZİNLER ---
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // --- DURUM (STATE) ---
  const [mode, setMode] = useState('photo'); // 'photo' | 'video'
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  
  // --- ZOOM HESAPLAMASI ---
  // Expo zoom (0-1) değerini hesapla
  const initialExpoZoom = (START_ZOOM - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  
  const [zoom, setZoom] = useState(initialExpoZoom); 
  
  // UI OFFSET: Gerçek değerden 0.2 çıkar
  const [currentZoomLabel, setCurrentZoomLabel] = useState(START_ZOOM - 0.2);

  // Mod değiştiğinde (Video/Foto) zoom'u tekrar 1.2x (UI: 1.0x) ayarına zorla
  useEffect(() => {
      setZoom(initialExpoZoom);
      setCurrentZoomLabel(START_ZOOM - 0.2);
  }, [mode]);

  // Pinch (Kıstırma) Hareketi Değişkenleri
  const baseZoom = useRef(initialExpoZoom);
  const initialPinchDistance = useRef(0);
  
  // Video Kayıt Durumu
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  // Güvenlik Kontrolü
  useEffect(() => {
    if (!groupId || !userId) {
      console.warn("Camera Warning: Missing groupId or userId params.");
    }
  }, [groupId, userId]);

  // --- PINCH TO ZOOM (YAKINLAŞTIRMA) MANTIĞI ---
  const onTouchStart = (e) => {
    if (e.nativeEvent.touches.length === 2) {
      const touch1 = e.nativeEvent.touches[0];
      const touch2 = e.nativeEvent.touches[1];
      const distance = Math.hypot(touch1.pageX - touch2.pageX, touch1.pageY - touch2.pageY);
      
      initialPinchDistance.current = distance;
      baseZoom.current = zoom; // Mevcut zoom seviyesini sakla
    }
  };

  const onTouchMove = (e) => {
    if (e.nativeEvent.touches.length === 2) {
      const touch1 = e.nativeEvent.touches[0];
      const touch2 = e.nativeEvent.touches[1];
      const distance = Math.hypot(touch1.pageX - touch2.pageX, touch1.pageY - touch2.pageY);
      
      // Hassasiyet ayarı
      const scaleFactor = (distance - initialPinchDistance.current) / 500; 
      
      let newExpoZoom = baseZoom.current + scaleFactor;

      // Expo Zoom değerini 0 ile 1 arasına sabitle
      if (newExpoZoom < 0) newExpoZoom = 0;
      if (newExpoZoom > 1) newExpoZoom = 1;
      
      setZoom(newExpoZoom);

      // Ekranda görünecek değeri güncelle
      // Önce gerçek değeri buluyoruz
      const realZoomValue = (newExpoZoom * (MAX_ZOOM - MIN_ZOOM)) + MIN_ZOOM;
      
      // UI'da göstermeden önce 0.2 çıkarıyoruz.
      setCurrentZoomLabel(realZoomValue - 0.2);
    }
  };

  // --- ÇEKİM & YÜKLEME ---
  const uploadMediaBackground = async (uri, type) => {
    if (!uri) return;
    console.log(`[Upload] Starting background upload for ${type}...`);
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';
    formData.append('user_id', userId);
    formData.append('group_id', groupId);
    formData.append('photo', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: filename,
      type: mimeType,
    });
    try {
      await fetch(`${API_URL}/upload-photo`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });
    } catch (e) { console.error(e); }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    if (mode === 'photo') {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0, 
          skipProcessing: false,
          mirror: facing === 'front', 
        });
        let finalUri = photo.uri;
        if (Platform.OS === 'android') {
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                photo.uri,
                [{ resize: { width: photo.width } }], 
                { compress: 1, format: ImageManipulator.SaveFormat.JPEG } 
            );
            finalUri = manipulatedImage.uri;
        }
        uploadMediaBackground(finalUri, 'photo');
      } catch (error) { console.error(error); }
    } else {
      if (isRecording) stopVideo(); else startVideo();
    }
  };

  const startVideo = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
      try {
        const video = await cameraRef.current.recordAsync();
        uploadMediaBackground(video.uri, 'video');
      } catch (e) { stopVideo(); }
    }
  };

  const stopVideo = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!permission) return <View style={cameraStyles.container} />;
  if (!permission.granted) {
    return (
      <View style={cameraStyles.permissionContainer}>
        <Text style={cameraStyles.message}>Kamera izni gerekiyor.</Text>
        <TouchableOpacity style={cameraStyles.permButton} onPress={requestPermission}>
          <Text style={cameraStyles.permText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View 
        style={cameraStyles.container}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
    >
      <CameraView
        ref={cameraRef}
        style={cameraStyles.camera}
        facing={facing}
        flash={flash}
        mode={mode}
        zoom={zoom} 
      >
        {/* --- ÜST KONTROLLER --- */}
        <View style={cameraStyles.topControls}>
          <TouchableOpacity onPress={() => router.back()} style={cameraStyles.iconButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')} style={cameraStyles.iconButton}>
            <Ionicons name={flash === 'on' ? "flash" : "flash-off"} size={24} color={flash === 'on' ? "#FFD700" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* --- SAYAÇ (Video) --- */}
        {isRecording && (
          <View style={cameraStyles.timerOverlay}>
            <View style={cameraStyles.redDot} />
            <Text style={cameraStyles.timerText}>{formatTime(duration)}</Text>
          </View>
        )}

        {/* --- ZOOM GÖSTERGESİ --- */}
        <View style={cameraStyles.zoomIndicatorContainer}>
            <Text style={cameraStyles.zoomText}>{currentZoomLabel.toFixed(1)}x</Text>
        </View>

        {/* --- ALT KONTROLLER --- */}
        <View style={cameraStyles.bottomControls}>
          <View style={{ width: 50 }} />
          <TouchableOpacity style={cameraStyles.shutterContainer} onPress={handleCapture} onLongPress={mode === 'photo' ? startVideo : null}>
            <View style={[cameraStyles.shutterInner, mode === 'video' && cameraStyles.videoShutterInner, isRecording && cameraStyles.recordingInner]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} style={cameraStyles.flipButton}>
            <Ionicons name="camera-reverse" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* --- MOD SEÇİCİ --- */}
        <View style={cameraStyles.modeContainer}>
          <TouchableOpacity onPress={() => setMode('photo')}>
            <Text style={[cameraStyles.modeText, mode === 'photo' && cameraStyles.activeMode]}>FOTOĞRAF</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('video')}>
            <Text style={[cameraStyles.modeText, mode === 'video' && cameraStyles.activeMode]}>VİDEO</Text>
          </TouchableOpacity>
        </View>

      </CameraView>
    </View>
  );
}