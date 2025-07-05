// hooks/useAnalytics.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  SystemHealth, 
  QueryAnalytics, 
  DocumentAnalytics, 
  TopicAnalytics, 
  PerformanceMetrics, 
  DashboardSummary,
  UseAnalyticsReturn 
} from '@/types';
import { analyticsApi as api } from '@/services/api';
import toast from 'react-hot-toast';

export const useAnalytics = (): UseAnalyticsReturn => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [queryAnalytics, setQueryAnalytics] = useState<QueryAnalytics | null>(null);
  const [documentAnalytics, setDocumentAnalytics] = useState<DocumentAnalytics | null>(null);
  const [topicAnalytics, setTopicAnalytics] = useState<TopicAnalytics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auto-refresh system health every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSystemHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Load initial analytics on mount
  useEffect(() => {
    refreshAnalytics();
  }, []);

  const refreshSystemHealth = useCallback(async () => {
    try {
      const response = await api.getSystemHealth();
      if (response.data.success) {
        // CORRECTED: The health data is in `response.data.health`, not `response.data.data`
        setSystemHealth(response.data.health!);
      }
    } catch (error) {
      console.error('Failed to refresh system health:', error);
    }
  }, []);

  const refreshAnalytics = useCallback(async (days: number = 7) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load all analytics data in parallel
      const [
        healthResponse,
        dashboardResponse,
        queryResponse,
        documentResponse,
        performanceResponse
      ] = await Promise.allSettled([
        api.getSystemHealth(),
        api.getDashboardSummary(),
        api.getQueryAnalytics(days),
        api.getDocumentAnalytics(days),
        api.getPerformanceMetrics()
      ]);

      // Process system health
      if (healthResponse.status === 'fulfilled' && healthResponse.value.data.success) {
        // CORRECTED: The health data is in `response.data.health`, not `response.data.data`
        setSystemHealth(healthResponse.value.data.health!);
      }

      // Process dashboard summary
      if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.data.success) {
        setDashboardSummary(dashboardResponse.value.data.data!);
      }

      // Process query analytics
      if (queryResponse.status === 'fulfilled' && queryResponse.value.data.success) {
        setQueryAnalytics(queryResponse.value.data.data!);
      }

      // Process document analytics
      if (documentResponse.status === 'fulfilled' && documentResponse.value.data.success) {
        setDocumentAnalytics(documentResponse.value.data.data!);
      }

      // Process performance metrics
      if (performanceResponse.status === 'fulfilled' && performanceResponse.value.data.success) {
        setPerformanceMetrics(performanceResponse.value.data.data!);
      }

      // Try to get topic analytics separately as it might take longer
      try {
        const topicResponse = await api.getTopicAnalytics(days);
        if (topicResponse.data.success) {
          setTopicAnalytics(topicResponse.data.data!);
        }
      } catch (topicError) {
        console.error('Failed to load topic analytics:', topicError);
      }

      setLastUpdated(new Date());
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load analytics';
      setError(errorMessage);
      console.error('Analytics error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getQueryAnalytics = useCallback(async (days: number = 30) => {
    try {
      const response = await api.getQueryAnalytics(days);
      if (response.data.success) {
        setQueryAnalytics(response.data.data!);
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to get query analytics');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get query analytics';
      console.error('Query analytics error:', error);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const getDocumentAnalytics = useCallback(async (days: number = 30) => {
    try {
      const response = await api.getDocumentAnalytics(days);
      if (response.data.success) {
        setDocumentAnalytics(response.data.data!);
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to get document analytics');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get document analytics';
      console.error('Document analytics error:', error);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const getPerformanceMetrics = useCallback(async () => {
    try {
      const response = await api.getPerformanceMetrics();
      if (response.data.success) {
        setPerformanceMetrics(response.data.data!);
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to get performance metrics');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get performance metrics';
      console.error('Performance metrics error:', error);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const getTrends = useCallback(async () => {
    try {
      // CORRECTED: Renamed function call from getTrendsAnalysis to getTrends
      const response = await api.getTrends();
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to get trends');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get trends';
      console.error('Trends error:', error);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const getOverview = useCallback(async (days: number = 7) => {
    try {
      // CORRECTED: Renamed function call from getAnalyticsOverview to getOverview
      const response = await api.getOverview(days);
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to get overview');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get overview';
      console.error('Overview error:', error);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  // Helper functions for computed analytics
  const getSystemHealthStatus = useCallback(() => {
    if (!systemHealth) return 'unknown';
    return systemHealth.system_status;
  }, [systemHealth]);

  const getQueryPerformance = useCallback(() => {
    if (!queryAnalytics) return null;
    
    const { total_queries, average_response_time_ms, response_time_distribution } = queryAnalytics;
    
    return {
      totalQueries: total_queries,
      avgResponseTime: average_response_time_ms,
      distribution: response_time_distribution,
      performanceGrade: average_response_time_ms < 1000 ? 'excellent' : 
                       average_response_time_ms < 3000 ? 'good' : 
                       average_response_time_ms < 5000 ? 'fair' : 'poor'
    };
  }, [queryAnalytics]);

  const getProcessingEfficiency = useCallback(() => {
    if (!documentAnalytics) return null;
    
    const stats = documentAnalytics.processing_statistics;
    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const processed = stats.find(stat => stat.status === 'processed')?.count || 0;
    const errors = stats.find(stat => stat.status === 'error')?.count || 0;
    
    return {
      total,
      processed,
      errors,
      successRate: total > 0 ? Math.round((processed / total) * 100) : 0,
      errorRate: total > 0 ? Math.round((errors / total) * 100) : 0
    };
  }, [documentAnalytics]);

  const getTopicQuality = useCallback(() => {
    if (!topicAnalytics || !topicAnalytics.quality_metrics) return null;
    
    const { quality_metrics } = topicAnalytics;
    
    return {
      totalTopics: quality_metrics.total_topics,
      qualityScore: quality_metrics.quality_score,
      emptyTopics: quality_metrics.empty_topics,
      wellPopulated: quality_metrics.well_populated_topics,
      avgContent: quality_metrics.average_content_per_topic
    };
  }, [topicAnalytics]);

  const getInsights = useCallback(() => {
    const insights = [];
    
    // Query insights
    if (queryAnalytics) {
      const avgTime = queryAnalytics.average_response_time_ms;
      if (avgTime > 3000) {
        insights.push({
          type: 'warning',
          category: 'performance',
          message: `Average query response time is ${avgTime}ms. Consider optimizing your knowledge base.`,
          action: 'Optimize embeddings or reduce document complexity'
        });
      } else if (avgTime < 1000) {
        insights.push({
          type: 'success',
          category: 'performance',
          message: `Excellent query performance! Average response time: ${avgTime}ms`,
          action: null
        });
      }
    }
    
    // Document insights
    if (documentAnalytics) {
      const stats = documentAnalytics.processing_statistics;
      const errorStat = stats.find(stat => stat.status === 'error');
      if (errorStat && errorStat.percentage > 10) {
        insights.push({
          type: 'error',
          category: 'processing',
          message: `${errorStat.percentage}% of documents failed to process`,
          action: 'Check document formats and processing logs'
        });
      }
    }
    
    // System health insights
    if (systemHealth) {
      if (systemHealth.system_status === 'error') {
        insights.push({
          type: 'error',
          category: 'system',
          message: 'System health is critical',
          action: 'Check error logs and system resources'
        });
      } else if (systemHealth.system_status === 'warning') {
        insights.push({
          type: 'warning',
          category: 'system',
          message: 'System health needs attention',
          action: 'Review recent activities and error rates'
        });
      }
    }
    
    return insights;
  }, [queryAnalytics, documentAnalytics, systemHealth]);

  return {
    // Data
    systemHealth,
    queryAnalytics,
    documentAnalytics,
    topicAnalytics,
    performanceMetrics,
    dashboardSummary,
    
    // State
    isLoading,
    error,
    lastUpdated,
    
    // Actions
    refreshAnalytics,
    refreshSystemHealth,
    getQueryAnalytics,
    getDocumentAnalytics,
    getPerformanceMetrics,
    getTrends,
    getOverview,
    
    // Computed values
    getSystemHealthStatus,
    getQueryPerformance,
    getProcessingEfficiency,
    getTopicQuality,
    getInsights,
  };
};