import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Hash, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  Clock,
  Search,
  Filter,
  X,
  Loader2
} from 'lucide-react';
import { documentApi } from '@/services/api';
import toast from 'react-hot-toast';

import { Document, DocumentChunk } from '@/types'; 

interface DocumentChunksViewerProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentChunksViewer: React.FC<DocumentChunksViewerProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByTopic, setFilterByTopic] = useState<string>('all');
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadChunks();
    }
  }, [isOpen, document.id]);

  const loadChunks = async () => {
    try {
      setLoading(true);
      const response = await documentApi.getDocumentChunks(document.id);
      const chunksData: DocumentChunk[] = response.data.chunks || [];
      
      setChunks(chunksData);
      
      // Extract unique topics with better type handling
      const chunksWithTopics = chunksData.filter((chunk): chunk is DocumentChunk & { topic_name: string } => 
        chunk.topic_name != null && chunk.topic_name !== ''
      );
      
      const topicNames = chunksWithTopics.map(chunk => chunk.topic_name);
      const uniqueTopics = Array.from(new Set(topicNames));
      
      setTopics(['all', ...uniqueTopics]);
      
    } catch (error) {
      toast.error('Failed to load document chunks');
      console.error('Error loading chunks:', error);
      setChunks([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const toggleChunkExpansion = (chunkId: string) => {
    setExpandedChunks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chunkId)) {
        newSet.delete(chunkId);
      } else {
        newSet.add(chunkId);
      }
      return newSet;
    });
  };

  const filteredChunks = chunks.filter(chunk => {
    const matchesSearch = chunk.chunk_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = filterByTopic === 'all' || chunk.topic_name === filterByTopic;
    return matchesSearch && matchesTopic;
  });

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const highlightSearchText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-6xl max-h-[90vh] w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Document Chunks
              </h3>
              <p className="text-sm text-gray-500">
                {document.filename} • {chunks.length} chunks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search within chunks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterByTopic}
                onChange={(e) => setFilterByTopic(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {topics.map(topic => (
                  <option key={topic} value={topic}>
                    {topic === 'all' ? 'All Topics' : topic}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {filteredChunks.length !== chunks.length && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredChunks.length} of {chunks.length} chunks
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-240px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading chunks...</span>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterByTopic !== 'all' ? 'No matching chunks' : 'No chunks found'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || filterByTopic !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'This document hasn\'t been processed into chunks yet'
                }
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredChunks.map((chunk, index) => {
                    const isExpanded = expandedChunks.has(chunk.id);
                    
                    return (
                      <motion.div
                        key={chunk.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all"
                      >
                        {/* Chunk Header */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-gray-500" />
                              <span className="font-mono text-sm font-medium text-gray-700">
                                Chunk {chunk.chunk_index + 1}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{chunk.word_count} words</span>
                              
                              {chunk.topic_name && (
                                <div className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    {chunk.topic_name}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(chunk.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => toggleChunkExpansion(chunk.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            {isExpanded ? (
                              <>
                                <span>Collapse</span>
                                <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <span>Expand</span>
                                <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Chunk Content */}
                        <div className="p-4">
                          <div className="prose prose-sm max-w-none">
                            {isExpanded ? (
                              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {highlightSearchText(chunk.chunk_text, searchQuery)}
                              </div>
                            ) : (
                              <div className="text-gray-700 leading-relaxed">
                                {highlightSearchText(truncateText(chunk.chunk_text), searchQuery)}
                                {chunk.chunk_text.length > 200 && (
                                  <button
                                    onClick={() => toggleChunkExpansion(chunk.id)}
                                    className="text-blue-600 hover:text-blue-800 ml-2 font-medium"
                                  >
                                    Read more
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DocumentChunksViewer;