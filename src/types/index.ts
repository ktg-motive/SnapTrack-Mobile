// Core data types for SnapTrack Mobile

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
}

export interface Entity {
  id: string;
  name: string;
  email_identifier: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
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
  status?: 'processing' | 'completed' | 'failed';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
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

// Authentication types
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
}

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