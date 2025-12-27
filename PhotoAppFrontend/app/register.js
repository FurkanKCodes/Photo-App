import React, { useState } from 'react';
import { 
  Text, View, TextInput, TouchableOpacity, Alert, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal 
} from 'react-native';
import { useRouter } from 'expo-router'; 
import auth from '@react-native-firebase/auth'; // Firebase Auth Eklendi
import API_URL from '../config'; 
import authStyles from '../styles/authStyles'; 

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  // --- SMS SYSTEM STATES ---
  const [confirm, setConfirm] = useState(null); // Firebase'den gelen doğrulama objesi
  const [verificationCode, setVerificationCode] = useState(''); // Kullanıcının girdiği kod
  const [modalVisible, setModalVisible] = useState(false); // Pop-up görünürlüğü
  
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);
  
  const router = useRouter();

  const handleEmailChange = (text) => {
    setEmail(text);
    const emailRegex = /^.+@.+\.com$/;
    setIsEmailValid(text.length === 0 || emailRegex.test(text));
  };

  const handlePhoneChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setPhoneNumber(numericText);
      setIsPhoneValid(numericText.length === 0 || numericText.length === 10);
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setIsPasswordValid(text.length === 0 || text.length >= 6);
  };

  const isRegisterEnabled = 
    username.length > 0 && 
    email.length > 0 && isEmailValid && 
    password.length >= 6 && 
    phoneNumber.length === 10;

  // --- ADIM 1: SMS GÖNDERME ---
  const handleSendSMS = async () => {
    if (!isRegisterEnabled) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doğru doldurun.');
      return;
    }

    setLoading(true);
    const formattedPhone = '+90' + phoneNumber;

    try {
      console.log("SMS gönderiliyor:", formattedPhone);
      // Firebase SMS Gönderme Fonksiyonu
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      
      setConfirm(confirmation); // Doğrulama objesini kaydet
      setModalVisible(true); // Pop-up'ı aç
      setLoading(false);
      
    } catch (error) {
      console.error("SMS Hatası:", error);
      setLoading(false);
      
      if (error.code === 'auth/invalid-phone-number') {
        Alert.alert('Hata', 'Telefon numarası geçersiz.');
      } else if (error.code === 'auth/quota-exceeded') {
        Alert.alert('Hata', 'SMS kotası dolu.');
      } else {
        Alert.alert('Hata', 'SMS gönderilemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  // --- ADIM 2: KODU DOĞRULA VE VERİTABANINA KAYDET ---
  const verifyCodeAndRegister = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli kodu girin.');
      return;
    }

    setLoading(true);
    try {
      // 1. Firebase ile kodu doğrula
      await confirm.confirm(verificationCode);
      console.log("Telefon doğrulandı!");

      // 2. Doğrulama başarılıysa Backend'e kaydet
      await registerUserToBackend();

    } catch (error) {
      console.error('Kod Hatası:', error);
      setLoading(false);
      Alert.alert('Hata', 'Girdiğiniz kod hatalı veya süresi dolmuş.');
    }
  };

  // --- ADIM 3: BACKEND KAYIT (Eski handleRegister fonksiyonun) ---
  const registerUserToBackend = async () => {
    try {
      const formattedPhone = '+90' + phoneNumber;

      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
          phone_number: formattedPhone 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalVisible(false); // Modalı kapat
        Alert.alert('Başarılı', 'Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.', [
          { text: 'Tamam', onPress: () => router.back() } 
        ]);
      } else {
        Alert.alert('Kayıt Başarısız', data.message || data.error || 'Bir hata oluştu.');
        // Not: Firebase'de oluştu ama SQL'de oluşamadıysa, kullanıcı Firebase'de kalır. 
        // İdeal senaryoda buradan Firebase user silinmelidir ama şimdilik basit tutuyoruz.
      }
    } catch (error) {
      console.error("Register Error:", error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={authStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={authStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={authStyles.title}>Aramıza Katıl</Text>
        
        <View style={authStyles.inputContainer}>
          <TextInput
            style={authStyles.input}
            placeholder="Kullanıcı Adı"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={authStyles.input}
            placeholder="E-posta Adresi"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {!isEmailValid && (
             <Text style={authStyles.errorText}>Geçerli bir e-posta girin (.com)</Text>
          )}

          <View style={authStyles.phoneContainer}>
             <Text style={authStyles.phonePrefix}>+90</Text>
             <TextInput
                style={authStyles.phoneInput}
                placeholder="Telefon Numarası (555...)"
                placeholderTextColor="#aaa"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="number-pad"
                maxLength={10} 
             />
          </View>
          {!isPhoneValid && (
             <Text style={authStyles.errorText}>Lütfen 10 haneli numarayı girin</Text>
          )}

          <TextInput
            style={authStyles.input}
            placeholder="Şifre"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
          />
          {!isPasswordValid && (
             <Text style={authStyles.errorText}>En az 6 karakter olmalı</Text>
          )}
        </View>

        {/* BUTON ARTIK SMS GÖNDERİYOR */}
        <TouchableOpacity 
            style={[authStyles.button, (!isRegisterEnabled || loading) && authStyles.buttonDisabled]} 
            onPress={handleSendSMS} 
            disabled={!isRegisterEnabled || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={authStyles.buttonText}>Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={authStyles.linkContainer}>
          <Text style={authStyles.linkText}>Zaten hesabın var mı? Giriş Yap</Text>
        </TouchableOpacity>

        {/* --- SMS DOĞRULAMA POP-UP (MODAL) --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
             setModalVisible(!modalVisible);
             setLoading(false);
          }}
        >
          <View style={authStyles.modalOverlay}>
            <View style={authStyles.modalContainer}>
              <Text style={authStyles.modalTitle}>Doğrulama Kodu</Text>
              <Text style={authStyles.modalSubtitle}>
                {`+90 ${phoneNumber} numarasına gönderilen 6 haneli kodu giriniz.`}
              </Text>

              <TextInput
                style={authStyles.modalInput}
                placeholder="123456"
                placeholderTextColor="#ccc"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
              />

              <TouchableOpacity 
                style={authStyles.modalButton} 
                onPress={verifyCodeAndRegister}
                disabled={loading}
              >
                 {loading ? <ActivityIndicator color="#fff" /> : <Text style={authStyles.buttonText}>Doğrula ve Tamamla</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={authStyles.modalCancelButton} 
                onPress={() => {
                    setModalVisible(false);
                    setLoading(false);
                }}
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