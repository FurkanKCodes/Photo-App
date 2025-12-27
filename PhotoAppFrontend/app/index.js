import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, Image, StatusBar, KeyboardAvoidingView, 
  Platform, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as Notifications from 'expo-notifications';
import 'react-native-gesture-handler';
import * as Device from 'expo-device';
import Constants from 'expo-constants'; 
import API_URL from '../config';

// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function LoginScreen() {
  const router = useRouter();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true); 

  // --- CHECK SESSION ON MOUNT ---
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const userSession = await AsyncStorage.getItem('user_session');
        if (userSession) {
          const user = JSON.parse(userSession);
          router.replace({ pathname: '/home', params: { userId: user.id } });
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setCheckingSession(false);
      }
    };
    checkLogin();
  }, []);

  // --- REGISTER FOR PUSH NOTIFICATIONS ---
  const registerForPushNotificationsAsync = async () => {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Bildirim izni verilmedi!');
        return;
      }

      try {
          const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

          token = (await Notifications.getExpoPushTokenAsync({
            projectId: projectId 
          })).data;
          
          console.log("Push Token Alındı:", token);
      } catch (error) {
          console.log("Bildirim Token Hatası (Login Engellenmedi):", error.message);
          token = null; 
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  const updatePushToken = async (userId, token) => {
      if (!token) return;
      try {
          await fetch(`${API_URL}/update-push-token`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true'
              },
              body: JSON.stringify({ user_id: userId, push_token: token })
          });
      } catch (e) {
          console.error("Token update failed:", e);
      }
  };

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    // Backend'e gönderirken başına +90 ekliyoruz
    const formattedPhoneNumber = `+90${phoneNumber}`;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ phone_number: formattedPhoneNumber, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
            id: data.user_id,
            username: data.username,
            profile_image: data.profile_image 
        };
        await AsyncStorage.setItem('user_session', JSON.stringify(userData));

        try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                await updatePushToken(data.user_id, token);
            }
        } catch (tokenErr) {
            console.log("Token süreci hatası:", tokenErr);
        }

        Alert.alert('Başarılı', 'Giriş yapıldı!');
        router.replace({ pathname: '/home', params: { userId: data.user_id } });
      } else {
        Alert.alert('Hata', data.error || 'Giriş başarısız.');
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert('Hata', 'Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
      return (
          <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff'}}>
              <ActivityIndicator size="large" color="#007AFF" />
          </View>
      );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#fff' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Photo App</Text>
        </View>

        <View style={styles.formContainer}>
          
          {/* --- TELEFON GİRİŞ ALANI (TEK CONTAINER GÖRÜNÜMÜ) --- */}
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+90</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Telefon Numarası (555...)"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="number-pad"
              maxLength={10} 
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/ForgotPasswordScreen')} style={{marginBottom: 15}}>
            <Text style={styles.linkText}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>Hesabın yok mu? Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 100, height: 100, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  formContainer: { width: '100%' },
  
  // Normal Input Stili (Şifre vb. için)
  input: { 
    height: 50, 
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    marginBottom: 15, 
    fontSize: 16, 
    backgroundColor: '#f9f9f9' 
  },

  // Yeni Telefon Input Container Yapısı
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    marginBottom: 15
  },
  countryCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333'
  },

  button: { backgroundColor: '#007AFF', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#007AFF', textAlign: 'center', fontSize: 16 },
});