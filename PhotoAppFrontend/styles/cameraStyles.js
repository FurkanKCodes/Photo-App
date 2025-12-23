import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';

// Get the full width of the device screen to calculate layouts dynamically
const { width } = Dimensions.get('window');

// Calculate top padding based on the OS
// iOS: Fixed 60px safe area
// Android: Status bar height + 20px buffer
const TOP_PADDING = Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20;

// Calculate bottom padding based on the OS (more padding for iOS home indicator)
const BOTTOM_PADDING = Platform.OS === 'ios' ? 50 : 30;

const cameraStyles = StyleSheet.create({
  // Main container for the camera screen (Full screen black background)
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Container shown when permissions are not granted (Centers the permission button)
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  
  // Style for the "Permission Required" text message
  message: {
    color: '#fff',
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  
  // Style for the "Grant Permission" button
  permButton: {
    backgroundColor: '#007AFF', // iOS Blue
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  
  // Text style inside the permission button
  permText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Style for the CameraView component (Takes up all available space)
  camera: {
    flex: 1,
  },
  
  // --- TOP CONTROLS (Close Button & Flash) ---
  topControls: {
    position: 'absolute', // Floating over the camera view
    top: TOP_PADDING,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between', // Push items to edges
    paddingHorizontal: 20,
    zIndex: 20, // Ensure it stays on top of the camera preview
  },
  
  // Circular translucent button style for icons (Close, Flash, Flip)
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent black
    borderRadius: 22, // Makes it a perfect circle
  },

  // --- FLASH MENU (Expanded Options) ---
  flashMenu: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)', // Darker background for menu
    borderRadius: 25,
    paddingHorizontal: 5,
    marginRight: 10, // Spacing between the menu and the main flash toggle
  },
  
  // Individual button inside the flash menu
  flashBtn: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Small "A" text for Auto Flash mode inside the menu
  autoText: {
    fontSize: 10,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 6,
    right: 4,
  },
  
  // Small "A" text for the main Flash icon when Auto is selected
  mainAutoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },

  // --- TIMER (Video Recording) ---
  timerOverlay: {
    position: 'absolute',
    top: TOP_PADDING + 60, // Positioned below top controls
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.6)', // Red semi-transparent background
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 25,
  },
  
  // The blinking red dot indicator
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  
  // The timer text (00:00)
  timerText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // --- BOTTOM CONTROLS (Shutter & Flip) ---
  bottomControls: {
    position: 'absolute',
    bottom: BOTTOM_PADDING,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around', // Evenly space the shutter and flip buttons
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },

  // Outer ring of the shutter button
  shutterContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Inner circle of the shutter button (White for photo)
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  
  // Inner square/shape for Video mode (Red)
  videoShutterInner: {
    backgroundColor: '#ff4040',
    width: 40,
    height: 40,
    borderRadius: 8, // Rounded square look
  },
  
  // Inner shape when actively recording (Smaller square)
  recordingInner: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },

  // Button to flip camera (Front/Back)
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- MODE SELECTOR (PHOTO / VIDEO Text) ---
  modeContainer: {
    position: 'absolute',
    bottom: BOTTOM_PADDING + 90, // Positioned above the shutter button
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 15,
  },
  
  // Inactive mode text style
  modeText: {
    color: 'rgba(255,255,255,0.6)', // Faded white
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 15,
    letterSpacing: 1,
  },
  
  // Active mode text style (Gold/Yellow highlight)
  activeMode: {
    color: '#FFD700',
    opacity: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- ZOOM INDICATOR (NEW) ---
  zoomIndicator: {
    position: 'absolute',
    bottom: BOTTOM_PADDING + 130, // Mod seçicinin (90px) biraz daha üstünde duracak
    alignSelf: 'center', // Yatayda tam ortala
    backgroundColor: 'rgba(0,0,0,0.6)', // Siyah yarı saydam
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 16, // Diğer öğelerin üstünde görünsün
  },
  
  zoomText: {
    color: '#FFD700', // Sarı renk
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default cameraStyles;