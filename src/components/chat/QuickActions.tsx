// components/chat/QuickActions.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  BarChart3, 
  Search, 
  Lightbulb,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

interface QuickActionsProps {
  onActionClick: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const actions = [
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
      id: 'search',
      label: 'Find',
      icon: Search,
      prompt: 'Help me find specific information about',
      color: 'green'
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: Lightbulb,
      prompt: 'What insights can you derive from my documents?',
      color: 'yellow'
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: TrendingUp,
      prompt: 'What trends do you see in my document collection?',
      color: 'indigo'
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      prompt: 'Can you re-analyze my documents with fresh perspective?',
      color: 'gray'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
      green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200',
      indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
      gray: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="px-6 py-4 bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Lightbulb className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-700">Quick Actions</span>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              onClick={() => onActionClick(action.id)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${getColorClasses(action.color)}`}
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
  );
};

export default QuickActions;