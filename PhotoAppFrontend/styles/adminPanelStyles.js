import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

const adminPanelStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // --- HEADER ---
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 30,
  },

  // --- TABS ---
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#007AFF',
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
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rowInfo: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subText: {
    fontSize: 13,
    color: '#666',
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
      color: '#333',
  },
  formDesc: {
      fontSize: 14,
      color: '#666',
      marginBottom: 30,
  },
  inputGroup: {
      marginBottom: 20,
  },
  input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: '#f9f9f9',
      marginTop: 5,
  },
  separator: {
      alignItems: 'center',
      marginVertical: 10,
  },

  // --- MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%', 
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Evidence Image
  evidenceImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: 'contain'
  },

  // Evidence Video (NEW)
  evidenceVideo: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 15,
  },
  
  // Detail Box
  detailRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#ddd',
  },
  btnDelete: {
    backgroundColor: '#FF9500',
  },
  btnBan: {
    backgroundColor: '#FF3B30',
    marginTop: 15, 
    width: '100%',
    paddingVertical: 14,
  },
  btnUnban: {
    backgroundColor: '#34C759', 
    width: '100%',
    marginTop: 15,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnTextDark: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default adminPanelStyles;