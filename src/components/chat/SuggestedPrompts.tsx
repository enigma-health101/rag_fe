// components/chat/SuggestedPrompts.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ prompts, onPromptClick }) => {
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">Try asking:</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prompts.map((prompt, index) => (
          <motion.button
            key={index}
            onClick={() => onPromptClick(prompt)}
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
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPrompts;