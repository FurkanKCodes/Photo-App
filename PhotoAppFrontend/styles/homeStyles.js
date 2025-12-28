import { StyleSheet, Platform, StatusBar } from 'react-native';

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    // Item 1: Dark gray background (gradient requires logic change, dark gray applied)
    backgroundColor: '#333333', 
  },
  // Header Styles (Updated)
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 65 : StatusBar.currentHeight + 25,
    paddingBottom: 15, 
    paddingHorizontal: 20,
    // Item 2: Darkest gray tone (background bottom color)
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
  profileImage: {
    width: 40, 
    height: 40,
    borderRadius: 19, 
    borderWidth: 2,
    // Item 3: Black border
    borderColor: '#ffffff',
  },
  headerTitle: {
    // Item 4: White text and font size 27
    color: '#ffffff',
    fontSize: 27, 
    fontWeight: 'bold',
  },
  addButton: {
    width: 40, 
    height: 40,
    borderRadius: 19,
    // Item 5: Black background
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Content Styles
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  // Group Card Styles
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    // Item 6: Slightly lighter gray than header
    backgroundColor: '#2C2C2C',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF', 
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 15,
    // Item 7: Black border
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#ddd',
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center', 
  },
  groupName: {
    // Item 8: White text and font size 22
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
    marginRight: 5,
  },
  // Tab Bar
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#101010', 
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Form Styles
  formContainer: {
    alignItems: 'center',
    width: '100%',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 20,
  },
  defaultImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  selectPhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  label: {
    alignSelf: 'flex-start',
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffffff',
    marginLeft: 2,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  actionButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default homeStyles;