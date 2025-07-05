// hooks/useDocuments.ts
import { useState, useEffect, useCallback } from 'react';
import { documentApi } from '@/services/api';
import toast from 'react-hot-toast';
import { Document } from '@/types/index';

// API Response type
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  documents?: T;
  document?: Document;
  error?: string;
  message?: string;
}

// Return type for the hook
interface UseDocumentsReturn {
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


export const useDocuments = (): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load documents on mount
  useEffect(() => {
    refreshDocuments();
  }, []);

  const refreshDocuments = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await documentApi.getDocuments();
    
    if (response.data.success) {
      // FIXED: Properly handle the response structure
      const documentsData: Document[] = response.data.documents || [];
      setDocuments(documentsData); // ✅ No more red underline!
    } else {
      throw new Error(response.data.error || 'Failed to fetch documents');
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch documents';
    setError(errorMessage);
    console.error('Error fetching documents:', error);
  } finally {
    setIsLoading(false);
  }
}, []);

  const uploadDocument = useCallback(async (file: File): Promise<Document | null> => {
    if (!file) {
      toast.error('No file selected');
      return null;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 50MB limit');
      return null;
    }

    // Validate file type
    const allowedTypes = ['pdf', 'docx', 'txt', 'pptx'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      toast.error(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
      return null;
    }

    setIsLoading(true);
    
    try {
      const response = await documentApi.uploadDocument(file);
      
      if (response.data.success) {
        // FIXED: Now properly typed - no type conversion needed
        const newDocument = response.data.document as Document;

        setDocuments(prev => [newDocument, ...prev]);
        toast.success(`"${file.name}" uploaded successfully`);
        return newDocument; // Returns unified Document type
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      toast.error(errorMessage);
      console.error('Upload error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processDocument = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Update document status to processing optimistically
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === id ? { ...doc, status: 'processing' as const } : doc
        )
      );

      const response = await documentApi.reprocessDocument(id);
      
      if (response.data.success) {
        // Refresh documents to get updated status
        await refreshDocuments();
        toast.success('Document processed successfully');
        return true;
      } else {
        throw new Error(response.data.error || 'Processing failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Processing failed';
      toast.error(errorMessage);
      console.error('Processing error:', error);
      
      // Revert status on error
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === id ? { ...doc, status: 'error' as const } : doc
        )
      );
      
      return false;
    }
  }, [refreshDocuments]);

  const reprocessDocument = useCallback(async (id: string): Promise<boolean> => {
    try {
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === id ? { ...doc, status: 'processing' as const } : doc
        )
      );

      const response = await documentApi.reprocessDocument(id);
      
      if (response.data.success) {
        await refreshDocuments();
        toast.success('Document reprocessed successfully');
        return true;
      } else {
        throw new Error(response.data.error || 'Reprocessing failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Reprocessing failed';
      toast.error(errorMessage);
      console.error('Reprocessing error:', error);
      
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === id ? { ...doc, status: 'error' as const } : doc
        )
      );
      
      return false;
    }
  }, [refreshDocuments]);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    const documentToDelete = documents.find(doc => doc.id === id);
    
    if (!documentToDelete) {
      toast.error('Document not found');
      return false;
    }

    try {
      const response = await documentApi.deleteDocument(id);
      
      if (response.data.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        toast.success(`"${documentToDelete.filename}" deleted successfully`);
        return true;
      } else {
        throw new Error(response.data.error || 'Deletion failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Deletion failed';
      toast.error(errorMessage);
      console.error('Deletion error:', error);
      return false;
    }
  }, [documents]);

  const batchDeleteDocuments = useCallback(async (ids: string[]): Promise<{ success: number; failed: number }> => {
  if (ids.length === 0) {
    toast.error('No documents selected');
    return { success: 0, failed: 0 };
  }

  try {
    const response = await documentApi.batchDeleteDocuments(ids);
    
    if (response.data.success) {
      // Remove successfully deleted documents from state
      setDocuments(prev => prev.filter(doc => !ids.includes(doc.id)));
      
      // Handle detailed response if available
      const summary = response.data.summary;
      if (summary) {
        toast.success(`${summary.successful_deletions} documents deleted successfully`);
        return { 
          success: summary.successful_deletions, 
          failed: summary.failed_deletions 
        };
      } else {
        toast.success(`${ids.length} document${ids.length > 1 ? 's' : ''} deleted successfully`);
        return { success: ids.length, failed: 0 };
      }
    } else {
      throw new Error(response.data.error || 'Batch deletion failed');
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Batch deletion failed';
    toast.error(errorMessage);
    console.error('Batch deletion error:', error);
    return { success: 0, failed: ids.length };
  }
}, []);

  const downloadDocument = useCallback(async (id: string): Promise<boolean> => {
    const document = documents.find(doc => doc.id === id);
    
    if (!document) {
      toast.error('Document not found');
      return false;
    }

    try {
      // Create a simple download by opening the file URL
      // This is a placeholder - you'll need to implement actual download logic
      toast.success('Download functionality not implemented yet');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Download failed';
      toast.error(errorMessage);
      console.error('Download error:', error);
      return false;
    }
  }, [documents]);

  const getDocumentById = useCallback((id: string): Document | undefined => {
    return documents.find(doc => doc.id === id);
  }, [documents]);

  const getDocumentsByStatus = useCallback((status: Document['status']): Document[] => {
    return documents.filter(doc => doc.status === status);
  }, [documents]);

  const getDocumentStats = useCallback(() => {
    const total = documents.length;
    const processed = documents.filter(doc => doc.status === 'processed').length;
    const processing = documents.filter(doc => doc.status === 'processing').length;
    const uploaded = documents.filter(doc => doc.status === 'uploaded').length;
    const errors = documents.filter(doc => doc.status === 'error').length;
    
    return {
      total,
      processed,
      processing,
      uploaded,
      errors,
      successRate: total > 0 ? Math.round((processed / total) * 100) : 0
    };
  }, [documents]);

  return {
    documents,
    isLoading,
    error,
    uploadDocument,
    processDocument,
    reprocessDocument,
    deleteDocument,
    batchDeleteDocuments,
    downloadDocument,
    refreshDocuments,
    getDocumentById,
    getDocumentsByStatus,
    getDocumentStats,
  };
};