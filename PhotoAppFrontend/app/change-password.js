import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StatusBar, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import API_URL from '../config';
// Re-using edit profile styles for consistent look
import editProfileStyles from '../styles/editProfileStyles';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState(''); // "Şifre hatalı"
  const [newPasswordError, setNewPasswordError] = useState(''); // "Minimum 6 karakter"

  // --- VALIDATION ---
  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
    if (text.length > 0 && text.length < 6) {
        setNewPasswordError("Minimum 6 karakter");
    } else {
        setNewPasswordError("");
    }
  };

  const isSaveActive = 
    currentPassword.length > 0 && 
    newPassword.length >= 6 && 
    !loading;

  // --- SAVE ACTION ---
  const handleSave = async () => {
    if (!isSaveActive) return;

    setLoading(true);
    setCurrentPasswordError(''); // Reset previous errors

    try {
        const response = await fetch(`${API_URL}/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                current_password: currentPassword,
                new_password: newPassword
            }),
        });
        
        const data = await response.json();

        if (response.ok) {
            Alert.alert("Başarılı", "Şifreniz güncellendi.", [
                { text: "Tamam", onPress: () => router.back() }
            ]);
        } else {
            // Check specific error from backend
            if (data.error === "Mevcut şifre hatalı") {
                setCurrentPasswordError("Şifre hatalı");
            } else {
                Alert.alert("Hata", data.error || "Güncelleme başarısız.");
            }
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Hata", "Sunucu hatası.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#4e4e4e', '#1a1a1a']} 
      style={editProfileStyles.container}
    >
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />

      {/* HEADER */}
      <View style={editProfileStyles.headerContainer}>
        <TouchableOpacity style={editProfileStyles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        
        <Text style={editProfileStyles.headerTitle}>Şifreyi Değiştir</Text>

        {/* SAVE BUTTON */}
        <TouchableOpacity 
            style={[editProfileStyles.saveButton, !isSaveActive && editProfileStyles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isSaveActive || loading}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
            ) : (
                <Text style={[
                    editProfileStyles.saveButtonText, 
                    isSaveActive ? editProfileStyles.saveTextActive : editProfileStyles.saveTextInactive
                ]}>
                    Kaydet
                </Text>
            )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={editProfileStyles.scrollContent}>
            <View style={[editProfileStyles.formContainer, { marginTop: 30 }]}>
                
                {/* CURRENT PASSWORD */}
                <View style={editProfileStyles.inputGroup}>
                    <Text style={editProfileStyles.inputLabel}>Mevcut şifre:</Text>
                    <TextInput 
                        style={[editProfileStyles.inputField, currentPasswordError ? { borderBottomColor: 'red' } : {}]}
                        value={currentPassword}
                        onChangeText={(text) => { setCurrentPassword(text); setCurrentPasswordError(''); }}
                        placeholder="Mevcut şifrenizi girin"
                        secureTextEntry
                    />
                    {currentPasswordError ? (
                        <Text style={editProfileStyles.errorText}>{currentPasswordError}</Text>
                    ) : null}
                </View>

                {/* NEW PASSWORD */}
                <View style={editProfileStyles.inputGroup}>
                    <Text style={editProfileStyles.inputLabel}>Yeni şifre:</Text>
                    <TextInput 
                        style={[editProfileStyles.inputField, newPasswordError ? { borderBottomColor: 'red' } : {}]}
                        value={newPassword}
                        onChangeText={handleNewPasswordChange}
                        placeholder="Yeni şifrenizi girin"
                        secureTextEntry
                    />
                    {newPasswordError ? (
                        <Text style={editProfileStyles.errorText}>{newPasswordError}</Text>
                    ) : null}
                </View>

            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}