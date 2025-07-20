// RevenueCat IAP Manager
import { Platform } from 'react-native';
import Purchases, { 
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  PurchasesOfferings,
  PRODUCT_CATEGORY,
  PurchasesError,
  LOG_LEVEL
} from 'react-native-purchases';

// RevenueCat API Key
const REVENUECAT_API_KEY = 'appl_WLEVmwCIKvGCRoEJbzbKDMuHMIO';

interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceString: string;
  currency: string;
}

class RevenueCatIAPManager {
  private static instance: RevenueCatIAPManager;
  private offerings: PurchasesOfferings | null = null;
  private isConfigured: boolean = false;

  static getInstance(): RevenueCatIAPManager {
    if (!RevenueCatIAPManager.instance) {
      RevenueCatIAPManager.instance = new RevenueCatIAPManager();
    }
    return RevenueCatIAPManager.instance;
  }

  async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('IAP only available on iOS');
      return;
    }

    if (this.isConfigured) {
      console.log('✅ RevenueCat already configured');
      return;
    }

    try {
      console.log('🍎 Initializing RevenueCat...');
      console.log('🍎 Purchases module available:', !!Purchases);
      console.log('🍎 Purchases.configure available:', typeof Purchases.configure);
      
      // Enable debug logs
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      
      // Configure RevenueCat
      await Purchases.configure({ 
        apiKey: REVENUECAT_API_KEY,
        appUserID: null, // Let RevenueCat generate anonymous IDs
        observerMode: false,
        useAmazon: false
      });
      
      this.isConfigured = true;
      console.log('✅ RevenueCat configured successfully');
      
      // Set up purchase update listener
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        console.log('📱 Customer info updated:', customerInfo.activeSubscriptions);
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async loadProducts(): Promise<Product[]> {
    if (!this.isConfigured) {
      await this.initialize();
    }

    try {
      console.log('📦 Loading offerings from RevenueCat...');
      
      // Get offerings from RevenueCat
      this.offerings = await Purchases.getOfferings();
      
      if (!this.offerings || !this.offerings.current) {
        console.warn('⚠️ No current offering available');
        return [];
      }
      
      console.log('Current offering:', this.offerings.current.identifier);
      
      // Get available packages
      const packages = this.offerings.current.availablePackages;
      
      if (!packages || packages.length === 0) {
        console.warn('⚠️ No packages available in current offering');
        return [];
      }
      
      // Map packages to our Product format
      const products: Product[] = packages.map(pkg => ({
        productId: pkg.product.identifier,
        title: pkg.product.title || 'SnapTrack Monthly',
        description: pkg.product.description || 'Full access to SnapTrack receipt management',
        price: pkg.product.price.toString(),
        priceString: pkg.product.priceString,
        currency: pkg.product.currencyCode || 'USD'
      }));
      
      console.log('✅ Products loaded:', products);
      return products;
      
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      return [];
    }
  }

  async purchase(productId: string): Promise<any> {
    if (!this.isConfigured) {
      await this.initialize();
    }

    try {
      console.log('💳 Starting purchase for:', productId);
      
      // Find the package for this product
      if (!this.offerings || !this.offerings.current) {
        throw new Error('No offerings available');
      }
      
      const packageToPurchase = this.offerings.current.availablePackages.find(
        pkg => pkg.product.identifier === productId
      );
      
      if (!packageToPurchase) {
        throw new Error(`Product ${productId} not found`);
      }
      
      // Make the purchase
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('✅ Purchase successful');
      console.log('Product purchased:', productIdentifier);
      console.log('Active subscriptions:', customerInfo.activeSubscriptions);
      
      // Return a purchase object that matches our expected format
      return {
        transactionId: customerInfo.originalPurchaseDate || Date.now().toString(),
        productId: productIdentifier,
        customerInfo
      };
      
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      
      // Check if user cancelled
      if (error.code === 'UserCancelledError' || error.userCancelled) {
        throw new Error('Purchase cancelled');
      }
      
      throw error;
    }
  }

  async getReceipt(): Promise<string | null> {
    try {
      console.log('🧾 Getting customer info...');
      
      // RevenueCat handles receipts internally, but we can get customer info
      const customerInfo = await Purchases.getCustomerInfo();
      
      // For backend validation, we'll send the customer info
      // RevenueCat validates receipts server-side
      return JSON.stringify({
        appUserID: customerInfo.originalAppUserId,
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: customerInfo.entitlements.active
      });
      
    } catch (error) {
      console.error('❌ Error getting customer info:', error);
      return null;
    }
  }

  async finishTransaction(purchase: any, consumable: boolean = false): Promise<void> {
    // RevenueCat handles transaction finishing automatically
    console.log('✅ Transaction handled by RevenueCat');
  }

  async restorePurchases(): Promise<void> {
    if (!this.isConfigured) {
      await this.initialize();
    }

    try {
      console.log('🔄 Restoring purchases...');
      
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('✅ Purchases restored');
      console.log('Active subscriptions:', customerInfo.activeSubscriptions);
      
    } catch (error) {
      console.error('❌ Restore purchases error:', error);
      throw error;
    }
  }

  async clearPendingTransactions(): Promise<void> {
    // RevenueCat handles this automatically
    console.log('✅ RevenueCat handles transaction management');
  }

  async disconnect(): Promise<void> {
    // RevenueCat doesn't need explicit disconnect
    console.log('✅ RevenueCat cleanup not needed');
  }

  getProducts(): Product[] {
    if (!this.offerings || !this.offerings.current) {
      return [];
    }
    
    return this.offerings.current.availablePackages.map(pkg => ({
      productId: pkg.product.identifier,
      title: pkg.product.title || 'SnapTrack Monthly',
      description: pkg.product.description || 'Full access to SnapTrack receipt management',
      price: pkg.product.price.toString(),
      priceString: pkg.product.priceString,
      currency: pkg.product.currencyCode || 'USD'
    }));
  }

  isInitialized(): boolean {
    return this.isConfigured;
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Check if user has any active subscriptions
      return customerInfo.activeSubscriptions.length > 0;
      
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}

export default RevenueCatIAPManager;
export const revenueCatIAPManager = RevenueCatIAPManager.getInstance();