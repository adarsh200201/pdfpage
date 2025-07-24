import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Database,
  Crown,
  Calendar,
  Activity,
  Monitor,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Play,
  Square,
  LogOut,
  User,
} from "lucide-react";
import RealTimeMonitoring from "./RealTimeMonitoring";
import { Button } from "@/components/ui/button";

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  totalOperations: number;
  totalFileSize: number;
  averageFileSize: number;
  dailyActiveUsers: number;
  popularTools: Array<{
    tool: string;
    count: number;
    uniqueUserCount?: number;
    avgProcessingTime?: number;
  }>;
  recentSignups: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    isPremium: boolean;
    loginCount: number;
  }>;
  conversionStats: {
    totalIPs: number;
    ipsHitSoftLimit: number;
    ipsConverted: number;
    conversionRate: number;
    softLimitRate: number;
  };
  deviceStats: Array<{
    deviceType: string;
    count: number;
    percentage: number;
  }>;
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

interface AdminDashboardProps {
  onLogout?: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    premiumUsers: 0,
    totalOperations: 0,
    totalFileSize: 0,
    averageFileSize: 0,
    dailyActiveUsers: 0,
    popularTools: [],
    recentSignups: [],
    conversionStats: {
      totalIPs: 0,
      ipsHitSoftLimit: 0,
      ipsConverted: 0,
      conversionRate: 0,
      softLimitRate: 0,
    },
    deviceStats: [],
  });

  const [realTimeStatus, setRealTimeStatus] = useState<RealTimeStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real data from backend
  const fetchRealData = async () => {
    try {
      setError(null);

      const apiUrl = import.meta.env.VITE_API_URL || "/api";

      // Fetch multiple endpoints in parallel
      const [
        usageStatsResponse,
        popularToolsResponse,
        recentUsersResponse,
        conversionStatsResponse,
        deviceStatsResponse,
        realTimeStatusResponse,
      ] = await Promise.all([
        // User statistics
        fetch(`${apiUrl}/users/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),

        // Popular tools - fetch all data without time filtering
        fetch(`${apiUrl}/usage/popular-tools`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),

        // Recent users
        fetch(`${apiUrl}/users/recent?limit=10`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),

        // Conversion analytics
        fetch(`${apiUrl}/analytics/conversion-funnel?days=30`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),

        // Device statistics
        fetch(`${apiUrl}/usage/device-stats?days=30`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),

        // Real-time status
        fetch(`${apiUrl}/schema-test/real-time-status`),
      ]);

      // Helper function to safely parse JSON responses
      const safeJsonParse = async (response: Response, fallback: any = {}) => {
        if (!response.ok) {
          console.warn(`API response not ok: ${response.status} ${response.statusText}`);
          return fallback;
        }

        try {
          const text = await response.text();
          if (!text || text.trim() === '') {
            console.warn('Empty response body');
            return fallback;
          }

          // Check if response is HTML (error page)
          if (text.trim().startsWith('<!')) {
            console.warn('Received HTML instead of JSON:', text.substring(0, 100));
            return fallback;
          }

          return JSON.parse(text);
        } catch (error) {
          console.error('Failed to parse JSON:', error);
          return fallback;
        }
      };

      // Process user stats
      let userStats = {
        totalUsers: 0,
        premiumUsers: 0,
        totalUploads: 0,
        totalFileSize: 0,
      };

      const usageData = await safeJsonParse(usageStatsResponse, {});
      if (usageData && usageData.success && usageData.stats) {
        userStats = usageData.stats;
      }

      // Process popular tools
      let popularTools = [];
      const toolsData = await safeJsonParse(popularToolsResponse, {});
      if (toolsData && toolsData.success) {
        popularTools = toolsData.tools || [];
      }

      // Process recent users
      let recentSignups = [];
      const usersData = await safeJsonParse(recentUsersResponse, {});
      if (usersData && usersData.success) {
        recentSignups = usersData.users || [];
      }

      // Process conversion stats
      let conversionStats = {
        totalIPs: 0,
        ipsHitSoftLimit: 0,
        ipsConverted: 0,
        conversionRate: 0,
        softLimitRate: 0,
      };
      const conversionDataResponse = await safeJsonParse(conversionStatsResponse, {});
      if (conversionDataResponse && conversionDataResponse.success && conversionDataResponse.data && conversionDataResponse.data.overview) {
        const rawStats = conversionDataResponse.data.overview;
        conversionStats = {
          totalIPs: Number(rawStats.totalIPs) || 0,
          ipsHitSoftLimit: Number(rawStats.ipsHitSoftLimit) || 0,
          ipsConverted: Number(rawStats.ipsConverted) || 0,
          conversionRate: Number(rawStats.conversionRate) || 0,
          softLimitRate: Number(rawStats.softLimitRate) || 0,
        };
      }

      // Process device stats
      let deviceStats = [];
      const deviceData = await safeJsonParse(deviceStatsResponse, {});
      if (deviceData && deviceData.success) {
        deviceStats = (deviceData.stats || []).map((device: any) => ({
          deviceType: device.deviceType || "Unknown",
          count: Number(device.count) || 0,
          percentage: Number(device.percentage) || 0,
        }));
      }

      // Process real-time status
      const statusData = await safeJsonParse(realTimeStatusResponse, {});
      if (statusData && statusData.success) {
        setRealTimeStatus(statusData.status);
      }

      // Update stats with real data
      setStats({
        totalUsers: userStats.totalUsers || 0,
        premiumUsers: userStats.premiumUsers || 0,
        totalOperations:
          userStats.totalUsageRecords ||
          userStats.successfulOperations ||
          userStats.totalUploads ||
          0,
        totalFileSize: userStats.totalFileSize || 0,
        averageFileSize:
          (userStats.totalUsageRecords ||
            userStats.successfulOperations ||
            userStats.totalUploads) > 0
            ? Math.round(
                userStats.totalFileSize /
                  (userStats.totalUsageRecords ||
                    userStats.successfulOperations ||
                    userStats.totalUploads),
              )
            : 0,
        dailyActiveUsers: realTimeStatus?.recentActivity.activeSessions || 0,
        popularTools: popularTools.slice(0, 15),
        recentSignups: recentSignups.slice(0, 10),
        conversionStats,
        deviceStats,
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setError(`Failed to fetch real-time data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchRealData();
  }, []);

  // Live mode updates
  useEffect(() => {
    if (isLiveMode) {
      intervalRef.current = setInterval(fetchRealData, 30000); // Update every 30 seconds (reduced from 5 seconds)
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
  }, [isLiveMode]);

  const toggleLiveMode = () => {
    setIsLiveMode(!isLiveMode);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  const premiumConversionRate = (() => {
    try {
      return stats?.totalUsers > 0
        ? (
            ((Number(stats.premiumUsers) || 0) /
              (Number(stats.totalUsers) || 1)) *
            100
          ).toFixed(1)
        : "0";
    } catch (error) {
      console.warn("Error calculating premium conversion rate:", error);
      return "0";
    }
  })();

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-bg-light min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading database data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for stats object
  if (!stats || !stats.conversionStats) {
    return (
      <div className="p-6 space-y-6 bg-bg-light min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2 text-yellow-600">
            <AlertCircle className="h-6 w-6" />
            <span>Stats data not available. Please refresh the page.</span>
            <Button onClick={fetchRealData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-bg-light min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-dark mb-2">
            Admin Dashboard - Live Database Data
          </h1>
          <p className="text-text-light">
            Real data from MongoDB database - No sample/script data
          </p>
          {lastUpdate && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Admin User Info */}
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {JSON.parse(localStorage.getItem("user") || "{}").name || "Admin"}
            </span>
            <Badge variant="secondary" className="text-xs">
              Admin
            </Badge>
          </div>

          {/* Logout Button */}
          {onLogout && (
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div></div>

        <div className="flex items-center space-x-4">
          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={fetchRealData} variant="outline" disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </Button>

          <Button
            onClick={toggleLiveMode}
            variant={isLiveMode ? "destructive" : "default"}
          >
            {isLiveMode ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Live Updates
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Live Updates
              </>
            )}
          </Button>

          {isLiveMode && (
            <div className="flex items-center text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
              Live Mode Active
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Database Overview
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center">
            <Monitor className="h-4 w-4 mr-2" />
            Database Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Database Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Database Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users (Database)
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {premiumConversionRate}% premium conversion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Premium Users (Database)
                </CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.premiumUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Operations (Database)
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalOperations.toLocaleString()}
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-muted-foreground flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    {formatBytes(stats.totalFileSize)} processed
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    Database tracking active
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Sessions (Database)
                </CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {realTimeStatus?.recentActivity.activeSessions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current active users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Database System Status */}
          {realTimeStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2 text-green-500" />
                  Database System Health
                  <Badge variant="default" className="ml-2">
                    Database
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Status:</span>
                      <Badge
                        variant={
                          realTimeStatus.systemHealth.databaseConnected
                            ? "default"
                            : "destructive"
                        }
                      >
                        {realTimeStatus.systemHealth.databaseConnected
                          ? "Connected"
                          : "Error"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Schemas:</span>
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
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">IP Tracking:</span>
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
                      <span className="text-sm">Session Tracking:</span>
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
                      <span className="text-sm">Response Time:</span>
                      <span className="text-sm font-medium text-green-600">
                        {realTimeStatus.systemHealth.averageResponseTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Latency:</span>
                      <span className="text-sm font-medium text-green-600">
                        {realTimeStatus.systemHealth.realTimeTrackingLatency}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Today's Conversions:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {realTimeStatus.recentActivity.todayConversions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Recent Usage:</span>
                      <span className="text-sm font-medium text-purple-600">
                        {realTimeStatus.recentActivity.totalRecentUsage}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversion Funnel (Database) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                Conversion Funnel (Database)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.conversionStats.totalIPs}
                  </div>
                  <div className="text-sm text-gray-600">Total IPs</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.conversionStats.ipsHitSoftLimit}
                  </div>
                  <div className="text-sm text-gray-600">Hit Soft Limit</div>
                  <div className="text-xs text-gray-500">
                    {Number(stats.conversionStats.softLimitRate || 0).toFixed(
                      1,
                    )}
                    % rate
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.conversionStats.ipsConverted}
                  </div>
                  <div className="text-sm text-gray-600">Converted</div>
                  <div className="text-xs text-gray-500">
                    {Number(stats.conversionStats.conversionRate || 0).toFixed(
                      1,
                    )}
                    % rate
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.conversionStats.totalIPs > 0
                      ? (
                          (Number(stats.conversionStats.ipsConverted || 0) /
                            Number(stats.conversionStats.totalIPs || 1)) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Overall Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tool Usage by Category (Database Data) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-red-500" />
                  Popular PDF Tools (Database)
                </CardTitle>
                <CardDescription>
                  Real PDF tool usage from database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.popularTools
                    .filter(
                      (tool) =>
                        // PDF tools - look for common PDF tool patterns
                        tool.tool.includes("pdf") ||
                        tool.tool.includes("merge") ||
                        tool.tool.includes("split") ||
                        tool.tool.includes("word-to") ||
                        tool.tool.includes("to-word") ||
                        tool.tool.includes("jpg-to") ||
                        tool.tool.includes("to-jpg") ||
                        tool.tool.includes("png-to") ||
                        tool.tool.includes("to-png") ||
                        tool.tool.includes("excel-to") ||
                        tool.tool.includes("to-excel") ||
                        tool.tool.includes("powerpoint-to") ||
                        tool.tool.includes("to-powerpoint") ||
                        tool.tool.includes("watermark") ||
                        tool.tool.includes("protect") ||
                        tool.tool.includes("unlock") ||
                        tool.tool.includes("rotate"),
                    )
                    .slice(0, 10).length > 0 ? (
                    stats.popularTools
                      .filter(
                        (tool) =>
                          // PDF tools - look for common PDF tool patterns
                          tool.tool.includes("pdf") ||
                          tool.tool.includes("merge") ||
                          tool.tool.includes("split") ||
                          tool.tool.includes("word-to") ||
                          tool.tool.includes("to-word") ||
                          tool.tool.includes("jpg-to") ||
                          tool.tool.includes("to-jpg") ||
                          tool.tool.includes("png-to") ||
                          tool.tool.includes("to-png") ||
                          tool.tool.includes("excel-to") ||
                          tool.tool.includes("to-excel") ||
                          tool.tool.includes("powerpoint-to") ||
                          tool.tool.includes("to-powerpoint") ||
                          tool.tool.includes("watermark") ||
                          tool.tool.includes("protect") ||
                          tool.tool.includes("unlock") ||
                          tool.tool.includes("rotate"),
                      )
                      .slice(0, 10)
                      .map((tool, index) => (
                        <div
                          key={tool.tool}
                          className="flex items-center space-x-3"
                        >
                          <span className="w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-medium capitalize">
                                {tool.tool.replace("-", " ")}
                              </span>
                              <span className="text-sm text-gray-600">
                                {tool.count} uses
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{
                                  width: `${(tool.count / (stats.popularTools.filter((t) => t.tool.includes("pdf") || t.tool.includes("merge") || t.tool.includes("split") || t.tool.includes("word-to") || t.tool.includes("to-word") || t.tool.includes("jpg-to") || t.tool.includes("to-jpg") || t.tool.includes("png-to") || t.tool.includes("to-png") || t.tool.includes("excel-to") || t.tool.includes("to-excel") || t.tool.includes("powerpoint-to") || t.tool.includes("to-powerpoint") || t.tool.includes("watermark") || t.tool.includes("protect") || t.tool.includes("unlock") || t.tool.includes("rotate"))[0]?.count || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                            {tool.uniqueUserCount && (
                              <div className="text-xs text-gray-500 mt-1">
                                {tool.uniqueUserCount} unique users
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <div className="flex flex-col items-center space-y-2">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <span>No PDF tool usage data available</span>
                        <p className="text-xs text-gray-400">
                          Real usage data from database
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Image Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Popular Image Tools (Database)
                </CardTitle>
                <CardDescription>
                  Real image tool usage from database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.popularTools
                    .filter(
                      (tool) =>
                        tool.tool.includes("img-") ||
                        [
                          "compress",
                          "convert",
                          "crop",
                          "resize",
                          "background-removal",
                          "meme",
                        ].includes(tool.tool),
                    )
                    .slice(0, 10).length > 0 ? (
                    stats.popularTools
                      .filter(
                        (tool) =>
                          tool.tool.includes("img-") ||
                          [
                            "compress",
                            "convert",
                            "crop",
                            "resize",
                            "background-removal",
                            "meme",
                          ].includes(tool.tool),
                      )
                      .slice(0, 10)
                      .map((tool, index) => (
                        <div
                          key={tool.tool}
                          className="flex items-center space-x-3"
                        >
                          <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-medium capitalize">
                                {tool.tool}
                              </span>
                              <span className="text-sm text-gray-600">
                                {tool.count} uses
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${(tool.count / (stats.popularTools.filter((t) => t.tool.includes("img-") || ["compress", "convert", "crop", "resize", "background-removal", "meme"].includes(t.tool))[0]?.count || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                            {tool.uniqueUserCount && (
                              <div className="text-xs text-gray-500 mt-1">
                                {tool.uniqueUserCount} unique users
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <div className="flex flex-col items-center space-y-2">
                        <TrendingUp className="h-8 w-8 text-gray-400" />
                        <span>No image tool usage data available</span>
                        <p className="text-xs text-gray-400">
                          Real usage data from database
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Favicon Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-500" />
                  Popular Favicon Tools (Database)
                </CardTitle>
                <CardDescription>
                  Real favicon tool usage from database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.popularTools
                    .filter(
                      (tool) =>
                        tool.tool.includes("favicon") ||
                        tool.tool.includes("image-to-favicon"),
                    )
                    .slice(0, 10).length > 0 ? (
                    stats.popularTools
                      .filter(
                        (tool) =>
                          tool.tool.includes("favicon") ||
                          tool.tool.includes("image-to-favicon"),
                      )
                      .slice(0, 10)
                      .map((tool, index) => (
                        <div
                          key={tool.tool}
                          className="flex items-center space-x-3"
                        >
                          <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-medium capitalize">
                                {tool.tool
                                  .replace("favicon-", "")
                                  .replace("-", " ")}
                              </span>
                              <span className="text-sm text-gray-600">
                                {tool.count} uses
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${(tool.count / (stats.popularTools.filter((t) => t.tool.includes("favicon") || t.tool.includes("image-to-favicon"))[0]?.count || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                            {tool.uniqueUserCount && (
                              <div className="text-xs text-gray-500 mt-1">
                                {tool.uniqueUserCount} unique users
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <div className="flex flex-col items-center space-y-2">
                        <Activity className="h-8 w-8 text-gray-400" />
                        <span>No favicon tool usage data available</span>
                        <p className="text-xs text-gray-400">
                          Real usage data from database
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Distribution and Database Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Distribution (Database) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2 text-green-500" />
                  Device Distribution (Database)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.deviceStats.length > 0 ? (
                    stats.deviceStats.map((device) => (
                      <div
                        key={device.deviceType}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium capitalize">
                            {device.deviceType}
                          </span>
                          <Badge variant="outline">{device.count}</Badge>
                        </div>
                        <span className="text-sm text-gray-600">
                          {Number(device.percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No device data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Database Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-purple-500" />
                  Database Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {stats.totalOperations.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600">
                        Total Operations
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {formatBytes(stats.totalFileSize)}
                      </div>
                      <div className="text-xs text-green-600">
                        Files Processed
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">📊 Database Status:</p>
                    <ul className="text-xs space-y-1">
                      <li>• All data shown is from live MongoDB database</li>
                      <li>
                        • Real data shows actual PDF, Image, and Favicon tool
                        usage
                      </li>
                      <li>
                        • Switch to "Database Monitoring" for detailed analytics
                      </li>
                      <li>• Use "Live Updates" to see real-time changes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity (Database) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-500" />
                Recent User Signups (Database)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentSignups.length > 0 ? (
                  stats.recentSignups.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">
                            {user.email.replace(/(.{3}).*(@.*)/, "$1***$2")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {user.isPremium && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              user.isPremium
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.isPremium ? "Premium" : "Free"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(user.createdAt)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user.loginCount} logins
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No recent signups available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <RealTimeMonitoring />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Analytics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.totalUsers}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                  <div className="text-xs text-gray-500">
                    {stats.premiumUsers} premium ({premiumConversionRate}%)
                  </div>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {stats.totalOperations.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Operations</div>
                  <div className="text-xs text-gray-500">
                    Avg: {formatBytes(stats.averageFileSize)}
                  </div>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {Number(stats.conversionStats.conversionRate || 0).toFixed(
                      1,
                    )}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                  <div className="text-xs text-gray-500">
                    {stats.conversionStats.ipsConverted} conversions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
