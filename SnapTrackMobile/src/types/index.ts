// Core data types for SnapTrack Mobile

// Export new UUID-based auth types
export * from './auth';

export interface Receipt {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  entity: string;
  category?: string;
  tags: string[];
  notes?: string;
  confidence_score: number;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tenant_id: string;
  
  // Text receipt support (from email processing)
  extraction_method?: string;
  email_subject?: string;
  raw_text?: string;
  
  // Additional API response fields for backward compatibility
  vendor_name?: string;
  image_url?: string;
  date_created?: string;
  last_modified?: string;
  receipt_date?: string;
  
  // Additional date field for compatibility
  expense_date?: string;
}

export interface Entity {
  id: string;
  name: string;
  email_identifier: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Legacy User interface - keeping for backward compatibility
export interface LegacyUser {
  id: string;
  email: string;
  name?: string;
  entities: Entity[];
  subdomain?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedReceipt {
  // New standardized format fields
  success?: boolean;
  expense?: {
    id: string;
    vendor: string;
    amount: number;
    date: string;
    entity: string;
    image_url: string;
    status: string;
  };
  confidence?: {
    amount: number;
    entity: number;
  };
  // Legacy format fields (for backward compatibility)
  id?: string;
  extracted_data?: {
    vendor: string;
    amount: number;
    date: string;
    confidence_score: number;
    raw_text?: string;
  };
  receipt_url?: string;
  status?: 'uploading' | 'scanning' | 'analyzing' | 'extracting' | 'complete' | 'error';
  
  // Additional fields for compatibility
  image_url?: string;
  vendor?: string;
  corrected_vendor?: string;
  parsed_vendor?: string;
  vendor_name?: string;
  business_name?: string;
  merchant?: string;
  amount?: number;
  corrected_amount?: number;
  parsed_amount?: number;
  total_amount?: number;
  total?: number;
  price?: number;
  expense_date?: string;
  date?: string;
  corrected_date?: string;
  parsed_date?: string;
  receipt_date?: string;
  transaction_date?: string;
  tags?: string | string[];
  parsed_tags?: string | string[];
  confidence_score?: number;
  validation_confidence?: number;
  ai_validated?: boolean;
  ai_reasoning?: string;
  ai_validation?: {
    validated: boolean;
    reasoning: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  expense?: T; // Legacy field for backward compatibility
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  // Legacy fields for backward compatibility
  pages?: number;
  page?: number;
  total?: number;
  limit?: number;
}

export interface ReceiptFilters {
  entity?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QuickStats {
  total_amount: number;
  receipt_count: number;
  monthly_total: number;
  monthly_count: number;
  entities: { [key: string]: number };
}

// Legacy authentication types moved to auth.ts

// Offline support types
export interface OfflineAction {
  id: string;
  type: 'upload' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

export interface OfflineReceipt extends Omit<Receipt, 'id'> {
  local_id: string;
  image_uri: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
}

// Help system types
export interface HelpCategory {
  id: string;
  key: string;
  title: string;
  description: string;
  article_count: number;
}

export interface HelpArticle {
  id: string;
  key: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  video_url?: string;
  screenshots: string[];
  related_articles: string[];
  requires_screenshots: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  help_categories: {
    key: string;
    title: string;
    description: string;
  };
}

export interface HelpCategoriesResponse {
  categories: HelpCategory[];
}

export interface HelpArticlesResponse {
  articles: HelpArticle[];
}