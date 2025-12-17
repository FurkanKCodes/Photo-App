import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';

const { width } = Dimensions.get('window');
const TOP_PADDING = Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20;
const BOTTOM_PADDING = Platform.OS === 'ios' ? 50 : 30;

const cameraStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  permText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  
  // --- TOP CONTROLS ---
  topControls: {
    position: 'absolute',
    top: TOP_PADDING,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 22,
  },

  // --- FLASH MENU ---
  flashMenu: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    paddingHorizontal: 5,
    marginRight: 10, // Ana butona yapışık olmasın
  },
  flashBtn: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoText: {
    fontSize: 10,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 6,
    right: 4,
  },
  mainAutoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },

  // --- TIMER ---
  timerOverlay: {
    position: 'absolute',
    top: TOP_PADDING + 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 25,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  timerText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // --- BOTTOM CONTROLS ---
  bottomControls: {
    position: 'absolute',
    bottom: BOTTOM_PADDING,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },

  shutterContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  videoShutterInner: {
    backgroundColor: '#ff4040',
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  recordingInner: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },

  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- MODE SELECTOR ---
  modeContainer: {
    position: 'absolute',
    bottom: BOTTOM_PADDING + 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 15,
  },
  modeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 15,
    letterSpacing: 1,
  },
  activeMode: {
    color: '#FFD700',
    opacity: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default cameraStyles;