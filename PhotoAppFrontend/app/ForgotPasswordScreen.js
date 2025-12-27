import React, { useState } from 'react';
import { 
  Text, View, TextInput, TouchableOpacity, Alert, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal 
} from 'react-native';
import { useRouter } from 'expo-router'; 
import auth from '@react-native-firebase/auth'; 
import API_URL from '../config'; 
import authStyles from '../styles/authStyles'; 

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // SMS & Modal States
  const [confirm, setConfirm] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [modalVisible, setModalVisible] = useState(false); 
  
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  const handlePhoneChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setPhoneNumber(numericText);
      setIsPhoneValid(numericText.length === 0 || numericText.length === 10);
    }
  };

  // --- 1. SMS GÖNDER ---
  const handleSendSMS = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Hata', 'Lütfen geçerli bir numara girin.');
      return;
    }

    setLoading(true);
    const formattedPhone = '+90' + phoneNumber;

    try {
      // Firebase SMS
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      setConfirm(confirmation);
      setModalVisible(true);
      setLoading(false);
    } catch (error) {
      console.error("SMS Hatası:", error);
      setLoading(false);
      Alert.alert('Hata', 'SMS gönderilemedi. Numaranızı kontrol edin.');
    }
  };

  // --- 2. KODU DOĞRULA VE ŞİFREYİ SIFIRLA ---
  const handleVerifyAndReset = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli kodu girin.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalı.');
      return;
    }

    setLoading(true);
    try {
      // A) Kodu Doğrula
      await confirm.confirm(verificationCode);
      
      // B) Backend'e Yeni Şifreyi Gönder
      const formattedPhone = '+90' + phoneNumber;
      
      const response = await fetch(`${API_URL}/reset-password-via-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formattedPhone,
          new_password: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalVisible(false);
        Alert.alert('Başarılı', 'Şifreniz değiştirildi. Giriş yapabilirsiniz.', [
          { text: 'Tamam', onPress: () => router.back() } 
        ]);
      } else {
        Alert.alert('Hata', data.error || 'Şifre sıfırlanamadı.');
      }

    } catch (error) {
      console.error('Reset Error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        Alert.alert('Hata', 'Girdiğiniz kod yanlış.');
      } else {
        Alert.alert('Hata', 'Bir sorun oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={authStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={authStyles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        <Text style={authStyles.title}>Şifremi Unuttum</Text>
        <Text style={{textAlign:'center', marginBottom:20, color:'#666'}}>
          Hesabınıza kayıtlı telefon numarasını girin. Size bir doğrulama kodu göndereceğiz.
        </Text>

        <View style={authStyles.inputContainer}>
          <View style={authStyles.phoneContainer}>
             <Text style={authStyles.phonePrefix}>+90</Text>
             <TextInput
                style={authStyles.phoneInput}
                placeholder="555 XXX XX XX"
                placeholderTextColor="#aaa"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="number-pad"
                maxLength={10} 
             />
          </View>
        </View>

        <TouchableOpacity 
            style={authStyles.button} 
            onPress={handleSendSMS} 
            disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={authStyles.buttonText}>Kod Gönder</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={authStyles.linkContainer}>
          <Text style={authStyles.linkText}>Giriş Ekranına Dön</Text>
        </TouchableOpacity>

        {/* --- MODAL (KOD + YENİ ŞİFRE) --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={authStyles.modalOverlay}>
            <View style={authStyles.modalContainer}>
              <Text style={authStyles.modalTitle}>Şifre Yenileme</Text>
              
              <TextInput
                style={authStyles.modalInput}
                placeholder="Kod (123456)"
                placeholderTextColor="#ccc"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TextInput
                style={[authStyles.input, {width:'100%', marginBottom:20}]} 
                placeholder="Yeni Şifre"
                placeholderTextColor="#aaa"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <TouchableOpacity 
                style={authStyles.modalButton} 
                onPress={handleVerifyAndReset}
                disabled={loading}
              >
                 {loading ? <ActivityIndicator color="#fff" /> : <Text style={authStyles.buttonText}>Şifreyi Değiştir</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={authStyles.modalCancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={authStyles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}