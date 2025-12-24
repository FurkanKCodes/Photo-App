import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
// Expo Camera: Imports the main camera component and permission hook
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import API_URL from '../config'; 
import cameraStyles from '../styles/cameraStyles';

export default function CameraScreen() {
  // Navigation hooks
  const router = useRouter();
  // Get group and user IDs passed from the previous screen
  const { groupId, userId } = useLocalSearchParams();

  // --- PERMISSIONS ---
  // hook to request and check camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  // Reference to the Camera component to call methods like takePictureAsync
  const cameraRef = useRef(null);

  // --- STATE ---
  // Controls whether the camera is in 'picture' mode or 'video' mode
  const [mode, setMode] = useState('picture'); // 'picture' | 'video'
  // Controls camera direction: 'front' (selfie) or 'back'
  const [facing, setFacing] = useState('back');
  
  // Flash States: 'off', 'on', 'auto'
  const [flash, setFlash] = useState('off'); 
  // Toggle for the expanded flash menu (the small menu popping out to the left)
  const [showFlashMenu, setShowFlashMenu] = useState(false);

  // Video Recording State
  const [isRecording, setIsRecording] = useState(false); // Is currently recording?
  const [duration, setDuration] = useState(0); // Duration in seconds
  const timerRef = useRef(null); // Reference for the interval timer

  // Zoom States
  const [zoom, setZoom] = useState(0);
  const startZoom = useRef(0);

  const pinchGesture = Gesture.Pinch()
    .runOnJS(true) // <--- EKLEMEN GEREKEN KRİTİK SATIR BURASI
    .onStart(() => {
      startZoom.current = zoom;
    })
    .onUpdate((event) => {
      const scale = event.scale;
      const velocity = (scale - 1) * 0.5; 
      
      let newZoom = startZoom.current + velocity;

      if (newZoom < 0) newZoom = 0;
      if (newZoom > 1) newZoom = 1;

      setZoom(newZoom);
    });

  // --- SECURITY CHECK ---
  // Ensure that critical IDs are present when the screen loads
  useEffect(() => {
    if (!groupId || !userId) {
      console.warn("Error: groupId or userId is missing.");
    }
  }, [groupId, userId]);
  
  // --- BACKGROUND UPLOAD (Connects to Backend) ---
  // This function handles uploading media without blocking the UI
  const uploadMediaBackground = async (uri, type) => {
    if (!uri) return;
    
    // Log to console (English for workspace)
    console.log(`[Upload] Starting: ${type}`);

    // Create a FormData object to send file + data as multipart/form-data
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';
    
    // Append required fields for the backend
    formData.append('user_id', userId);
    formData.append('group_id', groupId);
    
    // Append the actual file
    formData.append('photo', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, // Fix file path for iOS
      name: filename,
      type: mimeType,
    });

    try {
      // Send to Backend (Async operation, does not block UI)
      // Note: This promise is not awaited, so the UI remains responsive immediately
      fetch(`${API_URL}/upload-photo`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'multipart/form-data',
            'ngrok-skip-browser-warning': 'true' 
        },
        body: formData,
      }).then(res => {
          console.log("[Upload] Server Response:", res.status);
      }).catch(err => {
          console.error("[Upload] Error:", err);
      });

    } catch (e) { console.error(e); }
  };

  // --- CAPTURE PROCESS ---
  // Triggered when the large shutter button is pressed
  const handleCapture = async () => {
    if (!cameraRef.current) return;

    // Check current mode to decide action
    if (mode === 'picture') {
      try {
        // Capture photo with highest quality
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0, // Lossless quality (1.0 = max)
          skipProcessing: true, // Skip processing for speed (faster shutter)
          mirror: facing === 'front', // Mirror selfie so text isn't backwards
        });
        
        // Upload in background immediately after capture
        uploadMediaBackground(photo.uri, 'photo');
      } catch (error) { console.error("Photo Capture Error:", error); }
    } else {
      // If in video mode, button acts as a toggle (Start/Stop)
      if (isRecording) stopVideo(); else startVideo();
    }
  };

  // Logic to start video recording
  const startVideo = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      setDuration(0);
      // Start a 1-second interval to update the UI timer
      timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
      try {
        // Start actual recording
        const video = await cameraRef.current.recordAsync({
            quality: '2160p', // 4K if supported, otherwise highest available
            codec: 'hevc',
        });
        // This line runs only AFTER recording stops (promise resolves on stop)
        uploadMediaBackground(video.uri, 'video');
      } catch (e) { stopVideo(); }
    }
  };

  // Logic to stop video recording
  const stopVideo = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording(); // Stops the camera recording
      setIsRecording(false); // Update state
      clearInterval(timerRef.current); // Stop the UI timer
    }
  };

  // Helper function to format seconds into MM:SS format
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getDisplayZoom = (z) => {
    const minZoom = facing === 'front' ? 1.0 : 0.3;
    const maxZoom = 5.0; 
    const displayValue = minZoom + (z * (maxZoom - minZoom));
    return `${displayValue.toFixed(1)}x`;
  };

  // Check Permissions: if not determined yet, show empty view
  if (!permission) return <View style={cameraStyles.container} />;
  
  // If permission denied, show a button to request it again
  if (!permission.granted) {
    return (
      <View style={cameraStyles.permissionContainer}>
        {/* UI Text remains Turkish */}
        <Text style={cameraStyles.message}>Kamera izni gerekiyor.</Text>
        <TouchableOpacity style={cameraStyles.permButton} onPress={requestPermission}>
          <Text style={cameraStyles.permText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    // 1. GESTURE HANDLER ROOT: Dokunmatik hareketlerin algılanması için en dış katman
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={cameraStyles.container}>
        
        {/* 2. GESTURE DETECTOR: Pinch (kıstırma) hareketini dinler */}
        <GestureDetector gesture={pinchGesture}>
          <CameraView
            ref={cameraRef}
            style={cameraStyles.camera}
            facing={facing} // 'front' veya 'back'
            flash={flash === 'on' ? 'on' : flash === 'off' ? 'off' : 'auto'} // Flash durumu
            mode={mode} // 'picture' veya 'video'
            zoom={zoom} // 3. ZOOM BAĞLANTISI: State'teki zoom değerini buraya veriyoruz
          >
            {/* --- TOP CONTROLS (Close & Flash) --- */}
            <View style={cameraStyles.topControls}>
              {/* Close Button: Önceki ekrana döner */}
              <TouchableOpacity onPress={() => router.back()} style={cameraStyles.iconButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              
              {/* FLASH MENU WRAPPER */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Genişletilmiş Menü (Ana ikonun soluna açılır) */}
                {showFlashMenu && (
                    <View style={cameraStyles.flashMenu}>
                        {/* Seçenek: Otomatik (A) */}
                        <TouchableOpacity onPress={() => { setFlash('auto'); setShowFlashMenu(false); }} style={cameraStyles.flashBtn}>
                            <Ionicons name="flash" size={20} color={flash === 'auto' ? "#FFD700" : "#fff"} />
                            <Text style={[cameraStyles.autoText, { color: flash === 'auto' ? "#FFD700" : "#fff" }]}>A</Text>
                        </TouchableOpacity>
                        
                        {/* Seçenek: Kapalı */}
                        <TouchableOpacity onPress={() => { setFlash('off'); setShowFlashMenu(false); }} style={cameraStyles.flashBtn}>
                            <Ionicons name="flash-off" size={20} color={flash === 'off' ? "#FFD700" : "#fff"} />
                        </TouchableOpacity>

                        {/* Seçenek: Açık */}
                        <TouchableOpacity onPress={() => { setFlash('on'); setShowFlashMenu(false); }} style={cameraStyles.flashBtn}>
                            <Ionicons name="flash" size={20} color={flash === 'on' ? "#FFD700" : "#fff"} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Ana Flash İkonu: Menü görünürlüğünü değiştirir */}
                <TouchableOpacity onPress={() => setShowFlashMenu(!showFlashMenu)} style={cameraStyles.iconButton}>
                    {flash === 'auto' ? (
                        <View>
                            <Ionicons name="flash" size={24} color="#fff" />
                            <Text style={cameraStyles.mainAutoText}>A</Text>
                        </View>
                    ) : (
                        <Ionicons name={flash === 'on' ? "flash" : "flash-off"} size={24} color={flash === 'on' ? "#FFD700" : "#fff"} />
                    )}
                </TouchableOpacity>
              </View>
            </View>

            {/* --- TIMER (Sadece kayıt sırasına görünür) --- */}
            {isRecording && (
              <View style={cameraStyles.timerOverlay}>
                <View style={cameraStyles.redDot} />
                <Text style={cameraStyles.timerText}>{formatTime(duration)}</Text>
              </View>
            )}

            {/* --- BOTTOM CONTROLS (Shutter & Flip) --- */}
            <View style={cameraStyles.bottomControls}>
              {/* Düzeni dengelemek için boşluk */}
              <View style={{ width: 50 }} />
              
              {/* Ana Deklanşör Butonu */}
              <TouchableOpacity style={cameraStyles.shutterContainer} onPress={handleCapture}>
                <View style={[
                    cameraStyles.shutterInner, 
                    mode === 'video' && cameraStyles.videoShutterInner, // Video için şekil değişimi
                    isRecording && cameraStyles.recordingInner // Kayıt sırasında şekil değişimi
                ]} />
              </TouchableOpacity>

              {/* Kamera Çevirme Butonu */}
              <TouchableOpacity onPress={() => {
                  setFacing(f => f === 'back' ? 'front' : 'back');
                  setZoom(0); // <-- EKLE: Kamera dönünce zoom sıfırlansın
              }} style={cameraStyles.flipButton}>
                  <Ionicons name="camera-reverse" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            

            <View style={cameraStyles.zoomIndicator}>
                <Text style={cameraStyles.zoomText}>{getDisplayZoom(zoom)}</Text>
            </View>

            {/* --- MODE SELECTOR (Metin Butonları) --- */}
            <View style={cameraStyles.modeContainer}>
              {/* FOTOĞRAF moduna geçiş */}
              <TouchableOpacity onPress={() => {
                // Kayıt varsa durdur, sonra modu değiştir
                if (isRecording) {
                    stopVideo();
                }
                setMode('picture');
                setZoom(0);
              }}>
                <Text style={[cameraStyles.modeText, mode === 'picture' && cameraStyles.activeMode]}>FOTOĞRAF</Text>
              </TouchableOpacity>
              
              {/* VİDEO moduna geçiş */}
              <TouchableOpacity onPress={() => {
                // Zaten videodaysa bir şey yapma
                if (mode !== 'video') {
                    setMode('video');
                    setZoom(0);
                }
              }}>
                <Text style={[cameraStyles.modeText, mode === 'video' && cameraStyles.activeMode]}>VİDEO</Text>
              </TouchableOpacity>
            </View>

          </CameraView>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}