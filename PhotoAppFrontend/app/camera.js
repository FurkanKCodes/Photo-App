import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
// Expo Camera
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import API_URL from '../config'; 
import cameraStyles from '../styles/cameraStyles';

export default function CameraScreen() {
  const router = useRouter();
  const { groupId, userId } = useLocalSearchParams();

  // --- PERMISSIONS ---
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // --- STATE ---
  const [mode, setMode] = useState('photo'); // 'photo' | 'video'
  const [facing, setFacing] = useState('back');
  
  // Flash States: 'off', 'on', 'auto'
  const [flash, setFlash] = useState('off'); 
  const [showFlashMenu, setShowFlashMenu] = useState(false);

  // Video Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  // --- SECURITY CHECK ---
  useEffect(() => {
    if (!groupId || !userId) {
      console.warn("Error: groupId or userId is missing.");
    }
  }, [groupId, userId]);

  // --- BACKGROUND UPLOAD (Connects to Backend) ---
  const uploadMediaBackground = async (uri, type) => {
    if (!uri) return;
    
    // Log to console (English for workspace)
    console.log(`[Upload] Starting: ${type}`);

    const formData = new FormData();
    const filename = uri.split('/').pop();
    const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';
    
    formData.append('user_id', userId);
    formData.append('group_id', groupId);
    
    // Append file
    formData.append('photo', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: filename,
      type: mimeType,
    });

    try {
      // Send to Backend (Async operation, does not block UI)
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
  const handleCapture = async () => {
    if (!cameraRef.current) return;

    if (mode === 'photo') {
      try {
        // Capture photo with highest quality
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0, // Lossless quality
          skipProcessing: true, // Skip processing for speed
          mirror: facing === 'front', // Mirror selfie
        });
        
        // Upload in background
        uploadMediaBackground(photo.uri, 'photo');
      } catch (error) { console.error("Photo Capture Error:", error); }
    } else {
      // If in video mode, button toggles recording
      if (isRecording) stopVideo(); else startVideo();
    }
  };

  const startVideo = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
      try {
        const video = await cameraRef.current.recordAsync({
            quality: '2160p', // 4K if supported, otherwise highest available
        });
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

  // Check Permissions
  if (!permission) return <View style={cameraStyles.container} />;
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
    <View style={cameraStyles.container}>
      <CameraView
        ref={cameraRef}
        style={cameraStyles.camera}
        facing={facing}
        flash={flash === 'on' ? 'on' : flash === 'off' ? 'off' : 'auto'}
        mode={mode}
        zoom={0} // Zoom disabled (0 = 1x)
      >
        {/* --- TOP CONTROLS --- */}
        <View style={cameraStyles.topControls}>
          {/* Close Button */}
          <TouchableOpacity onPress={() => router.back()} style={cameraStyles.iconButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          {/* FLASH MENU */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Expanded Menu (Opens to the left) */}
            {showFlashMenu && (
                <View style={cameraStyles.flashMenu}>
                    {/* Auto (A) */}
                    <TouchableOpacity onPress={() => { setFlash('auto'); setShowFlashMenu(false); }} style={cameraStyles.flashBtn}>
                        <Ionicons name="flash" size={20} color={flash === 'auto' ? "#FFD700" : "#fff"} />
                        <Text style={[cameraStyles.autoText, { color: flash === 'auto' ? "#FFD700" : "#fff" }]}>A</Text>
                    </TouchableOpacity>
                    
                    {/* Off */}
                    <TouchableOpacity onPress={() => { setFlash('off'); setShowFlashMenu(false); }} style={cameraStyles.flashBtn}>
                        <Ionicons name="flash-off" size={20} color={flash === 'off' ? "#FFD700" : "#fff"} />
                    </TouchableOpacity>

                    {/* On */}
                    <TouchableOpacity onPress={() => { setFlash('on'); setShowFlashMenu(false); }} style={cameraStyles.flashBtn}>
                        <Ionicons name="flash" size={20} color={flash === 'on' ? "#FFD700" : "#fff"} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Main Flash Icon */}
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

        {/* --- TIMER --- */}
        {isRecording && (
          <View style={cameraStyles.timerOverlay}>
            <View style={cameraStyles.redDot} />
            <Text style={cameraStyles.timerText}>{formatTime(duration)}</Text>
          </View>
        )}

        {/* --- BOTTOM CONTROLS --- */}
        <View style={cameraStyles.bottomControls}>
          <View style={{ width: 50 }} />
          
          <TouchableOpacity style={cameraStyles.shutterContainer} onPress={handleCapture}>
            <View style={[
                cameraStyles.shutterInner, 
                mode === 'video' && cameraStyles.videoShutterInner, 
                isRecording && cameraStyles.recordingInner
            ]} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} style={cameraStyles.flipButton}>
            <Ionicons name="camera-reverse" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* --- MODE SELECTOR --- */}
        <View style={cameraStyles.modeContainer}>
          <TouchableOpacity onPress={() => {
            // If recording, stop first, then switch mode
            if (isRecording) {
                stopVideo();
            }
            setMode('photo');
          }}>
            <Text style={[cameraStyles.modeText, mode === 'photo' && cameraStyles.activeMode]}>FOTOĞRAF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => {
            // If already video, do nothing
            if (mode !== 'video') {
                setMode('video');
            }
          }}>
            <Text style={[cameraStyles.modeText, mode === 'video' && cameraStyles.activeMode]}>VİDEO</Text>
          </TouchableOpacity>
        </View>

      </CameraView>
    </View>
  );
}