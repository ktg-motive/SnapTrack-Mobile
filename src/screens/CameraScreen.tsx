import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
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
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
            We need camera access to scan your receipts and extract expense information.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Grant Permission</Text>
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
                  
                  navigation.navigate('Review', { 
                    imageUri: realReceiptImage,
                    source: 'camera'
                    // Removed mockData to force real API calls in simulator
                  });
                }
              }
            ]
          );
        } else {
          // Real camera capture
          const photo = await cameraRef.current!.takePictureAsync({
            quality: 0.6,  // Reduced from 0.8 to 0.6 for smaller initial file
            base64: false,
            skipProcessing: false,
          });
          
          // Optimize image for faster upload while maintaining OCR quality
          console.log('📸 Optimizing captured image for upload...');
          const optimizedResult = await smartOptimizeImage(photo.uri);
          
          console.log('🚀 Upload optimization complete:', {
            savings: `${((1 - optimizedResult.compressionRatio) * 100).toFixed(1)}%`,
            newSize: `${(optimizedResult.optimizedSize / 1024 / 1024).toFixed(2)}MB`
          });
          
          navigation.navigate('Review', { 
            imageUri: optimizedResult.uri,
            source: 'camera'
          });
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      } finally {
        setIsProcessing(false);
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
              
              navigation.navigate('Review', { 
                imageUri: realReceiptImage,
                source: 'library'
                // Removed mockData to force real API calls in simulator
              });
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
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      // Optimize image for faster upload while maintaining OCR quality
      console.log('📸 Optimizing library image for upload...');
      const optimizedResult = await smartOptimizeImage(result.assets[0].uri);
      
      console.log('🚀 Upload optimization complete:', {
        savings: `${((1 - optimizedResult.compressionRatio) * 100).toFixed(1)}%`,
        newSize: `${(optimizedResult.optimizedSize / 1024 / 1024).toFixed(2)}MB`
      });
      
      navigation.navigate('Review', { 
        imageUri: optimizedResult.uri,
        source: 'library'
      });
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
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Overlay UI */}
        <SafeAreaView style={styles.overlay}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Ionicons name="chevron-back" size={28} color="white" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            
            <Text style={[typography.body, styles.instructionText]}>
              Position receipt in frame
            </Text>
            
            <View style={{ width: 80 }} />
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
              Align receipt within the frame
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 4,
  },
  instructionText: {
    color: 'white',
    textAlign: 'center',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '90%',
    height: '60%',
    position: 'relative',
    maxWidth: 450,
    maxHeight: 600,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.neonBlue,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  frameText: {
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  sideButton: {
    alignItems: 'center',
    width: 60,
  },
  sideButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  permissionButton: {
    width: '100%',
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.body,
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});