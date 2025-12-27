import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // --- HEADER STYLES ---
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 65 : StatusBar.currentHeight + 25,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF', // Theme Color
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, 
    marginRight: 40, // Balance the back button spacing
  },

  // --- PROFILE INFO SECTION ---
  profileInfoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20, // Reduced slightly to fit stats
  },
  largeProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF', 
    marginBottom: 15,
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  editProfileText: {
    fontSize: 16,
    color: '#007AFF', 
    fontWeight: '600',
  },

  // --- NEW: INFO STRIP STYLES ---
  infoStripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', 
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 15,
    width: '90%', 
    alignSelf: 'center',
  },
  infoStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#000',
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
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 15,
    width: 24,
    textAlign: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  deleteAccountText: {
    // optional specific style
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