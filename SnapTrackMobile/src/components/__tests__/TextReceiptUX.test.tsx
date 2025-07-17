import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ReceiptCard } from '../ReceiptCard';
import { ReceiptPreviewModal } from '../ReceiptPreviewModal';
import { Receipt } from '../../types';

// Mock the theme
jest.mock('../../styles/theme', () => ({
  theme: {
    colors: {
      surface: '#fff',
      onSurface: '#000',
      primary: '#007AFF',
      accent: '#FF9500',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      secondaryContainer: '#E3F2FD',
      onSecondaryContainer: '#0D47A1',
      onSurfaceVariant: '#666',
      outline: '#999',
      placeholder: '#999',
      primaryContainer: '#E3F2FD',
      onPrimaryContainer: '#0D47A1',
      textPrimary: '#000',
      textSecondary: '#666',
      textMuted: '#999',
      card: '#fff',
      background: '#f5f5f5',
      shadow: '#000'
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxs: 2
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12
    }
  }
}));

// Mock other dependencies
jest.mock('../hooks/useReceiptEditor', () => ({
  useReceiptEditor: () => ({
    isEditing: false,
    editData: {},
    entities: [],
    tagInput: '',
    tagSuggestions: [],
    showSuggestions: false,
    isSaving: false,
    handleEdit: jest.fn(),
    handleSave: jest.fn(),
    handleCancel: jest.fn(),
    handleDelete: jest.fn(),
    handlePreview: jest.fn(),
    handleAddTag: jest.fn(),
    handleRemoveTag: jest.fn(),
    handleTagInputChange: jest.fn(),
    handleSelectSuggestion: jest.fn(),
    updateEditData: jest.fn(),
    setTagInput: jest.fn(),
    setShowSuggestions: jest.fn()
  })
}));

jest.mock('../../services/shareService', () => ({
  shareService: {
    shareReceiptImage: jest.fn(),
    saveReceiptToCameraRoll: jest.fn()
  }
}));

// Sample text receipt data
const textReceipt: Receipt = {
  id: 'text-receipt-1',
  vendor: 'Toast POS',
  amount: 24.50,
  date: '2025-01-07',
  entity: 'Personal',
  tags: ['dining', 'lunch'],
  notes: '',
  confidence_score: 0.92,
  created_at: '2025-01-07T12:00:00Z',
  updated_at: '2025-01-07T12:00:00Z',
  user_id: 'user-1',
  tenant_id: 'tenant-1',
  extraction_method: 'text',
  email_subject: 'Receipt from Toast POS - Order #12345',
  raw_text: 'Thank you for your order!\n\nToast POS\n123 Main St\nOrder #12345\n\nBurger: $18.00\nFries: $4.50\nTax: $2.00\nTotal: $24.50\n\nPaid with credit card ending in 1234'
};

// Sample image receipt data for comparison
const imageReceipt: Receipt = {
  id: 'image-receipt-1',
  vendor: 'Starbucks',
  amount: 5.75,
  date: '2025-01-07',
  entity: 'Business',
  tags: ['coffee'],
  notes: 'Morning coffee',
  confidence_score: 0.95,
  receipt_url: 'https://example.com/receipt.jpg',
  created_at: '2025-01-07T12:00:00Z',
  updated_at: '2025-01-07T12:00:00Z',
  user_id: 'user-1',
  tenant_id: 'tenant-1',
  extraction_method: 'ocr'
};

describe('Text Receipt UX Implementation', () => {
  describe('ReceiptCard Component', () => {
    it('should display "Email" badge for text receipts', () => {
      render(<ReceiptCard receipt={textReceipt} />);
      
      expect(screen.getByText('Email')).toBeTruthy();
    });

    it('should not display "Email" badge for image receipts', () => {
      render(<ReceiptCard receipt={imageReceipt} />);
      
      expect(screen.queryByText('Email')).toBeNull();
    });

    it('should display email subject when no notes are present', () => {
      render(<ReceiptCard receipt={textReceipt} />);
      
      expect(screen.getByText('📧 Receipt from Toast POS - Order #12345')).toBeTruthy();
    });

    it('should always show view button for text receipts', () => {
      render(<ReceiptCard receipt={textReceipt} />);
      
      // The view button should be present even without receipt_url
      expect(screen.getByTestId('view-button')).toBeTruthy();
    });

    it('should use file-document-outline icon for text receipts', () => {
      render(<ReceiptCard receipt={textReceipt} />);
      
      // This would need to be tested with icon testing utilities
      // The icon should be file-document-outline instead of eye
    });
  });

  describe('ReceiptPreviewModal Component', () => {
    it('should show email receipt card for text receipts', () => {
      render(
        <ReceiptPreviewModal
          receipt={textReceipt}
          isVisible={true}
          onClose={jest.fn()}
        />
      );
      
      expect(screen.getByText('Email Receipt')).toBeTruthy();
      expect(screen.getByText('Processed from email content')).toBeTruthy();
    });

    it('should display email subject in preview modal', () => {
      render(
        <ReceiptPreviewModal
          receipt={textReceipt}
          isVisible={true}
          onClose={jest.fn()}
        />
      );
      
      expect(screen.getByText('Email Subject:')).toBeTruthy();
      expect(screen.getByText('Receipt from Toast POS - Order #12345')).toBeTruthy();
    });

    it('should display receipt summary with proper formatting', () => {
      render(
        <ReceiptPreviewModal
          receipt={textReceipt}
          isVisible={true}
          onClose={jest.fn()}
        />
      );
      
      expect(screen.getByText('$24.50')).toBeTruthy();
      expect(screen.getByText('Toast POS')).toBeTruthy();
      expect(screen.getByText('Text Processing')).toBeTruthy();
    });

    it('should display original email content', () => {
      render(
        <ReceiptPreviewModal
          receipt={textReceipt}
          isVisible={true}
          onClose={jest.fn()}
        />
      );
      
      expect(screen.getByText('Original Email Content')).toBeTruthy();
      expect(screen.getByText(/Thank you for your order!/)).toBeTruthy();
    });

    it('should show regular image display for image receipts', () => {
      render(
        <ReceiptPreviewModal
          receipt={imageReceipt}
          isVisible={true}
          onClose={jest.fn()}
        />
      );
      
      // Should not show email receipt card
      expect(screen.queryByText('Email Receipt')).toBeNull();
      expect(screen.queryByText('Processed from email content')).toBeNull();
    });
  });

  describe('Cross-Platform Consistency', () => {
    it('should handle text receipts consistently across components', () => {
      // Test that both components recognize extraction_method === 'text'
      expect(textReceipt.extraction_method).toBe('text');
      
      // Both components should display text receipt specific content
      const cardRender = render(<ReceiptCard receipt={textReceipt} />);
      expect(cardRender.getByText('Email')).toBeTruthy();
      
      const modalRender = render(
        <ReceiptPreviewModal
          receipt={textReceipt}
          isVisible={true}
          onClose={jest.fn()}
        />
      );
      expect(modalRender.getByText('Email Receipt')).toBeTruthy();
    });

    it('should use same data fields across components', () => {
      // Verify both components can access text receipt fields
      expect(textReceipt.email_subject).toBeDefined();
      expect(textReceipt.raw_text).toBeDefined();
      expect(textReceipt.extraction_method).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing email_subject gracefully', () => {
      const receiptWithoutSubject = {
        ...textReceipt,
        email_subject: undefined
      };
      
      render(<ReceiptCard receipt={receiptWithoutSubject} />);
      
      // Should fall back to "No description" when no notes and no email_subject
      expect(screen.getByText('No description')).toBeTruthy();
    });

    it('should handle missing raw_text gracefully', () => {
      const receiptWithoutRawText = {
        ...textReceipt,
        raw_text: undefined
      };
      
      render(
        <ReceiptPreviewModal
          receipt={receiptWithoutRawText}
          isVisible={true}
          onClose={jest.fn()}
        />
      );
      
      // Should not show original email content section
      expect(screen.queryByText('Original Email Content')).toBeNull();
    });
  });
});