'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Clock, AlertTriangle, CheckCircle, Activity, Server, FileWarning } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyticsApi } from '@/services/api';
import toast from 'react-hot-toast';
import { SystemHealth } from '@/types';

const SystemStatus: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getSystemHealth();
      setSystemHealth(response.data.health); 
      setLastRefresh(new Date());
    } catch (error) {
      toast.error('Failed to load system health');
      console.error('Error loading system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string = 'unknown') => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getStatusBgColor = (status: string = 'unknown') => {
      switch (status.toLowerCase()) {
      case 'healthy': return 'bg-green-100';
      case 'warning': return 'bg-yellow-100';
      case 'error': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  }

  const getStatusIcon = (status: string = 'unknown') => {
    switch (status.toLowerCase()) {
      case 'healthy': return <CheckCircle className="w-6 h-6" />;
      case 'warning': return <AlertTriangle className="w-6 h-6" />;
      case 'error': return <Server className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };
  
  const formatNumber = (num: number = 0) => {
    return num.toLocaleString();
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Status</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" onClick={loadSystemHealth} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-4 p-4 rounded-lg ${getStatusBgColor(systemHealth?.system_status)}`}>
            <div className={`p-2 rounded-full ${getStatusColor(systemHealth?.system_status)}`}>
              {getStatusIcon(systemHealth?.system_status)}
            </div>
            <div>
              <p className={`font-semibold text-xl capitalize ${getStatusColor(systemHealth?.system_status)}`}>
                {systemHealth?.system_status || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                System check performed at {new Date(systemHealth?.generated_at || Date.now()).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(systemHealth?.database_statistics?.total_documents)}</p>
                <p className="text-sm text-gray-600 capitalize">Total Documents</p>
            </div>
             <div>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(systemHealth?.database_statistics?.total_chunks)}</p>
                <p className="text-sm text-gray-600">Total Chunks</p>
            </div>
            <div>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(systemHealth?.database_statistics?.total_topics)}</p>
                <p className="text-sm text-gray-600">Total Topics</p>
            </div>
            <div>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(systemHealth?.database_statistics?.total_queries)}</p>
                <p className="text-sm text-gray-600">Total Queries</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileWarning className="w-5 h-5" />
                Error Tracking
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-8">
                <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{formatNumber(systemHealth?.error_tracking?.error_documents)}</p>
                    <p className="text-sm text-gray-600">Documents with Errors</p>
                </div>
                <div>
                    <h4 className="font-medium text-gray-800 mb-2">Recent Error Messages:</h4>
                    {systemHealth?.error_tracking?.recent_errors && systemHealth.error_tracking.recent_errors.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {systemHealth.error_tracking.recent_errors.slice(0, 3).map((error, index) => (
                                <li key={index} className="truncate"><code>{error}</code></li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No recent errors recorded. ✅</p>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default SystemStatus;