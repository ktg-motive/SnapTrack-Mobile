import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { OfflineReceipt, OfflineAction } from '../types';

interface QueuedReceipt {
  id: string;
  imageUri: string;
  entity: string;
  vendor: string;
  amount: number;
  date: string;
  category?: string;
  tags: string[];
  notes?: string;
  timestamp: number;
  status: 'pending' | 'uploading' | 'failed';
  retries: number;
}

class OfflineStorageService {
  private static QUEUE_KEY = '@snaptrack_upload_queue';
  private static RECEIPTS_KEY = '@snaptrack_cached_receipts';
  private static SYNC_STATUS_KEY = '@snaptrack_sync_status';
  private static MAX_RETRIES = 3;

  /**
   * Queue a receipt for upload when online
   */
  async queueReceiptUpload(receipt: Omit<QueuedReceipt, 'id' | 'timestamp' | 'status' | 'retries'>): Promise<string> {
    const receiptId = `offline_${Date.now()}`;
    const queuedReceipt: QueuedReceipt = {
      ...receipt,
      id: receiptId,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0
    };

    const queue = await this.getUploadQueue();
    queue.push(queuedReceipt);
    await AsyncStorage.setItem(OfflineStorageService.QUEUE_KEY, JSON.stringify(queue));

    console.log('📱 Queued receipt for offline upload:', receiptId);
    return receiptId;
  }

  /**
   * Get current upload queue
   */
  async getUploadQueue(): Promise<QueuedReceipt[]> {
    try {
      const queueData = await AsyncStorage.getItem(OfflineStorageService.QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('❌ Failed to get upload queue:', error);
      return [];
    }
  }

  /**
   * Get number of pending uploads
   */
  async getPendingUploadsCount(): Promise<number> {
    const queue = await this.getUploadQueue();
    return queue.filter(r => r.status === 'pending' || r.status === 'failed').length;
  }

  /**
   * Process upload queue when online
   */
  async processQueue(apiClient: any): Promise<{ success: number; failed: number }> {
    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    
    if (!isConnected) {
      console.log('📡 No internet connection, skipping queue processing');
      return { success: 0, failed: 0 };
    }

    const queue = await this.getUploadQueue();
    const pendingReceipts = queue.filter(r => 
      r.status === 'pending' || (r.status === 'failed' && r.retries < OfflineStorageService.MAX_RETRIES)
    );

    if (pendingReceipts.length === 0) {
      console.log('📱 No pending receipts to upload');
      return { success: 0, failed: 0 };
    }

    console.log(`📱 Processing ${pendingReceipts.length} pending receipts`);
    let successCount = 0;
    let failedCount = 0;

    for (const receipt of pendingReceipts) {
      try {
        // Update status to uploading
        receipt.status = 'uploading';
        await this.updateQueueItem(receipt);
        
        // Upload receipt for OCR processing (same as frontend)
        console.log(`📱 Uploading receipt for OCR processing: ${receipt.id}`);
        const uploadResult = await apiClient.uploadReceipt(
          receipt.imageUri,
          receipt.entity,
          receipt.tags?.join(', ') || '', // Fixed: was using category instead of tags
          receipt.notes
        );
        
        // If we have locally stored vendor/amount data, update the created expense
        if (receipt.vendor && receipt.amount && uploadResult.expense?.id) {
          console.log(`📱 Updating expense with local data for ${receipt.id}`);
          await apiClient.updateReceipt(uploadResult.expense.id, {
            vendor: receipt.vendor,
            amount: receipt.amount,
            date: receipt.date,
            tags: receipt.tags || [],
            notes: receipt.notes || ''
          });
        }
        
        // Remove from queue on success
        await this.removeFromQueue(receipt.id);
        successCount++;
        
        console.log(`✅ Successfully uploaded offline receipt: ${receipt.id}`);
        
      } catch (error) {
        console.error(`❌ Failed to upload offline receipt ${receipt.id}:`, error);
        
        receipt.status = 'failed';
        receipt.retries += 1;
        
        if (receipt.retries >= OfflineStorageService.MAX_RETRIES) {
          console.log(`🚫 Max retries reached for receipt ${receipt.id}, removing from queue`);
          await this.removeFromQueue(receipt.id);
        } else {
          await this.updateQueueItem(receipt);
        }
        
        failedCount++;
      }
    }

    console.log(`📱 Queue processing complete: ${successCount} successful, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  }

  /**
   * Cache receipts for offline viewing
   */
  async cacheReceipts(receipts: any[]): Promise<void> {
    try {
      const cachedData = {
        receipts,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(OfflineStorageService.RECEIPTS_KEY, JSON.stringify(cachedData));
    } catch (error) {
      console.error('❌ Failed to cache receipts:', error);
    }
  }

  /**
   * Get cached receipts for offline viewing
   */
  async getCachedReceipts(): Promise<any[]> {
    try {
      const cachedData = await AsyncStorage.getItem(OfflineStorageService.RECEIPTS_KEY);
      if (!cachedData) return [];

      const parsed = JSON.parse(cachedData);
      const isStale = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000; // 24 hours

      if (isStale) {
        console.log('📱 Cached receipts are stale, returning empty array');
        return [];
      }

      return parsed.receipts || [];
    } catch (error) {
      console.error('❌ Failed to get cached receipts:', error);
      return [];
    }
  }

  /**
   * Alias for getCachedReceipts for backward compatibility
   */
  async getReceipts(): Promise<any[]> {
    return this.getCachedReceipts();
  }

  /**
   * Check if device is currently online
   */
  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected || false;
    } catch (error) {
      console.error('❌ Failed to check network status:', error);
      return false;
    }
  }

  /**
   * Get sync status information
   */
  async getSyncStatus(): Promise<{ lastSync: number; pendingCount: number }> {
    try {
      const statusData = await AsyncStorage.getItem(OfflineStorageService.SYNC_STATUS_KEY);
      const pendingCount = await this.getPendingUploadsCount();
      
      if (!statusData) {
        return { lastSync: 0, pendingCount };
      }

      const parsed = JSON.parse(statusData);
      return { lastSync: parsed.lastSync || 0, pendingCount };
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      return { lastSync: 0, pendingCount: 0 };
    }
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(): Promise<void> {
    try {
      const syncData = { lastSync: Date.now() };
      await AsyncStorage.setItem(OfflineStorageService.SYNC_STATUS_KEY, JSON.stringify(syncData));
    } catch (error) {
      console.error('❌ Failed to update sync status:', error);
    }
  }

  /**
   * Clear all offline data (for logout, etc.)
   */
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(OfflineStorageService.QUEUE_KEY),
        AsyncStorage.removeItem(OfflineStorageService.RECEIPTS_KEY),
        AsyncStorage.removeItem(OfflineStorageService.SYNC_STATUS_KEY)
      ]);
      console.log('📱 Cleared all offline data');
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
    }
  }

  // Private helper methods

  private async updateQueueItem(receipt: QueuedReceipt): Promise<void> {
    try {
      const queue = await this.getUploadQueue();
      const index = queue.findIndex(r => r.id === receipt.id);
      
      if (index >= 0) {
        queue[index] = receipt;
        await AsyncStorage.setItem(OfflineStorageService.QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('❌ Failed to update queue item:', error);
    }
  }

  private async removeFromQueue(receiptId: string): Promise<void> {
    try {
      const queue = await this.getUploadQueue();
      const filtered = queue.filter(r => r.id !== receiptId);
      await AsyncStorage.setItem(OfflineStorageService.QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('❌ Failed to remove from queue:', error);
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
export default offlineStorage;