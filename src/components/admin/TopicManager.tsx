'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Tag, 
  FileText, 
  Merge,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Copy,
  TrendingUp,
  BarChart3,
  Zap,
  Target,
  GitMerge,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { topicsApi } from '@/services/api';
import toast from 'react-hot-toast';

// Updated interfaces to match backend response
interface TopicWithStats {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  similarity?: number;
  
  // Backend specific fields
  avg_chunk_relevance?: number;
  avg_relevance?: number;
  avg_relevance_score?: number;
  category?: string;
  confidence_score?: number;
  content_count?: number;
  created_at?: string;
  document_count?: number;
  embedding?: string | number[];
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

interface Statistics {
  total_topics: number;
  avg_content_per_topic: number;
  total_categories: number;
  topics_with_content: number;
  empty_topics: number;
  high_quality_topics: number;
}

interface QualityMetrics {
  overall_quality_score: number;
  topics_without_content: number;
  avg_keywords_per_topic: number;
  topics_needing_review: number;
}

const TopicManager: React.FC = () => {
  const [topics, setTopics] = useState<TopicWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Add abort controllers for request cancellation
  const abortControllersRef = useRef<{[key: string]: AbortController}>({});
  const isInitializingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup function to cancel all ongoing requests
  const cancelAllRequests = useCallback(() => {
    Object.values(abortControllersRef.current).forEach(controller => {
      if (controller) {
        controller.abort();
      }
    });
    abortControllersRef.current = {};
  }, []);

  // Create or get abort controller for a specific operation
  const getAbortController = useCallback((operation: string) => {
    // Cancel existing controller for this operation
    if (abortControllersRef.current[operation]) {
      abortControllersRef.current[operation].abort();
    }
    
    // Create new controller
    const controller = new AbortController();
    abortControllersRef.current[operation] = controller;
    return controller;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cancelAllRequests();
    };
  }, [cancelAllRequests]);

  // Debounced effect for pagination and category changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && !isInitializingRef.current) {
        console.log('🔄 useEffect triggered:', { 
          page: pagination.page, 
          category: selectedCategory,
          isInitializing: isInitializingRef.current 
        });
        initializeData();
      }
    }, 100); // Small delay to prevent rapid re-renders

    return () => clearTimeout(timeoutId);
  }, [pagination.page, selectedCategory]);

  const initializeData = async () => {
    if (isInitializingRef.current) {
      console.log('⏸️ Already initializing, skipping...');
      return;
    }
    
    console.log('🚀 Initializing Topic Manager data...');
    isInitializingRef.current = true;
    setLoading(true);
    setErrors({});

    try {
      await Promise.allSettled([
        loadTopics(),
        loadCategories(),
        loadStatistics(),
        loadQualityMetrics()
      ]);
    } catch (error) {
      console.error('❌ Failed to initialize data:', error);
      if (mountedRef.current) {
        setErrors(prev => ({ ...prev, initialization: 'Failed to load initial data' }));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isInitializingRef.current = false;
    }
  };

  const loadTopics = async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('📋 Loading topics...', { page: pagination.page, limit: pagination.limit, category: selectedCategory });
      
      const abortController = getAbortController('topics');
      setLoadingStates(prev => ({ ...prev, topics: true }));
      
      const response = await topicsApi.getTopics(
        pagination.page, 
        pagination.limit, 
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      
      // Check if component is still mounted and this request wasn't cancelled
      if (!mountedRef.current || abortController.signal.aborted) {
        console.log('📋 Topics request cancelled or component unmounted');
        return;
      }
      
      console.log('✅ Topics response:', response.data);
      
      // Handle backend response format: { success: true, data: { topics: [...], pagination: {...} } }
      if (response.data.success && response.data.data) {
        const topicsData = response.data.data.topics || [];
        const paginationData = response.data.data.pagination || {};
        
        setTopics(topicsData);
        setPagination(prev => ({
          ...prev,
          total: paginationData.total || topicsData.length,
          pages: paginationData.pages || Math.ceil(topicsData.length / pagination.limit)
        }));

        console.log('✅ Topics loaded successfully:', { count: topicsData.length, pagination: paginationData });
        
        if (topicsData.length === 0) {
          setErrors(prev => ({ ...prev, topics: 'No topics found. Upload and process documents to generate topics.' }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.topics;
            return newErrors;
          });
        }
      } else {
        throw new Error(response.data.error || 'Invalid response format');
      }
    } catch (error: any) {
      // Don't log error if request was aborted
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('📋 Topics request was cancelled');
        return;
      }
      
      if (!mountedRef.current) return;
      
      console.error('❌ Error loading topics:', error);
      setErrors(prev => ({ ...prev, topics: error.response?.data?.message || error.message || 'Failed to load topics' }));
      toast.error('Failed to load topics');
    } finally {
      if (mountedRef.current) {
        setLoadingStates(prev => ({ ...prev, topics: false }));
      }
      // Clean up abort controller
      delete abortControllersRef.current['topics'];
    }
  };

  const loadCategories = async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('🏷️ Loading categories...');
      const abortController = getAbortController('categories');
      setLoadingStates(prev => ({ ...prev, categories: true }));
      
      const response = await topicsApi.getTopicCategories();
      
      if (!mountedRef.current || abortController.signal.aborted) {
        console.log('🏷️ Categories request cancelled or component unmounted');
        return;
      }
      
      console.log('✅ Categories response:', response.data);
      
      // Handle backend response format: { success: true, data: { categories: [...], total_categories: number } }
      if (response.data.success && response.data.data) {
        const categoriesData = response.data.data.categories || [];
        // Backend returns: [{ category: 'content_based', topic_count: 111, content_count: 8 }]
        const categoryNames = categoriesData.map((cat: any) => cat.category || cat.name || cat);
        
        setCategories(['all', ...categoryNames]);
        console.log('✅ Categories loaded:', categoryNames);
        
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.categories;
          return newErrors;
        });
      } else {
        throw new Error(response.data.error || 'Invalid response format');
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🏷️ Categories request was cancelled');
        return;
      }
      
      if (!mountedRef.current) return;
      
      console.error('❌ Error loading categories:', error);
      setErrors(prev => ({ ...prev, categories: error.response?.data?.message || error.message || 'Failed to load categories' }));
      // Set a default category to prevent issues
      setCategories(['all', 'content_based']);
    } finally {
      if (mountedRef.current) {
        setLoadingStates(prev => ({ ...prev, categories: false }));
      }
      delete abortControllersRef.current['categories'];
    }
  };

  const loadStatistics = async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('📊 Loading statistics...');
      const abortController = getAbortController('statistics');
      setLoadingStates(prev => ({ ...prev, statistics: true }));
      
      const response = await topicsApi.getTopicStatistics();
      
      if (!mountedRef.current || abortController.signal.aborted) {
        console.log('📊 Statistics request cancelled or component unmounted');
        return;
      }
      
      console.log('✅ Statistics response:', response.data);
      
      // Handle backend response format: { success: true, data: { overall_statistics: {...}, category_distribution: [...] } }
      if (response.data.success && response.data.data) {
        const statsData = response.data.data;
        
        // Map the backend response structure to frontend structure
        const stats: Statistics = {
          total_topics: statsData.overall_statistics?.total_topics || 
                       statsData.overall_statistics?.llm_generated_topics || 0,
          avg_content_per_topic: parseFloat(statsData.overall_statistics?.avg_chunks_per_topic || '0'),
          total_categories: statsData.category_distribution?.length || 1,
          topics_with_content: (statsData.overall_statistics?.total_topics || 0) - 
                             (statsData.overall_statistics?.topics_without_content || 0),
          empty_topics: statsData.overall_statistics?.topics_without_content || 0,
          high_quality_topics: statsData.overall_statistics?.topics_with_good_content || 0
        };
        
        setStatistics(stats);
        console.log('✅ Statistics loaded:', stats);
        
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.statistics;
          return newErrors;
        });
      } else {
        throw new Error(response.data.error || 'Invalid response format');
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('📊 Statistics request was cancelled');
        return;
      }
      
      if (!mountedRef.current) return;
      
      console.error('❌ Error loading statistics:', error);
      setErrors(prev => ({ ...prev, statistics: error.response?.data?.message || error.message || 'Failed to load statistics' }));
      
      // Set default statistics to prevent empty cards
      setStatistics({
        total_topics: 0,
        avg_content_per_topic: 0,
        total_categories: 0,
        topics_with_content: 0,
        empty_topics: 0,
        high_quality_topics: 0
      });
    } finally {
      if (mountedRef.current) {
        setLoadingStates(prev => ({ ...prev, statistics: false }));
      }
      delete abortControllersRef.current['statistics'];
    }
  };

  const loadQualityMetrics = async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('🎯 Loading quality metrics...');
      const abortController = getAbortController('qualityMetrics');
      setLoadingStates(prev => ({ ...prev, qualityMetrics: true }));
      
      const response = await topicsApi.getQualityMetrics();
      
      if (!mountedRef.current || abortController.signal.aborted) {
        console.log('🎯 Quality metrics request cancelled or component unmounted');
        return;
      }
      
      console.log('✅ Quality metrics response:', response.data);
      
      // Handle backend response format: { success: true, data: { total_topics: number, quality_issues: {...} } }
      if (response.data.success && response.data.data) {
        const metricsData = response.data.data;
        
        // Safe parsing of metrics data with fallbacks
        const totalTopics = Number(metricsData.total_topics) || 0;
        const lowContentTopics = Number(metricsData.quality_issues?.low_content_topics?.count) || 0;
        const avgContentPerTopic = Number(metricsData.average_content_per_topic) || 0;
        const avgKeywordsPerTopic = Number(metricsData.avg_keywords_per_topic) || 0;
        const similarNamePairs = Number(metricsData.quality_issues?.similar_name_pairs?.count) || 0;
        
        // Simple quality score calculation (0-100) with safe math
        let qualityScore = 0;
        if (totalTopics > 0) {
          try {
            const contentScore = Math.min(avgContentPerTopic * 10, 50); // Max 50 points for content
            const distributionScore = Math.max(0, 50 - (lowContentTopics / totalTopics) * 50); // Max 50 points for distribution
            qualityScore = Math.round(contentScore + distributionScore);
            
            // Ensure quality score is within bounds
            qualityScore = Math.max(0, Math.min(100, qualityScore));
          } catch (mathError) {
            console.warn('Error calculating quality score, using default:', mathError);
            qualityScore = 0;
          }
        }
        
        // Create metrics object with type safety
        const metrics: QualityMetrics = {
          overall_quality_score: qualityScore,
          topics_without_content: lowContentTopics,
          avg_keywords_per_topic: avgKeywordsPerTopic,
          topics_needing_review: similarNamePairs
        };
        
        console.log('✅ Quality metrics processed:', {
          totalTopics,
          lowContentTopics,
          avgContentPerTopic,
          qualityScore,
          metrics
        });
        
        setQualityMetrics(metrics);
        
        // Clear any previous errors
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.qualityMetrics;
          return newErrors;
        });
      } else {
        throw new Error(response.data.error || response.data.message || 'Invalid response format');
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🎯 Quality metrics request was cancelled');
        return;
      }
      
      if (!mountedRef.current) return;
      
      console.error('❌ Error loading quality metrics:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to load quality metrics';
      
      setErrors(prev => ({ ...prev, qualityMetrics: errorMessage }));
      
      // Set safe default quality metrics to prevent UI crashes
      setQualityMetrics({
        overall_quality_score: 0,
        topics_without_content: 0,
        avg_keywords_per_topic: 0,
        topics_needing_review: 0
      });
    } finally {
      if (mountedRef.current) {
        setLoadingStates(prev => ({ ...prev, qualityMetrics: false }));
      }
      delete abortControllersRef.current['qualityMetrics'];
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTopics();
      return;
    }

    try {
      const abortController = getAbortController('search');
      setLoading(true);
      
      const response = await topicsApi.searchTopics(searchQuery, pagination.limit);
      
      if (!mountedRef.current || abortController.signal.aborted) {
        console.log('🔍 Search request cancelled or component unmounted');
        return;
      }
      
      // Handle backend response format: { success: true, data: { query: string, topics: [...], total_results: number } }
      if (response.data.success && response.data.data) {
        const searchResults = response.data.data.topics || [];
        const totalResults = response.data.data.total_results || searchResults.length;
        
        setTopics(searchResults);
        setPagination(prev => ({
          ...prev,
          total: totalResults,
          pages: Math.ceil(totalResults / pagination.limit)
        }));
      } else {
        throw new Error(response.data.error || 'Search failed');
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🔍 Search request was cancelled');
        return;
      }
      
      if (!mountedRef.current) return;
      
      toast.error(error.response?.data?.message || error.message || 'Search failed');
      console.error('Search error:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      delete abortControllersRef.current['search'];
    }
  };

  // Stable pagination handlers
  const handlePageChange = useCallback((newPage: number) => {
    console.log('📄 Page change requested:', { from: pagination.page, to: newPage });
    setPagination(prev => {
      if (prev.page === newPage) {
        console.log('📄 Page already set, skipping...');
        return prev;
      }
      return { ...prev, page: newPage };
    });
  }, [pagination.page]);

  const handleCategoryChange = useCallback((newCategory: string) => {
    console.log('🏷️ Category change requested:', { from: selectedCategory, to: newCategory });
    if (selectedCategory === newCategory) {
      console.log('🏷️ Category already set, skipping...');
      return;
    }
    setSelectedCategory(newCategory);
    // Reset page when category changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [selectedCategory]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    cancelAllRequests();
    initializeData();
  }, [cancelAllRequests]);

  // Update the getCategoryColor function to handle undefined category
  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      'content_based': 'bg-blue-100 text-blue-800',
      'technology': 'bg-blue-100 text-blue-800',
      'business': 'bg-green-100 text-green-800',
      'science': 'bg-purple-100 text-purple-800',
      'finance': 'bg-yellow-100 text-yellow-800',
      'legal': 'bg-red-100 text-red-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[category || 'general'] || 'bg-gray-100 text-gray-800';
  };

  // Render individual topic card
  const renderTopicCard = (topic: TopicWithStats, index: number) => (
    <motion.div
      key={topic.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="group border rounded-lg p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{topic.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(topic.category)}`}>
              {topic.category || 'general'}
            </span>
            {topic.avg_relevance && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                {(topic.avg_relevance * 100).toFixed(0)}% relevance
              </span>
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {topic.description || 'No description available'}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{topic.content_count || topic.total_chunks || 0} content chunks</span>
            </div>
            <div className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              <span>{topic.keywords?.length || 0} keywords</span>
            </div>
            {topic.created_at && (
              <span>Created: {new Date(topic.created_at).toLocaleDateString()}</span>
            )}
          </div>
          
          {topic.keywords && topic.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topic.keywords.slice(0, 5).map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                >
                  {keyword}
                </span>
              ))}
              {topic.keywords.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{topic.keywords.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Show topic details with safe field access
              const details = [
                `Topic: ${topic.name}`,
                `Description: ${topic.description || 'No description'}`,
                `Content Count: ${topic.content_count || topic.total_chunks || 0}`,
                `Relevance: ${topic.avg_relevance ? (topic.avg_relevance * 100).toFixed(1) + '%' : 'N/A'}`,
                `Keywords: ${topic.keywords?.join(', ') || 'None'}`,
                `Category: ${topic.category || 'general'}`,
                `Created: ${topic.created_at ? new Date(topic.created_at).toLocaleString() : 'Unknown'}`
              ].join('\n');
              
              alert(details);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast('Edit functionality coming soon', {
                icon: 'ℹ️',
              });
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this topic?')) {
                toast.error('Delete functionality not implemented yet');
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  // Render the topics list
  const renderTopicsList = () => {
    if (loadingStates.topics) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (topics.length === 0) {
      return (
        <div className="text-center py-8">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Topics Found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery 
              ? 'No topics match your search criteria. Try different keywords.'
              : 'Upload and process documents to generate topics automatically.'
            }
          </p>
          {!searchQuery && (
            <div className="space-y-3">
              <Button onClick={() => window.location.href = '/upload'} className="mr-3">
                Upload Documents
              </Button>
              <div className="text-sm text-gray-600">
                <p>To get started:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Upload documents (PDF, DOCX, TXT, etc.)</li>
                  <li>Process the documents to extract content</li>
                  <li>Topics will be automatically generated</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <AnimatePresence>
          {topics.map((topic, index) => renderTopicCard(topic, index))}
        </AnimatePresence>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading topic management data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Topic Management</h2>
          <p className="text-gray-600 mt-1">Manage and optimize your knowledge graph topics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading || isInitializingRef.current}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="space-y-2">
          {Object.entries(errors).map(([key, error]) => (
            <div key={key} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Error loading {key}:</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          ))}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Topics</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loadingStates.statistics ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    statistics?.total_topics ?? 0
                  )}
                </p>
                {statistics?.total_topics === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No topics yet</p>
                )}
              </div>
              <Tag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Content per Topic</p>
                <p className="text-2xl font-bold text-green-600">
                  {loadingStates.statistics ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    statistics?.avg_content_per_topic?.toFixed(1) ?? '0'
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">Content chunks</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">
                  {loadingStates.statistics ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    statistics?.total_categories ?? 0
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">Topic categories</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold text-orange-600">
                  {loadingStates.qualityMetrics ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    qualityMetrics?.overall_quality_score ?? '0'
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">Overall rating</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Insights */}
      {qualityMetrics && (qualityMetrics.topics_without_content > 0 || qualityMetrics.topics_needing_review > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Quality Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {qualityMetrics.topics_without_content > 0 && (
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>{qualityMetrics.topics_without_content} topics have very little content</span>
                </div>
              )}
              {qualityMetrics.topics_needing_review > 0 && (
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>{qualityMetrics.topics_needing_review} topic pairs have similar names and may need merging</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search topics by name or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <Button onClick={handleSearch} disabled={loadingStates.topics}>
              {loadingStates.topics ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Topics ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderTopicsList()}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1 || loadingStates.topics}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.pages || loadingStates.topics}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicManager;