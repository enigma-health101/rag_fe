// components/layout/Layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Upload, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  Search,
  Bell,
  User,
  ChevronDown,
  Zap,
  Database,
  Activity
} from 'lucide-react';

type ActiveTab = 'chat' | 'upload' | 'analytics' | 'settings';

interface NavigationItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

interface Stats {
  totalDocuments: number;
  processedDocuments: number;
  totalQueries: number;
  systemHealth: string;
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  documents?: any[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange,
  documents = []
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navigationItems: NavigationItem[] = [
    { 
      id: 'chat', 
      label: 'Chat Assistant', 
      icon: MessageSquare,
      description: 'Interactive Q&A with your documents',
      color: 'blue'
    },
    { 
      id: 'upload', 
      label: 'Document Manager', 
      icon: Upload,
      description: 'Upload and manage your files',
      color: 'green'
    },
    { 
      id: 'analytics', 
      label: 'Analytics Hub', 
      icon: BarChart3,
      description: 'Insights and performance metrics',
      color: 'purple'
    },
    { 
      id: 'settings', 
      label: 'System Settings', 
      icon: Settings,
      description: 'Configure your application',
      color: 'gray'
    },
  ];

  const stats: Stats = {
    totalDocuments: documents.length,
    processedDocuments: documents.filter(d => d.status === 'processed').length,
    totalQueries: 1247, // This would come from your analytics
    systemHealth: 'excellent'
  };

  const currentTab = navigationItems.find(item => item.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 bg-white/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                RAG System
              </h1>
              <p className="text-xs text-gray-500">AI Knowledge Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive ? 'border shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive 
                    ? `bg-${item.color}-100` 
                    : `group-hover:bg-${item.color}-50 bg-gray-100`
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isActive ? `text-${item.color}-600` : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs opacity-75 mt-0.5">{item.description}</div>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-2 h-2 bg-current rounded-full opacity-60"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Stats Section */}
        <div className="px-4 py-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            System Overview
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-gray-600">Documents</span>
              </div>
              <div className="font-bold text-lg text-gray-900">{stats.totalDocuments}</div>
              <div className="text-xs text-green-600">
                {stats.processedDocuments} processed
              </div>
            </div>
            
            <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-green-600" />
                <span className="text-xs text-gray-600">Queries</span>
              </div>
              <div className="font-bold text-lg text-gray-900">{stats.totalQueries.toLocaleString()}</div>
              <div className="text-xs text-blue-600">+12% today</div>
            </div>
          </div>

          {/* System Health Indicator */}
          <div className="mt-3 p-3 bg-white/80 rounded-lg border border-gray-200/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">System Health</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 capitalize">{stats.systemHealth}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200/50 bg-white/50">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Made with ❤️ by AI
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Version 2.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Current Tab Info */}
                <div className="hidden lg:flex items-center gap-3">
                  {currentTab && (
                    <>
                      <div className={`p-2 rounded-lg bg-${currentTab.color}-50`}>
                        <currentTab.icon className={`w-5 h-5 text-${currentTab.color}-600`} />
                      </div>
                      <div>
                        <h1 className="text-lg font-semibold text-gray-900">
                          {currentTab.label}
                        </h1>
                        <p className="text-sm text-gray-500 hidden xl:block">
                          {currentTab.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Center Section - Search */}
              <div className="flex-1 max-w-xl mx-4">
                <motion.button
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-2 bg-gray-100/80 hover:bg-gray-200/80 rounded-xl transition-all duration-200 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-gray-500 group-hover:text-gray-700 text-sm">
                    Search documents, topics, or ask a question...
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs bg-white rounded border border-gray-300 text-gray-500">
                      ⌘
                    </kbd>
                    <kbd className="px-2 py-1 text-xs bg-white rounded border border-gray-300 text-gray-500">
                      K
                    </kbd>
                  </div>
                </motion.button>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2">
                {/* AI Status Badge */}
                <motion.div 
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full border border-purple-200/50"
                  whileHover={{ scale: 1.05 }}
                >
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">AI Active</span>
                </motion.div>

                {/* Notifications */}
                <motion.button
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </motion.button>

                {/* Profile */}
                <div className="relative">
                  <motion.button
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">John Doe</p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative">
          {/* Content Container */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="container-modern py-8 min-h-[calc(100vh-5rem)]"
          >
            {children}
          </motion.div>

          {/* Background Decoration */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl" />
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Search className="w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents, topics, or ask a question..."
                    className="flex-1 text-lg outline-none placeholder-gray-400"
                    autoFocus
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Searches</h3>
                    <div className="space-y-2">
                      {['Machine learning basics', 'API documentation', 'Data analysis methods'].map((search, index) => (
                        <button
                          key={index}
                          className="flex items-center gap-3 w-full p-3 text-left rounded-lg hover:bg-gray-50"
                        >
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;