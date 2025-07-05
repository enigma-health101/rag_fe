'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { analyticsApi } from '@/services/api';
import toast from 'react-hot-toast';
import { ContentMetricsData } from '@/types';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

const ContentMetrics: React.FC = () => {
  const [metricsData, setMetricsData] = useState<ContentMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  useEffect(() => {
    loadContentMetrics();
  }, []);

  const loadContentMetrics = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await analyticsApi.getContentMetrics(30); 
      setMetricsData(response.data.data);
      setLastUpdated(new Date());
      
      if (!silent) {
        toast.success('Content metrics loaded successfully');
      }
    } catch (error) {
      console.error('Error loading content metrics:', error);
      if (!silent) {
        toast.error('Failed to load content metrics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportMetrics = async () => {
    try {
      // Implementation for exporting metrics data
      const dataStr = JSON.stringify(metricsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `content-metrics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Metrics exported successfully');
    } catch (error) {
      toast.error('Failed to export metrics');
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOverallQuality = () => {
    if (!metricsData) return 0;
    
    const { quality_metrics, orphan_content, document_coverage } = metricsData;
    const avgCoverage = document_coverage.length > 0 ? document_coverage.reduce((sum, doc) => sum + doc.coverage_percentage, 0) / document_coverage.length : 0;
    const orphanPenalty = orphan_content.orphan_percentage;
    const relevanceScore = quality_metrics.avg_relevance_score || 0;
    
    // Calculate composite quality score (0-100)
    const qualityScore = Math.max(0, (avgCoverage * 0.4) + (relevanceScore * 100 * 0.4) + ((100 - orphanPenalty) * 0.2));
    return Math.round(qualityScore);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Metrics Available</h3>
        <p className="text-gray-500 mb-4">Upload and process documents to see detailed analytics</p>
        <Button onClick={() => loadContentMetrics()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Loading
        </Button>
      </div>
    );
  }

  const overallQuality = calculateOverallQuality();

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Analytics</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis of your document processing and topic coverage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={() => loadContentMetrics(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-600">{metricsData.document_coverage.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Processed files</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Coverage</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metricsData.document_coverage.length > 0
                      ? (metricsData.document_coverage.reduce((sum, doc) => sum + doc.coverage_percentage, 0) / metricsData.document_coverage.length).toFixed(1)
                      : '0'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Topic coverage</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Orphan Content</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {metricsData.orphan_content.orphan_percentage?.toFixed(1) || '0'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Uncategorized chunks</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quality Score</p>
                  <p className="text-2xl font-bold text-purple-600">{overallQuality}</p>
                  <p className="text-xs text-gray-500 mt-1">Overall rating</p>
                </div>
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Relevance</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {metricsData.quality_metrics.avg_relevance_score?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Content relevance</p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Document Status and File Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Document Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metricsData.document_status_distribution.map((status, index) => (
                  <motion.div
                    key={status.status}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status.status)}
                      <span className="capitalize font-medium">{status.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                        {status.count}
                      </span>
                      <span className="text-sm text-gray-500 w-12 text-right">{status.percentage.toFixed(1)}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                File Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metricsData.file_type_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ file_type, document_count }) => `${file_type.toUpperCase()} (${document_count})`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="document_count"
                    paddingAngle={2}
                  >
                    {metricsData.file_type_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, 'Documents']}
                    labelFormatter={(label) => `${label} Files`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Document Coverage Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Document Coverage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={metricsData.document_coverage.slice(0, 15)} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="filename" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'coverage_percentage' ? `${value}%` : value,
                    name === 'coverage_percentage' ? 'Coverage' : 
                    name === 'total_chunks' ? 'Total Chunks' : 'Topic Chunks'
                  ]}
                  labelFormatter={(label) => `File: ${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="coverage_percentage" fill="#3B82F6" name="coverage_percentage" radius={[2, 2, 0, 0]} />
                <Bar dataKey="unique_topics" fill="#10B981" name="unique_topics" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quality Metrics Detail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Content Quality Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{metricsData.quality_metrics.avg_chunk_words?.toFixed(0) || '0'}</p>
                <p className="text-sm text-blue-700 font-medium">Avg Words per Chunk</p>
                <p className="text-xs text-gray-600 mt-1">Optimal range: 100-300</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{metricsData.quality_metrics.high_relevance_chunks || 0}</p>
                <p className="text-sm text-green-700 font-medium">High Relevance Chunks</p>
                <p className="text-xs text-gray-600 mt-1">Score ≥ 0.8</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-3xl font-bold text-red-600">{metricsData.quality_metrics.low_relevance_chunks || 0}</p>
                <p className="text-sm text-red-700 font-medium">Low Relevance Chunks</p>
                <p className="text-xs text-gray-600 mt-1">Score ≤ 0.4</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{metricsData.quality_metrics.avg_relevance_score?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-purple-700 font-medium">Avg Relevance Score</p>
                <p className="text-xs text-gray-600 mt-1">Range: 0.0 - 1.0</p>
              </div>
            </div>
            
            {/* Quality Recommendations */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3">Quality Recommendations</h4>
              <div className="space-y-2">
                {metricsData.orphan_content.orphan_percentage > 20 && (
                  <div className="flex items-center gap-2 text-sm text-orange-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>High orphan content detected. Consider improving topic extraction algorithms.</span>
                  </div>
                )}
                {metricsData.quality_metrics.avg_relevance_score < 0.6 && (
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>Low average relevance score. Review document preprocessing and chunking strategy.</span>
                  </div>
                )}
                {metricsData.quality_metrics.avg_chunk_words < 50 && (
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>Chunks are too small. Consider increasing chunk size for better context.</span>
                  </div>
                )}
                {overallQuality >= 80 && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Excellent content quality! Your documents are well-processed and organized.</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* File Type Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              File Type Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metricsData.file_type_distribution.map((fileType, index) => (
                <motion.div
                  key={fileType.file_type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{fileType.file_type.toUpperCase()}</p>
                      <p className="text-sm text-gray-600">{fileType.document_count} documents</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatFileSize(fileType.total_size_bytes)}</p>
                    <p className="text-sm text-gray-600">Avg: {formatFileSize(fileType.avg_size_bytes)}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(fileType.document_count / metricsData.document_coverage.length) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {((fileType.document_count / metricsData.document_coverage.length) * 100).toFixed(1)}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Processing Trends (if data available) */}
      {metricsData.processing_trends && metricsData.processing_trends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Processing Trends ({selectedTimeRange})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsData.processing_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
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
                    dataKey="documents_processed" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Documents Processed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="success_rate" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Success Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Topic Coverage Trends (if data available) */}
      {metricsData.topic_coverage_trends && metricsData.topic_coverage_trends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Topic Coverage Trends ({selectedTimeRange})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsData.topic_coverage_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
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
                    dataKey="avg_coverage" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    name="Avg Coverage (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_topics_generated" 
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                    name="Topics Generated"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ContentMetrics;