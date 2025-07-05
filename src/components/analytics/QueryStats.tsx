// components/analytics/QueryStats.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, MessageSquare, Zap } from 'lucide-react';

interface QueryTrendData {
  query_date: string;
  query_count: number;
  avg_response_time: number;
  avg_rating?: number;
}

interface QueryStatsProps {
  trends: QueryTrendData[];
  totalQueries: number;
  avgResponseTime: number;
  avgRating?: number;
  period: number;
}

const QueryStats: React.FC<QueryStatsProps> = ({
  trends,
  totalQueries,
  avgResponseTime,
  avgRating,
  period
}) => {
  if (!trends || trends.length === 0) {
    return (
      <div className="card-modern p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Query Analytics</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">No query data available</p>
            <p className="text-sm text-gray-500 mt-1">
              No query data available for the last {period} days
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate trend direction
  const recentTrend = trends.slice(-7);
  const earlierTrend = trends.slice(-14, -7);
  
  const recentAvg = recentTrend.reduce((sum, day) => sum + day.query_count, 0) / recentTrend.length;
  const earlierAvg = earlierTrend.length > 0 
    ? earlierTrend.reduce((sum, day) => sum + day.query_count, 0) / earlierTrend.length 
    : recentAvg;
  
  const trendDirection = recentAvg > earlierAvg ? 'up' : 'down';
  const trendPercentage = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg * 100) : 0;

  const metrics = [
    {
      title: 'Total Queries',
      value: totalQueries.toLocaleString(),
      change: `${trendDirection === 'up' ? '+' : ''}${trendPercentage.toFixed(1)}%`,
      changeType: trendDirection === 'up' ? 'positive' : 'negative',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Avg Response Time',
      value: `${avgResponseTime.toFixed(0)}ms`,
      change: avgResponseTime < 500 ? 'Excellent' : avgResponseTime < 1000 ? 'Good' : 'Needs improvement',
      changeType: avgResponseTime < 500 ? 'positive' : avgResponseTime < 1000 ? 'neutral' : 'negative',
      icon: Clock,
      color: 'green'
    },
    {
      title: 'Daily Average',
      value: (totalQueries / period).toFixed(0),
      change: 'Queries per day',
      changeType: 'neutral',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Performance',
      value: avgResponseTime < 500 ? 'Fast' : avgResponseTime < 1000 ? 'Good' : 'Slow',
      change: 'Response quality',
      changeType: avgResponseTime < 500 ? 'positive' : avgResponseTime < 1000 ? 'neutral' : 'negative',
      icon: Zap,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Query Analytics</h3>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {trendDirection === 'up' ? (
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>Trending up</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600">
              <TrendingDown className="w-4 h-4" />
              <span>Trending down</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const getColorClasses = () => {
            const colors = {
              blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
              green: 'from-green-500 to-green-600 text-green-600 bg-green-50',
              purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
              orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50',
            };
            return colors[metric.color as keyof typeof colors] || colors.blue;
          };

          const getChangeColor = () => {
            switch (metric.changeType) {
              case 'positive': return 'text-green-600';
              case 'negative': return 'text-red-600';
              default: return 'text-gray-600';
            }
          };

          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-modern p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${getColorClasses().split(' ')[0]} ${getColorClasses().split(' ')[1]}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className={`text-xs font-medium ${getChangeColor()}`}>
                {metric.change}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Volume Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-modern p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Query Volume Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="query_date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [value, 'Queries']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="query_count"
                stroke="#3B82F6"
                fill="url(#areaGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Response Time Trends */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-modern p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="query_date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [`${value}ms`, 'Response Time']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="avg_response_time"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-modern p-6"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {trends.filter(d => d.avg_response_time < 500).length}
            </div>
            <div className="text-sm text-green-700">Fast Response Days</div>
            <div className="text-xs text-green-600 mt-1">&lt;500ms</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.max(...trends.map(d => d.query_count))}
            </div>
            <div className="text-sm text-blue-700">Peak Daily Queries</div>
            <div className="text-xs text-blue-600 mt-1">Highest volume</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {((trends.filter(d => d.avg_response_time < 1000).length / trends.length) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-purple-700">Good Performance</div>
            <div className="text-xs text-purple-600 mt-1">&lt;1000ms</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QueryStats;