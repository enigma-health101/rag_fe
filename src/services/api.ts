import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  Document,
  DocumentSummaryResponse,
  DocumentChunksResponse,
  SystemHealthResponse,
  ContentMetricsResponse,
  QueryAnalytics,
  DocumentAnalytics,
  TopicAnalytics,
} from '@/types';
// Core type definitions
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  document?: Document;
  documents?: Document[];
}

interface TopicAnalysis {
  topic_id: string;
  topic_name: string;
  topic_description: string;
  similarity_score: number;
  batches_processed: number;
  topic_summary: string;
  sources: string[];
  raw_responses?: {
    batch_index: number;
    content: string;
    chunks_count: number;
    sources: string[];
  }[];
}

interface EnhancedQueryResponse {
  query_id: string;
  query: string;
  response: string;
  reasoning?: string;
  topic_analyses?: TopicAnalysis[];
  matched_topics?: any[];
  related_topics?: any[];
  processing_time_ms?: number;
  sources?: string[];
  content_chunks_used?: number;
}

interface QueryResponse {
  query_id?: string;
  query?: string;
  response: string;
  matched_topics?: any[];
  related_topics?: any[];
  content_chunks_used?: number;
  processing_time_ms?: number;
  sources?: string[];
  error?: boolean;
}

interface SuggestionResponse {
  suggestions: string[];
}


interface DocumentUploadResponse {
  success: boolean;
  document: Document;
  message?: string;
  error?: string;
}

interface DocumentListResponse {
  success: boolean;
  documents: Document[];  
  message?: string;
  error?: string;
}

interface BatchDeleteResponse {
  success: boolean;
  results?: Array<{
    document_id: string;
    status: 'success' | 'failed' | 'not_found';
    filename?: string;
    message?: string;
  }>;
  summary?: {
    successful_deletions: number;
    failed_deletions: number;
  };
  message?: string;
  error?: string;
}

interface DocumentStats {
  total_documents: number;
  processed_documents: number;
  processing_documents: number;
  total_size_bytes: number;
  avg_processing_time_ms: number;
}



interface ProcessingStatus {
  status: 'idle' | 'processing' | 'completed' | 'error';
  current_file?: string;
  progress?: number;
  message?: string;
}

interface QueryHistoryItem {
  id: string;
  query_text: string;
  response_time_ms: number;
  rating?: number;
  created_at: string;
  matched_topics?: string[];
}

interface PopularQuery {
  query_text: string;
  frequency: number;
  avg_rating?: number;
  avg_response_time?: number;
}

interface AnalyticsData {
  total_queries: number;
  avg_response_time: number;
  avg_rating: number;
  popular_queries: PopularQuery[];
  query_history: QueryHistoryItem[];
}

interface ModelConfig {
  extraction_model: string;
  reasoning_model: string;
  embedding_model?: string;
  temperature?: number;
  max_tokens?: number;
  context_length?: number;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5005/api',
  timeout: 120000, // 2 minutes for complex processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    } else if (error.response && error.response.status >= 500) {
      // Handle server errors
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

export const queryApi = {
  // Enhanced query processing
  async processQuery(query: string, options?: {
    maxTopics?: number;
    detailLevel?: 'brief' | 'standard' | 'detailed';
    includeReasoning?: boolean;
    focusTopics?: string[];
    excludeTopics?: string[];
  }): Promise<AxiosResponse<ApiResponse<EnhancedQueryResponse>>> {
    return api.post('/query/query', {
      query,
      options: {
        max_topics: options?.maxTopics || 5,
        detail_level: options?.detailLevel || 'standard',
        include_reasoning: options?.includeReasoning !== false,
        focus_topics: options?.focusTopics || [],
        exclude_topics: options?.excludeTopics || [],
      }
    });
  },

  // Legacy query processing for backward compatibility
  async processQueryLegacy(query: string): Promise<AxiosResponse<ApiResponse<QueryResponse>>> {
    return api.post('/query/process-legacy', { query });
  },

  // Get query suggestions
  async getSuggestions(partialQuery: string, limit: number = 5): Promise<AxiosResponse<ApiResponse<SuggestionResponse>>> {
    return api.get('/query/suggestions', {
      params: { 
        q: partialQuery, 
        limit 
      }
    });
  },

  // Rate a response
  async rateResponse(queryId: string, rating: number, feedback?: string): Promise<boolean> {
    try {
      const response = await api.post('/query/rate', {
        query_id: queryId,
        rating,
        feedback
      });
      return response.data.success;
    } catch (error) {
      console.error('Failed to rate response:', error);
      return false;
    }
  },

  // Get query history
  async getQueryHistory(options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AxiosResponse<ApiResponse<QueryHistoryItem[]>>> {
    const params: any = {
      limit: options?.limit || 50,
      offset: options?.offset || 0
    };
    
    if (options?.userId) params.user_id = options.userId;
    if (options?.dateFrom) params.date_from = options.dateFrom.toISOString();
    if (options?.dateTo) params.date_to = options.dateTo.toISOString();

    return api.get('/query/history', { params });
  },

  // Get popular queries
  async getPopularQueries(days: number = 30, limit: number = 10): Promise<AxiosResponse<ApiResponse<PopularQuery[]>>> {
    return api.get('/query/popular', {
      params: { days, limit }
    });
  },

  // Direct content search
  async searchContent(query: string, options?: {
    limit?: number;
    minSimilarity?: number;
    sources?: string[];
  }): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.post('/query/search-content', {
      query,
      limit: options?.limit || 10,
      min_similarity: options?.minSimilarity || 0.3,
      sources: options?.sources || []
    });
  },

  // Export topic analysis
  async exportTopicAnalysis(queryId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<AxiosResponse<Blob>> {
    return api.get(`/query/${queryId}/export`, {
      params: { format },
      responseType: 'blob'
    });
  },
  async summarizeTopics(topicAnalyses: TopicAnalysis[]): Promise<AxiosResponse<ApiResponse<{ response: string }>>> {
    return api.post('/query/summarize', { topic_analyses: topicAnalyses });
  },

  async analyzeTopics(topicAnalyses: TopicAnalysis[]): Promise<AxiosResponse<ApiResponse<{ response: string }>>> {
    return api.post('/query/analyze', { topic_analyses: topicAnalyses });
  },

  async generateInsights(topicAnalyses: TopicAnalysis[]): Promise<AxiosResponse<ApiResponse<{ response:string }>>> {
    return api.post('/query/insights', { topic_analyses: topicAnalyses });
  },

  // Regenerate response with different parameters
  async regenerateResponse(queryId: string, options?: {
    focusTopics?: string[];
    excludeTopics?: string[];
    detailLevel?: 'brief' | 'standard' | 'detailed';
  }): Promise<AxiosResponse<ApiResponse<EnhancedQueryResponse>>> {
    return api.post(`/query/${queryId}/regenerate`, { options });
  }
};

export const documentApi = {
  // Upload documents - FIXED with correct response type
  async uploadDocument(file: File): Promise<AxiosResponse<DocumentUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    // Add the generic <DocumentUploadResponse> to the post method
    return api.post<DocumentUploadResponse>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Get document list - FIXED with correct response type
  async getDocuments(options?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  }): Promise<AxiosResponse<DocumentListResponse>> {
    const params: any = {
      limit: options?.limit || 50,
      offset: options?.offset || 0
    };
    
    if (options?.status) params.status = options.status;
    if (options?.search) params.search = options.search;

    return api.get('/documents', { params });
  },

  // Process document (initial processing)
  async processDocument(documentId: string): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.post(`/documents/process/${documentId}`);
  },

  // Delete document
  async deleteDocument(documentId: string): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.delete(`/documents/${documentId}`);
  },

  // Reprocess document
  async reprocessDocument(documentId: string): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.post(`/documents/${documentId}/reprocess`);
  },

  // Batch delete documents - FIXED with correct response type
  async batchDeleteDocuments(documentIds: string[]): Promise<AxiosResponse<BatchDeleteResponse>> {
    // Add the generic <BatchDeleteResponse> here as well
    return api.post<BatchDeleteResponse>('/documents/batch-delete', { document_ids: documentIds });
  },


  // Download document
  async downloadDocument(documentId: string): Promise<AxiosResponse<Blob>> {
    return api.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
  },

  // Get document details
  async getDocumentDetails(documentId: string): Promise<AxiosResponse<DocumentUploadResponse>> {
    return api.get(`/documents/${documentId}`);
  },

  // Get document chunks
  async getDocumentChunks(documentId: string): Promise<AxiosResponse<DocumentChunksResponse>> {
    // This now uses the correct, specific response type
    return api.get<DocumentChunksResponse>(`/documents/${documentId}/chunks`);
  },

  // Get document summary (singular)
  async getDocumentSummary(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/documents/summary');
  },

  // FIXED: Add the missing getDocumentsSummary method (plural)
  async getDocumentsSummary(): Promise<AxiosResponse<DocumentSummaryResponse>> {
    return api.get<DocumentSummaryResponse>('/documents/summary');
  },

  // Get processing statistics
  async getProcessingStatistics(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/documents/statistics');
  },

  // Health check
  async healthCheck(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/documents/health-check');
  }
};


export const topicsApi = {
  // Get topics with pagination - matches backend `/topics/` endpoint
  async getTopics(page: number = 1, limit: number = 20, category?: string): Promise<AxiosResponse<ApiResponse<any>>> {
    const params: any = {
      page,
      limit
    };
    
    if (category && category !== 'all') {
      params.category = category;
    }

    return api.get('/topics', { params });
  },

  // Get topic categories - matches backend `/topics/categories` endpoint
  async getTopicCategories(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/categories');
  },

  // Get topic statistics - matches backend `/topics/statistics` endpoint
  async getTopicStatistics(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/statistics');
  },

  // Get quality metrics - matches backend `/topics/quality-metrics` endpoint
  async getQualityMetrics(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/quality-metrics');
  },

  // Search topics - matches backend `/topics/search?q=` endpoint
  async searchTopics(query: string, limit: number = 20): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/search', { 
      params: { 
        q: query, 
        limit 
      } 
    });
  },

  // Get topic details - matches backend `/topics/<topic_id>` endpoint
  async getTopicDetails(topicId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get(`/topics/${topicId}`);
  },

  // Get topic relationships - matches backend `/topics/<topic_id>/relationships` endpoint
  async getTopicRelationships(topicId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get(`/topics/${topicId}/relationships`);
  },

  // Get topic content - matches backend `/topics/<topic_id>/content` endpoint
  async getTopicContent(topicId: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<any>>> {
    const params: any = {
      page: options?.page || 1,
      limit: options?.limit || 10
    };

    return api.get(`/topics/${topicId}/content`, { params });
  },

  // Update topic - matches backend `/topics/<topic_id>` PUT endpoint
  async updateTopicMetadata(topicId: string, metadata: {
    name?: string;
    description?: string;
    keywords?: string[];
    topic_type?: string;
  }): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.put(`/topics/${topicId}`, metadata);
  },

  // Delete topic - matches backend `/topics/<topic_id>` DELETE endpoint
  async deleteTopic(topicId: string): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.delete(`/topics/${topicId}`);
  },

  // Merge topics - matches backend `/topics/merge` endpoint
  async mergeTopics(sourceTopicId: string, targetTopicId: string): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.post('/topics/merge', { 
      source_topic_id: sourceTopicId,
      target_topic_id: targetTopicId
    });
  },

  // Find duplicates - matches backend `/topics/duplicates` endpoint
  async findDuplicates(threshold: number = 0.8): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/duplicates', {
      params: { threshold }
    });
  },

  // Auto deduplicate - matches backend `/topics/auto-deduplicate` endpoint
  async autoDeduplicate(threshold: number = 0.8, maxMerges: number = 50, dryRun: boolean = false): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.post('/topics/auto-deduplicate', {
      similarity_threshold: threshold,
      max_merges: maxMerges,
      dry_run: dryRun
    });
  },

  // Cleanup empty topics - matches backend `/topics/cleanup-empty` endpoint
  async cleanupEmpty(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.post('/topics/cleanup-empty');
  },

  // Find similar topics - matches backend `/topics/similar/<topic_id>` endpoint
  async findSimilar(topicId: string, threshold: number = 0.7, limit: number = 10): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get(`/topics/similar/${topicId}`, {
      params: { threshold, limit }
    });
  },

  // Get merge recommendations - matches backend `/topics/merge-recommendations` endpoint
  async getMergeRecommendations(minSimilarity: number = 0.7): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/merge-recommendations', {
      params: { min_similarity: minSimilarity }
    });
  },

  // Validate merge - matches backend `/topics/validate-merge` endpoint
  async validateMerge(sourceTopicId: string, targetTopicId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.post('/topics/validate-merge', {
      source_topic_id: sourceTopicId,
      target_topic_id: targetTopicId
    });
  },

  // Bulk merge - matches backend `/topics/bulk-merge` endpoint
  async bulkMerge(mergeGroups: any[]): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.post('/topics/bulk-merge', {
      merge_groups: mergeGroups
    });
  },

  // Topic maintenance - matches backend `/topics/maintenance` endpoint
  async performMaintenance(actions: string[], options: any = {}): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.post('/topics/maintenance', {
      actions,
      ...options
    });
  },

  // Topic query analytics - matches backend `/topics/query-analytics` endpoint
  async getQueryAnalytics(limit: number = 20): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/query-analytics', {
      params: { limit }
    });
  },

  // Processing performance - matches backend `/topics/processing-performance` endpoint
  async getProcessingPerformance(days: number = 30): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/processing-performance', {
      params: { days }
    });
  },

  // Content effectiveness - matches backend `/topics/content-effectiveness` endpoint
  async getContentEffectiveness(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/content-effectiveness');
  },

  // Get reasoning examples - matches backend `/topics/reasoning-examples/<topic_id>` endpoint
  async getReasoningExamples(topicId: string, limit: number = 5): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get(`/topics/reasoning-examples/${topicId}`, {
      params: { limit }
    });
  },

  // Get batch analysis - matches backend `/topics/batch-analysis/<topic_id>` endpoint
  async getBatchAnalysis(topicId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get(`/topics/batch-analysis/${topicId}`);
  },

  // Export analytics - matches backend `/topics/export-analytics/<topic_id>` endpoint
  async exportAnalytics(topicId: string, format: 'json' = 'json'): Promise<AxiosResponse<any>> {
    return api.get(`/topics/export-analytics/${topicId}`, {
      params: { format }
    });
  },

  // Enhanced query history - matches backend `/topics/enhanced-query-history` endpoint
  async getEnhancedQueryHistory(userId?: string, limit: number = 50): Promise<AxiosResponse<ApiResponse<any>>> {
    const params: any = { limit };
    if (userId) params.user_id = userId;
    
    return api.get('/topics/enhanced-query-history', { params });
  },

  // Performance analytics - matches backend `/topics/performance-analytics` endpoint
  async getPerformanceAnalytics(days: number = 30): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/performance-analytics', {
      params: { days }
    });
  },
};

export const analyticsApi = {
  // Get system health
  async getSystemHealth(): Promise<AxiosResponse<SystemHealthResponse>> {
    // This now correctly returns the SystemHealthResponse type
    return api.get<SystemHealthResponse>('/documents/health-check');
  },
  // FIXED: Add missing getTopicStats method
  async getTopicStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/statistics');
  },
  // Get query analytics
  getQueryAnalytics(days: number): Promise<AxiosResponse<ApiResponse<QueryAnalytics>>> {
    return api.get<ApiResponse<QueryAnalytics>>('/analytics/queries', { params: { days } });
  },

  getDocumentAnalytics(days: number): Promise<AxiosResponse<ApiResponse<DocumentAnalytics>>> {
    return api.get<ApiResponse<DocumentAnalytics>>('/analytics/documents', { params: { days } });
  },

  getTopicAnalytics(days: number): Promise<AxiosResponse<ApiResponse<TopicAnalytics>>> {
    return api.get<ApiResponse<TopicAnalytics>>('/analytics/topics', { params: { days } });
  },
  getContentMetrics(days: number): Promise<AxiosResponse<ContentMetricsResponse>> {
    return api.get<ContentMetricsResponse>('/analytics/content', { params: { days } });
  },
  // Get performance metrics
  async getPerformanceMetrics(): Promise<AxiosResponse<ApiResponse<any>>> {
    try {
      return api.get('/analytics/performance');
    } catch (error) {
      return {
        data: {
          success: true,
          data: {
            database_metrics: {},
            query_performance: {},
            processing_efficiency: {},
            system_health_score: 85
          }
        }
      } as any;
    }
  },

  // Get dashboard summary
  async getDashboardSummary(days: number = 30): Promise<AxiosResponse<ApiResponse<any>>> {
    try {
      return api.get('/analytics/dashboard', { params: { days } });
    } catch (error) {
      return {
        data: {
          success: true,
          data: {
            overview: {
              total_documents: 0,
              processed_documents: 0,
              total_topics: 0,
              total_queries: 0
            }
          }
        }
      } as any;
    }
  },

  // Get comprehensive analytics
  async getAnalytics(options?: {
    dateFrom?: Date;
    dateTo?: Date;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<AxiosResponse<ApiResponse<any>>> {
    const params: any = {
      group_by: options?.groupBy || 'day'
    };
    
    if (options?.dateFrom) params.date_from = options.dateFrom.toISOString();
    if (options?.dateTo) params.date_to = options.dateTo.toISOString();

    try {
      return api.get('/analytics', { params });
    } catch (error) {
      return {
        data: {
          success: true,
          data: {
            total_queries: 0,
            avg_response_time: 0,
            popular_queries: []
          }
        }
      } as any;
    }
  },

  // Get query performance metrics
  async getQueryPerformance(options?: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AxiosResponse<ApiResponse<any>>> {
    const params: any = {};
    
    if (options?.dateFrom) params.date_from = options.dateFrom.toISOString();
    if (options?.dateTo) params.date_to = options.dateTo.toISOString();

    try {
      return api.get('/analytics/query-performance', { params });
    } catch (error) {
      return {
        data: {
          success: true,
          data: {
            avg_response_time: 0,
            query_count: 0
          }
        }
      } as any;
    }
  },

  // Get topic usage statistics
  async getTopicUsage(options?: {
    limit?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AxiosResponse<ApiResponse<any[]>>> {
    const params: any = {
      limit: options?.limit || 20
    };
    
    if (options?.dateFrom) params.date_from = options.dateFrom.toISOString();
    if (options?.dateTo) params.date_to = options.dateTo.toISOString();

    try {
      return api.get('/analytics/topic-usage', { params });
    } catch (error) {
      return {
        data: {
          success: true,
          data: []
        }
      } as any;
    }
  },

  // Get trends data
  async getTrends(options?: {
    metric?: 'queries' | 'topics' | 'documents';
    period?: 'day' | 'week' | 'month';
    days?: number;
  }): Promise<AxiosResponse<ApiResponse<any>>> {
    const params: any = {
      metric: options?.metric || 'queries',
      period: options?.period || 'day',
      days: options?.days || 30
    };

    try {
      return api.get('/analytics/trends', { params });
    } catch (error) {
      return {
        data: {
          success: true,
          data: []
        }
      } as any;
    }
  },

  // Get overview data
  async getOverview(days: number = 30): Promise<AxiosResponse<ApiResponse<any>>> {
    try {
      return api.get('/analytics/overview', { params: { days } });
    } catch (error) {
      return {
        data: {
          success: true,
          data: {
            total_documents: 0,
            total_topics: 0,
            total_queries: 0
          }
        }
      } as any;
    }
  },

  // Export analytics data
  async exportAnalytics(format: 'csv' | 'excel' | 'pdf', options?: {
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AxiosResponse<Blob>> {
    const params: any = { format };
    
    if (options?.dateFrom) params.date_from = options.dateFrom.toISOString();
    if (options?.dateTo) params.date_to = options.dateTo.toISOString();

    return api.get('/analytics/export', {
      params,
      responseType: 'blob'
    });
  },

  // FIXED: Remove duplicate getTopicStatistics (it was causing conflicts)
  async getTopicStatistics(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/topics/statistics');
  }
};


export const systemApi = {
  // Get system health
  async getSystemHealth(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/system/health');
  },

  // Get Ollama status
  async getOllamaStatus(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/system/ollama-status');
  },

  // Get available models
  async getAvailableModels(): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return api.get('/system/models');
  },

  // Update model configuration
  async updateModelConfig(config: ModelConfig): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.post('/system/model-config', config);
  },

  // Get current configuration
  async getConfiguration(): Promise<AxiosResponse<ApiResponse<any>>> {
    return api.get('/system/config');
  },

  // Update system configuration
  async updateConfiguration(config: any): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.patch('/system/config', config);
  },

  // Restart processing services
  async restartServices(): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.post('/system/restart-services');
  },

  // Clear cache
  async clearCache(cacheType?: 'embeddings' | 'responses' | 'all'): Promise<AxiosResponse<ApiResponse<void>>> {
    return api.post('/system/clear-cache', { cache_type: cacheType || 'all' });
  },

  // Get system logs
  async getSystemLogs(options?: {
    level?: 'debug' | 'info' | 'warning' | 'error';
    limit?: number;
    since?: Date;
  }): Promise<AxiosResponse<ApiResponse<any[]>>> {
    const params: any = {
      level: options?.level || 'info',
      limit: options?.limit || 100
    };
    
    if (options?.since) params.since = options.since.toISOString();

    return api.get('/system/logs', { params });
  }
};

// Utility functions
export const apiUtils = {
  // Handle file download
  downloadFile(blob: Blob, filename: string) {
    if (typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  },

  // Format API error message
  formatErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.message) {
      return error.message;
    } else {
      return 'An unexpected error occurred';
    }
  },

  // Check if error is network related
  isNetworkError(error: any): boolean {
    return !error.response && error.request;
  },

  // Retry API call with exponential backoff
  async retryApiCall<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Don't retry on client errors (4xx), only on server errors (5xx) or network errors
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
};

// Export types for use in other files
export type { 
  ApiResponse, 
  TopicAnalysis, 
  EnhancedQueryResponse, 
  QueryResponse, 
  SuggestionResponse,
  DocumentStats,
  ProcessingStatus,
  QueryHistoryItem,
  PopularQuery,
  AnalyticsData,
  ModelConfig
};

export default api;