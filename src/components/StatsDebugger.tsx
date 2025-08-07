import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { statsService } from '@/services/statsService';

const StatsDebugger: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const testStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing stats service...');
      const result = await statsService.getStats();
      setStats(result);
      setLastFetch(new Date());
      console.log('Stats result:', result);
    } catch (err: any) {
      setError(err.message);
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testStats();
  }, []);

  const getStatusColor = () => {
    if (loading) return 'border-blue-200 bg-blue-50';
    if (error) return 'border-red-200 bg-red-50';
    if (stats) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    if (error) return <XCircle className="w-4 h-4 text-red-600" />;
    if (stats) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <AlertTriangle className="w-4 h-4 text-gray-600" />;
  };

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${getStatusColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Stats Service Debugger
          <Badge variant="outline" className="ml-auto">
            Development Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Status:</span>
          <Badge variant={error ? 'destructive' : stats ? 'default' : 'secondary'}>
            {loading ? 'Loading...' : error ? 'Error' : stats ? 'Success' : 'Idle'}
          </Badge>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {stats && (
          <div className="space-y-2">
            <h3 className="font-medium">Stats Data:</h3>
            <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded border">
              <div>
                <div className="text-sm text-gray-600">PDFs Processed</div>
                <div className="font-medium">{stats.pdfsProcessed?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Registered Users</div>
                <div className="font-medium">{stats.registeredUsers?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Countries</div>
                <div className="font-medium">{stats.countries}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Uptime</div>
                <div className="font-medium">{stats.uptime}%</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-medium">Configuration:</h3>
          <div className="text-sm space-y-1 p-3 bg-white rounded border">
            <div><strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'Not set'}</div>
            <div><strong>Stats Disabled:</strong> {import.meta.env.VITE_DISABLE_STATS || 'false'}</div>
            <div><strong>Environment:</strong> {import.meta.env.DEV ? 'Development' : 'Production'}</div>
          </div>
        </div>

        {lastFetch && (
          <div className="text-xs text-gray-500">
            Last fetch: {lastFetch.toLocaleTimeString()}
          </div>
        )}

        <Button 
          onClick={testStats} 
          disabled={loading}
          size="sm"
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Stats Service
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StatsDebugger;
