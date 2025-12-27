import { StyleSheet, Dimensions } from 'react-native';

// FIX: Added 'height' to destructuring so it can be used in styles below
const { width, height } = Dimensions.get('window');

const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Style for ScrollView content container
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    width: '100%',
  },
  
  // --- PHONE INPUT STYLES ---
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 5, 
    borderWidth: 1,
    borderColor: '#eee',
    width: '100%',
  },
  phonePrefix: {
    paddingLeft: 15,
    paddingRight: 10,
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#000',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10, 
    marginLeft: 5,
    alignSelf: 'flex-start',
  },

  // Button Styles
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0c4ff', 
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkContainer: {
    marginTop: 20,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },

  // --- MODAL (POP-UP) STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#f1f1f1',
    padding: 15,
    borderRadius: 10,
    fontSize: 18,
    textAlign: 'center', // Center the code
    marginBottom: 20,
    letterSpacing: 5, // Space between digits
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalCancelButton: {
    paddingVertical: 10,
  },
  modalCancelText: {
    color: 'red',
    fontSize: 16,
  },

  // --- CHECKBOX & AGREEMENT STYLES ---
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align text to top if multiline
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12, // Circular
    borderWidth: 2,
    borderColor: '#aaa',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2, // Slight adjustment for text alignment
  },
  checkboxSelected: {
    backgroundColor: '#007AFF', // Blue fill when selected
    borderColor: '#007AFF',
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap', // Wrap text if it exceeds width
  },
  checkboxLabel: {
    color: '#555',
    fontSize: 14,
  },
  checkboxLink: {
    color: '#007AFF', // Blue link color
    fontWeight: 'bold',
    fontSize: 14,
  },

  // --- DOCUMENT MODAL STYLES (Terms/Privacy Pop-up) ---
  docModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docModalContent: {
    width: width * 0.9,
    height: height * 0.8, // Covers 80% of screen height
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  docModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  docScrollView: {
    marginBottom: 15,
  },
  docText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  docCloseButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default authStyles;