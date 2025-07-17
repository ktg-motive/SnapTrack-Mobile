import { CONFIG } from '../config';
import {
  Receipt,
  Entity,
  User,
  UploadedReceipt,
  ApiResponse,
  PaginatedResponse,
  ReceiptFilters,
  QuickStats,
  HelpCategory,
  HelpArticle,
  HelpCategoriesResponse,
  HelpArticlesResponse
} from '../types';
import { errorReporting } from './errorReporting';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class SnapTrackApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private isRefreshingToken: boolean = false;

  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
  }

  // Authentication management
  setAuthToken(token: string) {
    this.token = token;
  }

  clearAuthToken() {
    this.token = null;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const startTime = Date.now();
    
    // Don't set Content-Type for FormData - let the runtime set it with boundary
    const isFormData = options.body instanceof FormData;
    
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers) 
        ? options.headers as Record<string, string>
        : {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers
    };

    try {
      console.log(`📡 API Request: ${method} ${endpoint}`);
      
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle 401 Unauthorized - attempt token refresh and retry once
        if (response.status === 401 && this.token && !this.isRefreshingToken) {
          console.log('🔐 Got 401, attempting token refresh and retry...');
          
          this.isRefreshingToken = true;
          try {
            // Import authService dynamically to avoid circular imports
            const { authService } = await import('./authService');
            const newToken = await authService.refreshToken();
            
            if (newToken) {
              console.log('✅ Token refresh successful, retrying request...');
              this.setAuthToken(newToken);
              
              // Retry the original request with new token
              const retryHeaders: Record<string, string> = {
                ...headers,
                'Authorization': `Bearer ${newToken}`
              };
              
              const retryResponse = await fetch(url, {
                ...config,
                headers: retryHeaders
              });
              
              this.isRefreshingToken = false;
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                console.log(`✅ Retry successful: ${endpoint}`);
                errorReporting.logApiRequest(endpoint, method, Date.now() - startTime, true, retryResponse.status);
                return retryData;
              } else {
                // Even retry failed - fall through to error handling
                console.log('❌ Retry failed after token refresh');
              }
            } else {
              console.log('❌ Token refresh returned null');
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
          }
          
          this.isRefreshingToken = false;
        }
        
        const apiError = new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
        
        // Log API request performance (failed)
        errorReporting.logApiRequest(endpoint, method, duration, false, response.status);
        
        // Log the API error
        errorReporting.logError(apiError, `API_REQUEST_${method}`, {
          endpoint,
          status: response.status,
          duration,
          hasToken: !!this.token,
          triedRefresh: response.status === 401
        });
        
        throw apiError;
      }

      const data = await response.json();
      console.log(`✅ API Response: ${endpoint} successful (${duration}ms)`);
      
      // Log successful API request performance
      errorReporting.logApiRequest(endpoint, method, duration, true, response.status);
      
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ API Error: ${endpoint}`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      const networkError = new ApiError(
        'Network error occurred. Please check your connection.',
        0,
        'NETWORK_ERROR'
      );
      
      // Log network error
      errorReporting.logError(networkError, `API_NETWORK_ERROR_${method}`, {
        endpoint,
        duration,
        originalError: error instanceof Error ? error.message : 'Unknown error',
        hasToken: !!this.token
      });
      
      // Log failed API request performance
      errorReporting.logApiRequest(endpoint, method, duration, false, 0);
      
      throw networkError;
    }
  }

  // Receipt Management

  /**
   * Upload receipt image for OCR processing
   */
  async uploadReceipt(
    imageUri: string,
    entity: string = 'personal',
    tags?: string,
    notes?: string
  ): Promise<UploadedReceipt> {
    const formData = new FormData();
    
    // Create file object from image URI
    const imageFile = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg'
    } as any;
    
    formData.append('image', imageFile);
    formData.append('entity', entity);
    
    if (tags) {
      formData.append('tags', tags);
    }
    
    if (notes) {
      formData.append('notes', notes);
    }

    const response = await this.makeRequest<any>(
      '/api/parse',
      {
        method: 'POST',
        headers: {
          // Remove Content-Type header to let browser set boundary for FormData
          ...Object.fromEntries(
            Object.entries(this.token ? { Authorization: `Bearer ${this.token}` } : {})
          )
        },
        body: formData
      }
    );

    // Handle different response formats
    console.log('🔍 Raw OCR response:', JSON.stringify(response, null, 2));
    console.log('🔍 Response keys:', Object.keys(response));
    if (response.extracted_data) {
      console.log('🔍 extracted_data keys:', Object.keys(response.extracted_data));
      console.log('🔍 extracted_data values:', response.extracted_data);
    }
    
    if (response.success === false) {
      console.error('❌ Upload failed with error:', response.error);
      console.error('❌ Full error response:', JSON.stringify(response, null, 2));
      throw new ApiError(response.error || 'Failed to upload receipt');
    }

    // Handle new standardized backend response format
    if (response.success && response.expense) {
      console.log('🔍 New format detected - transforming response');
      // Transform new format to maintain compatibility with existing UI
      const transformedResponse = {
        id: response.expense.id,
        expense: response.expense,
        confidence: response.confidence,
        // IMPORTANT: Preserve AI validation data for enhanced processing UI
        ai_validation: response.ai_validation,
        // Backward compatibility fields for existing UI components
        extracted_data: {
          vendor: response.expense.vendor,
          amount: response.expense.amount,
          date: response.expense.date,
          confidence_score: response.confidence?.amount || 0
        },
        receipt_url: response.expense.image_url,
        status: (response.expense.status === 'completed' ? 'complete' : 'analyzing') as 'uploading' | 'scanning' | 'analyzing' | 'extracting' | 'complete' | 'error'
      };
      console.log('✅ Transformed response:', JSON.stringify(transformedResponse, null, 2));
      return transformedResponse;
    }
    
    // Handle legacy response formats
    if (response.extracted_data) {
      console.log('🔍 Legacy format detected');
      return response;
    } else if (response.data && response.data.extracted_data) {
      return response.data;
    } else if (response.data) {
      return response.data;
    }

    console.log('⚠️ Unknown response format, returning as-is');
    return response;
  }

  /**
   * Get paginated list of receipts with filters
   */
  async getReceipts(filters: ReceiptFilters = {}): Promise<PaginatedResponse<Receipt>> {
    const params = new URLSearchParams();
    
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.min_amount) params.append('min_amount', filters.min_amount.toString());
    if (filters.max_amount) params.append('max_amount', filters.max_amount.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    // Add cache-busting timestamp to ensure fresh data
    params.append('_t', Date.now().toString());

    const queryString = params.toString();
    const endpoint = `/api/expenses${queryString ? `?${queryString}` : ''}`;

    const response = await this.makeRequest<any>(endpoint);

    // Handle different response formats
    if (Array.isArray(response)) {
      return {
        data: response,
        pagination: {
          current_page: 1,
          per_page: response.length,
          total_count: response.length,
          total_pages: 1,
          has_next_page: false,
          has_prev_page: false
        },
        total: response.length,
        page: 1,
        limit: response.length,
        pages: 1
      };
    } else if (response.expenses && Array.isArray(response.expenses)) {
      // Backend returns { expenses: [...], pagination: {...} }
      // Transform backend format to mobile app format
      const transformedExpenses = response.expenses.map((expense: any) => {
        // Handle tags - could be string, array, or null
        let tags: string[] = [];
        if (expense.tags) {
          if (Array.isArray(expense.tags)) {
            tags = expense.tags;
          } else if (typeof expense.tags === 'string') {
            // Handle comma-separated string tags
            tags = expense.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
          }
        }
        
        // Normalize entity - handle empty/null
        let normalizedEntity = expense.entity || '';
        if (!normalizedEntity || normalizedEntity.trim() === '' || 
            normalizedEntity === 'null' || normalizedEntity === 'undefined') {
          normalizedEntity = 'Personal';
        } else {
          normalizedEntity = normalizedEntity.trim();
        }
        
        const transformed = {
          id: expense.id.toString(),
          vendor: expense.vendor || expense.vendor_name || '',
          amount: expense.amount || 0,
          date: expense.expense_date || expense.date || '',
          entity: normalizedEntity,
          tags: tags,
          notes: expense.notes || '',
          confidence_score: expense.confidence_score || 0,
          receipt_url: expense.image_url || expense.receipt_url || '',
          created_at: expense.date_created || expense.created_at || '',
          updated_at: expense.updated_at || expense.last_modified || '',
          user_id: expense.user_id || '',
          tenant_id: expense.tenant_id || ''
        };
        
        return transformed;
      });
      
      return {
        data: transformedExpenses,
        pagination: {
          current_page: response.pagination?.current_page || 1,
          per_page: response.pagination?.per_page || response.expenses.length,
          total_count: response.pagination?.total_count || response.expenses.length,
          total_pages: response.pagination?.total_pages || 1,
          has_next_page: response.pagination?.has_next_page || false,
          has_prev_page: response.pagination?.has_prev_page || false
        },
        total: response.pagination?.total_count || response.expenses.length,
        page: response.pagination?.current_page || 1,
        limit: response.pagination?.per_page || response.expenses.length,
        pages: response.pagination?.total_pages || 1
      };
    } else if (response.data && Array.isArray(response.data)) {
      return response;
    }

    return response;
  }

  /**
   * Get specific receipt by ID
   */
  async getReceipt(id: string): Promise<Receipt> {
    const response = await this.makeRequest<ApiResponse<Receipt>>(`/api/expenses/${id}`);
    
    if (!response.success) {
      throw new ApiError(response.error || 'Failed to get receipt');
    }
    
    return response.data;
  }

  /**
   * Update receipt details
   */
  async updateReceipt(id: string, updates: Partial<Receipt>): Promise<Receipt> {
    console.log('🔍 updateReceipt called with:', { id, updates });
    console.log('🔍 Current auth token exists:', !!this.token);
    console.log('🔍 API endpoint will be:', `/api/expenses/${id}`);
    
    // Transform Receipt updates to match backend Expense format (same as ReviewScreen logic)
    const expenseUpdates: any = {
      ...updates
    };
    
    // Transform field names to match backend expectations
    if (updates.date) {
      expenseUpdates.expense_date = updates.date;
      delete expenseUpdates.date;
    }
    
    // Ensure tags are properly formatted (backend might expect string or array)
    if (updates.tags) {
      expenseUpdates.tags = Array.isArray(updates.tags) 
        ? updates.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim() !== '') 
        : [updates.tags].filter((tag: any): tag is string => typeof tag === 'string' && tag.trim() !== '');
    }
    
    // Ensure amount is a number
    if (updates.amount !== undefined) {
      expenseUpdates.amount = typeof updates.amount === 'string' 
        ? parseFloat(updates.amount) || 0 
        : updates.amount;
    }
    
    // Add updated timestamp as expected by backend
    expenseUpdates.updated_at = new Date().toISOString();
    
    console.log('🔍 Transformed request body:', JSON.stringify(expenseUpdates, null, 2));
    
    const response = await this.makeRequest<ApiResponse<Receipt>>(
      `/api/expenses/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(expenseUpdates)
      }
    );

    console.log('🔍 updateReceipt response:', response);

    if (!response.success) {
      console.error('❌ updateReceipt failed:', response.error);
      throw new ApiError(response.error || 'Failed to update receipt');
    }

    // Transform the expense response back to Receipt format (same as getReceipts)
    const expense = response.expense || response.data;
    if (!expense) {
      throw new ApiError('Invalid response format from server');
    }

    // Handle tags - could be string, array, or null
    let tags: string[] = [];
    if (expense.tags) {
      if (Array.isArray(expense.tags)) {
        tags = expense.tags;
      } else if (typeof expense.tags === 'string') {
        tags = (expense.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
    }

    // Normalize entity - handle empty/null
    let normalizedEntity = expense.entity || '';
    if (!normalizedEntity || normalizedEntity.trim() === '' || 
        normalizedEntity === 'null' || normalizedEntity === 'undefined') {
      normalizedEntity = 'Personal';
    } else {
      normalizedEntity = normalizedEntity.trim();
    }

    const transformedReceipt = {
      id: expense.id.toString(), // Convert numeric ID to string
      vendor: expense.vendor || expense.vendor_name || '',
      amount: expense.amount || 0,
      date: expense.expense_date || expense.date || '',
      entity: normalizedEntity,
      tags: tags,
      notes: expense.notes || '',
      confidence_score: expense.confidence_score || 0,
      receipt_url: expense.image_url || expense.receipt_url || '',
      created_at: expense.date_created || expense.created_at || '',
      updated_at: expense.updated_at || expense.last_modified || '',
      user_id: expense.user_id || '',
      tenant_id: expense.tenant_id || ''
    };

    console.log('🔄 Transformed updated receipt:', JSON.stringify(transformedReceipt, null, 2));
    return transformedReceipt;
  }

  /**
   * Delete receipt
   */
  async deleteReceipt(id: string): Promise<void> {
    const response = await this.makeRequest<ApiResponse<void>>(
      `/api/expenses/${id}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.success) {
      throw new ApiError(response.error || 'Failed to delete receipt');
    }
  }

  // Note: Mobile app follows frontend pattern - only creates expenses via uploadReceipt (POST /api/parse)
  // No direct expense creation endpoint used, consistent with web frontend design

  // Entity Management

  /**
   * Get user's entities
   */
  async getEntities(): Promise<Entity[]> {
    const response = await this.makeRequest<any>('/api/entities');

    // Handle backend response format: {"success": true, "entities": [...], "count": N}
    if (response.success === false) {
      throw new ApiError(response.error || 'Failed to get entities');
    }

    // Backend returns entities in response.entities array
    if (Array.isArray(response.entities)) {
      return response.entities;
    }

    // Fallback for other response formats
    if (Array.isArray(response)) {
      return response;
    }

    throw new ApiError('Invalid entities response format');
  }

  /**
   * Create new entity
   */
  async createEntity(entityData: {name: string}): Promise<Entity> {
    const response = await this.makeRequest<any>('/api/entities', {
      method: 'POST',
      body: JSON.stringify(entityData)
    });

    if (response.success === false) {
      throw new ApiError(response.error || 'Failed to create entity');
    }

    return response.data || response;
  }

  /**
   * Update entity (Not supported by backend - entities can only be created/deleted)
   */
  async updateEntity(id: string, entityData: {name: string}): Promise<Entity> {
    throw new ApiError('Entity updates not supported by backend. Please delete and recreate the entity.');
  }

  /**
   * Delete entity
   */
  async deleteEntity(id: string): Promise<void> {
    const response = await this.makeRequest<any>(`/api/entities/${id}`, {
      method: 'DELETE'
    });

    if (response.success === false) {
      throw new ApiError(response.error || 'Failed to delete entity');
    }
  }

  // User Management

  /**
   * Get user profile and settings
   */
  async getUserProfile(): Promise<User> {
    const response = await this.makeRequest<ApiResponse<User>>('/api/user/profile');

    if (!response.success) {
      throw new ApiError(response.error || 'Failed to get user profile');
    }

    return response.data;
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<any> {
    const response = await this.makeRequest<ApiResponse<any>>('/api/user/settings');

    if (!response.success) {
      throw new ApiError(response.error || 'Failed to get user settings');
    }

    return response.data;
  }

  /**
   * Update user settings
   */
  async updateUserSettings(settings: any): Promise<any> {
    const response = await this.makeRequest<ApiResponse<any>>(
      '/api/user/settings',
      {
        method: 'POST',
        body: JSON.stringify(settings)
      }
    );

    if (!response.success) {
      throw new ApiError(response.error || 'Failed to update user settings');
    }

    return response.data;
  }

  // Statistics and Analytics

  /**
   * Get quick stats for dashboard
   */
  async getQuickStats(): Promise<QuickStats> {
    // Get recent receipts to calculate stats
    const receiptsResponse = await this.getReceipts({ limit: 1000 });
    const receipts = receiptsResponse.data || [];

    console.log('📊 Stats calculation - receipts count:', receipts.length);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyReceipts = receipts.filter(receipt => {
      const receiptDate = new Date(receipt.date);
      return receiptDate.getMonth() === currentMonth && 
             receiptDate.getFullYear() === currentYear;
    });

    const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    const monthlyTotal = monthlyReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);

    const entities: { [key: string]: number } = {};
    receipts.forEach(receipt => {
      entities[receipt.entity] = (entities[receipt.entity] || 0) + receipt.amount;
    });

    // Get the actual total count from the API response
    const totalCount = receiptsResponse.total || receiptsResponse.pagination?.total_count || receipts.length;
    
    console.log('📊 Using total count from API:', totalCount, '(loaded:', receipts.length, ')');

    return {
      total_amount: totalAmount,
      receipt_count: totalCount, // Use actual total count from API
      monthly_total: monthlyTotal,
      monthly_count: monthlyReceipts.length,
      entities
    };
  }

  // Tag Management

  /**
   * Search tags with autocomplete
   */
  async searchTags(query: string, limit: number = 10): Promise<string[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });

    const response = await this.makeRequest<any>(
      `/api/tags/search?${params.toString()}`
    );

    // Handle different response formats
    if (response.success === false) {
      throw new ApiError(response.error || 'Failed to search tags');
    }

    // Check for tags in different locations
    if (Array.isArray(response.tags)) {
      return response.tags;
    } else if (response.data && Array.isArray(response.data.tags)) {
      return response.data.tags;
    } else if (Array.isArray(response)) {
      return response;
    } else if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    // Return empty array if no tags found
    return [];
  }

  /**
   * Get all user tags
   */
  async getTags(): Promise<{data: string[]}> {
    const response = await this.makeRequest<any>('/api/tags');

    // Handle backend response format: {"success": true, "tags": [...], "count": N}
    if (response.success === false) {
      throw new ApiError(response.error || 'Failed to get tags');
    }

    // Backend returns tags as string array in response.tags
    if (Array.isArray(response.tags)) {
      return { data: response.tags };
    }

    // Return empty array if no tags found
    return { data: [] };
  }

  /**
   * Get all user tags (legacy method for backwards compatibility)
   */
  async getAllTags(): Promise<string[]> {
    const response = await this.getTags();
    return response.data;
  }

  /**
   * Create new tag (Not supported - tags are automatically derived from expenses)
   */
  async createTag(tagData: {name: string}): Promise<any> {
    throw new ApiError('Tag creation not supported. Tags are automatically created when used in expenses.');
  }

  /**
   * Update tag (Not supported - tags are automatically derived from expenses)
   */
  async updateTag(id: number, tagData: {name: string}): Promise<any> {
    throw new ApiError('Tag updates not supported. Tags are automatically managed from expenses.');
  }

  /**
   * Delete tag (Not supported - tags are automatically derived from expenses)
   */
  async deleteTag(id: number): Promise<void> {
    throw new ApiError('Tag deletion not supported. Tags are automatically managed from expenses.');
  }

  // Help System (Public endpoints - no auth required)

  /**
   * Get all help categories
   */
  async getHelpCategories(): Promise<HelpCategoriesResponse> {
    // Public endpoint - override makeRequest to exclude auth headers
    const url = `${this.baseUrl}/api/help/categories`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new ApiError(`Failed to fetch help categories: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get help articles with optional filtering
   */
  async getHelpArticles(params?: {
    category?: string;
    search?: string;
  }): Promise<HelpArticlesResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.category) {
      searchParams.append('category', params.category);
    }
    
    if (params?.search) {
      searchParams.append('search', params.search);
    }

    const queryString = searchParams.toString();
    const url = `${this.baseUrl}/api/help/content${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new ApiError(`Failed to fetch help articles: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get specific help article by key
   */
  async getHelpArticle(articleKey: string): Promise<{ article: HelpArticle }> {
    const url = `${this.baseUrl}/api/help/article/${articleKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new ApiError(`Failed to fetch help article: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Submit feedback for help article (requires auth)
   */
  async submitHelpFeedback(articleId: string, isHelpful: boolean, feedbackText?: string): Promise<void> {
    const response = await this.makeRequest<any>('/api/help/feedback', {
      method: 'POST',
      body: JSON.stringify({
        article_id: articleId,
        is_helpful: isHelpful,
        feedback_text: feedbackText || ''
      })
    });

    if (response.success === false) {
      throw new ApiError(response.error || 'Failed to submit help feedback');
    }
  }

  // Health Check

  /**
   * Check API health
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }

  // Generic HTTP Methods (for external services)

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new SnapTrackApiClient();
export default apiClient;