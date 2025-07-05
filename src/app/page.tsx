'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { documentApi, topicsApi, analyticsApi } from '@/services/api';
import { Document, DashboardStats } from '@/types';
import ChatInterface from '@/components/chat/ChatInterface';
import DocumentUpload from '@/components/admin/DocumentUpload';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import SystemStatus from '@/components/admin/SystemStatus';
import TopicManager from '@/components/admin/TopicManager';
import {
  MessageCircle,
  Upload,
  BarChart3,
  Settings,
  Tag,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';

type ActiveTab = 'chat' | 'upload' | 'topics' | 'analytics' | 'settings';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // State for additional stats not part of the main DashboardStats prop
  const [avgContentPerTopic, setAvgContentPerTopic] = useState(0);

  useEffect(() => {
    initializeDashboard();

    const interval = setInterval(() => {
      refreshStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDocuments(),
        loadDashboardStats()
      ]);
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await documentApi.getDocumentsSummary();
      setDocuments(response.data.summary?.documents || []);

      const errorDocs = response.data.summary?.documents?.filter((doc: Document) => doc.status === 'error') || [];
      if (errorDocs.length > 0) {
        setNotifications(prev => [
          ...prev.filter(n => !n.includes('processing errors')),
          `${errorDocs.length} documents have processing errors`
        ]);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const [docsResponse, topicsResponse, systemResponse] = await Promise.all([
        documentApi.getDocumentsSummary(),
        topicsApi.getTopicStatistics(),
        analyticsApi.getSystemHealth()
      ]);

      const docSummary = docsResponse.data.summary;
      const topicData = topicsResponse.data.data;
      const systemHealth = systemResponse.data.health;

      const stats: DashboardStats = {
        documents: {
          total: docSummary?.total_documents || 0,
          processed: docSummary?.processed_documents || 0,
          processing: (docSummary?.total_documents || 0) - (docSummary?.processed_documents || 0),
          errors: docSummary?.documents?.filter((d: Document) => d.status === 'error').length || 0
        },
        topics: {
          total: topicData?.total_topics || 0,
          categories: topicData?.total_categories || 0
        },
        system: {
          status: systemHealth?.system_status || 'unknown'
        },
        queries: { // Assuming these are placeholders for now as per original code
            total: 0, 
            avgResponseTime: 0
        }
      };

      setDashboardStats(stats);
      setAvgContentPerTopic(topicData?.avg_content_per_topic || 0);

      const newNotifications = [];
      if (stats.documents.errors > 0) {
        newNotifications.push(`${stats.documents.errors} documents need attention`);
      }
      if (stats.system.status !== 'healthy') {
        newNotifications.push(`System status: ${stats.system.status}`);
      }
      if (stats.documents.processing > 0) {
        newNotifications.push(`${stats.documents.processing} documents currently processing`);
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const refreshStats = async () => {
    try {
      await loadDashboardStats();
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  const handleDocumentUploaded = (document: Document) => {
    setDocuments(prev => [document, ...prev]);
    refreshStats();
    toast.success(`${document.filename} uploaded successfully`);
  };

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    refreshStats();
  };

  const handleDocumentsRefresh = () => {
    loadDocuments();
    refreshStats();
  };

  const getActiveComponent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'upload':
        return (
          <DocumentUpload
            documents={documents}
            onDocumentUploaded={handleDocumentUploaded}
            onDocumentDeleted={handleDocumentDeleted}
            onDocumentsRefresh={handleDocumentsRefresh}
          />
        );
      case 'topics':
        return <TopicManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'settings':
        return <SystemStatus />;
      default:
        return <ChatInterface />;
    }
  };

  const tabColorStyles: { [key: string]: { active: string; badge: string } } = {
    blue: {
      active: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200/50 shadow-sm',
      badge: 'bg-blue-100 text-blue-700',
    },
    green: {
      active: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200/50 shadow-sm',
      badge: 'bg-green-100 text-green-700',
    },
    purple: {
      active: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200/50 shadow-sm',
      badge: 'bg-purple-100 text-purple-700',
    },
    orange: {
      active: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200/50 shadow-sm',
      badge: 'bg-orange-100 text-orange-700',
    },
    gray: {
      active: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200/50 shadow-sm',
      badge: 'bg-gray-100 text-gray-700',
    },
  };

  const getTabInfo = (tabId: ActiveTab) => {
    const tabConfig = {
      chat: { label: 'Chat Assistant', icon: MessageCircle, desc: 'Interactive Q&A', color: 'blue', badge: null },
      upload: { label: 'Documents', icon: Upload, desc: 'Manage files', color: 'green', badge: dashboardStats?.documents.processing || 0 },
      topics: { label: 'Topics', icon: Tag, desc: 'Knowledge graph', color: 'purple', badge: dashboardStats?.topics.total || 0 },
      analytics: { label: 'Analytics', icon: BarChart3, desc: 'Insights & metrics', color: 'orange', badge: null },
      settings: { label: 'System', icon: Settings, desc: 'Configuration', color: 'gray', badge: dashboardStats?.system.status !== 'healthy' ? '!' : null }
    };
    return tabConfig[tabId];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading RAG System</h2>
          <p className="text-gray-600">Initializing your AI knowledge assistant...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="flex">
        <div className="w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 min-h-screen">
          <div className="flex items-center gap-3 p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">RAG System</h1>
              <p className="text-xs text-gray-500">AI Knowledge Assistant</p>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {(['chat', 'upload', 'topics', 'analytics', 'settings'] as ActiveTab[]).map((tabId) => {
              const tabInfo = getTabInfo(tabId);
              const IconComponent = tabInfo.icon;
              const activeClasses = tabColorStyles[tabInfo.color]?.active || tabColorStyles.gray.active;
              const badgeClasses = tabColorStyles[tabInfo.color]?.badge || tabColorStyles.gray.badge;

              return (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${activeTab === tabId ? activeClasses : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'}`}
                >
                  <div className={`text-lg ${activeTab === tabId ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{tabInfo.label}</div>
                    <div className="text-xs opacity-75">{tabInfo.desc}</div>
                  </div>
                  {tabInfo.badge ? (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${tabInfo.badge === '!' ? 'bg-red-100 text-red-700' : badgeClasses}`}>
                      {tabInfo.badge}
                    </div>
                  ) : null}
                   {activeTab === tabId && <div className="w-2 h-2 bg-current rounded-full opacity-60" />}
                </button>
              );
            })}
          </nav>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200/50">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Notifications</span>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-2">{notification}</div>
                ))}
              </div>
            </div>
          )}

          {dashboardStats && (
            <div className="p-4 border-t border-gray-200/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
                  <div className="text-xs text-gray-600 mb-1">Documents</div>
                  <div className="font-bold text-lg text-gray-900">{dashboardStats.documents.total}</div>
                  <div className="text-xs text-green-600">{dashboardStats.documents.processed} processed</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
                  <div className="text-xs text-gray-600 mb-1">Topics</div>
                  <div className="font-bold text-lg text-gray-900">{dashboardStats.topics.total}</div>
                  <div className="text-xs text-purple-600">{dashboardStats.topics.categories} categories</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50 col-span-2">
                  <div className="text-xs text-gray-600 mb-1">System Status</div>
                  <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dashboardStats.system.status)}`}>
                    <div className="w-2 h-2 bg-current rounded-full"></div>
                    <span className="capitalize">{dashboardStats.system.status}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gray-200/50">
            <div className="text-xs text-gray-600 mb-3">Quick Actions</div>
            <div className="space-y-2">
              <button onClick={() => setActiveTab('upload')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><Plus className="w-3 h-3" />Upload Document</button>
              <button onClick={() => setActiveTab('topics')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><Tag className="w-3 h-3" />Manage Topics</button>
              <button onClick={() => setActiveTab('analytics')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"><TrendingUp className="w-3 h-3" />View Analytics</button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
            <div className="flex items-center justify-between p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{getTabInfo(activeTab).label}</h2>
                <p className="text-gray-600 mt-1">
                  {activeTab === 'chat' && 'Interactive Q&A with your documents'}
                  {activeTab === 'upload' && 'Upload and manage your knowledge base'}
                  {activeTab === 'topics' && 'Organize and optimize your knowledge graph'}
                  {activeTab === 'analytics' && 'Comprehensive insights and performance metrics'}
                  {activeTab === 'settings' && 'Configure your application settings'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {dashboardStats && (
                  <div className="flex items-center gap-3">
                    {dashboardStats.documents.processing > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-700">{dashboardStats.documents.processing} Processing</span>
                      </div>
                    )}
                    {dashboardStats.documents.errors > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full border border-red-200">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-700">{dashboardStats.documents.errors} Errors</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">AI Active</span>
                    </div>
                  </div>
                )}
                {(activeTab === 'topics' || activeTab === 'analytics') && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder={`Search ${activeTab}...`} className="input-modern pl-10 pr-4 py-2 w-64" />
                  </div>
                )}
              </div>
            </div>
            
            {activeTab === 'upload' && dashboardStats && (
              <div className="px-6 pb-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Total: <span className="font-medium">{dashboardStats.documents.total}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Processed: <span className="font-medium">{dashboardStats.documents.processed}</span></span>
                  </div>
                  {dashboardStats.documents.processing > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600">Processing: <span className="font-medium">{dashboardStats.documents.processing}</span></span>
                    </div>
                  )}
                  {dashboardStats.documents.errors > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">Errors: <span className="font-medium">{dashboardStats.documents.errors}</span></span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'topics' && dashboardStats && (
              <div className="px-6 pb-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Topics: <span className="font-medium">{dashboardStats.topics.total}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-gray-600">Categories: <span className="font-medium">{dashboardStats.topics.categories}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-gray-600">Avg Content: <span className="font-medium">{avgContentPerTopic.toFixed(1)}</span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <main className="p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              {getActiveComponent()}
            </motion.div>
          </main>
        </div>
      </div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-400/5 to-pink-400/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <style jsx global>{`
        .Toaster__toast {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .Toaster__toast--success { background: rgba(16, 185, 129, 0.95) !important; }
        .Toaster__toast--error { background: rgba(239, 68, 68, 0.95) !important; }
      `}</style>
    </div>
  );
};

export default Dashboard;