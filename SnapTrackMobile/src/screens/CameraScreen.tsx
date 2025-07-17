import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, typography, shadows, spacing } from '../styles/theme';
import { smartOptimizeImage } from '../utils/imageOptimization';
import type { RootStackParamList } from '../types/navigation';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Manage camera lifecycle based on screen focus
  useFocusEffect(
    React.useCallback(() => {
      // Camera screen is focused - activate camera
      setIsCameraActive(true);
      
      return () => {
        // Camera screen is losing focus - deactivate camera
        setIsCameraActive(false);
      };
    }, [])
  );

  if (!permission) {
    return <View style={styles.loadingContainer} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={80} color={colors.textMuted} />
          <Text style={[typography.title2, styles.permissionTitle]}>
            Camera Access Required
          </Text>
          <Text style={[typography.body, styles.permissionMessage]}>
            SnapTrack uses your camera to capture photos of receipts for expense tracking and automatic data extraction. This helps you digitize your receipts and organize your expenses.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isSimulator = Platform.OS === 'ios' && !Platform.isPad && Platform.isTesting !== true && __DEV__;

  const takePicture = async () => {
    if (!isProcessing) {
      setIsProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      try {
        if (isSimulator) {
          // Use mock data for simulator
          console.log('📱 Using simulator mock data');
          Alert.alert(
            'Simulator Mode',
            'Using mock receipt data for testing',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Use a real receipt image for testing
                  const realReceiptImage = 'https://philip.greenspun.com/blog/wp-content/uploads/2024/04/2024-04-08-20.26.03-scaled.jpg';
                  
                  // Clear processing state before navigation
                  setIsProcessing(false);
                  
                  // Small delay to ensure UI cleanup
                  setTimeout(() => {
                    navigation.navigate('Review', { 
                      imageUri: realReceiptImage,
                      source: 'camera'
                      // Removed mockData to force real API calls in simulator
                    });
                  }, 100);
                }
              }
            ]
          );
        } else {
          // Real camera capture
          const photo = await cameraRef.current!.takePictureAsync({
            quality: 0.6,  // Reduced from 0.8 to 0.6 for smaller initial file
            base64: false,
            skipProcessing: false
          });
          
          // Optimize image for faster upload while maintaining OCR quality
          console.log('📸 Optimizing captured image for upload...');
          const optimizedResult = await smartOptimizeImage(photo.uri);
          
          console.log('🚀 Upload optimization complete:', {
            savings: `${((1 - optimizedResult.compressionRatio) * 100).toFixed(1)}%`,
            newSize: `${(optimizedResult.optimizedSize / 1024 / 1024).toFixed(2)}MB`
          });
          
          // Clear processing state before navigation
          setIsProcessing(false);
          
          // Small delay to ensure UI cleanup
          setTimeout(() => {
            navigation.navigate('Review', { 
              imageUri: optimizedResult.uri,
              source: 'camera'
            });
          }, 100);
        }
      } catch (error) {
        setIsProcessing(false);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const pickFromLibrary = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isSimulator) {
      // Use mock data for simulator
      Alert.alert(
        'Simulator Mode',
        'Using mock restaurant receipt data',
        [
          {
            text: 'OK',
            onPress: () => {
              // Use a real receipt image for testing
              const realReceiptImage = 'https://philip.greenspun.com/blog/wp-content/uploads/2024/04/2024-04-08-20.26.03-scaled.jpg';
              
              // Small delay to ensure UI cleanup
              setTimeout(() => {
                navigation.navigate('Review', { 
                  imageUri: realReceiptImage,
                  source: 'library'
                  // Removed mockData to force real API calls in simulator
                });
              }, 100);
            }
          }
        ]
      );
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,  // Reduced from 0.8 to 0.6 for smaller initial file
      allowsEditing: true,
      aspect: [4, 3]
    });

    if (!result.canceled && result.assets[0]) {
      // Optimize image for faster upload while maintaining OCR quality
      console.log('📸 Optimizing library image for upload...');
      const optimizedResult = await smartOptimizeImage(result.assets[0].uri);
      
      console.log('🚀 Upload optimization complete:', {
        savings: `${((1 - optimizedResult.compressionRatio) * 100).toFixed(1)}%`,
        newSize: `${(optimizedResult.optimizedSize / 1024 / 1024).toFixed(2)}MB`
      });
      
      // Small delay to ensure UI cleanup
      setTimeout(() => {
        navigation.navigate('Review', { 
          imageUri: optimizedResult.uri,
          source: 'library'
        });
      }, 100);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      {isCameraActive ? (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          {/* Overlay UI */}
          <SafeAreaView style={styles.overlay}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Ionicons name="chevron-back" size={28} color="white" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            
              <View style={{ flex: 1 }} />
            </View>

            {/* Center Scanning Frame */}
            <View style={styles.centerArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            
              <Text style={[typography.caption, styles.frameText]}>
              Position receipt anywhere in view
              </Text>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <TouchableOpacity 
                style={styles.sideButton}
                onPress={pickFromLibrary}
              >
                <Ionicons name="images-outline" size={28} color="white" />
                <Text style={styles.sideButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.shutterButton, isProcessing && styles.shutterDisabled]}
                onPress={takePicture}
                disabled={isProcessing}
              >
                <View style={styles.shutterInner}>
                  {isProcessing ? (
                    <Ionicons name="hourglass" size={32} color="white" />
                  ) : (
                    <Ionicons name="camera" size={32} color="white" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.sideButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse-outline" size={28} color="white" />
                <Text style={styles.sideButtonText}>Flip</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      ) : (
        <View style={styles.camera}>
          <SafeAreaView style={styles.overlay}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Ionicons name="chevron-back" size={28} color="white" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.centerArea}>
              <ActivityIndicator size="large" color="white" />
              <Text style={[typography.body, { color: 'white', marginTop: 20 }]}>
                Camera initializing...
              </Text>
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  backText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 4
  },
  bottomControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: 40
  },
  bottomLeft: {
    borderRightWidth: 0,
    borderTopWidth: 0,
    bottom: 0,
    left: 0
  },
  bottomRight: {
    borderLeftWidth: 0,
    borderTopWidth: 0,
    bottom: 0,
    right: 0
  },
  buttonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600'
  },
  camera: {
    flex: 1
  },
  centerArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  container: {
    backgroundColor: 'black',
    flex: 1
  },
  corner: {
    position: 'absolute',
    width: 24,           // Increased from 20
    height: 24,          // Increased from 20
    borderColor: colors.neonBlue,
    borderWidth: 3
  },
  frameText: {
    color: 'white',
    marginTop: 20,
    textAlign: 'center'
  },
  gradientButton: {
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16
  },
  instructionText: {
    color: 'white',
    textAlign: 'center'
  },
  loadingContainer: {
    backgroundColor: colors.background,
    flex: 1
  },
  overlay: {
    backgroundColor: 'transparent',
    flex: 1
  },
  permissionButton: {
    width: '100%'
  },
  permissionContainer: {
    backgroundColor: colors.background,
    flex: 1
  },
  permissionContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40
  },
  permissionMessage: {
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 40,
    textAlign: 'center'
  },
  permissionTitle: {
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 20,
    textAlign: 'center'
  },
  scanFrame: {
    width: '95%',      // Increased from 90%
    height: '85%',     // Increased from 60%
    position: 'relative',
    maxWidth: 600,     // Increased from 450
    maxHeight: 800    // Increased from 600
  },
  shutterButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'white',
    borderRadius: 40,
    borderWidth: 4,
    height: 80,
    justifyContent: 'center',
    width: 80
  },
  shutterDisabled: {
    opacity: 0.6
  },
  shutterInner: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60
  },
  sideButton: {
    alignItems: 'center',
    width: 60
  },
  sideButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  topLeft: {
    borderBottomWidth: 0,
    borderRightWidth: 0,
    left: 0,
    top: 0
  },
  topRight: {
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    right: 0,
    top: 0
  }
});