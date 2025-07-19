import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// Initialize Sentry with free tier optimizations
export const initSentry = () => {
  try {
    Sentry.init({
      dsn: 'https://254bbe4264d311f0aa2e7640a9c25708@o4509696760872960.ingest.us.sentry.io/4509696760872960',
    
    // Environment configuration
    environment: __DEV__ ? 'development' : 'production',
    
    // Only send errors in production to conserve quota
    enabled: !__DEV__,
    
    // Debug mode for development
    debug: __DEV__,
    
    // Performance Monitoring - Sample at 10% to stay within free tier
    tracesSampleRate: __DEV__ ? 0 : 0.1, // 0% in dev, 10% in production
    
    // Session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    
    // Breadcrumbs configuration
    maxBreadcrumbs: 50, // Capture more context for errors
    
    // Release tracking
    release: '1.0.0', // This should match your app version
    dist: '1', // Build number
    
    // Error filtering to conserve quota
    beforeSend(event, hint) {
      // Filter out development errors
      if (__DEV__) {
        return null;
      }
      
      // Filter out non-critical warnings
      if (event.level === 'warning' || event.level === 'info') {
        return null;
      }
      
      // Filter out network errors that are expected (like user offline)
      const error = hint.originalException;
      if (error && error instanceof Error) {
        if (error.message && error.message.includes('Network request failed')) {
          // Only send if it's during a critical operation
          const breadcrumbs = event.breadcrumbs || [];
          const hasUploadOperation = breadcrumbs.some(
            b => b.message && b.message.includes('uploadReceipt')
          );
          if (!hasUploadOperation) {
            return null;
          }
        }
      }
      
      return event;
    },
    
    // Transaction filtering for performance monitoring
    beforeSendTransaction(transaction) {
      // Only sample critical transactions
      const criticalTransactions = [
        'uploadReceipt',
        'processReceiptWithAPI',
        'api.parse',
        'api.expenses'
      ];
      
      const transactionName = transaction.transaction || '';
      const isCritical = criticalTransactions.some(name => 
        transactionName.includes(name)
      );
      
      // Sample critical transactions at 50%, others at 5%
      const sampleRate = isCritical ? 0.5 : 0.05;
      return Math.random() < sampleRate ? transaction : null;
    },
    
    integrations: [
      // Capture console logs as breadcrumbs
      Sentry.breadcrumbsIntegration({
        console: true,
        fetch: true,
        navigation: true,
      }),
      
      // React Navigation integration
      // Commenting out temporarily to debug crash
      // Sentry.reactNavigationIntegration(),
      
      // React Native specific integrations
      Sentry.nativeCrashIntegration(),
      // Sentry.touchEventBoundaryIntegration(),
      
      // Screenshot integration (only on crash)
      // Commenting out temporarily - might be causing crash
      // Sentry.screenshotIntegration({
      //   attachScreenshot: true,
      // }),
    ],
    
    // Attachments (be careful with size to stay in free tier)
    // Commenting out temporarily - might be causing crash
    // attachScreenshot: true,
    // attachViewHierarchy: true,
    
    // Offline caching
    transportOptions: {
      shouldStore: true,
    },
  });
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    // Don't throw - app should still work without Sentry
  }
};

// Helper functions for manual tracking

/**
 * Track API calls with performance monitoring
 */
export const trackApiCall = (endpoint: string, method: string) => {
  const transaction = Sentry.startTransaction({
    name: `api.${endpoint}`,
    op: 'http.client',
    tags: {
      method,
      endpoint,
    },
  });
  
  Sentry.getCurrentScope().setSpan(transaction);
  
  return {
    finish: (status: number, error?: Error) => {
      transaction.setHttpStatus(status);
      if (error) {
        Sentry.captureException(error, {
          tags: {
            api_endpoint: endpoint,
            api_method: method,
            http_status: status,
          },
        });
      }
      transaction.finish();
    },
  };
};

/**
 * Track receipt upload operations
 */
export const trackReceiptUpload = (entityName: string) => {
  const transaction = Sentry.startTransaction({
    name: 'uploadReceipt',
    op: 'upload',
    tags: {
      entity: entityName,
      platform: Platform.OS,
    },
  });
  
  Sentry.addBreadcrumb({
    message: 'Starting receipt upload',
    category: 'upload',
    level: 'info',
    data: {
      entity: entityName,
      timestamp: new Date().toISOString(),
    },
  });
  
  return {
    addBreadcrumb: (message: string, data?: any) => {
      Sentry.addBreadcrumb({
        message,
        category: 'upload',
        level: 'info',
        data,
      });
    },
    finish: (success: boolean, error?: Error) => {
      if (!success && error) {
        Sentry.captureException(error, {
          tags: {
            upload_entity: entityName,
            upload_platform: Platform.OS,
          },
          contexts: {
            upload: {
              entity: entityName,
              platform: Platform.OS,
              timestamp: new Date().toISOString(),
            },
          },
        });
      }
      transaction.setData('success', success);
      transaction.finish();
    },
  };
};

/**
 * Capture custom errors with context
 */
export const captureError = (error: Error, context: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      custom_error: true,
    },
  });
};

/**
 * Add user context for better error tracking
 */
export const setUserContext = (userId: string, email?: string) => {
  Sentry.setUser({
    id: userId,
    email,
  });
};

/**
 * Clear user context on logout
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Add custom breadcrumb
 */
export const addBreadcrumb = (message: string, category: string, data?: any) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
};

// Export Sentry instance for direct access if needed
export { Sentry };