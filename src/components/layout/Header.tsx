// components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Settings, 
  ChevronDown,
  HelpCircle,
  LogOut,
  Sparkles
} from 'lucide-react';

type ActiveTab = 'chat' | 'upload' | 'analytics' | 'settings';

interface NavigationItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
  activeTab: ActiveTab;
  navigationItems: NavigationItem[];
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onSearchClick, 
  activeTab, 
  navigationItems 
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const currentTab = navigationItems.find(item => item.id === activeTab);
  
  const notifications = [
    {
      id: 1,
      title: "Document processed",
      message: "Your latest upload has been successfully analyzed",
      time: "2 min ago",
      type: "success"
    },
    {
      id: 2,
      title: "System update",
      message: "RAG System has been updated to version 2.0.0",
      time: "1 hour ago",
      type: "info"
    },
    {
      id: 3,
      title: "Query performance",
      message: "Response time improved by 15% this week",
      time: "3 hours ago",
      type: "success"
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'info':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
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
              onClick={onSearchClick}
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
            {/* AI Assistant Badge */}
            <motion.div 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full border border-purple-200/50"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">AI Active</span>
            </motion.div>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200/50 z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Help */}
            <motion.button
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <HelpCircle className="w-5 h-5" />
            </motion.button>

            {/* Profile Dropdown */}
            <div className="relative">
              <motion.button
                onClick={() => setProfileOpen(!profileOpen)}
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

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200/50 z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-medium text-gray-900">John Doe</p>
                      <p className="text-sm text-gray-500">john.doe@example.com</p>
                    </div>
                    <div className="py-2">
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Profile Settings</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Preferences</span>
                      </button>
                    </div>
                    <div className="py-2 border-t border-gray-100">
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-red-600">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;