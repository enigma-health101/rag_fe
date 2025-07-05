import { useState, useCallback } from 'react';
import { 
  ChatMessage, 
  EnhancedQueryResponse, 
  TopicAnalysis,
  extractQueryData,
  cleanResponseContent 
} from '@/types';
import { queryApi } from '@/services/api';
import toast from 'react-hot-toast';

// Type alias for enhanced chat message (using existing ChatMessage with enhanced fields)
type EnhancedChatMessage = ChatMessage;

export const useChat = () => {
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStats, setProcessingStats] = useState<{
    totalTopics: number;
    totalBatches: number;
    totalSources: number;
    processingTime: number;
  } | null>(null);

  // Helper function to extract processing statistics
  const extractProcessingStats = (queryData: EnhancedQueryResponse) => {
    const totalTopics = queryData.topic_analyses?.length || 0;
    const totalBatches = queryData.topic_analyses?.reduce((sum, topic) => sum + topic.batches_processed, 0) || 0;
    const uniqueSources = new Set(queryData.sources || []);
    
    return {
      totalTopics,
      totalBatches,
      totalSources: uniqueSources.size,
      processingTime: queryData.processing_time_ms || 0
    };
  };

  // Helper function to create enhanced success message
  const createSuccessMessage = (stats: any) => {
    const parts = [];
    
    if (stats.processingTime) {
      parts.push(`${stats.processingTime}ms`);
    }
    
    if (stats.totalTopics > 0) {
      parts.push(`${stats.totalTopics} topics analyzed`);
    }
    
    if (stats.totalBatches > 0) {
      parts.push(`${stats.totalBatches} content batches processed`);
    }
    
    if (stats.totalSources > 0) {
      parts.push(`${stats.totalSources} sources referenced`);
    }

    return parts.length > 0 ? `Analysis complete: ${parts.join(' • ')}` : 'Response generated successfully';
  };

  const sendMessage = useCallback(async (content: string): Promise<EnhancedChatMessage | null> => {
    if (!content.trim() || isLoading) {
      return null;
    }

    const userMessage: EnhancedChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      type: 'user',
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setProcessingStats(null);

    try {
      // Send query to API
      const response = await queryApi.processQuery(content.trim());
      console.log('Enhanced API Response:', response); // Debug log
      
      // Extract query data using the helper function
      const queryData = extractQueryData(response);
      
      if (!queryData) {
        throw new Error('Invalid response format from server');
      }

      // Clean the response content
      const cleanedResponse = cleanResponseContent(queryData.response);
      
      if (!cleanedResponse) {
        throw new Error('Empty response received from server');
      }

      // Extract processing statistics
      const stats = extractProcessingStats(queryData);
      setProcessingStats(stats);

      // Create enhanced assistant message
      const assistantMessage: EnhancedChatMessage = {
        id: (Date.now() + 1).toString(),
        content: cleanedResponse,
        type: 'assistant',
        timestamp: new Date(),
        sources: queryData.sources || [],
        topics: [
          ...(queryData.matched_topics || []), 
          ...(queryData.related_topics || [])
        ],
        queryId: queryData.query_id,
        // Enhanced fields
        reasoning: queryData.reasoning || '',
        topicAnalyses: queryData.topic_analyses || [],
        processingTime: queryData.processing_time_ms || 0,
      };

      // Add assistant message to chat
      setMessages(prev => [...prev, assistantMessage]);
      
      // Show enhanced processing statistics
      const successMessage = createSuccessMessage(stats);
      toast.success(successMessage);
      
      return assistantMessage;
    } catch (error: any) {
      console.error('Error sending enhanced message:', error);
      
      let errorMsg = 'Failed to send message. Please try again.';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
      
      // Create error message
      const errorMessage: EnhancedChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        type: 'assistant',
        timestamp: new Date(),
        reasoning: 'Error occurred during processing - no analysis could be completed.',
      };

      setMessages(prev => [...prev, errorMessage]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setProcessingStats(null);
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const rateMessage = useCallback(async (messageId: string, rating: number, feedback?: string) => {
    try {
      // Find the message and get query info from response
      const message = messages.find(msg => msg.id === messageId);
      if (message && message.type === 'assistant' && message.queryId) {
        // Call the rating API with the stored query_id
        const success = await queryApi.rateResponse(message.queryId, rating, feedback);
        
        if (success) {
          // Update the local message rating
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageId ? { ...msg, rating } : msg
            )
          );
          
          const ratingText = rating === 5 ? 'Excellent!' : rating >= 4 ? 'Good!' : rating >= 3 ? 'Okay' : 'Thanks for feedback';
          toast.success(`${ratingText} Your feedback helps improve our analysis.`);
        } else {
          throw new Error('Rating submission failed');
        }
      } else {
        // If no queryId available, just update locally
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, rating } : msg
          )
        );
        toast.success('Thank you for your feedback!');
      }
    } catch (error) {
      console.error('Error rating message:', error);
      toast.error('Failed to submit rating. Please try again.');
    }
  }, [messages]);

  // Enhanced method to get topic analysis summary
  const getTopicAnalysisSummary = useCallback((messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || !message.topicAnalyses) {
      return null;
    }

    const analyses = message.topicAnalyses;
    const topTopics = analyses
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 3);

    return {
      totalTopics: analyses.length,
      totalBatches: analyses.reduce((sum, topic) => sum + topic.batches_processed, 0),
      topTopics: topTopics.map(topic => ({
        name: topic.topic_name,
        similarity: topic.similarity_score,
        sourcesCount: topic.sources.length
      })),
      allSources: Array.from(new Set(analyses.flatMap(topic => topic.sources))),
    };
  }, [messages]);

  // Method to export topic analysis data
  const exportTopicAnalysis = useCallback((messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || !message.topicAnalyses) {
      toast.error('No topic analysis data found for this message');
      return null;
    }

    const exportData = {
      query: messages.find(msg => msg.type === 'user' && 
        parseInt(msg.id) < parseInt(messageId))?.content || 'Unknown query',
      timestamp: message.timestamp.toISOString(),
      processingTime: message.processingTime,
      reasoning: message.reasoning,
      mainResponse: message.content,
      topicAnalyses: message.topicAnalyses.map(topic => ({
        topicName: topic.topic_name,
        description: topic.topic_description,
        similarityScore: topic.similarity_score,
        batchesProcessed: topic.batches_processed,
        summary: topic.topic_summary,
        sources: topic.sources,
        rawResponses: topic.raw_responses
      })),
      sources: message.sources,
      topics: message.topics
    };

    // Create downloadable JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `topic-analysis-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Topic analysis data exported successfully');
    return exportData;
  }, [messages]);

  // Method to regenerate response with different parameters
  const regenerateResponse = useCallback(async (messageId: string, options?: {
    focusTopics?: string[];
    excludeTopics?: string[];
    detailLevel?: 'brief' | 'standard' | 'detailed';
  }) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message) {
      toast.error('Message not found');
      return null;
    }

    // Find the original user query
    const userMessageIndex = messages.findIndex(msg => msg.id === messageId) - 1;
    const userMessage = messages[userMessageIndex];
    
    if (!userMessage || userMessage.type !== 'user') {
      toast.error('Could not find original query');
      return null;
    }

    // Create modified query based on options
    let modifiedQuery = userMessage.content;
    
    if (options?.focusTopics?.length) {
      modifiedQuery += ` (Focus on: ${options.focusTopics.join(', ')})`;
    }
    
    if (options?.excludeTopics?.length) {
      modifiedQuery += ` (Exclude: ${options.excludeTopics.join(', ')})`;
    }
    
    if (options?.detailLevel && options.detailLevel !== 'standard') {
      modifiedQuery += ` (${options.detailLevel} analysis)`;
    }

    // Remove the old assistant message and regenerate
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    toast('Regenerating response with new parameters...', { icon: 'ℹ️' });
    return await sendMessage(modifiedQuery);
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    processingStats,
    sendMessage,
    clearMessages,
    removeMessage,
    rateMessage,
    getTopicAnalysisSummary,
    exportTopicAnalysis,
    regenerateResponse,
  };
};