import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// Using Expo vector icons instead
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { smartOptimizeImage } from '../../utils/imageOptimization';

interface CameraCaptureScreenProps {
  onNext: () => void;
  onReceiptCapture: (uri: string) => void;
  onPermissionUpdate: (permissions: { camera: boolean; photos: boolean }) => void;
  state: any;
}

const { width, height } = Dimensions.get('window');

export default function CameraCaptureScreen({ 
  onNext, 
  onReceiptCapture, 
  onPermissionUpdate,
  state 
}: CameraCaptureScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestPermissions();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const [permission, requestPermission] = useCameraPermissions();

  const requestPermissions = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        setHasPermission(result.granted);
      } else {
        setHasPermission(true);
      }
      
      const mediaResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const mediaGranted = mediaResult.status === 'granted';
      
      onPermissionUpdate({ 
        camera: permission?.granted || false, 
        photos: mediaGranted 
      });
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,  // Reduced quality for smaller initial file
      });

      // Optimize image for faster upload while maintaining OCR quality
      console.log('📸 Optimizing captured image for upload...');
      const optimizedResult = await smartOptimizeImage(photo.uri);
      
      console.log('🚀 Upload optimization complete:', {
        savings: `${((1 - optimizedResult.compressionRatio) * 100).toFixed(1)}%`,
        newSize: `${(optimizedResult.optimizedSize / 1024 / 1024).toFixed(2)}MB`
      });

      setImageUri(optimizedResult.uri);
      onReceiptCapture(optimizedResult.uri);

      // Success animation
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-advance after short delay
      setTimeout(() => {
        onNext();
      }, 1500);

    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleGalleryPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,  // Reduced from 0.8 to 0.6 for smaller initial file
      });

      if (!result.canceled && result.assets[0]) {
        // Optimize image for faster upload while maintaining OCR quality
        console.log('📸 Optimizing library image for upload...');
        const optimizedResult = await smartOptimizeImage(result.assets[0].uri);
        
        console.log('🚀 Upload optimization complete:', {
          savings: `${((1 - optimizedResult.compressionRatio) * 100).toFixed(1)}%`,
          newSize: `${(optimizedResult.optimizedSize / 1024 / 1024).toFixed(2)}MB`
        });
        
        setImageUri(optimizedResult.uri);
        onReceiptCapture(optimizedResult.uri);
        
        // Success animation
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          onNext();
        }, 1500);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const renderPermissionRequest = () => (
    <View style={styles.permissionContainer}>
      <Icon name="camera-alt" size={64} color={theme.colors.primary} />
      <Text style={styles.permissionTitle}>Camera Access Needed</Text>
      <Text style={styles.permissionText}>
        SnapTrack needs camera access to capture receipts. This is essential for the core functionality.
      </Text>
      <Button
        mode="contained"
        onPress={requestPermissions}
        style={styles.permissionButton}
        icon="camera"
      >
        Grant Camera Access
      </Button>
      <Button
        mode="outlined"
        onPress={handleGalleryPick}
        style={styles.alternativeButton}
        icon="photo-library"
      >
        Choose from Gallery
      </Button>
    </View>
  );

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.guidanceContainer}>
            <Text style={styles.guidanceText}>
              Point camera at any receipt and tap capture
            </Text>
          </View>

          <View style={styles.scanFrame}>
            <View style={styles.scanCorners}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          <View style={styles.captureContainer}>
            <Button
              mode="contained"
              onPress={handleCapture}
              style={styles.captureButton}
              contentStyle={styles.captureButtonContent}
              labelStyle={styles.captureButtonLabel}
              loading={isCapturing}
              disabled={isCapturing}
              icon="camera"
            >
              {isCapturing ? 'Capturing...' : 'Capture Receipt'}
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleGalleryPick}
              style={styles.galleryButton}
              contentStyle={styles.galleryButtonContent}
              icon="photo-library"
            >
              Choose from Gallery
            </Button>
          </View>
        </View>
      </CameraView>
    </View>
  );

  const renderSuccessState = () => (
    <Animated.View
      style={[
        styles.successContainer,
        {
          opacity: successAnim,
          transform: [
            {
              scale: successAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Icon name="check-circle" size={64} color={theme.colors.primary} />
      <Text style={styles.successTitle}>Receipt Captured!</Text>
      <Text style={styles.successText}>
        Great! Let's see what SnapTrack Intelligence can do with it.
      </Text>
    </Animated.View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.contentSection}>
        <Text style={styles.title}>Let's capture your first receipt</Text>
        
        {imageUri ? (
          renderSuccessState()
        ) : hasPermission === null ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          renderPermissionRequest()
        ) : (
          renderCameraView()
        )}

        {!imageUri && hasPermission && (
          <Card style={styles.tipCard}>
            <Card.Content>
              <View style={styles.tipContainer}>
                <Icon name="lightbulb-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.tipText}>
                  Don't have a receipt handy? You can choose a sample from your photo gallery.
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    width: width * 0.8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginBottom: 16,
  },
  alternativeButton: {
    width: width * 0.8,
    borderColor: theme.colors.primary,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  guidanceContainer: {
    alignItems: 'center',
  },
  guidanceText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },
  scanCorners: {
    width: width * 0.7,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#ffffff',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  captureContainer: {
    alignItems: 'center',
    gap: 12,
  },
  captureButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: width * 0.7,
  },
  captureButtonContent: {
    paddingVertical: 8,
  },
  captureButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  galleryButton: {
    borderColor: '#ffffff',
    borderRadius: 12,
    width: width * 0.7,
  },
  galleryButtonContent: {
    paddingVertical: 4,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  tipCard: {
    backgroundColor: '#f8f9fa',
    elevation: 1,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});