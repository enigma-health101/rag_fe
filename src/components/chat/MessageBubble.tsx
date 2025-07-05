'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Share2, 
  Download,
  Brain,
  Target,
  FileText,
  Layers,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Clock,
  Cpu,
  User,
  Sparkles,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { ChatMessage, TopicAnalysis, BatchResponse } from '@/types';
import toast from 'react-hot-toast';

interface MessageBubbleProps {
  message: ChatMessage;
  onRate?: (messageId: string, rating: number) => void;
  onRegenerate?: (messageId: string, options?: any) => void;
  onExportAnalysis?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onRate, 
  onRegenerate, 
  onExportAnalysis 
}) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [showActions, setShowActions] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Message copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Assistant Response',
          text: message.content,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopy();
    }
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

  const toggleBatchExpansion = (batchKey: string) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchKey)) {
        newSet.delete(batchKey);
      } else {
        newSet.add(batchKey);
      }
      return newSet;
    });
  };

  const renderRatingButtons = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <motion.button
          key={rating}
          onClick={() => onRate?.(message.id, rating)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            message.rating === rating
              ? 'bg-yellow-100 text-yellow-600'
              : 'hover:bg-gray-100 text-gray-400'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Sparkles className="w-4 h-4" />
        </motion.button>
      ))}
    </div>
  );

  const renderBatchResponse = (batch: BatchResponse, topicId: string, batchIndex: number) => {
    const batchKey = `${topicId}-${batchIndex}`;
    const isExpanded = expandedBatches.has(batchKey);

    return (
      <div key={batchIndex} className="border border-gray-200 rounded-lg overflow-hidden">
        <motion.button
          onClick={() => toggleBatchExpansion(batchKey)}
          className="w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
        >
          <div>
            <span className="text-sm font-medium text-gray-700">
              Batch {batch.batch_index + 1}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {batch.chunks_count} chunks • {batch.sources.join(', ')}
            </p>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </motion.button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="prose prose-sm max-w-none text-gray-700">
                  {batch.content.split('\n').map((line, lineIndex) => (
                    <p key={lineIndex} className="mb-1 last:mb-0">{line}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderTopicAnalysis = (analysis: TopicAnalysis) => {
    const isExpanded = expandedTopics.has(analysis.topic_id);
    
    return (
      <div key={analysis.topic_id} className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50/30">
        <motion.button
          onClick={() => toggleTopicExpansion(analysis.topic_id)}
          className="w-full p-4 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-blue-900">{analysis.topic_name}</h4>
              <p className="text-sm text-blue-700">
                {(analysis.similarity_score * 100).toFixed(1)}% similarity • 
                {analysis.batches_processed} batches • 
                {analysis.sources.length} sources
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-blue-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-blue-600" />
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
              <div className="p-4 bg-white space-y-4">
                {/* Topic Description */}
                {analysis.topic_description && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h5 className="font-medium text-blue-900 mb-2">Description</h5>
                    <p className="text-sm text-blue-800">{analysis.topic_description}</p>
                  </div>
                )}
                
                {/* Topic Summary */}
                <div className="bg-green-50 rounded-lg p-3">
                  <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Analysis Summary
                  </h5>
                  <div className="prose prose-sm max-w-none text-green-800">
                    {analysis.topic_summary.split('\n').map((line, index) => (
                      <p key={index} className="mb-1 last:mb-0">{line}</p>
                    ))}
                  </div>
                </div>
                
                {/* Detailed Batch Analyses */}
                {analysis.raw_responses && analysis.raw_responses.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Detailed Analysis ({analysis.raw_responses.length} batches)
                    </h5>
                    <div className="space-y-2">
                      {analysis.raw_responses.map((batch, index) => 
                        renderBatchResponse(batch, analysis.topic_id, index)
                      )}
                    </div>
                  </div>
                )}
                
                {/* Sources */}
                <div className="border-t pt-3">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Sources ({analysis.sources.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.sources.map((source, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
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

  if (message.type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end mb-4"
      >
        <div className="max-w-[80%] bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl px-4 py-3 shadow-lg">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 space-y-4">
          {/* Main Response */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm">
            <div className="prose prose-sm max-w-none text-gray-800">
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-2 last:mb-0 leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
            
            {/* Message Actions */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200/50">
              <div className="flex items-center gap-2">
                {/* Processing Stats */}
                {message.processingTime && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{message.processingTime}ms</span>
                  </div>
                )}
                
                {message.topicAnalyses && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Target className="w-3 h-3" />
                    <span>{message.topicAnalyses.length} topics</span>
                  </div>
                )}
                
                {message.sources && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FileText className="w-3 h-3" />
                    <span>{message.sources.length} sources</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </motion.button>
                
                <motion.button
                  onClick={handleShare}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 className="w-4 h-4 text-gray-500" />
                </motion.button>
                
                {onExportAnalysis && message.topicAnalyses && (
                  <motion.button
                    onClick={() => onExportAnalysis(message.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-4 h-4 text-gray-500" />
                  </motion.button>
                )}
                
                <div className="relative">
                  <motion.button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showActions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 min-w-[140px]"
                      >
                        {onRegenerate && (
                          <button
                            onClick={() => {
                              onRegenerate(message.id);
                              setShowActions(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Regenerate
                          </button>
                        )}
                        {onRate && (
                          <div className="border-t pt-2 mt-2">
                            <span className="text-xs text-gray-500 px-3 mb-1 block">Rate this response:</span>
                            {renderRatingButtons()}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* AI Reasoning Section */}
          {message.reasoning && (
            <div className="bg-purple-50 rounded-lg border border-purple-200">
              <motion.button
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full p-3 flex items-center justify-between hover:bg-purple-100 transition-colors"
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
                            <p key={index} className="mb-2 last:mb-0 leading-relaxed">
                              {line}
                            </p>
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
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Topic Analysis ({message.topicAnalyses.length} topics)
                </h4>
                {onExportAnalysis && (
                  <motion.button
                    onClick={() => onExportAnalysis(message.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Download className="w-3 h-3" />
                    Export Analysis
                  </motion.button>
                )}
              </div>
              <div className="space-y-3">
                {message.topicAnalyses.map(renderTopicAnalysis)}
              </div>
            </div>
          )}

          {/* Sources Summary */}
          {message.sources && message.sources.length > 0 && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Sources Referenced ({message.sources.length})
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
      </div>
    </motion.div>
  );
};

export default MessageBubble;