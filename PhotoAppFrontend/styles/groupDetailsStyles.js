import { StyleSheet, StatusBar, Platform, Dimensions } from 'react-native';
  
  const { width, height } = Dimensions.get('window');
  
  const groupDetailsStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    // --- HEADER ---
    headerContainer: {
      paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
      paddingBottom: 15,
      paddingHorizontal: 20,
      backgroundColor: '#007AFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    },
    
    // --- GROUP INFO ---
    groupInfoContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    largeGroupImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10,
      backgroundColor: '#eee',
    },
    groupNameText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 5,
    },
    // NEW: DESCRIPTION STYLE
    groupDescriptionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 30,
        marginBottom: 10,
    },
    editGroupButton: {
      marginTop: 5,
      paddingVertical: 5,
      paddingHorizontal: 15,
      backgroundColor: '#f0f0f0',
      borderRadius: 15,
    },
    editGroupText: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '600',
    },
  
    // --- MEMBER LIST ---
    membersTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
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
      borderBottomColor: '#f5f5f5',
      zIndex: 1, // Important for popup menu
    },
    memberImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
      backgroundColor: '#eee',
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
    },
    youTag: {
      color: '#888',
      fontSize: 14,
      fontWeight: 'normal',
    },
    adminTag: {
      fontSize: 12,
      color: '#007AFF',
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
        right: 35, // Position to the left of the 3 dots
        top: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 140,
        zIndex: 1000,
    },
    popupMenuItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    popupMenuText: {
        fontSize: 14,
        color: '#333',
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
      backgroundColor: '#fff',
    },
    editModalHeader: {
      paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
      paddingBottom: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#007AFF', 
    },
    editHeaderTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff', 
    },
    saveText: {
      fontSize: 16,
      fontWeight: '600',
    },
    activeSave: {
      color: '#fff', 
    },
    inactiveSave: {
      color: 'rgba(255, 255, 255, 0.5)', 
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
      backgroundColor: '#eee',
    },
    changePhotoText: {
      marginTop: 10,
      color: '#007AFF',
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
      color: '#666',
      marginBottom: 5,
    },
    input: {
      fontSize: 18,
      color: '#333',
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
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
      color: '#666',
    },
    toggleStatus: {
      fontSize: 10,
      fontWeight: 'bold',
    },
    requestItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#f5f5f5',
    },
    requestImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
      backgroundColor: '#eee',
    },
    requestName: {
      fontSize: 16,
      color: '#333',
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
      backgroundColor: '#FF3B30', // Red
      // marginHorizontal: 20, // Removed for flex layout
      marginTop: 0,
      paddingVertical: 12,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    leaveText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    mediaButton: {
      backgroundColor: '#fff', 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderRadius: 15
    },
  });
  
  export default groupDetailsStyles;