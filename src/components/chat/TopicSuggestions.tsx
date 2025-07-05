'use client';

import React from 'react';
import { Tag, TrendingUp, Clock } from 'lucide-react';
import { Topic } from '@/types';

interface TopicSuggestionsProps {
  topics: Topic[];
  onTopicClick: (topic: Topic) => void;
  className?: string;
}

const TopicSuggestions: React.FC<TopicSuggestionsProps> = ({
  topics,
  onTopicClick,
  className = ''
}) => {
  if (!topics || topics.length === 0) {
    return null;
  }

  const generateSampleQuestions = (topic: Topic) => {
    const questions = [
      `What is ${topic.name}?`,
      `Tell me more about ${topic.name}`,
      `How does ${topic.name} work?`,
      `Show me examples of ${topic.name}`,
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <TrendingUp className="w-4 h-4" />
        <span>Related topics you might want to explore:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {topics.slice(0, 6).map((topic) => (
          <button
            key={topic.id}
            onClick={() => onTopicClick(topic)}
            className="group flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-full text-sm transition-colors border border-blue-200 hover:border-blue-300"
          >
            <Tag className="w-3 h-3" />
            <span>{topic.name}</span>
            {(topic as any).content_count && (
              <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full">
                {(topic as any).content_count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        <span>Click on a topic to ask questions about it</span>
      </div>
    </div>
  );
};

export default TopicSuggestions;