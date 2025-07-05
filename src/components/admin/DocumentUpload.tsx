'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Trash2,
  FileText,
  Image,
  Archive,
  AlertCircle,
  Cloud,
  Zap,
  Clock,
  Eye,
  Download,
  X,
  Hash,
  RotateCcw,
  Trash,
  RefreshCw
} from 'lucide-react';
import { documentApi } from '@/services/api';
import { Document } from '@/types';
import DocumentChunksViewer from './DocumentChunksViewer';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
  onDocumentUploaded: (document: Document) => void;
  documents: Document[];
  onDocumentDeleted: (documentId: string) => void;
  onDocumentsRefresh: () => void;
}

interface ProcessingTimer {
  documentId: string;
  startTime: Date;
  elapsed: number;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onDocumentUploaded,
  documents,
  onDocumentDeleted,
  onDocumentsRefresh,
}) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [reprocessing, setReprocessing] = useState<Set<string>>(new Set());
  const [processingTimers, setProcessingTimers] = useState<Map<string, ProcessingTimer>>(new Map());
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [showChunks, setShowChunks] = useState(false);
  const [selectedDocumentForChunks, setSelectedDocumentForChunks] = useState<Document | null>(null);
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Timer effect for processing documents
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessingTimers(prev => {
        const updated = new Map(prev);
        updated.forEach((timer, documentId) => {
          const elapsed = Date.now() - timer.startTime.getTime();
          updated.set(documentId, { ...timer, elapsed });
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.forEach(interval => clearInterval(interval));
    };
  }, [pollingIntervals]);

  // Helper function to start polling for document status
  // Helper function to start polling for document status
const startPolling = (documentId: string, isReprocessing = false) => {
  const pollStatus = async () => {
    try {
      // Get the current document to check its status
      onDocumentsRefresh(); // This call updates the `documents` prop from the parent

      // Find the document in the *current* list
      const currentDocument = documents.find(d => d.id === documentId);

      if (currentDocument && (currentDocument.status === 'processed' || currentDocument.status === 'error')) {
        // Processing completed, stop polling and cleanup
        stopPolling(documentId, isReprocessing); // This stops the timer
      }
    } catch (error) {
      console.error('Error polling document status:', error);
    }
  };

  // Poll every 3 seconds
  const intervalId = setInterval(pollStatus, 3000);
  setPollingIntervals(prev => new Map(prev).set(documentId, intervalId));
};

  // Helper function to stop polling and cleanup
  const stopPolling = (documentId: string, isReprocessing = false) => {
    // Clear polling interval
    const intervalId = pollingIntervals.get(documentId);
    if (intervalId) {
      clearInterval(intervalId);
      setPollingIntervals(prev => {
        const updated = new Map(prev);
        updated.delete(documentId);
        return updated;
      });
    }

    // Remove from processing/reprocessing sets
    if (isReprocessing) {
      setReprocessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    } else {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }

    // Remove timer
    setProcessingTimers(prev => {
      const updated = new Map(prev);
      updated.delete(documentId);
      return updated;
    });

    // Show completion notification
    const currentDocument = documents.find(d => d.id === documentId);
    if (currentDocument) {
      if (currentDocument.status === 'processed') {
        toast.success(`${isReprocessing ? 'Reprocessing' : 'Processing'} completed: ${currentDocument.filename}`);
      } else if (currentDocument.status === 'error') {
        toast.error(`${isReprocessing ? 'Reprocessing' : 'Processing'} failed: ${currentDocument.filename}`);
      }
    }
  };

  // Effect to monitor document status changes and stop polling when needed
  useEffect(() => {
    documents.forEach(document => {
      const isBeingProcessed = processing.has(document.id);
      const isBeingReprocessed = reprocessing.has(document.id);
      
      if ((isBeingProcessed || isBeingReprocessed) && 
          (document.status === 'processed' || document.status === 'error')) {
        stopPolling(document.id, isBeingReprocessed);
      }
    });
  }, [documents, processing, reprocessing]);

  const formatTimer = (elapsed: number) => {
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  interface UploadProgress {
  [key: string]: number; // This allows any string key
}

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
  setUploading(true);

  try {
    for (const file of acceptedFiles) {
      const fileId = `temp-${Date.now()}-${Math.random()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      // Progress simulation (no changes here)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          if (currentProgress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [fileId]: currentProgress + 10 };
        });
      }, 200);

      try {
        const res = await documentApi.uploadDocument(file as File);
        clearInterval(progressInterval);

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

        if (res.data.success && res.data.document) {
          const newDocument = res.data.document; // Renamed to avoid confusion
          onDocumentUploaded(newDocument);
          toast.success(`${file.name} uploaded successfully`);

          if (newDocument.status === 'uploaded') {
            // Immediately call processDocument with the ID
            // It's safer to not use a timeout here unless necessary
            processDocument(newDocument.id); 
          }
        } else {
          throw new Error(res.data.error || 'Upload failed');
        }
      } catch (uploadError: any) {
        clearInterval(progressInterval);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

        console.error('Upload error:', uploadError);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  } catch (error: any) {
    console.error('Batch upload error:', error);
    toast.error('Failed to upload documents');
  } finally {
    setUploading(false);
  }
}, [onDocumentUploaded]);

  const processDocument = async (documentId: string) => {
  // Prevent multiple simultaneous processing requests
  if (processing.has(documentId)) {
    console.log('Document is already being processed:', documentId);
    return;
  }

  setProcessing(prev => new Set(prev).add(documentId));
  
  // Start timer
  setProcessingTimers(prev => new Map(prev).set(documentId, {
    documentId,
    startTime: new Date(),
    elapsed: 0
  }));
  
  try {
    // Use the correct processDocument API method for initial processing
    const response = await documentApi.processDocument(documentId);
    
    if (response.data.success) {
      toast.success('Document processing started');
      
      // Start polling for status updates
      startPolling(documentId, false);
    } else {
      throw new Error(response.data.error || 'Failed to start processing');
    }
    
  } catch (error: any) {
    console.error('Processing error:', error);
    toast.error(`Failed to start document processing: ${error.response?.data?.message || error.message}`);
    
    // Cleanup on error
    setProcessing(prev => {
      const newSet = new Set(prev);
      newSet.delete(documentId);
      return newSet;
    });
    
    setProcessingTimers(prev => {
      const updated = new Map(prev);
      updated.delete(documentId);
      return updated;
    });
  }
};

  const reprocessDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to reprocess this document? This will delete existing chunks and topics.')) {
      return;
    }
    
    setLoadingActions(prev => new Set(prev).add(`reprocess-${documentId}`));
    setReprocessing(prev => new Set(prev).add(documentId));
    
    // Start timer for reprocessing
    setProcessingTimers(prev => new Map(prev).set(documentId, {
      documentId,
      startTime: new Date(),
      elapsed: 0
    }));
    
    try {
      // Initiate reprocessing (async on backend)
      await documentApi.reprocessDocument(documentId);
      toast.success('Document reprocessing started');
      
      // Start polling for status updates
      startPolling(documentId, true);
      
    } catch (error: any) {
      toast.error('Failed to start document reprocessing');
      console.error('Reprocess error:', error);
      
      // Cleanup on error
      setReprocessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
      
      setProcessingTimers(prev => {
        const updated = new Map(prev);
        updated.delete(documentId);
        return updated;
      });
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`reprocess-${documentId}`);
        return newSet;
      });
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    setLoadingActions(prev => new Set(prev).add(`delete-${documentId}`));
    
    try {
      await documentApi.deleteDocument(documentId);
      onDocumentDeleted(documentId);
      toast.success('Document deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete document');
      console.error('Delete error:', error);
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`delete-${documentId}`);
        return newSet;
      });
    }
  };

  const bulkDeleteDocuments = async () => {
  if (selectedDocuments.size === 0) return;
  
  if (!confirm(`Are you sure you want to delete ${selectedDocuments.size} documents?`)) {
    return;
  }
  
  setLoadingActions(prev => new Set(prev).add('bulk-delete'));
  
  try {
    const documentIds = Array.from(selectedDocuments);
    
    // FIXED: batchDeleteDocuments now has correct TypeScript types
    const response = await documentApi.batchDeleteDocuments(documentIds);
    
    if (response.data.success) {
      documentIds.forEach(id => onDocumentDeleted(id));
      setSelectedDocuments(new Set());
      setShowBulkActions(false);
      
      // Handle detailed response if available
      if (response.data.summary) {
        const { successful_deletions, failed_deletions } = response.data.summary;
        if (failed_deletions > 0) {
          toast.success(`${successful_deletions} documents deleted successfully. ${failed_deletions} failed.`);
        } else {
          toast.success(`${successful_deletions} documents deleted successfully`);
        }
      } else {
        toast.success(`${documentIds.length} documents deleted successfully`);
      }
    } else {
      throw new Error(response.data.error || 'Batch deletion failed');
    }
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    toast.error(`Failed to delete documents: ${error.response?.data?.message || error.message}`);
  } finally {
    setLoadingActions(prev => {
      const newSet = new Set(prev);
      newSet.delete('bulk-delete');
      return newSet;
    });
  }
};

  const downloadDocument = async (document: Document) => {
  setLoadingActions(prev => new Set(prev).add(`download-${document.id}`));
  
  try {
    // FIXED: downloadDocument now has correct TypeScript types
    const response = await documentApi.downloadDocument(document.id);
    
    // Create blob and download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = document.filename;
    window.document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    window.document.body.removeChild(a);
    
    toast.success('Download started');
  } catch (error: any) {
    console.error('Download error:', error);
    toast.error(`Failed to download document: ${error.response?.data?.message || error.message}`);
  } finally {
    setLoadingActions(prev => {
      const newSet = new Set(prev);
      newSet.delete(`download-${document.id}`);
      return newSet;
    });
  }
};

  const viewChunks = (document: Document) => {
    setSelectedDocumentForChunks(document);
    setShowChunks(true);
  };

  const closeChunks = () => {
    setShowChunks(false);
    setSelectedDocumentForChunks(null);
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(documents.map(d => d.id)));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <File className="w-5 h-5 text-red-600" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'pptx':
      case 'ppt':
        return <Image className="w-5 h-5 text-orange-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string, documentId: string) => {
    if (processing.has(documentId) || reprocessing.has(documentId) || status === 'processing') {
      return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    }
    
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string, documentId: string) => {
    if (processing.has(documentId)) return 'Processing...';
    if (reprocessing.has(documentId)) return 'Reprocessing...';
    if (status === 'processing') return 'Processing...';
    
    switch (status) {
      case 'uploaded': return 'Ready to process';
      case 'processed': return 'Processed';
      case 'error': return 'Error occurred';
      default: return 'Unknown status';
    }
  };

  const getStatusColor = (status: string, documentId: string) => {
    if (processing.has(documentId) || reprocessing.has(documentId) || status === 'processing') {
      return 'status-processing';
    }
    
    switch (status) {
      case 'processed': return 'status-success';
      case 'error': return 'status-error';
      default: return 'status-warning';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const stats = {
    total: documents.length,
    processed: documents.filter(d => d.status === 'processed').length,
    processing: documents.filter(d => d.status === 'processing').length + processing.size + reprocessing.size,
    errors: documents.filter(d => d.status === 'error').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
          <p className="text-gray-600 mt-1">Upload and process documents for AI analysis</p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
            <div className="text-xs text-gray-500">Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
            <div className="text-xs text-gray-500">Processing</div>
          </div>
          {stats.errors > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <div className="text-xs text-gray-500">Errors</div>
            </div>
          )}
          <button
            onClick={onDocumentsRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh documents"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {uploading ? (
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            ) : (
              <Cloud className="w-10 h-10 text-blue-600" />
            )}
          </div>
        </div>
        
        {uploading ? (
          <div className="space-y-2">
            <p className="text-lg font-medium text-blue-600">Uploading files...</p>
            <div className="space-y-1">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : isDragActive ? (
          <div className="space-y-2">
            <p className="text-lg font-medium text-blue-600">Drop your files here</p>
            <p className="text-sm text-blue-500">Release to upload</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, DOCX, PPTX, TXT files up to 50MB
              </p>
            </div>
            
            <button className="btn-primary inline-flex items-center gap-2 hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
              Choose Files
            </button>
          </div>
        )}
        
        {/* Feature highlights */}
        <div className="flex items-center justify-center gap-8 mt-8 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>AI Processing</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Secure Upload</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Fast Analysis</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDocuments.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-blue-900">
                {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={bulkDeleteDocuments}
                disabled={loadingActions.has('bulk-delete')}
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                {loadingActions.has('bulk-delete') ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash className="w-4 h-4 mr-2" />
                )}
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedDocuments(new Set())}
                className="btn-ghost text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Documents List */}
      <div className="card-modern">
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Uploaded Documents ({documents.length})
            </h3>
            {documents.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedDocuments.size === documents.length && documents.length > 0}
                  onChange={selectAllDocuments}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Select all</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
              <p className="text-gray-500">Upload your first document to get started with AI analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {documents.map((document, index) => {
                  const timer = processingTimers.get(document.id);
                  const isCurrentlyProcessing = processing.has(document.id) || reprocessing.has(document.id);
                  
                  return (
                    <motion.div
                      key={document.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="group p-4 border border-gray-200/50 rounded-xl hover:shadow-md transition-all bg-white/50 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedDocuments.has(document.id)}
                          onChange={() => toggleDocumentSelection(document.id)}
                          className="rounded border-gray-300"
                        />
                        
                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          {getFileIcon(document.filename)}
                        </div>
                        
                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {document.filename}
                            </h4>
                            <span className={`${getStatusColor(document.status, document.id)}`}>
                              {getStatusText(document.status, document.id)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span>{formatFileSize(document.file_size)}</span>
                            {document.chunk_count && (
                              <span className="flex items-center gap-1">
                                <Archive className="w-3 h-3" />
                                {document.chunk_count} chunks
                              </span>
                            )}
                            {document.topic_count && (
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {document.topic_count} topics
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(document.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Processing Timer */}
                        {(timer && (processing.has(document.id) || reprocessing.has(document.id) || document.status === 'processing')) && (
                          <div className="flex-shrink-0">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                              {/* <div className="text-xs text-blue-600 font-medium mb-1">
                                {reprocessing.has(document.id) ? 'Reprocessing' : 'Processing'}
                              </div> */}
                              <div className="text-lg font-mono font-bold text-blue-700">
                                {formatTimer(timer.elapsed)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {getStatusIcon(document.status, document.id)}
                        </div>
                        
                        {/* Actions - Always visible */}
                        <div className="flex items-center gap-2">
                          {document.status === 'uploaded' && (
                            <button
                              onClick={() => processDocument(document.id)}
                              disabled={processing.has(document.id)}
                              className="btn-primary text-sm px-3 py-1.5 hover:scale-105 transition-transform"
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Process
                            </button>
                          )}
                          
                          {document.status === 'processed' && (
                            <>
                              <button
                                onClick={() => viewChunks(document)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors hover:scale-105"
                                title="View chunks"
                              >
                                <Hash className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => reprocessDocument(document.id)}
                                disabled={loadingActions.has(`reprocess-${document.id}`) || reprocessing.has(document.id)}
                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors hover:scale-105"
                                title="Reprocess document"
                              >
                                {loadingActions.has(`reprocess-${document.id}`) || reprocessing.has(document.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => downloadDocument(document)}
                            disabled={loadingActions.has(`download-${document.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hover:scale-105"
                            title="Download document"
                          >
                            {loadingActions.has(`download-${document.id}`) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => deleteDocument(document.id)}
                            disabled={loadingActions.has(`delete-${document.id}`)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:scale-105"
                          >
                            {loadingActions.has(`delete-${document.id}`) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Processing Progress with Timer */}
                      {(isCurrentlyProcessing || document.status === 'processing') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>
                                {reprocessing.has(document.id) ? 'Reanalyzing content...' : 'Analyzing content...'}
                              </span>
                              {timer && (
                                <span className="font-mono font-medium text-blue-600">
                                  {formatTimer(timer.elapsed)}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Error Message */}
                      {document.status === 'error' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              <span>Failed to process document. Please try uploading again.</span>
                            </div>
                            <button
                              onClick={() => reprocessDocument(document.id)}
                              disabled={loadingActions.has(`reprocess-${document.id}`) || reprocessing.has(document.id)}
                              className="btn-secondary text-sm px-3 py-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              {loadingActions.has(`reprocess-${document.id}`) || reprocessing.has(document.id) ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <RotateCcw className="w-3 h-3 mr-1" />
                              )}
                              Retry
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Document Chunks Viewer */}
      {selectedDocumentForChunks && (
        <DocumentChunksViewer
          document={selectedDocumentForChunks}
          isOpen={showChunks}
          onClose={closeChunks}
        />
      )}
    </div>
  );
};

export default DocumentUpload;