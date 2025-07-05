// hooks/useTopics.ts
import { useState, useEffect, useCallback } from 'react';
import { Topic, TopicDetails, UseTopicsReturn, Pagination } from '@/types';
import { topicsApi as api } from '@/services/api';
import toast from 'react-hot-toast';

export const useTopics = (): UseTopicsReturn => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Load topics on mount
  useEffect(() => {
    refreshTopics();
  }, []);

  const refreshTopics = useCallback(async (page: number = 1, limit: number = 50) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // CORRECTED: Called api.getTopics instead of non-existent getTopicsSummary
      const response = await api.getTopics(page, limit);
      if (response.data.success) {
        const data = response.data.data!;
        setTopics(data.topics || []);
        // Update pagination info if available from the response
        if (data.pagination) {
          setPagination(data.pagination);
        } else {
           setPagination(prev => ({ ...prev, page, limit, total: data.topics?.length || 0, pages: 1 }));
        }
      } else {
        throw new Error(response.data.error || 'Failed to fetch topics');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch topics';
      setError(errorMessage);
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchTopics = useCallback(async (query: string): Promise<Topic[]> => {
    if (!query.trim()) {
      return topics;
    }

    try {
      const response = await api.searchTopics(query, 50);
      if (response.data.success) {
        return response.data.data?.topics || [];
      } else {
        throw new Error(response.data.error || 'Search failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Search failed';
      console.error('Topic search error:', error);
      toast.error(errorMessage);
      return [];
    }
  }, [topics]);

  const getTopicDetails = useCallback(async (id: string): Promise<TopicDetails | null> => {
    try {
      const response = await api.getTopicDetails(id);
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to fetch topic details');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch topic details';
      console.error('Topic details error:', error);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const getTopicRelationships = useCallback(async (id: string) => {
    try {
      const response = await api.getTopicRelationships(id);
      if (response.data.success) {
        return response.data.data!;
      }
      return { relationships: [], total_relationships: 0 };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch relationships';
      console.error('Topic relationships error:', error);
      return { relationships: [], total_relationships: 0 };
    }
  }, []);

  const updateTopic = useCallback(async (id: string, updates: Partial<Topic>): Promise<boolean> => {
    try {
      // CORRECTED: Called updateTopicMetadata instead of updateTopic
      const response = await api.updateTopicMetadata(id, updates);
      if (response.data.success) {
        // Update local state
        setTopics(prev => 
          prev.map(topic => 
            topic.id === id ? { ...topic, ...updates } : topic
          )
        );
        toast.success('Topic updated successfully');
        return true;
      } else {
        throw new Error(response.data.error || 'Update failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Update failed';
      console.error('Topic update error:', error);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const deleteTopic = useCallback(async (id: string): Promise<boolean> => {
    const topicToDelete = topics.find(topic => topic.id === id);
    
    if (!topicToDelete) {
      toast.error('Topic not found');
      return false;
    }

    try {
      const response = await api.deleteTopic(id);
      if (response.data.success) {
        setTopics(prev => prev.filter(topic => topic.id !== id));
        toast.success(`Topic "${topicToDelete.name}" deleted successfully`);
        return true;
      } else {
        throw new Error(response.data.error || 'Deletion failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Deletion failed';
      console.error('Topic deletion error:', error);
      toast.error(errorMessage);
      return false;
    }
  }, [topics]);

  const mergeTopics = useCallback(async (sourceId: string, targetId: string): Promise<boolean> => {
    const sourceTopic = topics.find(t => t.id === sourceId);
    const targetTopic = topics.find(t => t.id === targetId);
    
    if (!sourceTopic || !targetTopic) {
      toast.error('One or both topics not found');
      return false;
    }

    try {
      const response = await api.mergeTopics(sourceId, targetId);
      if (response.data.success) {
        // Remove source topic and refresh data
        setTopics(prev => prev.filter(topic => topic.id !== sourceId));
        await refreshTopics();
        toast.success(`Merged "${sourceTopic.name}" into "${targetTopic.name}"`);
        return true;
      } else {
        throw new Error(response.data.error || 'Merge failed');
      }
    } catch (error: any)
    {
      const errorMessage = error.response?.data?.message || error.message || 'Merge failed';
      console.error('Topic merge error:', error);
      toast.error(errorMessage);
      return false;
    }
  }, [topics, refreshTopics]);

  const findDuplicates = useCallback(async (threshold: number = 0.75) => {
    try {
      // CORRECTED: Called findDuplicates instead of findDuplicateTopics
      const response = await api.findDuplicates(threshold);
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to find duplicates');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to find duplicates';
      console.error('Find duplicates error:', error);
      toast.error(errorMessage);
      return { duplicates: [], threshold_used: threshold, total_duplicate_groups: 0 };
    }
  }, []);

  const autoDeduplicate = useCallback(async (threshold: number = 0.8, maxMerges: number = 50, dryRun: boolean = false) => {
    try {
      // CORRECTED: Called autoDeduplicate instead of autoDeduplicateTopics
      const response = await api.autoDeduplicate(threshold, maxMerges, dryRun);
      if (response.data.success) {
        if (!dryRun) {
          // Refresh topics after deduplication
          await refreshTopics();
        }
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Auto-deduplication failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Auto-deduplication failed';
      console.error('Auto-deduplication error:', error);
      toast.error(errorMessage);
      return { status: 'failed', error: errorMessage };
    }
  }, [refreshTopics]);

  const cleanupEmpty = useCallback(async () => {
    try {
      // CORRECTED: Called cleanupEmpty instead of cleanupEmptyTopics
      const response = await api.cleanupEmpty();
      if (response.data.success) {
        await refreshTopics();
        const result = response.data.data!;
        if (result.topics_deleted > 0) {
          toast.success(`Cleaned up ${result.topics_deleted} empty topics`);
        } else {
          toast('No empty topics found to clean up.');
        }
        return result;
      } else {
        throw new Error(response.data.error || 'Cleanup failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Cleanup failed';
      console.error('Cleanup error:', error);
      toast.error(errorMessage);
      return { status: 'failed', topics_deleted: 0 };
    }
  }, [refreshTopics]);

  const getQualityMetrics = useCallback(async () => {
    try {
      const response = await api.getQualityMetrics();
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to get quality metrics');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get quality metrics';
      console.error('Quality metrics error:', error);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const getCategories = useCallback(async () => {
    try {
      const response = await api.getTopicCategories();
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to get categories');
      }
    } catch (error: any) {
      console.error('Categories error:', error);
      return { categories: [], total_categories: 0 };
    }
  }, []);

  const findSimilar = useCallback(async (id: string, threshold: number = 0.7, limit: number = 10) => {
    try {
      // CORRECTED: Called findSimilar instead of findSimilarTopics
      const response = await api.findSimilar(id, threshold, limit);
      if (response.data.success) {
        return response.data.data!;
      } else {
        throw new Error(response.data.error || 'Failed to find similar topics');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to find similar topics';
      console.error('Find similar error:', error);
      toast.error(errorMessage);
      return { reference_topic: null, similar_topics: [], threshold_used: threshold, total_similar: 0 };
    }
  }, []);

  const getTopicById = useCallback((id: string): Topic | undefined => {
    return topics.find(topic => topic.id === id);
  }, [topics]);

  const getTopicsByCategory = useCallback((category: string): Topic[] => {
    if (category === 'all') return topics;
    return topics.filter(topic => topic.category === category);
  }, [topics]);

  const getTopicStats = useCallback(() => {
    const total = topics.length;
    if (total === 0) {
      return { total: 0, withContent: 0, categories: 0, avgContent: 0, contentCoverage: 0 };
    }
    const withContent = topics.filter(topic => (topic.content_count || 0) > 0).length;
    const categories = new Set(topics.map(topic => topic.category || 'uncategorized')).size;
    const avgContent = topics.reduce((sum, topic) => sum + (topic.content_count || 0), 0) / total;
    
    return {
      total,
      withContent,
      categories,
      avgContent: Math.round(avgContent * 100) / 100,
      contentCoverage: Math.round((withContent / total) * 100)
    };
  }, [topics]);

  return {
    topics,
    isLoading,
    error,
    pagination,
    searchTopics,
    getTopicDetails,
    getTopicRelationships,
    updateTopic,
    deleteTopic,
    mergeTopics,
    findDuplicates,
    autoDeduplicate,
    cleanupEmpty,
    getQualityMetrics,
    getCategories,
    findSimilar,
    refreshTopics,
    getTopicById,
    getTopicsByCategory,
    getTopicStats,
  };
};