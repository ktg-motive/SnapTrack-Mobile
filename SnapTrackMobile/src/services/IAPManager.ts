// IAP Manager - Re-export RevenueCat implementation
import RevenueCatIAPManager from './RevenueCatIAPManager';

export default RevenueCatIAPManager;
export const iapManager = RevenueCatIAPManager.getInstance();