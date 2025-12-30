import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const mediaStyles = StyleSheet.create({
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
    // Home header color (Darkest Gray)
    backgroundColor: '#1a1a1a', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    minHeight: 80,
  },
  backButton: {
    padding: 5,
    // Optional: make back button hit area larger
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    // White text like Home
    color: '#ffffff',
    fontSize: 27, // Matched with Home font size
    fontWeight: 'bold',
  },
  // Matched with Home's Add Button (Black Circle)
  addButton: {
    width: 40, 
    height: 40,
    borderRadius: 20,
    // Black background
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- SECTION HEADERS (Date Separators) ---
  sectionHeaderContainer: {
    // Darker gray for separation (Matched with Home group cards)
    backgroundColor: '#2C2C2C', 
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444', // Dark border
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    // White text
    color: '#ffffff',
  },

  // --- SCROLL BUBBLE ---
  scrollBubble: {
    position: 'absolute',
    top: 50, 
    right: 20, 
    // Accent color remains Blue for visibility or can be Black
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 999,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  scrollBubbleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // --- GRID LIST ---
  rowContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start', 
  },
  mediaItem: {
    // Border color changed to dark to blend in
    borderWidth: 1,
    borderColor: '#333', 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', // Dark placeholder
  },
  mediaItemSelected: {
      opacity: 0.7, 
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playIconOverlay: {
    position: 'absolute',
    opacity: 0.8,
    alignSelf: 'center',
  },
  // Checkbox Overlay
  selectionOverlay: {
      position: 'absolute',
      top: 5,
      left: 5,
      zIndex: 5,
      backgroundColor: 'rgba(0,0,0,0.5)', 
      borderRadius: 4,
  },

  // --- FILTER MODAL STYLES (Updated for Dark Mode) ---
  filterModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-start', 
      paddingTop: 100, 
  },
  filterModalContainer: {
      // Dark background
      backgroundColor: '#1a1a1a',
      marginHorizontal: 20,
      borderRadius: 15,
      maxHeight: height * 0.6,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#333',
  },
  filterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
      // Slightly lighter dark for header
      backgroundColor: '#222',
  },
  filterTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
  },
  filterContent: {
      padding: 10,
  },
  filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 10,
  },
  filterAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
      backgroundColor: '#555',
  },
  filterAvatarPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
      backgroundColor: '#FFF',
      alignItems: 'center',
      justifyContent: 'center',
  },
  filterName: {
      fontSize: 16,
      color: '#ffffff',
  },
  filterSeparator: {
      height: 1,
      backgroundColor: '#333',
      marginVertical: 5,
  },
  filterFooter: {
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: '#333',
  },
  applyButton: {
      backgroundColor: '#000',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
  },
  applyButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
  },

  // --- FULL SCREEN MODAL ---
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000', 
    justifyContent: 'center',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100, 
  },
  controlButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
  },
  fullScreenContent: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: height,
    resizeMode: 'contain',
  },
  fullVideo: {
    width: width,
    height: height * 0.6, 
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    color: '#ccc',
    fontSize: 12,
  },
  optionsMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    right: 20,
    // White background for menu is usually better for contrast, or dark gray
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    padding: 5,
    width: 150,
    zIndex: 200,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#444',
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
  },
  reportText: {
    color: '#FF3B30', // Red for report
    fontWeight: 'bold',
  },
});

export default mediaStyles;