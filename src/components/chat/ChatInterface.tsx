'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  Sparkles, 
  Mic,
  Paperclip,
  Plus,
  Zap,
  Brain,
  MessageCircle,
  ArrowUp,
  Lightbulb,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Target,
  BookOpen,
  Cpu
} from 'lucide-react';
import { queryApi } from '@/services/api';
import { 
  ChatMessage, 
  EnhancedQueryResponse, 
  TopicAnalysis,
  extractQueryData,
  cleanResponseContent 
} from '@/types';
import toast from 'react-hot-toast';

// Type alias for enhanced chat message (using existing ChatMessage with enhanced fields)
type EnhancedChatMessage = ChatMessage;

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Get suggestions if input is long enough
    if (value.length > 2) {
      try {
        const response = await queryApi.getSuggestions(value);
        
        // Handle the nested response structure consistently
        let suggestionData: string[] = [];
        
        if (response.data?.data?.suggestions) {
          // If nested structure: { data: { data: { suggestions: [] } } }
          suggestionData = response.data.data.suggestions;
        } else if ((response.data as any)?.suggestions) {
          // If simple structure: { data: { suggestions: [] } }
          suggestionData = response.data.data?.suggestions ?? [];
        } else if (Array.isArray(response.data)) {
          // If direct array: { data: [] }
          suggestionData = response.data;
        }
        
        // Ensure suggestions is always an array
        const safeSuggestions = Array.isArray(suggestionData) ? suggestionData : [];
        setSuggestions(safeSuggestions);
        setShowSuggestions(safeSuggestions.length > 0);
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSubmit = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: EnhancedChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await queryApi.processQuery(text);
      console.log('API Response:', response); // Debug log
      
      setIsTyping(false);

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

      const assistantMessage: EnhancedChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: cleanedResponse,
        timestamp: new Date(),
        topics: [...(queryData.matched_topics || []), ...(queryData.related_topics || [])],
        sources: queryData.sources || [],
        queryId: queryData.query_id,
        // Enhanced fields
        reasoning: queryData.reasoning || '',
        topicAnalyses: queryData.topic_analyses || [],
        processingTime: queryData.processing_time_ms || 0,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (queryData.processing_time_ms) {
        toast.success(`Response generated in ${queryData.processing_time_ms}ms with ${queryData.topic_analyses?.length || 0} topics analyzed`);
      }
    } catch (error: any) {
      console.error('Query failed:', error);
      setIsTyping(false);
      
      const errorMessage: EnhancedChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to process query';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const toggleTopicExpansion = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const renderTopicAnalysis = (analysis: TopicAnalysis) => {
    const isExpanded = expandedTopics.has(analysis.topic_id);
    
    return (
      <div key={analysis.topic_id} className="border border-gray-200 rounded-lg overflow-hidden">
        <motion.button
          onClick={() => toggleTopicExpansion(analysis.topic_id)}
          className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
          whileHover={{ backgroundColor: '#f9fafb' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">{analysis.topic_name}</h4>
              <p className="text-sm text-gray-600">
                Similarity: {(analysis.similarity_score * 100).toFixed(1)}% • 
                {analysis.batches_processed} batches • 
                {analysis.sources.length} sources
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </motion.button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Topic Summary */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Summary
                  </h5>
                  <p className="text-sm text-blue-800">{analysis.topic_summary}</p>
                </div>
                
                {/* Raw Responses from Batches */}
                {analysis.raw_responses && analysis.raw_responses.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Detailed Analysis ({analysis.raw_responses.length} batches)
                    </h5>
                    {analysis.raw_responses.map((batch, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Batch {batch.batch_index + 1}
                          </span>
                          <span className="text-xs text-gray-500">
                            {batch.chunks_count} chunks • {batch.sources.join(', ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{batch.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Sources */}
                <div className="border-t pt-3">
                  <h5 className="font-medium text-gray-700 mb-2">Sources</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.sources.map((source, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderEnhancedMessage = (message: EnhancedChatMessage) => {
    if (message.type === 'user') {
      return (
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl px-4 py-3">
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Main Response */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm">
              <div className="prose prose-sm max-w-none text-gray-800">
                {message.content.split('\n').map((line, index) => (
                  <p key={index} className="mb-2 last:mb-0">{line}</p>
                ))}
              </div>
            </div>

            {/* Enhanced Information Panel */}
            {(message.reasoning || message.topicAnalyses?.length || message.processingTime) && (
              <div className="space-y-3">
                {/* Processing Stats */}
                {message.processingTime && (
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Cpu className="w-4 h-4" />
                      <span>Processed in {message.processingTime}ms</span>
                    </div>
                    {message.topicAnalyses && (
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{message.topicAnalyses.length} topics analyzed</span>
                      </div>
                    )}
                    {message.sources && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{message.sources.length} sources referenced</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reasoning Section */}
                {message.reasoning && (
                  <div className="bg-purple-50 rounded-lg border border-purple-200">
                    <motion.button
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="w-full p-3 flex items-center justify-between hover:bg-purple-100 transition-colors"
                      whileHover={{ backgroundColor: '#f3e8ff' }}
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-900">AI Reasoning Process</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {showReasoning ? (
                          <EyeOff className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-purple-600" />
                        )}
                        {showReasoning ? (
                          <ChevronDown className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {showReasoning && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 pt-0">
                            <div className="bg-white rounded-lg p-3 border border-purple-200">
                              <div className="prose prose-sm max-w-none text-purple-800">
                                {message.reasoning.split('\n').map((line, index) => (
                                  <p key={index} className="mb-2 last:mb-0">{line}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Topic Analyses */}
                {message.topicAnalyses && message.topicAnalyses.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Topic Analysis ({message.topicAnalyses.length} topics)
                    </h4>
                    <div className="space-y-2">
                      {message.topicAnalyses.map(renderTopicAnalysis)}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Sources Referenced
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const suggestedPrompts = [
    "What are the key topics in my documents?",
    "Summarize the latest research findings",
    "How do I implement machine learning models?",
    "Explain the data analysis methodology",
  ];

  const quickActions = [
    {
      id: 'summarize',
      label: 'Summarize',
      icon: FileText,
      prompt: 'Can you provide a summary of the key points from my documents?',
      color: 'blue'
    },
    {
      id: 'analyze',
      label: 'Analyze',
      icon: BarChart3,
      prompt: 'What are the main themes and patterns in my document collection?',
      color: 'purple'
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: Lightbulb,
      prompt: 'What insights can you derive from my documents?',
      color: 'yellow'
    },
  ];

  const handleQuickAction = async (actionId: string) => {
    // Find the last assistant message that has topic analyses
    const lastAssistantMessage = [...messages].reverse().find(
      (m) => m.type === 'assistant' && m.topicAnalyses && m.topicAnalyses.length > 0
    );

    if (!lastAssistantMessage || !lastAssistantMessage.topicAnalyses) {
      toast.error('Please ask a question first to generate topics to act on.');
      return;
    }

    setIsLoading(true);
    // Add a user message to show what action was clicked
    const userMessage: EnhancedChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `Perform action: ${actionId}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);


    try {
      let response;
      const analyses = lastAssistantMessage.topicAnalyses;

      switch (actionId) {
        case 'summarize':
          response = await queryApi.summarizeTopics(analyses);
          break;
        case 'analyze':
          response = await queryApi.analyzeTopics(analyses);
          break;
        case 'insights':
          response = await queryApi.generateInsights(analyses);
          break;
        default:
          throw new Error('Unknown quick action');
      }
      
      const responseContent = response.data.data?.response;
      if (!responseContent) throw new Error('Received an empty response from the server.');

      const assistantMessage: EnhancedChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error(`Failed to perform action ${actionId}:`, error);
      toast.error(error.message || `Failed to perform ${actionId} action.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Chat Header */}
      <div className="flex-shrink-0 p-6 bg-gradient-to-r from-blue-50 via-white to-purple-50 border-b border-gray-200/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enhanced AI Assistant
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Advanced topic analysis with reasoning
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Enhanced AI Analysis
              </h3>
              <p className="text-gray-600 max-w-md mb-8">
                Experience advanced document analysis with topic-by-topic processing, 
                reasoning insights, and comprehensive understanding of your content.
              </p>
              
              {/* Suggested Prompts */}
              <div className="w-full max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Try asking:</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedPrompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleSubmit(prompt)}
                      className="group p-4 text-left bg-white/80 hover:bg-white border border-gray-200/50 hover:border-blue-300/50 rounded-xl transition-all hover:shadow-md"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 pr-2">
                          {prompt}
                        </span>
                        <ArrowUp className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 rotate-45" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {renderEnhancedMessage(message)}
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-200/50 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Analyzing topics...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length > 0 && (
        <div className="px-6 py-4 bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Quick Actions</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
                    action.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' :
                    action.color === 'purple' ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' :
                    'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-6 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
        <div className="relative">
          {/* Suggestions */}
          {showSuggestions && Array.isArray(suggestions) && suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3 p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
            {/* Attachment Button */}
            <motion.button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Paperclip className="w-5 h-5" />
            </motion.button>

            {/* Text Input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question for detailed topic analysis..."
              className="flex-1 resize-none outline-none bg-transparent placeholder-gray-400 text-gray-900 max-h-32 min-h-[24px]"
              disabled={isLoading}
              rows={1}
            />

            {/* Voice Input Button */}
            <motion.button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mic className="w-5 h-5" />
            </motion.button>

            {/* Send Button */}
            <motion.button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg transition-all ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-100 text-gray-400'
              }`}
              whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
              whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Character Count & Shortcuts */}
          <div className="flex items-center justify-between mt-2 px-2">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span className="text-purple-600">• Enhanced with reasoning analysis</span>
            </div>
            <div className="text-xs text-gray-400">
              {input.length}/2000
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;