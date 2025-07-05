// components/analytics/TopicChart.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface TopicData {
  name: string;
  chunk_count: number;
  avg_relevance: number;
  category?: string;
}

interface TopicChartProps {
  data: TopicData[];
  title?: string;
  type?: 'bar' | 'pie';
  height?: number;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  '#EC4899', '#6366F1'
];

const TopicChart: React.FC<TopicChartProps> = ({ 
  data, 
  title = "Topics by Content Volume", 
  type = 'bar',
  height = 300 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="card-modern p-6">
        <div className="flex items-center gap-3 mb-6">
          {type === 'bar' ? (
            <BarChart3 className="w-5 h-5 text-blue-600" />
          ) : (
            <PieChartIcon className="w-5 h-5 text-purple-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
              {type === 'bar' ? (
                <BarChart3 className="w-6 h-6 text-gray-400" />
              ) : (
                <PieChartIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <p className="font-medium text-gray-700">No topic data available</p>
            <p className="text-sm text-gray-500 mt-1">Upload documents to see topic analysis</p>
          </div>
        </div>
      </div>
    );
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12, fill: '#64748b' }}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip 
          formatter={(value, name) => [value, name === 'chunk_count' ? 'Content Chunks' : 'Avg Relevance']}
          labelFormatter={(label) => `Topic: ${label}`}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Bar 
          dataKey="chunk_count" 
          fill="url(#barGradient)" 
          name="Content Chunks"
          radius={[4, 4, 0, 0]}
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data.slice(0, 8)}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name.length > 15 ? name.substring(0, 15) + '...' : name} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={Math.min(height * 0.3, 120)}
          fill="#8884d8"
          dataKey="chunk_count"
          paddingAngle={2}
        >
          {data.slice(0, 8).map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [value, 'Content Chunks']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const totalTopics = data.length;
  const avgContent = data.reduce((sum, topic) => sum + topic.chunk_count, 0) / data.length;
  const topTopic = data.reduce((max, topic) => topic.chunk_count > max.chunk_count ? topic : max, data[0]);

  return (
    <motion.div
      className="card-modern p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {type === 'bar' ? (
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          ) : (
            <div className="p-2 bg-purple-50 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">+12% this week</span>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        {type === 'bar' ? renderBarChart() : renderPieChart()}
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalTopics}</div>
          <div className="text-sm text-gray-500">Total Topics</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{avgContent.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Avg Content</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{topTopic?.chunk_count || 0}</div>
          <div className="text-sm text-gray-500">Top Topic</div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopicChart;