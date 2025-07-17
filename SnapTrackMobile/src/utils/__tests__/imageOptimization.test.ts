import { estimateUploadTimeSavings, OCR_OPTIMIZATION_CONFIG } from '../imageOptimization';

// Mock expo modules for testing
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' }
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn()
}));

describe('imageOptimization', () => {
  it('estimateUploadTimeSavings calculates correctly', () => {
    const originalSize = 5 * 1024 * 1024; // 5MB
    const optimizedSize = 3 * 1024 * 1024; // 3MB
    const savings = estimateUploadTimeSavings(originalSize, optimizedSize, 1);
    expect(savings).toBe(2); // 2 seconds saved
  });

  it('OCR_OPTIMIZATION_CONFIG has expected values', () => {
    expect(OCR_OPTIMIZATION_CONFIG.maxWidth).toBe(2048);
    expect(OCR_OPTIMIZATION_CONFIG.maxHeight).toBe(2048);
    expect(OCR_OPTIMIZATION_CONFIG.quality).toBe(0.7);
  });
});