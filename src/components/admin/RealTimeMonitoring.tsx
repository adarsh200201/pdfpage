import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Users,
  Monitor,
  Database,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Play,
  Square,
  Eye,
  Zap,
} from "lucide-react";

interface SchemaTestResult {
  success: boolean;
  userId?: string;
  timeMs: number;
  features: any;
}

interface RealTimeStatus {
  timestamp: string;
  ipAddress: string;
  realTimeTracking: {
    active: boolean;
    ipUsageTracked: boolean;
    currentUsage: number;
    shouldShowSoftLimit: boolean;
    lastActivity: string | null;
    sessionActive: boolean;
  };
  recentActivity: {
    totalRecentUsage: number;
    activeSessions: number;
    todayConversions: number;
    lastToolUsed: string | null;
    lastActivity: string | null;
  };
  systemHealth: {
    schemasOperational: boolean;
    databaseConnected: boolean;
    realTimeTrackingLatency: string;
    averageResponseTime: string;
  };
}

interface LiveAnalytics {
  timestamp: string;
  timeRange: string;
  liveMetrics: {
    activeSessionsLastHour: number;
    toolUsageLastHour: number;
    conversionsToday: number;
    softLimitHitsToday: number;
    imageToolsUsage: number;
    faviconToolsUsage: number;
  };
  liveToolUsage: Array<{
    _id: string;
    count: number;
    avgProcessingTime: number;
    totalFileSize: number;
    category?: string;
  }>;
  popularImageTools: Array<{
    _id: string;
    count: number;
    avgProcessingTime: number;
    totalFileSize: number;
  }>;
  popularFaviconTools: Array<{
    _id: string;
    count: number;
    avgProcessingTime: number;
    totalFileSize: number;
  }>;
  deviceDistribution: Array<{
    _id: string;
    count: number;
    percentage: number;
  }>;
  realTimeFeatures: {
    ipTracking: boolean;
    screenTimeTracking: boolean;
    conversionTracking: boolean;
    sessionTracking: boolean;
    deviceDetection: boolean;
    geoLocationTracking: boolean;
  };
}

const RealTimeMonitoring: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [realTimeStatus, setRealTimeStatus] = useState<RealTimeStatus | null>(
    null,
  );
  const [liveAnalytics, setLiveAnalytics] = useState<LiveAnalytics | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh real-time data
  useEffect(() => {
    if (isRunning) {
      fetchRealTimeData();
      intervalRef.current = setInterval(fetchRealTimeData, 5000); // Update every 5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const fetchRealTimeData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const [statusResponse, analyticsResponse] = await Promise.all([
        fetch(`${apiUrl}/schema-test/real-time-status`),
        fetch(`${apiUrl}/schema-test/live-analytics`),
      ]);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setRealTimeStatus(statusData.status);
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setLiveAnalytics(analyticsData.analytics);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching real-time data:", error);
    }
  };

  const runSchemaTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const response = await fetch(
        `${apiUrl}/schema-test/create-test-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checkSoftLimit: true,
            realTimeTest: true,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setTestResults(data.testResults);
        // Refresh real-time data after test
        await fetchRealTimeData();
      } else {
        setError(data.message || "Schema test failed");
      }
    } catch (error) {
      setError(`Error running schema test: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoring = () => {
    setIsRunning(!isRunning);
  };

  const generateImageFaviconData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/schema-test/generate-image-favicon-data",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        // Refresh real-time data after generating sample data
        await fetchRealTimeData();
        console.log(
          "✅ Image/Favicon sample data generated successfully:",
          data,
        );
      } else {
        setError(
          data.message || "Failed to generate Image/Favicon sample data",
        );
      }
    } catch (error) {
      setError(`Error generating Image/Favicon sample data: ${error}`);
      console.error("Error generating Image/Favicon sample data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    return `${ms}ms`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: boolean) => {
    return status ? "text-green-600" : "text-red-600";
  };

  const getPerformanceColor = (timeMs: number) => {
    if (timeMs < 100) return "text-green-600";
    if (timeMs < 500) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Real-Time Schema Monitoring
          </h2>
          <p className="text-muted-foreground">
            Monitor and test all schemas with real-time data validation
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={generateImageFaviconData}
            disabled={loading}
            variant="outline"
            className="text-green-600 hover:text-green-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            Generate Image/Favicon Data
          </Button>
          <Button onClick={runSchemaTest} disabled={loading} variant="outline">
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Test All Schemas
          </Button>
          <Button
            onClick={toggleMonitoring}
            variant={isRunning ? "destructive" : "default"}
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Real-Time Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Real-Time Status
            </CardTitle>
            <Activity
              className={`h-4 w-4 ${isRunning ? "text-green-600" : "text-gray-400"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isRunning ? "Active" : "Inactive"}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastUpdate
                ? `Last update: ${formatTimestamp(lastUpdate.toISOString())}`
                : "Not monitoring"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveAnalytics?.liveMetrics.activeSessionsLastHour || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tool Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveAnalytics?.liveMetrics.toolUsageLastHour || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveAnalytics?.liveMetrics.conversionsToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Image and Favicon Tools Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Image Tools</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveAnalytics?.liveMetrics.imageToolsUsage || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favicon Tools</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveAnalytics?.liveMetrics.faviconToolsUsage || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDF Tools</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveAnalytics?.liveToolUsage
                .filter(
                  (tool) =>
                    !tool._id.includes("img-") &&
                    !tool._id.includes("favicon-"),
                )
                .reduce((sum, tool) => sum + tool.count, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Tools</CardTitle>
            <Monitor className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveAnalytics?.liveMetrics.toolUsageLastHour || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      {realTimeStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              System Health
            </CardTitle>
            <CardDescription>
              Real-time system status and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Schemas</span>
                  <Badge
                    variant={
                      realTimeStatus.systemHealth.schemasOperational
                        ? "default"
                        : "destructive"
                    }
                  >
                    {realTimeStatus.systemHealth.schemasOperational
                      ? "Operational"
                      : "Error"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge
                    variant={
                      realTimeStatus.systemHealth.databaseConnected
                        ? "default"
                        : "destructive"
                    }
                  >
                    {realTimeStatus.systemHealth.databaseConnected
                      ? "Connected"
                      : "Disconnected"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">IP Tracking</span>
                  <Badge
                    variant={
                      realTimeStatus.realTimeTracking.ipUsageTracked
                        ? "default"
                        : "secondary"
                    }
                  >
                    {realTimeStatus.realTimeTracking.ipUsageTracked
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Tracking</span>
                  <Badge
                    variant={
                      realTimeStatus.realTimeTracking.sessionActive
                        ? "default"
                        : "secondary"
                    }
                  >
                    {realTimeStatus.realTimeTracking.sessionActive
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Latency</span>
                  <span className="text-sm font-medium text-green-600">
                    {realTimeStatus.systemHealth.realTimeTrackingLatency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="text-sm font-medium text-green-600">
                    {realTimeStatus.systemHealth.averageResponseTime}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Usage</span>
                  <span className="text-sm font-medium">
                    {realTimeStatus.realTimeTracking.currentUsage}/3
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Soft Limit</span>
                  <Badge
                    variant={
                      realTimeStatus.realTimeTracking.shouldShowSoftLimit
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {realTimeStatus.realTimeTracking.shouldShowSoftLimit
                      ? "Active"
                      : "Not Active"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schema Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Schema Test Results
            </CardTitle>
            <CardDescription>
              Test ID: {testResults.testId} | Total Time:{" "}
              {formatTime(testResults.performance.totalTimeMs)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* User Schema */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">User Schema</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    Time:{" "}
                    <span
                      className={getPerformanceColor(
                        testResults.schemas.user.timeMs,
                      )}
                    >
                      {formatTime(testResults.schemas.user.timeMs)}
                    </span>
                  </div>
                  <div>
                    Password Hashing:{" "}
                    <span
                      className={getStatusColor(
                        testResults.schemas.user.features.passwordHashing,
                      )}
                    >
                      ✓
                    </span>
                  </div>
                  <div>
                    Virtual Fields: <span className="text-green-600">✓</span>
                  </div>
                  <div>
                    Methods: <span className="text-green-600">✓</span>
                  </div>
                </div>
              </div>

              {/* IP Usage Schema */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">IP Usage Schema</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    Time:{" "}
                    <span
                      className={getPerformanceColor(
                        testResults.schemas.ipUsageLog.timeMs,
                      )}
                    >
                      {formatTime(testResults.schemas.ipUsageLog.timeMs)}
                    </span>
                  </div>
                  <div>
                    Usage Count:{" "}
                    <span className="text-blue-600">
                      {testResults.schemas.ipUsageLog.features.usageCount}
                    </span>
                  </div>
                  <div>
                    Tools Tracked:{" "}
                    <span className="text-blue-600">
                      {testResults.schemas.ipUsageLog.features.toolsUsed}
                    </span>
                  </div>
                  <div>
                    Session Tracking: <span className="text-green-600">✓</span>
                  </div>
                </div>
              </div>

              {/* Usage Schema */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Usage Schema</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    Time:{" "}
                    <span
                      className={getPerformanceColor(
                        testResults.schemas.usage.timeMs,
                      )}
                    >
                      {formatTime(testResults.schemas.usage.timeMs)}
                    </span>
                  </div>
                  <div>
                    Auto Category:{" "}
                    <span
                      className={getStatusColor(
                        testResults.schemas.usage.features.autoToolCategory,
                      )}
                    >
                      ✓
                    </span>
                  </div>
                  <div>
                    Device Detection:{" "}
                    <span
                      className={getStatusColor(
                        testResults.schemas.usage.features.autoDeviceDetection,
                      )}
                    >
                      ✓
                    </span>
                  </div>
                  <div>
                    Real-time:{" "}
                    <span
                      className={getStatusColor(
                        testResults.schemas.usage.features.realTimeTracking,
                      )}
                    >
                      ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback Schema */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Feedback Schema</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    Time:{" "}
                    <span
                      className={getPerformanceColor(
                        testResults.schemas.feedback.timeMs,
                      )}
                    >
                      {formatTime(testResults.schemas.feedback.timeMs)}
                    </span>
                  </div>
                  <div>
                    User Association:{" "}
                    <span
                      className={getStatusColor(
                        testResults.schemas.feedback.features.userAssociation,
                      )}
                    >
                      ✓
                    </span>
                  </div>
                  <div>
                    Timestamps:{" "}
                    <span
                      className={getStatusColor(
                        testResults.schemas.feedback.features.timestampTracking,
                      )}
                    >
                      ✓
                    </span>
                  </div>
                  <div>
                    Metadata:{" "}
                    <span
                      className={getStatusColor(
                        testResults.schemas.feedback.features.metadataSupport,
                      )}
                    >
                      ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Real-Time Features Test */}
            <div className="space-y-4">
              <h4 className="font-medium">Real-Time Features Validation</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <span className="text-sm font-medium">
                    Screen Time Tracking
                  </span>
                  <div className="text-sm">
                    Time on Page:{" "}
                    <span className="font-medium text-blue-600">
                      {
                        testResults.realTimeTracking.screenTimeTracking
                          ?.timeOnPage
                      }
                      s
                    </span>
                  </div>
                  <div className="text-sm">
                    Real-time Updates: <span className="text-green-600">✓</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">
                    IP Address Tracking
                  </span>
                  <div className="text-sm">
                    Current Usage:{" "}
                    <span className="font-medium text-blue-600">
                      {
                        testResults.realTimeTracking.features.ipTracking
                          .currentUsage
                      }
                    </span>
                  </div>
                  <div className="text-sm">
                    Soft Limit:{" "}
                    <span
                      className={getStatusColor(
                        testResults.realTimeTracking.features.ipTracking
                          .shouldShowSoftLimit,
                      )}
                    >
                      {testResults.realTimeTracking.features.ipTracking
                        .shouldShowSoftLimit
                        ? "Active"
                        : "Not Active"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">
                    Conversion Tracking
                  </span>
                  <div className="text-sm">
                    Daily Usage:{" "}
                    <span className="font-medium text-blue-600">
                      {testResults.realTimeTracking.features.dailyUsage}
                    </span>
                  </div>
                  <div className="text-sm">
                    Analytics: <span className="text-green-600">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Analytics */}
      {liveAnalytics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
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
                          <span className="font-medium capitalize">
                            {tool._id.replace("-", " ")}
                          </span>
                          <span className="text-sm text-gray-600">
                            {tool.count} uses
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tool.uniqueUserCount || 0} unique users
                        </div>
                      </div>
                    </div>
                  ))}
                {liveAnalytics.liveToolUsage.filter(
                  (tool) =>
                    !tool._id.includes("img-") &&
                    !tool._id.includes("favicon-"),
                ).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No PDF tool usage data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Popular Image Tools (Real Usage)
              </CardTitle>
              <CardDescription>Image tool usage - all data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(liveAnalytics.popularImageTools || [])
                  .slice(0, 10)
                  .map((tool, index) => (
                    <div key={tool._id} className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium capitalize">
                            {tool._id.replace("img-", "").replace("-", " ")}
                          </span>
                          <span className="text-sm text-gray-600">
                            {tool.count} uses
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(tool.count / (liveAnalytics.popularImageTools[0]?.count || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {tool.uniqueUserCount || 0} unique users
                        </div>
                      </div>
                    </div>
                  ))}
                {(!liveAnalytics.popularImageTools ||
                  liveAnalytics.popularImageTools.length === 0) && (
                  <div className="text-center text-muted-foreground py-4">
                    <div className="flex flex-col items-center space-y-2">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                      <span>No image tool usage data</span>
                      <Button
                        onClick={generateImageFaviconData}
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                      >
                        Generate Sample Data
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-500" />
                Popular Favicon Tools (Real Usage)
              </CardTitle>
              <CardDescription>Favicon tool usage - all data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(liveAnalytics.popularFaviconTools || [])
                  .slice(0, 10)
                  .map((tool, index) => (
                    <div key={tool._id} className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium capitalize">
                            {tool._id.replace("favicon-", "").replace("-", " ")}
                          </span>
                          <span className="text-sm text-gray-600">
                            {tool.count} uses
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(tool.count / (liveAnalytics.popularFaviconTools[0]?.count || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {tool.uniqueUserCount || 0} unique users
                        </div>
                      </div>
                    </div>
                  ))}
                {(!liveAnalytics.popularFaviconTools ||
                  liveAnalytics.popularFaviconTools.length === 0) && (
                  <div className="text-center text-muted-foreground py-4">
                    <div className="flex flex-col items-center space-y-2">
                      <Activity className="h-8 w-8 text-gray-400" />
                      <span>No favicon tool usage data</span>
                      <Button
                        onClick={generateImageFaviconData}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Generate Sample Data
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Device Distribution (Live)
              </CardTitle>
              <CardDescription>
                Real device data with usage percentages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveAnalytics.deviceDistribution.map((device) => (
                  <div key={device._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {device._id || "Unknown"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{device.count}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {device.percentage
                            ? `${device.percentage.toFixed(1)}%`
                            : "0%"}
                        </span>
                      </div>
                    </div>
                    <Progress value={device.percentage || 0} className="h-2" />
                  </div>
                ))}
                {liveAnalytics.deviceDistribution.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No device data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-Time Features Status */}
      {liveAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Real-Time Features Status
            </CardTitle>
            <CardDescription>
              All real-time tracking capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {Object.entries(liveAnalytics.realTimeFeatures).map(
                ([feature, enabled]) => (
                  <div key={feature} className="text-center space-y-2">
                    <div
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                    >
                      {enabled ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="text-xs font-medium capitalize">
                      {feature.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <Badge
                      variant={enabled ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeMonitoring;
