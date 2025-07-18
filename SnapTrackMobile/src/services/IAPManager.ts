// Mock IAP Manager for development/testing
// This prevents crashes when expo-in-app-purchases isn't available
import { Platform } from 'react-native';
import { CONFIG } from '../config';
import { apiClient } from './apiClient';

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
      console.log('🍎 Initializing IAP (Mock Mode)...');
      // Mock initialization for development
      this.isConnected = true;
      
      // Mock product data
      this.products = [{
        productId: PRODUCT_ID,
        title: 'SnapTrack Monthly',
        description: 'Full access to SnapTrack receipt management',
        price: '4.99',
        priceString: '$4.99',
        currency: 'USD'
      }];
      
      console.log('✅ IAP initialized successfully (Mock Mode)');
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
      console.log('🏷️ Loading products (Mock Mode)...');
      // Return mock products for development
      console.log('✅ Products loaded (Mock Mode):', this.products);
      return this.products;
    } catch (error) {
      console.error('❌ Error loading products:', error);
      throw error;
    }
  }

  async purchase(productId: string): Promise<any> {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      console.log('💳 Starting purchase for (Mock Mode):', productId);
      // Mock purchase - always return null for development
      console.log('⚠️ Purchase in Mock Mode - returning null');
      return null;
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      throw new Error('Purchase not available in development mode');
    }
  }

  async purchaseWithOfferCode(productId: string, offerCode: string): Promise<any> {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      console.log('💳 Starting purchase with offer code (Mock Mode):', productId, offerCode);
      // Mock purchase with offer code - always return null for development
      console.log('⚠️ Purchase with offer code in Mock Mode - returning null');
      return null;
    } catch (error: any) {
      console.error('❌ Purchase with offer code error:', error);
      throw new Error('Purchase with offer code not available in development mode');
    }
  }

  async getReceipt(): Promise<string | null> {
    try {
      console.log('🧾 Getting receipt (Mock Mode)...');
      // Mock receipt - always return null for development
      console.log('⚠️ Receipt in Mock Mode - returning null');
      return null;
    } catch (error) {
      console.error('❌ Error getting receipt:', error);
      return null;
    }
  }

  async finishTransaction(purchase: any, consumable: boolean = false): Promise<void> {
    try {
      console.log('✅ Finishing transaction (Mock Mode):', purchase?.transactionId || 'mock');
      // Mock transaction finish - do nothing for development
      console.log('⚠️ Transaction finish in Mock Mode - no action');
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
      console.log('🔄 Restoring purchases (Mock Mode)...');
      // Mock restore - always throw error for development
      console.log('⚠️ Restore purchases in Mock Mode - throwing error');
      throw new Error('No active subscription found (Mock Mode)');
    } catch (error) {
      console.error('❌ Restore purchases error:', error);
      throw error;
    }
  }

  private async handlePurchaseSuccess(purchase: any): Promise<void> {
    try {
      console.log('🎉 Handling successful purchase (Mock Mode):', purchase?.productId || 'mock');
      // Mock purchase success - do nothing for development
      console.log('⚠️ Purchase success in Mock Mode - no action');
    } catch (error) {
      console.error('❌ Error handling purchase:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        // Mock disconnect - just set flag for development
        this.isConnected = false;
        console.log('✅ IAP disconnected (Mock Mode)');
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