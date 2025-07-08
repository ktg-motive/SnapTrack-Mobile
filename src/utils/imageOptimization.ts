/**
 * Image Optimization Utilities
 * 
 * Optimizes images for OCR processing to reduce upload time while maintaining quality.
 * Backend handles rotation correction and final preprocessing, so we can safely compress here.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export interface ImageOptimizationConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: ImageManipulator.SaveFormat;
}

// OCR-optimized settings based on Google Vision API recommendations
export const OCR_OPTIMIZATION_CONFIG: ImageOptimizationConfig = {
  maxWidth: 2048,      // Google Vision recommended max
  maxHeight: 2048,     // Google Vision recommended max  
  quality: 0.7,        // 70% quality - good balance of size vs clarity
  format: ImageManipulator.SaveFormat.JPEG,
};

// Aggressive compression for very large images
export const AGGRESSIVE_OPTIMIZATION_CONFIG: ImageOptimizationConfig = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.6,        // 60% quality - smaller files
  format: ImageManipulator.SaveFormat.JPEG,
};

/**
 * Optimizes an image for OCR processing
 * 
 * @param imageUri - Local file URI of the image
 * @param config - Optimization configuration (defaults to OCR_OPTIMIZATION_CONFIG)
 * @returns Promise<{uri: string, originalSize: number, optimizedSize: number, compressionRatio: number}>
 */
export async function optimizeImageForOCR(
  imageUri: string,
  config: ImageOptimizationConfig = OCR_OPTIMIZATION_CONFIG
): Promise<{
  uri: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}> {
  try {
    // Get original file size
    const originalInfo = await FileSystem.getInfoAsync(imageUri);
    const originalSize = originalInfo.exists ? originalInfo.size || 0 : 0;

    console.log('📸 Optimizing image for OCR:', {
      originalUri: imageUri,
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      config
    });

    // Apply image optimization
    const optimizedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        // Resize to max dimensions (maintains aspect ratio)
        {
          resize: {
            width: config.maxWidth,
            height: config.maxHeight,
          }
        }
      ],
      {
        compress: config.quality,
        format: config.format,
        base64: false, // We don't need base64, just the file
      }
    );

    // Get optimized file size
    const optimizedInfo = await FileSystem.getInfoAsync(optimizedImage.uri);
    const optimizedSize = optimizedInfo.exists ? optimizedInfo.size || 0 : 0;
    
    const compressionRatio = originalSize > 0 ? optimizedSize / originalSize : 1;

    console.log('✅ Image optimization complete:', {
      originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
      optimizedSize: `${(optimizedSize / 1024 / 1024).toFixed(2)}MB`,
      compressionRatio: `${(compressionRatio * 100).toFixed(1)}%`,
      savings: `${((1 - compressionRatio) * 100).toFixed(1)}%`,
      newUri: optimizedImage.uri
    });

    return {
      uri: optimizedImage.uri,
      originalSize,
      optimizedSize,
      compressionRatio,
    };

  } catch (error) {
    console.error('❌ Image optimization failed:', error);
    
    // Return original image if optimization fails
    const fallbackInfo = await FileSystem.getInfoAsync(imageUri);
    const fallbackSize = fallbackInfo.exists ? fallbackInfo.size || 0 : 0;
    
    return {
      uri: imageUri,
      originalSize: fallbackSize,
      optimizedSize: fallbackSize,
      compressionRatio: 1,
    };
  }
}

/**
 * Gets the appropriate optimization config based on original image size
 * 
 * @param imageUri - Local file URI of the image
 * @returns Promise<ImageOptimizationConfig>
 */
export async function getOptimalConfig(imageUri: string): Promise<ImageOptimizationConfig> {
  try {
    const info = await FileSystem.getInfoAsync(imageUri);
    const sizeInMB = info.exists ? (info.size || 0) / 1024 / 1024 : 0;

    // Use aggressive compression for very large files (>8MB)
    if (sizeInMB > 8) {
      console.log('📸 Large image detected, using aggressive compression');
      return AGGRESSIVE_OPTIMIZATION_CONFIG;
    }

    // Standard OCR optimization for normal sized images
    return OCR_OPTIMIZATION_CONFIG;
  } catch (error) {
    console.error('❌ Failed to analyze image size:', error);
    return OCR_OPTIMIZATION_CONFIG;
  }
}

/**
 * Smart optimization that automatically selects the best settings
 * 
 * @param imageUri - Local file URI of the image
 * @returns Promise<{uri: string, originalSize: number, optimizedSize: number, compressionRatio: number}>
 */
export async function smartOptimizeImage(imageUri: string) {
  const config = await getOptimalConfig(imageUri);
  return optimizeImageForOCR(imageUri, config);
}

/**
 * Optimization metrics for performance tracking
 */
export interface OptimizationMetrics {
  totalOriginalSize: number;
  totalOptimizedSize: number;
  totalImages: number;
  averageCompressionRatio: number;
  totalUploadTimeSaved: number; // Estimated based on compression
}

/**
 * Estimates upload time savings based on compression ratio
 * Assumes average upload speed of 1MB/s (typical mobile data)
 */
export function estimateUploadTimeSavings(
  originalSize: number,
  optimizedSize: number,
  uploadSpeedMBps: number = 1
): number {
  const sizeDifferenceMB = (originalSize - optimizedSize) / 1024 / 1024;
  return sizeDifferenceMB / uploadSpeedMBps; // Time saved in seconds
}