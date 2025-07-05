'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, FileText, MessageSquare, Clock } from 'lucide-react';
// Correctly import the entire analyticsApi object
import { analyticsApi } from '@/services/api'; 

// Define an interface that matches the component's expected data structure
interface TopicOverview {
  total_topics: number;
  avg_keywords_per_topic: number;
  topics_with_many_keywords: number;
}

interface TopicContent {
  name: string;
  chunk_count: number;
}

interface QueryTrend {
  query_date: string;
  query_count: number;
}

interface DashboardData {
  topic_overview: TopicOverview;
  top_topics_by_content: TopicContent[];
  query_trends: QueryTrend[];
}


const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // --- FIX: Call the correct API endpoints ---
      const [topicStatsResponse, queryStatsResponse] = await Promise.all([
        // Use getTopicAnalytics which correctly calls the /analytics/topics endpoint
        analyticsApi.getTopicAnalytics(selectedPeriod), 
        analyticsApi.getQueryAnalytics(selectedPeriod),
      ]);

      // --- REVISED AND CORRECTED DATA MAPPING ---

      // 1. Extract data from the actual API response structure
      const topicAnalyticsData = topicStatsResponse.data.data;
      const queryAnalyticsData = queryStatsResponse.data.data;

      // 2. Map Topic Analytics to the frontend's expected 'topic_overview' structure
      const topicOverviewData: TopicOverview = {
        total_topics: topicAnalyticsData?.quality_metrics?.total_topics ?? 0,
        // Map backend's 'average_content_per_topic' to frontend's 'avg_keywords_per_topic'
        avg_keywords_per_topic: topicAnalyticsData?.quality_metrics?.average_content_per_topic ?? 0,
        // Map backend's 'well_populated_topics' to frontend's 'topics_with_many_keywords'
        topics_with_many_keywords: topicAnalyticsData?.quality_metrics?.well_populated_topics ?? 0,
      };

      // 3. Map Topic Analytics to the frontend's 'top_topics_by_content' structure
      const topTopicsData: TopicContent[] = (topicAnalyticsData?.most_active_topics || []).map((topic: any) => ({
        name: topic.name,
        // Rename 'content_count' from backend to 'chunk_count' for the frontend chart
        chunk_count: topic.content_count, 
      }));

      // 4. Map Query Analytics to the frontend's 'query_trends' structure
      const queryTrendsData: QueryTrend[] = (queryAnalyticsData?.query_frequency || []).map((trend: any) => ({
        query_date: trend.query_date,
        query_count: trend.query_count,
      }));

      // 5. Set the component state with the correctly transformed data
      setAnalyticsData({
        topic_overview: topicOverviewData,
        top_topics_by_content: topTopicsData,
        query_trends: queryTrendsData,
      });

    } catch (error) {
      console.error('Failed to load analytics:', error);
      //toast.error('Could not load analytics data.');
      // Set a default empty state to prevent the UI from crashing
      setAnalyticsData({
        topic_overview: { total_topics: 0, avg_keywords_per_topic: 0, topics_with_many_keywords: 0 },
        top_topics_by_content: [],
        query_trends: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // ... (rest of the component remains the same)
  // The rendering logic below this point will now work correctly
  // as it will receive the data in the expected format.

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-medium text-gray-900">Loading Analytics</h3>
          <p className="text-sm text-gray-500">Gathering insights from your data...</p>
        </motion.div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights into your knowledge base</p>
        </div>
        
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(Number(e.target.value))}
          className="input-modern w-auto"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-modern p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Topics</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.topic_overview?.total_topics ?? '0'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Keywords/Topic</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.topic_overview.avg_keywords_per_topic?.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">+5%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-modern p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rich Topics</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.topic_overview.topics_with_many_keywords}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <MessageSquare className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">+8%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-modern p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Query Trends</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.query_trends.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600 font-medium">+23%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Topics by Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-modern p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Topics by Content
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.top_topics_by_content.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar 
                dataKey="chunk_count" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Query Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-modern p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Query Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.query_trends.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="query_date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="query_count" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Topic Distribution Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card-modern p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Content Distribution by Top Topics
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={analyticsData.top_topics_by_content.slice(0, 5)}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="chunk_count"
              paddingAngle={2}
            >
              {analyticsData.top_topics_by_content.slice(0, 5).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card-modern p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-sm text-green-700">System Uptime</div>
            <div className="text-xs text-green-600 mt-1">Last 30 days</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">1.2s</div>
            <div className="text-sm text-blue-700">Avg Response Time</div>
            <div className="text-xs text-blue-600 mt-1">Query processing</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">95%</div>
            <div className="text-sm text-purple-700">User Satisfaction</div>
            <div className="text-xs text-purple-600 mt-1">Based on ratings</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;