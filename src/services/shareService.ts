import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { Receipt } from '../types';

export interface ShareServiceConfig {
  autoSaveToCameraRoll: boolean;
}

export class ShareService {
  private config: ShareServiceConfig = {
    autoSaveToCameraRoll: false,
  };

  async updateConfig(newConfig: Partial<ShareServiceConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ShareServiceConfig {
    return { ...this.config };
  }

  /**
   * Share receipt image via native share sheet
   */
  async shareReceiptImage(receipt: Receipt): Promise<boolean> {
    try {
      if (!receipt.receipt_url) {
        Alert.alert('Error', 'No receipt image available to share');
        return false;
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return false;
      }

      // Download the image to local cache if it's a remote URL
      const localImageUri = await this.getLocalImageUri(receipt.receipt_url);
      
      if (!localImageUri) {
        Alert.alert('Error', 'Failed to prepare image for sharing');
        return false;
      }

      // Share the image
      await Sharing.shareAsync(localImageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Receipt from ${receipt.vendor || 'Unknown Vendor'}`,
        UTI: 'public.jpeg',
      });

      console.log('✅ Receipt shared successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to share receipt:', error);
      
      // Handle user cancellation gracefully
      if (error.message && (error.message.includes('cancelled') || error.message.includes('User cancelled'))) {
        return false;
      }
      
      Alert.alert('Share Error', 'Unable to share receipt image. Please try again.');
      return false;
    }
  }

  /**
   * Save receipt image to camera roll/photo library
   */
  async saveReceiptToCameraRoll(receipt: Receipt): Promise<boolean> {
    try {
      if (!receipt.receipt_url) {
        console.error('No receipt image URL provided');
        return false;
      }

      // Request permissions first
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        return false;
      }

      // Download the image to local cache if needed
      const localImageUri = await this.getLocalImageUri(receipt.receipt_url);
      
      if (!localImageUri) {
        console.error('Failed to get local image URI');
        return false;
      }

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(localImageUri);
      
      console.log('✅ Receipt saved to camera roll');
      
      // Try to create or update SnapTrack album
      try {
        // Check permissions again specifically for album creation
        const { status } = await MediaLibrary.getPermissionsAsync();
        if (status === 'granted') {
          // Get the most recently saved asset to add to album
          const assets = await MediaLibrary.getAssetsAsync({
            mediaType: MediaLibrary.MediaType.photo,
            sortBy: MediaLibrary.SortBy.creationTime,
            first: 1,
          });
          
          if (assets.assets.length > 0) {
            await this.addToSnapTrackAlbum(assets.assets[0]);
          }
        } else {
          console.log('ℹ️ Skipping album creation - insufficient permissions');
        }
      } catch (albumError) {
        console.error('❌ Failed to add to album:', albumError);
        // Don't fail the whole operation if album creation fails
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save receipt to camera roll:', error);
      return false;
    }
  }

  /**
   * Auto-save receipt if enabled in settings
   */
  async autoSaveReceiptIfEnabled(receipt: Receipt): Promise<void> {
    if (this.config.autoSaveToCameraRoll) {
      try {
        await this.saveReceiptToCameraRoll(receipt);
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
        // Don't show error to user for auto-save failures
      }
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'SnapTrack needs permission to save images to your photo library. Please enable photo library access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS, this will open the Settings app
              if (Platform.OS === 'ios') {
                require('react-native').Linking.openURL('app-settings:');
              }
            }}
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to request media library permissions:', error);
      return false;
    }
  }

  /**
   * Check if media library permissions are granted
   */
  async hasMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Failed to check media library permissions:', error);
      return false;
    }
  }

  /**
   * Get local image URI, downloading if necessary
   */
  private async getLocalImageUri(imageUri: string): Promise<string | null> {
    try {
      // If it's already a local file, return as-is
      if (imageUri.startsWith('file://')) {
        return imageUri;
      }

      // If it's a remote URL, download to cache
      if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
        const filename = `receipt_${Date.now()}.jpg`;
        const localUri = FileSystem.cacheDirectory + filename;
        
        const downloadResult = await FileSystem.downloadAsync(imageUri, localUri);
        
        if (downloadResult.status === 200) {
          return downloadResult.uri;
        }
      }

      return imageUri; // Return original if we can't process it
    } catch (error) {
      console.error('❌ Failed to get local image URI:', error);
      return null;
    }
  }

  /**
   * Generate a descriptive filename for the receipt
   */
  private generateReceiptFilename(receipt: Receipt): string {
    const vendor = (receipt.vendor || 'receipt').replace(/[^a-zA-Z0-9]/g, '_');
    const date = receipt.date ? new Date(receipt.date).toISOString().split('T')[0] : 'unknown_date';
    const amount = receipt.amount ? receipt.amount.toFixed(2).replace('.', '_') : '0_00';
    
    return `snaptrack_${vendor}_${date}_$${amount}.jpg`;
  }

  /**
   * Add saved asset to SnapTrack album
   */
  private async addToSnapTrackAlbum(asset: MediaLibrary.Asset): Promise<void> {
    try {
      // Check if we have full permissions for album management
      const { status, accessPrivileges } = await MediaLibrary.getPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('ℹ️ Insufficient permissions for album creation');
        return;
      }

      // Try to get existing SnapTrack album
      const albums = await MediaLibrary.getAlbumsAsync();
      let snapTrackAlbum = albums.find(album => album.title === 'SnapTrack Receipts');
      
      if (!snapTrackAlbum) {
        // Create SnapTrack album if it doesn't exist
        snapTrackAlbum = await MediaLibrary.createAlbumAsync('SnapTrack Receipts', asset, false);
        console.log('✅ Created SnapTrack Receipts album');
      } else {
        // Add asset to existing album
        await MediaLibrary.addAssetsToAlbumAsync([asset], snapTrackAlbum, false);
        console.log('✅ Added receipt to SnapTrack Receipts album');
      }
    } catch (error) {
      console.error('❌ Failed to add to SnapTrack album:', error);
      // Log more details for debugging
      if (error instanceof Error && error.message && error.message.includes('permission')) {
        console.log('ℹ️ Permission error - receipt saved but album organization skipped');
      }
    }
  }
}

// Export singleton instance
export const shareService = new ShareService();