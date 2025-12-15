import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const ITEM_SIZE = width / COLUMN_COUNT;

const mediaStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  // --- HEADER ---
  headerContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 65 : StatusBar.currentHeight + 25,
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#007AFF', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    minHeight: 80,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 5,
  },

  // --- GRID LIST ---
  gridContainer: {
    paddingTop: 2,
  },
  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderWidth: 1,
    borderColor: '#fff', 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', 
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
      backgroundColor: 'rgba(0,0,0,0.3)', 
      borderRadius: 4,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
    width: 150,
    zIndex: 200,
    elevation: 5,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  reportText: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default mediaStyles;