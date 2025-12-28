import { StyleSheet, StatusBar, Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const groupDetailsStyles = StyleSheet.create({
  container: {
    flex: 1,
    // Dark background consistent with Home page
    backgroundColor: '#333333',
  },
  // --- HEADER (Matched with Home) ---
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 65 : StatusBar.currentHeight + 25,
    paddingBottom: 15,
    paddingHorizontal: 20,
    // Home header color
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
    padding: 5,
    // Increased touch area
    width: 40, 
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    // Same font size as Home
    fontSize: 27,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    // Right margin to center title since back button is on left
    marginRight: 30, 
  },
  
  // --- GROUP INFO ---
  groupInfoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    // Border color darkened
    borderBottomColor: '#444444',
  },
  largeGroupImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: '#555', // Gray background if no image
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  groupNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    // White text
    color: '#ffffff',
    marginBottom: 5,
  },
  // DESCRIPTION STYLE
  groupDescriptionText: {
      fontSize: 14,
      // Light gray text
      color: '#cccccc',
      textAlign: 'center',
      paddingHorizontal: 30,
      marginBottom: 10,
  },
  editGroupButton: {
    marginTop: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
    // Home button style (Black or Dark Gray)
    backgroundColor: '#000000',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  editGroupText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // --- MEMBER LIST ---
  membersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    // White text
    color: '#ffffff',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    // Border color darkened
    borderBottomColor: '#444444',
    zIndex: 1, 
  },
  memberImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#555',
    borderWidth: 1,
    borderColor: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    // White text
    color: '#ffffff',
  },
  youTag: {
    color: '#aaaaaa',
    fontSize: 14,
    fontWeight: 'normal',
  },
  adminTag: {
    fontSize: 12,
    color: '#007AFF', // Admin tag remains blue or can be red
    marginTop: 2,
    fontWeight: '600',
  },
  moreButton: {
      padding: 5,
      marginLeft: 5,
  },
  // --- POPUP MENU STYLES ---
  popupMenu: {
      position: 'absolute',
      right: 35, 
      top: 0,
      // Menu background dark gray
      backgroundColor: '#2C2C2C',
      borderRadius: 8,
      paddingVertical: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 3.84,
      elevation: 5,
      minWidth: 140,
      zIndex: 1000,
      borderWidth: 1,
      borderColor: '#444',
  },
  popupMenuItem: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#444',
  },
  popupMenuText: {
      fontSize: 14,
      // Menu text white
      color: '#ffffff',
  },

  // --- FULL SCREEN IMAGE MODAL ---
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
    resizeMode: 'contain',
  },

  // --- EDIT MODAL STYLES ---
  editModalContainer: {
    flex: 1,
    // Modal background dark
    backgroundColor: '#333333',
  },
  editModalHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Same color as Header
    backgroundColor: '#1a1a1a', 
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', 
  },
  saveButton: {
    width: 70, // "Kaydet" yazısı sığsın diye biraz geniş
    paddingVertical: 6,
    backgroundColor: '#000', // Siyah buton
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7, 
    backgroundColor: '#e0e0e0', // Pasifken gri arka plan
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveTextActive: {
    color: '#FFF', // Aktifken yazı beyaz
  },
  saveTextInactive: {
    color: '#000', // Pasifken yazı siyah (gri buton üstüne)
  },
  editContent: {
    alignItems: 'center',
    paddingTop: 30,
  },
  editImageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  editThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#555',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: {
    marginTop: 10,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    width: '90%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 5,
  },
  input: {
    fontSize: 18,
    color: '#ffffff', // Input text white
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    paddingVertical: 5,
  },

  // --- REQUESTS STYLES ---
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingRight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#cccccc',
  },
  toggleStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    // Status color is usually dynamic but default can be white
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  requestImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#555',
    borderWidth: 1,
    borderColor: '#fff',
  },
  requestName: {
    fontSize: 16,
    color: '#ffffff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 20,
  },
  // --- LEAVE & DELETE BUTTON ---
  leaveButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30', // Can remain Red
    marginTop: 20,
    marginBottom: 40, // Bottom margin
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  leaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mediaButton: {
    backgroundColor: '#000', // Black button consistent with Home
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
});

export default groupDetailsStyles;