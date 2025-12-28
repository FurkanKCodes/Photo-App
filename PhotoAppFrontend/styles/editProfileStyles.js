import { StyleSheet, Platform, StatusBar } from 'react-native';

const editProfileStyles = StyleSheet.create({
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
    width: 40, // Increased touch area
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, 
  },
  // Save Button Styles
  saveButton: {
    width: 60,
    paddingVertical: 6,
    backgroundColor: '#000',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7, 
    backgroundColor: '#e0e0e0', // Greyish background when disabled
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveTextActive: {
    color: '#FFF', 
  },
  saveTextInactive: {
    color: '#000', 
  },

  // --- CONTENT CONTAINER ---
  scrollContent: {
    paddingBottom: 40,
  },

  // --- PROFILE PHOTO SECTION (CENTERED) ---
  photoSection: {
    alignItems: 'center', // Center the photo and text
    marginTop: 30,
    marginBottom: 30,
  },
  largeProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFFFFF', 
    marginBottom: 10,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    marginTop: 5,
  },

  // --- FORM SECTION (LEFT ALIGNED) ---
  formContainer: {
    paddingHorizontal: 20,
    width: '100%',
  },
  inputGroup: {
    marginBottom: 25,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'left', // Ensure text aligns left
    alignSelf: 'flex-start', // Ensure container aligns left
  },
  inputField: {
    borderBottomWidth: 1,
    backgroundColor: '#transparent',
    borderBottomColor: '#666',
    paddingVertical: 10,
    fontSize: 18,
    color: '#ffffff',
    width: '100%',
    textAlign: 'left',
  },
  
  // Phone Number Specific
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    backgroundColor: '#FFF',
    borderBottomColor: '#FFF',
    width: '100%',
  },
  phonePrefix: {
    fontSize: 16,
    color: '#000',
    marginRight: 10,
    paddingVertical: 10,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    textAlign: 'left',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'left',
  },
});

export default editProfileStyles;