import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color is handled by LinearGradient in profile.js
  },
  // --- HEADER STYLES (Matched with Home) ---
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 65 : StatusBar.currentHeight + 25,
    paddingBottom: 15,
    paddingHorizontal: 20,
    // Darkest gray (same as Home header)
    backgroundColor: '#1a1a1a', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    // White text and font size 27 (Matched with Home)
    color: '#ffffff',
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, 
    marginRight: 0, 
  },

  // --- PROFILE INFO SECTION ---
  profileInfoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20, 
  },
  largeProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    // White border (Matched with Home profile pic style)
    borderColor: '#ffffff', 
    marginBottom: 15,
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    // White text
    color: '#ffffff',
    marginBottom: 5,
  },
  editProfileButton: {
    marginTop: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#000000', // Siyah arka plan
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15, // Butonun altındaki boşluk
  },
  editProfileText: {
    color: '#ffffff', // Beyaz yazı
    fontSize: 14,
    fontWeight: '600',
  },

  // --- INFO STRIP STYLES (Stats) ---
  infoStripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Card background color (Matched with Home list items)
    backgroundColor: '#2C2C2C', 
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginTop: 15,
    width: '90%', 
    alignSelf: 'center',
    borderRadius: 12, // Rounded corners added
  },
  infoStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    // Light gray for labels
    color: '#cccccc',
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 14,
    // White for values
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  verticalDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#555555', // Darker divider
    marginHorizontal: 15,
  },

  // --- SETTINGS LIST SECTION ---
  settingsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    // Dark divider color
    borderBottomColor: '#444444',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 15,
    width: 24,
    textAlign: 'center',
    // Icons should be lighter to see on dark bg
    color: '#dddddd', 
  },
  settingText: {
    fontSize: 16,
    // White text
    color: '#ffffff',
  },
  deleteAccountText: {
    color: '#FF3B30', // Keep red for delete
  },

  // --- FULL SCREEN MODAL ---
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height,
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
});

export default profileStyles;