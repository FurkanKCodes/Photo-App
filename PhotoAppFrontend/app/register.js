import React, { useState } from 'react';
import { 
  Text, View, TextInput, TouchableOpacity, Alert, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal 
} from 'react-native';
import { useRouter } from 'expo-router'; 
import auth from '@react-native-firebase/auth'; 
import API_URL from '../config'; 
import authStyles from '../styles/authStyles'; 

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  // --- SMS SYSTEM STATES ---
  const [confirm, setConfirm] = useState(null); 
  const [verificationCode, setVerificationCode] = useState(''); 
  const [modalVisible, setModalVisible] = useState(false); 
  
  // --- AGREEMENT STATES ---
  const [isAgreed, setIsAgreed] = useState(false); 
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  // --- VALIDATION ---
  const isRegisterEnabled = 
    username.length > 0 && 
    email.length > 0 && isEmailValid && 
    password.length >= 6 && 
    phoneNumber.length === 10 &&
    isAgreed;

  // --- STEP 1: SEND SMS ---
  const handleSendSMS = async () => {
    if (!isRegisterEnabled) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun ve sözleşmeleri onaylayın.');
      return;
    }

    setLoading(true);
    const formattedPhone = '+90' + phoneNumber;

    try {
      console.log("Sending SMS to:", formattedPhone);
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      
      setConfirm(confirmation); 
      setModalVisible(true); 
      setLoading(false);
      
    } catch (error) {
      console.error("SMS Error:", error);
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

  // --- STEP 2: VERIFY CODE ---
  const verifyCodeAndRegister = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli kodu girin.');
      return;
    }

    setLoading(true);
    try {
      await confirm.confirm(verificationCode);
      console.log("Phone verified!");
      await registerUserToBackend();
    } catch (error) {
      console.error('Code Error:', error);
      setLoading(false);
      Alert.alert('Hata', 'Girdiğiniz kod hatalı veya süresi dolmuş.');
    }
  };

  // --- STEP 3: BACKEND REGISTRATION ---
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
        setModalVisible(false); 
        Alert.alert('Başarılı', 'Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.', [
          { text: 'Tamam', onPress: () => router.back() } 
        ]);
      } else {
        Alert.alert('Kayıt Başarısız', data.message || data.error || 'Bir hata oluştu.');
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

        {/* --- CHECKBOX AREA --- */}
        <View style={authStyles.checkboxContainer}>
            <TouchableOpacity onPress={() => setIsAgreed(!isAgreed)}>
                <View style={[authStyles.checkbox, isAgreed && authStyles.checkboxSelected]} />
            </TouchableOpacity>

            <View style={authStyles.checkboxTextContainer}>
                <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                    <Text style={authStyles.checkboxLink}>Kullanıcı Sözleşmesini</Text>
                </TouchableOpacity>
                <Text style={authStyles.checkboxLabel}> ve </Text>
                <TouchableOpacity onPress={() => setShowPrivacyModal(true)}>
                    <Text style={authStyles.checkboxLink}>Gizlilik Politikasını</Text>
                </TouchableOpacity>
                <Text style={authStyles.checkboxLabel}> okudum, onaylıyorum.</Text>
            </View>
        </View>

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

        {/* --- SMS MODAL --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => { setModalVisible(!modalVisible); setLoading(false); }}
        >
          <View style={authStyles.modalOverlay}>
            <View style={authStyles.modalContainer}>
              <Text style={authStyles.modalTitle}>Doğrulama Kodu</Text>
              <Text style={authStyles.modalSubtitle}>{`+90 ${phoneNumber} numarasına gönderilen 6 haneli kodu giriniz.`}</Text>
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
              <TouchableOpacity style={authStyles.modalButton} onPress={verifyCodeAndRegister} disabled={loading}>
                 {loading ? <ActivityIndicator color="#fff" /> : <Text style={authStyles.buttonText}>Doğrula ve Tamamla</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={authStyles.modalCancelButton} onPress={() => { setModalVisible(false); setLoading(false); }}>
                <Text style={authStyles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* --- TERMS OF SERVICE MODAL --- */}
        <Modal visible={showTermsModal} animationType="slide" transparent={true} onRequestClose={() => setShowTermsModal(false)}>
            <View style={authStyles.docModalContainer}>
                <View style={authStyles.docModalContent}>
                    <Text style={authStyles.docModalTitle}>Kullanıcı Sözleşmesi</Text>
                    <ScrollView style={authStyles.docScrollView}>
                        <Text style={authStyles.docText}>{termsOfServiceText}</Text>
                    </ScrollView>
                    <TouchableOpacity style={authStyles.docCloseButton} onPress={() => setShowTermsModal(false)}>
                        <Text style={authStyles.buttonText}>Kapat</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* --- PRIVACY POLICY MODAL --- */}
        <Modal visible={showPrivacyModal} animationType="slide" transparent={true} onRequestClose={() => setShowPrivacyModal(false)}>
            <View style={authStyles.docModalContainer}>
                <View style={authStyles.docModalContent}>
                    <Text style={authStyles.docModalTitle}>Gizlilik Politikası</Text>
                    <ScrollView style={authStyles.docScrollView}>
                        <Text style={authStyles.docText}>{privacyPolicyText}</Text>
                    </ScrollView>
                    <TouchableOpacity style={authStyles.docCloseButton} onPress={() => setShowPrivacyModal(false)}>
                        <Text style={authStyles.buttonText}>Kapat</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- EXACT TEXT CONTENT FROM UPLOADED PDFS ---

const privacyPolicyText = `GİZLİLİK POLİTİKASI
Son Güncelleme: 27/12/2025

1. Amaç
Bu Gizlilik Politikası, Uygulama'yı kullanan Kullanıcıların kişisel verilerinin hangi amaçlarla
işlendiğini, nasıl korunduğunu ve Kullanıcıların haklarını açıklar.

2. Toplanan Veriler
Uygulama kapsamında aşağıdaki veri kategorileri işlenebilir:
• Kimlik İletişim: Telefon numarası (SMS doğrulama için), kullanıcı adı, profil bilgileri.
• Hesap ve Plan Bilgileri: Free/Pro plan durumu, günlük upload limitleri ve kullanım
sayaçları.
• Grup Verileri: Grup üyelikleri, rol bilgisi (Admin), katılım istekleri.
• Medya İçeriği: Yüklenen fotoğraf ve videolar, içerik metadata'ları (tarih/saat, uplo-
ader bilgisi).
• Moderasyon Verileri: Report kayıtları, Admin Panel işlem kayıtları (yoksay/sil/ban).
• Teknik Veriler: Hata kayıtları, performans/metrik bilgileri (uygulamanın sağlıklı
çalışması için).

3. Verilerin İşlenme Amaçları
Kişisel veriler aşağıdaki amaçlarla işlenir:
• Telefon numarası ile SMS doğrulama yaparak tekil hesap politikasını sağlamak,
• Grup oluşturma/katılma ve ortak galeri fonksiyonlarını sunmak,
• Plan yönetimi ve günlük upload limitlerini uygulamak,
• Report ve moderasyon süreçlerini yürütmek, güvenliği artırmak,
• Push notification ile bilgilendirme sağlamak (katılma isteği, medya yükleme vb.),
• Uygulama güvenliği, hata ayıklama ve hizmet kalitesini artırmak.

4. Verilerin Paylaşımı
• Kullanıcı verileri üçüncü taraflarla satılmaz.
• Yalnızca hizmetin çalışması için zorunlu teknik sağlayıcılar (örn. SMS sağlayıcısı,
bildirim altyapısı, barındırma/depoma) kapsamında sınırlı paylaşım olabilir.
• Yasal zorunluluk halinde, yetkili kamu kurumlarıyla paylaşım yapılabilir.

5. Medya İçerikleri ve Erişim Kontrolleri
• Medya içerikleri yalnızca ilgili grup üyeleri tarafından görüntülenebilir.
• Kullanıcılar diğer kullanıcıları engelleyebilir. Engelleme durumunda taraflar birbirlerinin
medyalarına erişemez.
• Report edilen içerikler, yalnızca moderasyon amacıyla Admin Panel üzerinden yetkili
kişilerce incelenir.

6. Veri Güvenliği
Sağlayıcı, kişisel verilerin korunması için makul teknik ve idari tedbirleri uygular. Bununla bir-
likte internet ortamında %100 güvenlik garanti edilemez. Kullanıcı, kendi cihaz güvenliğinden
(şifre, ekran kilidi, işletim sistemi güncelliği vb.) de sorumludur.

7. Saklama Süresi
Veriler, hizmetin sunulması için gerekli süre boyunca ve ilgili mevzuatta öngörülen süreler
çerçevesinde saklanır.

8. Hesap Silme ve Verilerin Silinmesi
• Kullanıcı hesabını sildiğinde; kişisel veriler ve içerikler sistemden tamamen silinir.
• Yasal yükümlülük nedeniyle tutulması gereken kayıtlar (varsa) mevzuatın izin verdiği
ölçüde ve süre boyunca saklanabilir.

9. Kullanıcı Hakları
Kullanıcılar; verilerine erişme, düzeltme, silme, işleme itiraz etme gibi haklarını ilgili mevzuat
kapsamında kullanabilir. Talepler için iletişim:

10. Politika Değişiklikleri
Bu politika güncellenebilir. Güncellemeler Uygulama içinde yayınlandığı tarihten itibaren
geçerlidir.

Kabul Beyanı: Kayıt sırasında "Gizlilik Politikası"nı okuduğumu ve kabul ettiğimi onaylarım.`;

const termsOfServiceText = `KULLANICI SÖZLEŞMESİ
Son Güncelleme: 27/12/2025

1. Taraflar ve Kapsam
İşbu Kullanıcı Sözleşmesi ("Sözleşme"), uygulamayı ("Uygulama") kullanan kullanıcı ("Kulla-
nıcı") ile Uygulama'nın sahibi ve işletmecisi ("Sağlayıcı") arasında, Uygulama'nın kullanım
koşullarını düzenler. Uygulama'ya kayıt olarak veya Uygulama'yı kullanarak bu Sözleşme'yi
kabul etmiş sayılırsınız.

2. Uygulamanın Amacı
Uygulama; kullanıcıların grup oluşturarak veya gruplara katılarak fotoğraf ve videoları "ortak
galeri" mantığıyla paylaşmasını sağlar. Paylaşılan medya içerikleri, ilgili gruptaki yetkili
kullanıcılar tarafından görüntülenir.

3. Hesap Oluşturma ve Telefon Doğrulama
• Uygulama'da hesap oluşturabilmek için telefon numarası ile SMS doğrulaması zorunlu-
dur.
• Kullanıcı, kendisine ait ve kontrol ettiği telefon numarasıyla kayıt olmayı kabul eder.
• Bir telefon numarası ile birden fazla hesap açılmasına izin verilmez (tekil hesap politi-
kası).
• Kullanıcı, hesap bilgilerinin doğruluğundan ve güncelliğinden sorumludur.

4. Grup Yönetimi ve Yetkilendirme
• Her grubun tek bir yönetici ("Admin") hesabı bulunur.
• Grup kodu ile gruba katılma talebi oluşturulur; katılım, yalnızca Admin onayıyla
gerçekleşir.
• Admin, gruba katılımları açabilir/kapatabilir; kullanıcıları kabul edebilir/reddedebilir;
kullanıcıları gruptan çıkarabilir.
• Admin, yönetici yetkisini başka bir kullanıcıya devredebilir; bu durumda mevcut Admin
yetkisini kaybeder.
• Admin gruptan ayrılırsa, grupta belirlenen kurala göre (ör. ilk giren kullanıcı) yeni
Admin atanabilir.

5. Planlar, Kullanım Limitleri ve Ücretlendirme
Uygulama'da planlar ve günlük yükleme limitleri aşağıdaki şekilde sunulur:
• Free Plan: Günlük en fazla 10 fotoğraf ve 2 video yükleme.
• Pro Plan: Günlük en fazla 50 fotoğraf ve 10 video yükleme.
Plan içerikleri, limitler ve fiyatlandırma Uygulama içinde ayrıca gösterilebilir ve güncellenebilir.
Kullanıcı, güncel plan koşullarını Uygulama içinden takip etmekle yükümlüdür.

6. İçerik Paylaşımı ve Sorumluluk
• Kullanıcı yalnızca kendisine ait veya paylaşım hakkına sahip olduğu içerikleri yüklemeyi
kabul eder.
• Yasa dışı, hak ihlali oluşturan, nefret söylemi içeren, taciz/şiddet içeren, cinsel içerik,
özel hayatın gizliliğini ihlal eden veya üçüncü kişilerin haklarını zedeleyen içerikler
kesinlikle yasaktır.
• İçeriklerin hukuki sorumluluğu içeriği yükleyen kullanıcıya aittir.

7. Bildirme (Report) ve Moderasyon
• Kullanıcılar, uygunsuz buldukları medya içeriklerini "Report" ederek bildirebilir.
• Bildirilen içerikler Admin Panel üzerinden Sağlayıcı tarafından incelenebilir.
• İnceleme sonucunda Sağlayıcı; (i) bildirimi yoksayabilir, (ii) içeriği silebilir, (iii)
kullanıcıyı sistemden yasaklayabilir (ban) veya gerekli görülen diğer önlemleri alabilir.
• Sağlayıcı, topluluk güvenliği ve hukuki yükümlülükler kapsamında gerektiğinde içeriklere
müdahale etme hakkını saklı tutar.

8. Bildirimler (Notifications)
Uygulama; gruba katılma isteği ve medya yüklenmesi gibi olaylarda push notification gön-
derebilir. Kullanıcı, cihaz bildirim ayarlarını kendi tercihine göre yönetebilir. Bildirimlerin
gecikmesi veya bazı cihazlarda kısıtlanması Kullanıcı'nın cihaz/işletim sistemi ayarlarından
kaynaklanabilir.

9. Hesap Silme ve Sonlandırma
• Kullanıcı dilediği zaman hesabını silebilir.
• Hesap silindiğinde, Kullanıcı'nın kişisel verileri ve içerikleri sistemden tamamen
silinir (Sağlayıcı tarafından tutulması zorunlu yasal kayıtlar hariç).
• Sözleşme ihlali halinde Sağlayıcı, kullanıcı hesabını geçici veya kalıcı olarak askıya
alabilir/sonlandırabilir.

10. Hizmet Kesintileri ve Sorumluluğun Sınırlandırılması
Uygulama "olduğu gibi" sunulur. Bakım, güncelleme, ağ sorunları, cihaz kaynaklı problemler
veya üçüncü taraf servis kesintileri nedeniyle erişimde aksaklıklar yaşanabilir. Sağlayıcı, makul
çaba göstermekle birlikte kesintisiz hizmet garantisi vermez.

11. Sözleşme Değişiklikleri
Sağlayıcı, bu Sözleşme'yi güncelleyebilir. Güncellemeler Uygulama üzerinden yayınlandığı
tarihten itibaren geçerli olur.

12. İletişim
Sözleşme ile ilgili talepler için:

Kabul Beyanı: Kayıt sırasında "Kullanıcı Sözleşmesi'ni okuduğumu ve kabul ettiğimi onay-
larım. `;