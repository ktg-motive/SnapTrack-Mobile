// Real IAP Manager using expo-in-app-purchases
import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import { CONFIG } from '../config';

const PRODUCT_ID = 'com.snaptrack.monthly';

interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceString: string;
  currency: string;
}

class IAPManager {
  private static instance: IAPManager;
  private products: Product[] = [];
  private isConnected: boolean = false;
  private purchaseListener: any = null;

  static getInstance(): IAPManager {
    if (!IAPManager.instance) {
      IAPManager.instance = new IAPManager();
    }
    return IAPManager.instance;
  }

  async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('IAP only available on iOS');
      return;
    }

    try {
      console.log('🍎 Initializing IAP Manager...');
      
      // Connect to App Store
      await InAppPurchases.connectAsync();
      this.isConnected = true;
      
      // Clear any pending transactions
      console.log('🧹 Clearing pending transactions...');
      const history = await InAppPurchases.getPurchaseHistoryAsync();
      if (history && history.length > 0) {
        for (const purchase of history) {
          if (purchase && !purchase.acknowledged) {
            console.log('Finishing unacknowledged transaction:', purchase.productId);
            await InAppPurchases.finishTransactionAsync(purchase, false);
          }
        }
      }
      
      // Set up purchase listener
      this.purchaseListener = InAppPurchases.setPurchaseListener(({ purchases, responseCode }) => {
        console.log('Purchase event:', responseCode, purchases);
      });
      
      console.log('✅ Connected to App Store');
    } catch (error) {
      console.error('❌ Failed to initialize IAP:', error);
      throw error;
    }
  }

  async loadProducts(): Promise<Product[]> {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      console.log('📦 Loading products...');
      
      const { results } = await InAppPurchases.getProductsAsync([PRODUCT_ID]);
      
      if (results && results.length > 0) {
        // Map expo-in-app-purchases format to our format
        this.products = results.map(item => ({
          productId: item.productId,
          title: item.title || 'SnapTrack Monthly',
          description: item.description || 'Full access to SnapTrack receipt management',
          price: item.price || '4.99',
          priceString: item.priceString || '$4.99',
          currency: item.priceCurrencyCode || 'USD'
        }));
        
        console.log('✅ Products loaded:', this.products);
        return this.products;
      } else {
        console.warn('⚠️ No products found');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      throw error;
    }
  }

  async purchase(productId: string): Promise<any> {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      console.log('💳 Starting purchase for:', productId);
      
      // Purchase the product
      const purchase = await InAppPurchases.purchaseItemAsync(productId);
      
      console.log('✅ Purchase successful:', purchase);
      return purchase;
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      
      if (error.code === 'E_USER_CANCELLED') {
        throw new Error('Purchase cancelled');
      }
      
      throw error;
    }
  }

  async purchaseWithOfferCode(productId: string, offerCode: string): Promise<any> {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      console.log('💳 Starting purchase with offer code:', productId, offerCode);
      
      // Note: expo-in-app-purchases doesn't natively support offer codes
      // You need to use the native iOS StoreKit 2 API for this
      // For now, we'll do a regular purchase and send the offer code to the backend
      const purchase = await InAppPurchases.purchaseItemAsync(productId);
      
      // The backend will need to validate the offer code
      console.log('✅ Purchase successful (offer code will be validated by backend):', purchase);
      return purchase;
    } catch (error: any) {
      console.error('❌ Purchase with offer code error:', error);
      
      if (error.code === 'E_USER_CANCELLED') {
        throw new Error('Purchase cancelled');
      }
      
      throw error;
    }
  }

  async getReceipt(): Promise<string | null> {
    try {
      console.log('🧾 Getting receipt...');
      
      // Refresh receipt first to ensure we have the latest
      await InAppPurchases.refreshHistoryAsync();
      
      // Get the receipt
      const receipt = await InAppPurchases.getReceiptAsync();
      
      if (receipt) {
        console.log('✅ Receipt retrieved');
        return receipt;
      } else {
        console.log('⚠️ No receipt found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting receipt:', error);
      return null;
    }
  }

  async finishTransaction(purchase: any, consumable: boolean = false): Promise<void> {
    try {
      console.log('✅ Finishing transaction:', purchase?.transactionId);
      
      // Acknowledge the purchase
      await InAppPurchases.finishTransactionAsync(purchase, consumable);
      
      console.log('✅ Transaction finished');
    } catch (error) {
      console.error('❌ Error finishing transaction:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<void> {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      console.log('🔄 Restoring purchases...');
      
      // This will trigger the purchase listener with restored purchases
      await InAppPurchases.refreshHistoryAsync();
      
      console.log('✅ Purchase history refreshed');
    } catch (error) {
      console.error('❌ Restore purchases error:', error);
      throw error;
    }
  }

  async clearPendingTransactions(): Promise<void> {
    try {
      console.log('🧹 Clearing all pending transactions...');
      
      // Get purchase history
      const history = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (history && history.length > 0) {
        for (const purchase of history) {
          console.log('Found transaction:', purchase.productId, 'acknowledged:', purchase.acknowledged);
          // Finish all transactions, acknowledged or not
          await InAppPurchases.finishTransactionAsync(purchase, false);
        }
        console.log('✅ Cleared', history.length, 'transactions');
      } else {
        console.log('✅ No pending transactions found');
      }
    } catch (error) {
      console.error('❌ Error clearing transactions:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await InAppPurchases.disconnectAsync();
        this.isConnected = false;
        console.log('✅ IAP disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting IAP:', error);
    }
  }

  getProducts(): Product[] {
    return this.products;
  }

  isInitialized(): boolean {
    return this.isConnected;
  }
}

export default IAPManager;
export const iapManager = IAPManager.getInstance();