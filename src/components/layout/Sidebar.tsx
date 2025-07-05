// components/layout/Sidebar.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Database, Activity, TrendingUp, Tag, BarChart3, AlertCircle } from 'lucide-react';
import { DashboardStats } from '@/types'; 

type ActiveTab = 'chat' | 'upload' | 'topics' | 'analytics' | 'settings';

interface NavigationItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  badge?: number | string | null;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  stats: DashboardStats;
  notifications?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  navigationItems, 
  activeTab, 
  onTabChange, 
  stats,
  notifications = []
}) => {
  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive 
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/50' 
        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/50',
      green: isActive 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/50' 
        : 'text-gray-600 hover:text-green-700 hover:bg-green-50/50',
      purple: isActive 
        ? 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-purple-200/50' 
        : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50/50',
      orange: isActive 
        ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200/50' 
        : 'text-gray-600 hover:text-orange-700 hover:bg-orange-50/50',
      gray: isActive 
        ? 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200/50' 
        : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50/50',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getIconColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'text-blue-600' : 'text-gray-400',
      green: isActive ? 'text-green-600' : 'text-gray-400',
      purple: isActive ? 'text-purple-600' : 'text-gray-400',
      orange: isActive ? 'text-orange-600' : 'text-gray-400',
      gray: isActive ? 'text-gray-600' : 'text-gray-400',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-700 bg-green-100';
      case 'warning':
        return 'text-yellow-700 bg-yellow-100';
      case 'error':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getBadgeClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700',
      orange: 'bg-orange-100 text-orange-700',
      gray: 'bg-gray-100 text-gray-700',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <motion.div
      initial={false}
      animate={{ x: isOpen ? 0 : -288 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 lg:translate-x-0"
    >
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
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive ? 'border shadow-sm' : ''
              } ${getColorClasses(item.color, isActive)}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`p-2 rounded-lg transition-colors ${
                isActive 
                  ? `bg-${item.color}-100` 
                  : `group-hover:bg-${item.color}-50 bg-gray-100`
              }`}>
                <Icon className={`w-4 h-4 ${getIconColorClasses(item.color, isActive)}`} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs opacity-75 mt-0.5">{item.description}</div>
              </div>
              
              {/* Badge for counts */}
              {item.badge !== null && item.badge !== undefined && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.badge === '!' 
                    ? 'bg-red-100 text-red-700' 
                    : getBadgeClasses(item.color)
                }`}>
                  {item.badge}
                </div>
              )}
              
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

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200/50 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Alerts</span>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {notifications.slice(0, 3).map((notification, index) => (
              <div key={index} className="text-xs text-amber-700 bg-amber-100/50 border border-amber-200 rounded-lg p-2">
                {notification}
              </div>
            ))}
          </div>
          {notifications.length > 3 && (
            <div className="text-xs text-amber-600 mt-1">
              +{notifications.length - 3} more notifications
            </div>
          )}
        </div>
      )}

      {/* Enhanced Stats Section */}
      <div className="px-4 py-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          System Overview
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Documents Stats */}
          <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-gray-600">Documents</span>
            </div>
            <div className="font-bold text-lg text-gray-900">{stats.documents.total}</div>
            <div className="text-xs space-y-0.5">
              <div className="text-green-600">{stats.documents.processed} processed</div>
              {stats.documents.processing > 0 && (
                <div className="text-yellow-600">{stats.documents.processing} processing</div>
              )}
              {stats.documents.errors > 0 && (
                <div className="text-red-600">{stats.documents.errors} errors</div>
              )}
            </div>
          </div>
          
          {/* Topics Stats */}
          <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-600">Topics</span>
            </div>
            <div className="font-bold text-lg text-gray-900">{stats.topics.total}</div>
            <div className="text-xs text-purple-600">
              {stats.topics.categories} categories
            </div>
          </div>
          
          {/* Queries Stats */}
          <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs text-gray-600">Queries</span>
            </div>
            <div className="font-bold text-lg text-gray-900">{stats.queries.total.toLocaleString()}</div>
            <div className="text-xs text-blue-600">
              {stats.queries.avgResponseTime ? `${stats.queries.avgResponseTime}ms avg` : 'Real-time'}
            </div>
          </div>
          
          {/* Analytics Stats */}
          <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-3 h-3 text-orange-600" />
              <span className="text-xs text-gray-600">Analytics</span>
            </div>
            <div className="font-bold text-lg text-gray-900">
              {Math.round((stats.documents.processed / Math.max(stats.documents.total, 1)) * 100)}%
            </div>
            <div className="text-xs text-orange-600">success rate</div>
          </div>
        </div>

        {/* System Health Indicator */}
        <div className="mt-3 p-3 bg-white/80 rounded-lg border border-gray-200/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">System Health</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${getHealthStatusColor(stats.system.status).split(' ')[1]}`}></div>
              <span className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${getHealthStatusColor(stats.system.status)}`}>
                {stats.system.status}
              </span>
            </div>
          </div>
          
          {/* Processing indicators */}
          {(stats.documents.processing > 0 || stats.documents.errors > 0) && (
            <div className="mt-2 pt-2 border-t border-gray-200/50">
              <div className="flex justify-between text-xs">
                {stats.documents.processing > 0 && (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                    {stats.documents.processing} processing
                  </span>
                )}
                {stats.documents.errors > 0 && (
                  <span className="text-red-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {stats.documents.errors} errors
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200/50 bg-white/50">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Made with ❤️ by AI
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Version 2.0.0 • Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;