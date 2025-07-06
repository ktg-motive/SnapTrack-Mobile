// Shared TypeScript types for feedback system across web and mobile platforms

export enum FeedbackType {
  GENERAL_RATING = 'general_rating',
  PROBLEM_REPORT = 'problem_report',
  FEATURE_REQUEST = 'feature_request',
  ERROR_RECOVERY = 'error_recovery',
  SURVEY = 'survey'
}

export enum FeedbackCategory {
  // Problem categories
  OCR_ACCURACY = 'ocr_accuracy',
  APP_PERFORMANCE = 'app_performance',
  FEATURE_CONFUSION = 'feature_confusion',
  IMAGE_QUALITY = 'image_quality',
  SYNC_ISSUES = 'sync_issues',
  
  // Feature request categories
  RECEIPT_PROCESSING = 'receipt_processing',
  ENTITY_CATEGORIES = 'entity_categories',
  EXPORT_FUNCTIONALITY = 'export_functionality',
  MOBILE_EXPERIENCE = 'mobile_experience',
  WEB_EXPERIENCE = 'web_experience',
  
  // General categories
  GENERAL = 'general',
  OTHER = 'other'
}

export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum FeedbackStatus {
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface FeedbackSubmission {
  type: FeedbackType;
  category?: FeedbackCategory;
  rating?: number; // 1-5 stars for general rating
  subject?: string;
  message: string;
  context?: string; // What user was doing when providing feedback
  platform: 'web' | 'mobile';
  app_version?: string;
  device_info?: string;
  user_agent?: string;
  anonymous?: boolean;
}

export interface Feedback {
  id: string;
  user_id: string | null; // null for anonymous feedback
  type: FeedbackType;
  category: FeedbackCategory | null;
  rating: number | null;
  subject: string | null;
  message: string;
  context: string | null;
  platform: 'web' | 'mobile';
  app_version: string | null;
  device_info: string | null;
  user_agent: string | null;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  anonymous: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  admin_notes: string | null;
}

export interface FeedbackResponse {
  success: boolean;
  data?: Feedback;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface FeedbackListResponse {
  success: boolean;
  data?: {
    feedback: Feedback[];
    total: number;
    page: number;
    per_page: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// UI Helper types
export interface FeedbackFormData {
  type: FeedbackType;
  category: FeedbackCategory;
  rating: number | null;
  subject: string;
  message: string;
  anonymous: boolean;
}

export interface FeedbackCategoryOption {
  value: FeedbackCategory;
  label: string;
  description?: string;
  icon?: string;
}

// Validation schemas
export const FEEDBACK_VALIDATION = {
  message: {
    minLength: 10,
    maxLength: 2000
  },
  subject: {
    minLength: 3,
    maxLength: 100
  },
  rating: {
    min: 1,
    max: 5
  }
} as const;

// Category configurations
export const FEEDBACK_CATEGORIES: Record<FeedbackType, FeedbackCategoryOption[]> = {
  [FeedbackType.PROBLEM_REPORT]: [
    { value: FeedbackCategory.OCR_ACCURACY, label: 'OCR Accuracy Issues', description: 'Receipt text not extracted correctly' },
    { value: FeedbackCategory.APP_PERFORMANCE, label: 'Performance & Crashes', description: 'App is slow or crashes' },
    { value: FeedbackCategory.FEATURE_CONFUSION, label: 'Feature Confusion', description: 'Difficulty using app features' },
    { value: FeedbackCategory.IMAGE_QUALITY, label: 'Image Quality Problems', description: 'Receipt photos not processing well' },
    { value: FeedbackCategory.SYNC_ISSUES, label: 'Sync Issues', description: 'Data not syncing between devices' },
    { value: FeedbackCategory.OTHER, label: 'Other Problem', description: 'Something else is wrong' }
  ],
  [FeedbackType.FEATURE_REQUEST]: [
    { value: FeedbackCategory.RECEIPT_PROCESSING, label: 'Receipt Processing', description: 'Improvements to OCR and data extraction' },
    { value: FeedbackCategory.ENTITY_CATEGORIES, label: 'Entities & Categories', description: 'New entities or expense categories' },
    { value: FeedbackCategory.EXPORT_FUNCTIONALITY, label: 'Export Features', description: 'Data export and reporting' },
    { value: FeedbackCategory.MOBILE_EXPERIENCE, label: 'Mobile Experience', description: 'Mobile app improvements' },
    { value: FeedbackCategory.WEB_EXPERIENCE, label: 'Web Experience', description: 'Web dashboard improvements' },
    { value: FeedbackCategory.OTHER, label: 'Other Feature', description: 'Something new you\'d like to see' }
  ],
  [FeedbackType.GENERAL_RATING]: [
    { value: FeedbackCategory.GENERAL, label: 'General Feedback', description: 'Overall experience and satisfaction' }
  ],
  [FeedbackType.ERROR_RECOVERY]: [
    { value: FeedbackCategory.APP_PERFORMANCE, label: 'App Error', description: 'Error occurred during app usage' }
  ],
  [FeedbackType.SURVEY]: [
    { value: FeedbackCategory.GENERAL, label: 'Survey Response', description: 'Structured feedback collection' }
  ]
};

// Platform detection utilities
export function getPlatformInfo(): { platform: 'web' | 'mobile'; app_version?: string; device_info?: string; user_agent?: string } {
  // This will be implemented differently on web vs mobile
  if (typeof window !== 'undefined') {
    // Web environment
    return {
      platform: 'web',
      user_agent: navigator.userAgent,
      device_info: `${navigator.platform} - ${navigator.userAgent}`
    };
  } else {
    // Mobile environment (React Native)
    return {
      platform: 'mobile',
      // Mobile-specific detection will be implemented in mobile app
    };
  }
}

// Validation helpers
export function validateFeedbackSubmission(submission: FeedbackSubmission): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!submission.message || submission.message.trim().length < FEEDBACK_VALIDATION.message.minLength) {
    errors.push(`Message must be at least ${FEEDBACK_VALIDATION.message.minLength} characters`);
  }

  if (submission.message && submission.message.length > FEEDBACK_VALIDATION.message.maxLength) {
    errors.push(`Message must be less than ${FEEDBACK_VALIDATION.message.maxLength} characters`);
  }

  if (submission.subject && submission.subject.length > FEEDBACK_VALIDATION.subject.maxLength) {
    errors.push(`Subject must be less than ${FEEDBACK_VALIDATION.subject.maxLength} characters`);
  }

  if (submission.rating !== undefined && submission.rating !== null) {
    if (submission.rating < FEEDBACK_VALIDATION.rating.min || submission.rating > FEEDBACK_VALIDATION.rating.max) {
      errors.push(`Rating must be between ${FEEDBACK_VALIDATION.rating.min} and ${FEEDBACK_VALIDATION.rating.max}`);
    }
  }

  if (!Object.values(FeedbackType).includes(submission.type)) {
    errors.push('Invalid feedback type');
  }

  if (submission.category && !Object.values(FeedbackCategory).includes(submission.category)) {
    errors.push('Invalid feedback category');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}