//### Types (frontend/src/types/index.ts)

export interface Document {
  id: string;
  filename: string;
  original_filename?: string;
  file_size: number;
  file_type?: string;
  mime_type?: string;
  upload_date?: string;
  created_at: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'processed' | 'error';
  error_message?: string;
  metadata?: Record<string, any>;
  processing_time_ms?: number;
  total_chunks?: number;
  chunk_count?: number;
  total_topics_extracted?: number;
  topic_count?: number;
  // Backend specific fields
  file_path?: string;
  processing_status?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  updated_at?: string;
}

export interface BatchResponse {
  batch_index: number;
  content: string;
  chunks_count: number;
  sources: string[];
}

export interface TopicAnalysis {
  topic_id: string;
  topic_name: string;
  topic_description: string;
  similarity_score: number;
  batches_processed: number;
  raw_responses: BatchResponse[];
  topic_summary: string;
  chunks: ContentChunk[];
  sources: string[];
}

export interface ContentChunk {
  chunk_id: string;
  chunk_text: string;
  relevance_score: number;
  content_similarity: number;
  filename: string;
  document_id: string;
}
export interface DocumentChunk {
  id: string;
  chunk_text: string;
  chunk_index: number;
  word_count: number;
  topic_id?: string | null;
  topic_name?: string | null;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DocumentChunksResponse {
  success: boolean;
  chunks: DocumentChunk[];
  pagination: Pagination;
}

// Updated Topic interface to match your backend response structure
export interface Topic {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  similarity?: number;
  
  // Backend specific fields from your API response
  avg_chunk_relevance?: number;
  avg_relevance?: number;
  avg_relevance_score?: number;
  category?: string; // This exists in your backend
  confidence_score?: number;
  content_count?: number;
  created_at?: string; // This exists in your backend as string
  document_count?: number;
  embedding?: string | number[]; // Can be JSON string or array
  extraction_model?: string;
  llm_analysis_prompt?: string | null;
  manual_annotations?: any;
  metadata?: {
    created_at?: string;
    created_from_chunk?: boolean;
    enhancement_count?: number;
    last_enhanced?: string;
    [key: string]: any;
  };
  parent_topic_id?: string | null;
  topic_level?: number;
  topic_type?: string;
  total_chunks?: number;
  total_queries?: number;
  total_word_count?: number;
  updated_at?: string;
  last_accessed_at?: string | null;
}

// Extended interface for topics with additional stats
export interface TopicWithStats extends Topic {
  content_count?: number;
  avg_relevance?: number;
  similarity_score?: number;
  document_count?: number;
}

// Also update the TopicDetails interface
export interface TopicDetails extends Topic {
  content_chunks?: Array<{
    id: string;
    chunk_text: string;
    document_id: string;
    filename: string;
    relevance_score: number;
  }>;
  related_topics?: Topic[];
}

export interface QueryResponse {
  query_id?: string;
  query?: string;
  response: string;
  matched_topics?: Topic[];
  related_topics?: Topic[];
  content_chunks_used?: number;
  processing_time_ms?: number;
  sources?: string[];
  error?: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  topics?: Topic[];
  sources?: string[];
  rating?: number;
  queryId?: string;
  reasoning?: string;
  topicAnalyses?: TopicAnalysis[];
  processingTime?: number;
}
export interface EnhancedQueryResponse {
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


// Analytics Types - Updated to match backend structure
export interface SystemHealth {
  database_statistics: DatabaseStatistics;
  recent_activity: Array<{ activity_type: string; count: number; last_activity: string; }>;
  error_tracking: { error_documents: number; recent_errors: string[]; };
  system_status: 'healthy' | 'warning' | 'error' | 'unknown';
  generated_at: string;
}

export interface SystemHealthResponse {
  success: boolean;
  health: SystemHealth;
  timestamp: string;
}

export interface TopicStatistics {
  total_topics: number;
  avg_content_per_topic: number;
  total_categories: number;
}

export interface QueryAnalytics {
  total_queries: number;
  average_response_time_ms: number;
  query_frequency: Array<{ query_date: string; query_count: number; }>;
  common_query_patterns: Array<{ query_pattern: string; frequency: number; }>;
  response_time_distribution: Array<{ speed_category: 'fast' | 'medium' | 'slow'; count: number; }>;
  period_days: number;
  generated_at: string;
}

export interface DocumentAnalytics {
  processing_statistics: Array<{ status: string; count: number; percentage: number; }>;
  file_type_distribution: Array<{ file_type: string; count: number; avg_size: number; }>;
  processing_timeline: Array<{ process_date: string; documents_processed: number; successful: number; errors: number; }>;
  average_metrics: { chunks_per_document: number; topics_per_document: number; words_per_document: number; };
  period_days: number;
  generated_at: string;
}

export interface TopicAnalytics {
  topic_creation_timeline: Array<{ creation_date: string; topics_created: number; }>;
  category_distribution: Array<{ category: string; topic_count: number; }>;
  most_active_topics: Array<{ name: string; category: string; content_count: number; document_count: number; }>;
  quality_metrics: {
    total_topics: number;
    empty_topics: number;
    single_content_topics: number;
    well_populated_topics: number;
    average_content_per_topic: number;
    quality_score: number;
  };
  period_days: number;
  generated_at: string;
}

export interface PerformanceMetrics {
  database_metrics: {
    database_size: string;
    total_documents: number;
    total_chunks: number;
    total_topics: number;
  };
  query_performance: {
    average_response_time_ms: number;
    min_response_time_ms: number;
    max_response_time_ms: number;
    p95_response_time_ms: number;
  };
  processing_efficiency: {
    successful_docs: number;
    failed_docs: number;
    total_docs: number;
    success_rate: number;
  };
  system_health_score: number;
  generated_at: string;
}
// --- Type for the Main Dashboard State ---
export interface DashboardStats {
  documents: {
    total: number;
    processed: number;
    processing: number;
    errors: number;
  };
  topics: {
    total: number;
    categories: number;
  };
  system: {
    status: 'healthy' | 'warning' | 'error' | 'unknown';
  };
  queries: {
    total: number;
    avgResponseTime: number;
  };
}

// --- Analytics Service Types (Matching analytics_service.py) ---
export interface DatabaseStatistics {
  total_documents: number;
  total_chunks: number;
  total_topics: number;
  total_relationships: number;
  total_queries: number;
}

export interface DashboardSummary {
  overview: {
    total_documents: number;
    processed_documents: number;
    processing_documents: number;
    error_documents: number;
    total_chunks: number;
    total_topics: number;
    topic_categories: number;
    total_queries: number;
    avg_response_time_ms: number;
  };
  activity_trend: Array<{
    activity_date: string;
    document_uploads: number;
    queries_processed: number;
  }>;
  health_indicators: {
    processing_success_rate: number;
    average_chunks_per_document: number;
    system_status: string;
  };
  period: string;
  generated_at: string;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SuggestionsResponse {
  suggestions: string[];
}

export interface RatingRequest {
  query_id: string;
  rating: number;
  feedback?: string;
}

export interface BackendQueryResponse {
  success: boolean;
  data: QueryResponse;
}

export interface ProcessingStatus {
  status: 'idle' | 'processing' | 'completed' | 'error';
  current_file?: string;
  progress?: number;
  stage?: 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'analyzing' | 'completed';
  message?: string;
  started_at?: Date;
  estimated_completion?: Date;
}

export interface QueryHistoryItem {
  id: string;
  query_text: string;
  response_time_ms: number;
  rating?: number;
  created_at: Date;
  matched_topics?: string[];
}

export interface PopularQuery {
  query_text: string;
  frequency: number;
  avg_rating?: number;
  avg_response_time?: number;
}

export interface DocumentUpload {
  id: string;
  filename: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
  error?: string;
  upload_date?: Date;
  processed_date?: Date;
}

export interface DocumentSummary {
  total_documents: number;
  processed_documents: number;
  processing_rate: number;
  total_chunks: number;
  total_topics: number;
  average_topic_coverage: number;
  documents: Document[]; // Assuming Document type is already defined
}

export interface DocumentSummaryResponse {
  success: boolean;
  summary: DocumentSummary;
}

export interface DocumentStats {
  total_documents: number;
  total_chunks: number;
  total_topics: number;
  processing_status: 'idle' | 'processing' | 'completed' | 'error';
  last_processed?: Date;
}

// Hook return types
export interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  uploadDocument: (file: File) => Promise<Document | null>;
  processDocument: (id: string) => Promise<boolean>;
  reprocessDocument: (id: string) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
  batchDeleteDocuments: (ids: string[]) => Promise<{ success: number; failed: number }>;
  downloadDocument: (id: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
  getDocumentById: (id: string) => Document | undefined;
  getDocumentsByStatus: (status: Document['status']) => Document[];
  getDocumentStats: () => {
    total: number;
    processed: number;
    processing: number;
    uploaded: number;
    errors: number;
    successRate: number;
  };
}

export interface UseTopicsReturn {
  topics: Topic[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  searchTopics: (query: string) => Promise<Topic[]>;
  getTopicDetails: (id: string) => Promise<TopicDetails | null>;
  getTopicRelationships: (id: string) => Promise<{ relationships: any[]; total_relationships: number }>;
  updateTopic: (id: string, updates: Partial<Topic>) => Promise<boolean>;
  deleteTopic: (id: string) => Promise<boolean>;
  mergeTopics: (sourceId: string, targetId: string) => Promise<boolean>;
  findDuplicates: (threshold?: number) => Promise<any>;
  autoDeduplicate: (threshold?: number, maxMerges?: number, dryRun?: boolean) => Promise<any>;
  cleanupEmpty: () => Promise<any>;
  getQualityMetrics: () => Promise<any>;
  getCategories: () => Promise<any>;
  findSimilar: (id: string, threshold?: number, limit?: number) => Promise<any>;
  refreshTopics: (page?: number, limit?: number) => Promise<void>;
  getTopicById: (id: string) => Topic | undefined;
  getTopicsByCategory: (category: string) => Topic[];
  getTopicStats: () => {
    total: number;
    withContent: number;
    categories: number;
    avgContent: number;
    contentCoverage: number;
  };
}

export interface UseAnalyticsReturn {
  // Data
  systemHealth: SystemHealth | null;
  queryAnalytics: QueryAnalytics | null;
  documentAnalytics: DocumentAnalytics | null;
  topicAnalytics: TopicAnalytics | null;
  performanceMetrics: PerformanceMetrics | null;
  dashboardSummary: DashboardSummary | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  refreshAnalytics: (days?: number) => Promise<void>;
  refreshSystemHealth: () => Promise<void>;
  getQueryAnalytics: (days?: number) => Promise<QueryAnalytics | null>;
  getDocumentAnalytics: (days?: number) => Promise<DocumentAnalytics | null>;
  getPerformanceMetrics: () => Promise<PerformanceMetrics | null>;
  getTrends: () => Promise<any>;
  getOverview: (days?: number) => Promise<any>;
  
  // Computed values
  getSystemHealthStatus: () => string;
  getQueryPerformance: () => any;
  getProcessingEfficiency: () => any;
  getTopicQuality: () => any;
  getInsights: () => any[];
}

// --- Type for ContentMetrics.tsx ---
export interface DocumentCoverage {
  filename: string;
  file_type: string;
  total_chunks: number;
  chunks_with_topics: number;
  coverage_percentage: number;
  unique_topics: number;
}

export interface ContentMetricsData {
  document_coverage: DocumentCoverage[];
  document_status_distribution: Array<{ status: string; count: number; percentage: number; }>;
  orphan_content: { orphan_chunks: number; orphan_percentage: number; };
  quality_metrics: { avg_chunk_words: number; avg_relevance_score: number; high_relevance_chunks: number; low_relevance_chunks: number; };
  file_type_distribution: Array<{ file_type: string; document_count: number; total_size_bytes: number; avg_size_bytes: number; }>;
  processing_trends: Array<{ date: string; documents_processed: number; avg_processing_time: number; success_rate: number; }>;
  topic_coverage_trends: Array<{ date: string; avg_coverage: number; total_topics_generated: number; }>;
}

export interface ContentMetricsResponse {
    success: boolean;
    data: ContentMetricsData;
}

// --- Types for other Analytics Components ---
export interface TopicData {
  name: string;
  chunk_count: number;
  avg_relevance: number;
  category?: string;
}

export interface QueryTrendData {
  query_date: string;
  query_count: number;
  avg_response_time: number;
  avg_rating?: number;
}

export interface TopicOverview {
  total_topics: number;
  avg_keywords_per_topic: number;
  topics_with_many_keywords: number;
}

export interface DashboardData {
  topic_overview: TopicOverview;
  top_topics_by_content: TopicData[];
  query_trends: QueryTrendData[];
}
// Legacy types for backward compatibility
export interface AnalyticsData {
  total_queries: number;
  avg_response_time: number;
  avg_rating: number;
  popular_queries: PopularQuery[];
  query_history: QueryHistoryItem[];
  topics_distribution: {
    topic_name: string;
    query_count: number;
  }[];
  processing_performance: {
    date: string;
    avg_response_time: number;
    query_count: number;
  }[];
}

// Ollama-specific types
export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vram: number;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ModelConfig {
  extraction_model: string;
  reasoning_model: string;
  embedding_model?: string;
  temperature?: number;
  max_tokens?: number;
  context_length?: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  timestamp?: Date;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
  constraint: string;
}

// Configuration types
export interface AppConfig {
  llm_provider: 'ollama' | 'openai';
  ollama_extraction_model: string;
  ollama_reasoning_model: string;
  openai_api_key?: string;
  max_tokens_per_batch: number;
  max_context_length: number;
  similarity_threshold: number;
  max_topics_per_query: number;
  enable_reasoning_display: boolean;
  enable_topic_expansion: boolean;
}

// UI State types
export interface UIState {
  isLoading: boolean;
  isTyping: boolean;
  showSuggestions: boolean;
  showReasoning: boolean;
  expandedTopics: Set<string>;
  activeTab: 'chat' | 'documents' | 'analytics';
  sidebarOpen: boolean;
}

export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  sources?: string[];
  topics?: string[];
  minRating?: number;
  sortBy?: 'date' | 'rating' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

// WebSocket types for real-time updates
export interface WebSocketMessage {
  type: 'processing_update' | 'query_complete' | 'error' | 'status_update';
  data: any;
  timestamp: Date;
}

export interface ProcessingUpdate {
  file_id: string;
  filename: string;
  stage: ProcessingStatus['stage'];
  progress: number;
  message?: string;
  estimated_completion?: Date;
}

// Database entity types (for backend reference)
export interface DocumentEntity {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  upload_date: Date;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  metadata?: Record<string, any>;
}

export interface TopicEntity {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  embedding?: number[];
  created_at: Date;
  updated_at: Date;
}

export interface ContentChunkEntity {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  chunk_embedding?: number[];
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface TopicContentEntity {
  id: string;
  topic_id: string;
  chunk_id: string;
  relevance_score: number;
  created_at: Date;
}

export interface QueryLogEntity {
  id: string;
  query_text: string;
  query_embedding?: number[];
  response_text?: string;
  matched_topics?: string[];
  response_time_ms: number;
  rating?: number;
  feedback?: string;
  user_id?: string;
  created_at: Date;
  rated_at?: Date;
}

export interface EnhancedChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  sources?: string[];
  topics?: any[];
  queryId?: string;
  rating?: number;
  // Enhanced fields
  reasoning?: string;
  topicAnalyses?: TopicAnalysis[];
  processingTime?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ProcessingStats {
  totalTopics: number;
  totalBatches: number;
  totalSources: number;
  processingTime: number;
}

// Updated ChatInterface.tsx fixes
export const extractQueryData = (response: any): EnhancedQueryResponse | null => {
  // Handle different response formats
  if (response?.data?.success && response.data?.data) {
    // Backend format: { success: true, data: { response: "...", reasoning: "...", ... } }
    return response.data.data as EnhancedQueryResponse;
  } else if (response?.data?.response) {
    // Direct format: { response: "...", reasoning: "...", ... }
    return response.data as EnhancedQueryResponse;
  } else if (response?.response) {
    // Simple format: { response: "...", ... }
    return response as EnhancedQueryResponse;
  }
  return null;
};

export const cleanResponseContent = (content: string): string => {
  if (!content) return '';
  
  // Remove <think> tags and their content
  const withoutThinkTags = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Remove reasoning tags if they leaked into main content
  const withoutReasoningTags = withoutThinkTags.replace(/<\/?reasoning>/gi, '');
  const withoutAnswerTags = withoutReasoningTags.replace(/<\/?final_answer>/gi, '');
  
  // Clean up any extra whitespace
  return withoutAnswerTags.trim();
};