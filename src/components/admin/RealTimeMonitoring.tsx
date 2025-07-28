import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Database,
  Users,
  Clock,
  TrendingUp,
  Globe,
  Activity,
  FileText,
  Zap,
  Eye,
} from "lucide-react";

interface RealTimeStatus {
  timestamp: string;
  ipAddress: string;
  realTimeTracking: {
    ipUsage: number;
    softLimitShown: boolean;
    dailyUsage: number;
    lastActivity: string;
  };
}

interface LiveAnalytics {
  timestamp: string;
  liveToolUsage: Array<{
    _id: string;
    count: number;
    lastUsed: string;
  }>;
  activeUsers: {
    total: number;
    countries: number;
    topCountries: Array<{
      country: string;
      count: number;
    }>;
  };
  systemMetrics: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    throughput: number;
  };
}

const RealTimeMonitoring: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [realTimeStatus, setRealTimeStatus] = useState<RealTimeStatus | null>(null);
  const [liveAnalytics, setLiveAnalytics] = useState<LiveAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRealTimeData = async () => {
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const [statusResponse, analyticsResponse] = await Promise.all([
        fetch(`${apiUrl}/schema-test/real-time-status`),
        fetch(`${apiUrl}/schema-test/live-analytics`),
      ]);

      if (statusResponse.ok && analyticsResponse.ok) {
        const [statusData, analyticsData] = await Promise.all([
          statusResponse.json(),
          analyticsResponse.json(),
        ]);

        if (statusData.success && analyticsData.success) {
          setRealTimeStatus(statusData.data);
          setLiveAnalytics(analyticsData.data);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error("Error fetching real-time data:", error);
    }
  };

  const toggleMonitoring = () => {
    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
    } else {
      fetchRealTimeData();
      intervalRef.current = setInterval(fetchRealTimeData, 10000);
      setIsRunning(true);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (value: boolean): string => {
    return value ? "text-green-600" : "text-red-600";
  };

  const getPerformanceColor = (timeMs: number): string => {
    if (timeMs < 100) return "text-green-600";
    if (timeMs < 500) return "text-yellow-600";
    return "text-red-600";
  };

  const formatTime = (ms: number): string => {
    return `${ms}ms`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Real-Time System Monitoring
          </CardTitle>
          <p className="text-muted-foreground">
            Monitor all schemas with real-time data validation
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={fetchRealTimeData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            <Button
              onClick={toggleMonitoring}
              variant={isRunning ? "destructive" : "default"}
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Start Monitoring
                </>
              )}
            </Button>
            {lastUpdate && (
              <Badge variant="outline">
                Last Update: {lastUpdate.toLocaleTimeString()}
              </Badge>
            )}
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-Time Status */}
      {realTimeStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Real-Time Status
            </CardTitle>
            <CardDescription>
              Live monitoring from IP: {realTimeStatus.ipAddress}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Current IP Usage</div>
                <div className="text-2xl font-bold text-blue-600">
                  {realTimeStatus.realTimeTracking.ipUsage}
                </div>
                <div className="text-xs text-muted-foreground">
                  requests today
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Soft Limit Status</div>
                <div className={`text-2xl font-bold ${getStatusColor(realTimeStatus.realTimeTracking.softLimitShown)}`}>
                  {realTimeStatus.realTimeTracking.softLimitShown ? "Active" : "Normal"}
                </div>
                <div className="text-xs text-muted-foreground">
                  limit monitoring
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Daily Usage</div>
                <div className="text-2xl font-bold text-green-600">
                  {realTimeStatus.realTimeTracking.dailyUsage}
                </div>
                <div className="text-xs text-muted-foreground">
                  tools used
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Last Activity</div>
                <div className="text-sm font-semibold">
                  {formatTimeAgo(realTimeStatus.realTimeTracking.lastActivity)}
                </div>
                <div className="text-xs text-muted-foreground">
                  recent activity
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Analytics */}
      {liveAnalytics && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Popular PDF Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Popular PDF Tools (Real Usage)
              </CardTitle>
              <CardDescription>PDF tool usage - all data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liveAnalytics.liveToolUsage
                  .filter(
                    (tool) =>
                      !tool._id.includes("img-") &&
                      !tool._id.includes("favicon-"),
                  )
                  .slice(0, 10)
                  .map((tool, index) => (
                    <div key={tool._id} className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">
                            {tool._id.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className="font-bold text-red-600">{tool.count}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last used: {formatTimeAgo(tool.lastUsed)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* System Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                System Performance
              </CardTitle>
              <CardDescription>Real-time system metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Response Time</span>
                  <span className={`font-bold ${getPerformanceColor(liveAnalytics.systemMetrics.responseTime)}`}>
                    {liveAnalytics.systemMetrics.responseTime}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="font-bold text-green-600">
                    {liveAnalytics.systemMetrics.uptime}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="font-bold text-green-600">
                    {liveAnalytics.systemMetrics.errorRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Throughput</span>
                  <span className="font-bold text-blue-600">
                    {liveAnalytics.systemMetrics.throughput} req/s
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Active Users
              </CardTitle>
              <CardDescription>Current user activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {liveAnalytics.activeUsers.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {liveAnalytics.activeUsers.countries}
                  </div>
                  <div className="text-sm text-muted-foreground">Countries</div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Top Countries</h4>
                  {liveAnalytics.activeUsers.topCountries.slice(0, 5).map((country, index) => (
                    <div key={country.country} className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        {country.country}
                      </span>
                      <span className="font-medium">{country.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RealTimeMonitoring;
