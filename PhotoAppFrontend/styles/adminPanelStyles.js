import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

const adminPanelStyles = StyleSheet.create({
  container: {
    flex: 1,
    // Dark Theme Background
  },
  // --- HEADER (Matched with Home & Profile) ---
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 65 : StatusBar.currentHeight + 25,
    paddingBottom: 15,
    paddingHorizontal: 20,
    // Darkest gray header
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
  },
  headerTitle: {
    color: '#ffffff', // White text
    fontSize: 20,     // Slightly larger for visibility
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 30, // To balance the back button
  },

  // --- 2FA AUTH SCREEN STYLES ---
  authContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
  },
  authTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff', // White
      marginBottom: 10,
  },
  authDesc: {
      fontSize: 16,
      color: '#cccccc', // Light gray
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 22,
  },
  authInput: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#555',
      borderRadius: 10,
      padding: 15,
      fontSize: 24,
      textAlign: 'center',
      letterSpacing: 5,
      marginBottom: 20,
      backgroundColor: '#E0E0E0', // Light box for input
      color: '#000000', // Black text
  },
  authButton: {
      width: '100%',
      backgroundColor: '#000', // Blue button remains
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
  },
  authButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
  },

  // --- TABS ---
  tabContainer: {
    flexDirection: 'row',
    // Dark background for tabs
    backgroundColor: '#1a1a1a', 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888', // Dimmed text
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFF', // Active Blue
    fontWeight: 'bold',
  },

  // --- LISTS ---
  listContent: {
    padding: 20,
    paddingBottom: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // Dark card background
    backgroundColor: '#2C2C2C', 
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  rowInfo: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff', // White
  },
  subText: {
    fontSize: 13,
    color: '#cccccc', // Light gray
    marginTop: 3,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontSize: 16,
  },

  // --- MANUAL BAN FORM ---
  formContent: {
      padding: 20,
  },
  formTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#ffffff', // White
  },
  formDesc: {
      fontSize: 14,
      color: '#cccccc', // Light gray
      marginBottom: 30,
  },
  inputGroup: {
      marginBottom: 20,
  },
  input: {
      borderWidth: 1,
      borderColor: '#555',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: '#E0E0E0', // Light box
      color: '#000000', // Black text
      marginTop: 5,
  },
  separator: {
      alignItems: 'center',
      marginVertical: 10,
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Darker overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%', 
    // Dark Modal Background
    backgroundColor: '#2C2C2C', 
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // White
  },
  
  // Evidence Image
  evidenceImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#444',
  },

  // Evidence Video
  evidenceVideo: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  
  // Detail Box
  detailRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#aaaaaa', // Lighter label
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: '#ffffff', // White value
    fontWeight: '500',
  },
  
  // Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDismiss: {
    backgroundColor: '#555555', // Dark gray for Cancel/Dismiss
  },
  btnDelete: {
    backgroundColor: '#FF9500', // Orange
  },
  btnBan: {
    backgroundColor: '#FF3B30', // Red
    marginTop: 15, 
    width: '100%',
    paddingVertical: 14,
  },
  btnUnban: {
    backgroundColor: '#34C759', // Green
    width: '100%',
    marginTop: 15,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Used for dismiss button text if background is light, 
  // but now bg is dark (#555), so white text is better.
  btnTextDark: {
    color: '#ffffff', 
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default adminPanelStyles;