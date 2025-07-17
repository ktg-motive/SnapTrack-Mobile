import AsyncStorage from '@react-native-async-storage/async-storage';

interface ErrorReport {
  id: string;
  timestamp: number;
  context: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  additionalData?: any;
  userAgent: string;
  appVersion: string;
}

interface PerformanceMetric {
  id: string;
  timestamp: number;
  metric: string;
  duration: number;
  additionalData?: any;
}

class ErrorReportingService {
  private static ERROR_STORAGE_KEY = '@snaptrack_error_reports';
  private static PERFORMANCE_STORAGE_KEY = '@snaptrack_performance_metrics';
  private static MAX_STORED_ERRORS = 50;
  private static MAX_STORED_METRICS = 100;

  /**
   * Log an error with context and additional data
   */
  logError(error: Error, context: string, additionalData?: any): void {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error(`[${context}]`, error.message, additionalData);
    
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: Date.now(),
      context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      additionalData,
      userAgent: 'SnapTrack Mobile App',
      appVersion: '1.0.0' // TODO: Get from config
    };

    // Store locally for potential future sending
    this.storeErrorReport(errorReport);

    // In development, log detailed error info
    if (__DEV__) {
      console.log('🐛 Error Report Details:', errorReport);
    }

    // In production, integrate with crash reporting service
    if (!__DEV__) {
      this.sendErrorToExternalService(errorReport);
    }
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric: string, duration: number, additionalData?: any): void {
    const performanceId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[Performance] ${metric}: ${duration}ms`, additionalData);
    
    const performanceMetric: PerformanceMetric = {
      id: performanceId,
      timestamp: Date.now(),
      metric,
      duration,
      additionalData
    };

    // Store locally
    this.storePerformanceMetric(performanceMetric);

    // In development, log performance details
    if (__DEV__) {
      console.log('📊 Performance Metric:', performanceMetric);
    }

    // In production, send to analytics service
    if (!__DEV__) {
      this.sendPerformanceToExternalService(performanceMetric);
    }
  }

  /**
   * Log API request performance
   */
  logApiRequest(endpoint: string, method: string, duration: number, success: boolean, statusCode?: number): void {
    this.logPerformance(`API_${method.toUpperCase()}_${endpoint}`, duration, {
      endpoint,
      method,
      success,
      statusCode
    });
  }

  /**
   * Log screen navigation performance
   */
  logScreenLoad(screenName: string, duration: number): void {
    this.logPerformance(`SCREEN_LOAD_${screenName}`, duration, {
      screenName
    });
  }

  /**
   * Log OCR processing performance
   */
  logOcrProcessing(duration: number, success: boolean, confidence?: number): void {
    this.logPerformance('OCR_PROCESSING', duration, {
      success,
      confidence
    });
  }

  /**
   * Get stored error reports
   */
  async getStoredErrorReports(): Promise<ErrorReport[]> {
    try {
      const stored = await AsyncStorage.getItem(ErrorReportingService.ERROR_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to get stored error reports:', error);
      return [];
    }
  }

  /**
   * Get stored performance metrics
   */
  async getStoredPerformanceMetrics(): Promise<PerformanceMetric[]> {
    try {
      const stored = await AsyncStorage.getItem(ErrorReportingService.PERFORMANCE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to get stored performance metrics:', error);
      return [];
    }
  }

  /**
   * Clear all stored reports and metrics
   */
  async clearStoredData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ErrorReportingService.ERROR_STORAGE_KEY),
        AsyncStorage.removeItem(ErrorReportingService.PERFORMANCE_STORAGE_KEY)
      ]);
      console.log('📱 Cleared all error reporting data');
    } catch (error) {
      console.error('❌ Failed to clear error reporting data:', error);
    }
  }

  // Private helper methods

  private async storeErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      const existingReports = await this.getStoredErrorReports();
      const updatedReports = [errorReport, ...existingReports]
        .slice(0, ErrorReportingService.MAX_STORED_ERRORS);
      
      await AsyncStorage.setItem(
        ErrorReportingService.ERROR_STORAGE_KEY,
        JSON.stringify(updatedReports)
      );
    } catch (error) {
      console.error('❌ Failed to store error report:', error);
    }
  }

  private async storePerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const existingMetrics = await this.getStoredPerformanceMetrics();
      const updatedMetrics = [metric, ...existingMetrics]
        .slice(0, ErrorReportingService.MAX_STORED_METRICS);
      
      await AsyncStorage.setItem(
        ErrorReportingService.PERFORMANCE_STORAGE_KEY,
        JSON.stringify(updatedMetrics)
      );
    } catch (error) {
      console.error('❌ Failed to store performance metric:', error);
    }
  }

  private sendErrorToExternalService(errorReport: ErrorReport): void {
    // TODO: Integrate with external crash reporting service
    // Examples: Sentry, Crashlytics, Bugsnag
    console.log('🚨 Would send to crash reporting service:', errorReport.id);
  }

  private sendPerformanceToExternalService(metric: PerformanceMetric): void {
    // TODO: Integrate with external analytics service
    // Examples: Firebase Analytics, Mixpanel, Amplitude
    console.log('📊 Would send to analytics service:', metric.id);
  }
}

// Export singleton instance
export const errorReporting = new ErrorReportingService();
export default errorReporting;