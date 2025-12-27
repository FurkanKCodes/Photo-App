import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

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
    backgroundColor: 'rgba(0,0,0,0.5)', // Arka planı karartma
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
    textAlign: 'center', // Kodu ortala
    marginBottom: 20,
    letterSpacing: 5, // Rakamlar arası boşluk
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
});

export default authStyles;