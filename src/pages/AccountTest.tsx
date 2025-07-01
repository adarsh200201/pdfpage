import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Monitor,
  Activity,
  Clock,
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface TestResult {
  testId: string;
  timestamp: string;
  schemas: {
    user: { success: boolean; timeMs: number; features: any };
    ipUsageLog: { success: boolean; timeMs: number; features: any };
    usage: { success: boolean; timeMs: number; features: any };
    feedback: { success: boolean; timeMs: number; features: any };
  };
  realTimeTracking: {
    success: boolean;
    timeMs: number;
    features: any;
    screenTimeTracking: any;
  };
  performance: {
    totalTimeMs: number;
    averageSchemaTimeMs: number;
    realTimeTrackingTimeMs: number;
    performance: string;
  };
}

const AccountTest: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [realTimeStatus, setRealTimeStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [screenTime, setScreenTime] = useState(0);
  const [pageLoadTime] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Screen time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setScreenTime(Math.floor((Date.now() - pageLoadTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [pageLoadTime]);

  // Real-time status monitoring
  useEffect(() => {
    if (isMonitoring) {
      fetchRealTimeStatus();
      intervalRef.current = setInterval(fetchRealTimeStatus, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring]);

  const fetchRealTimeStatus = async () => {
    try {
      const response = await fetch("/api/schema-test/real-time-status");
      if (response.ok) {
        const data = await response.json();
        setRealTimeStatus(data.status);
      }
    } catch (error) {
      console.error("Error fetching real-time status:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generateTestData = () => {
    const timestamp = Date.now();
    setFormData({
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@pdfpage-test.com`,
      password: "TestPassword123!",
    });
  };

  const runSchemaTest = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/schema-test/create-test-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testData: formData,
          screenTimeInSec: screenTime,
          pageLoadTime: pageLoadTime,
          realTimeTest: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult(data.testResults);
        await fetchRealTimeStatus(); // Refresh status after test
      } else {
        setError(data.message || "Schema test failed");
      }
    } catch (error) {
      setError(`Error running schema test: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const createRealAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          signupSource: "account_test",
          screenTimeInSec: screenTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setError(null);
        alert(
          `Account created successfully! User ID: ${data.user.id}\nToken: ${data.token.substring(0, 20)}...`,
        );
        // Auto-run schema test after account creation
        await runSchemaTest();
      } else {
        setError(data.message || "Account creation failed");
      }
    } catch (error) {
      setError(`Error creating account: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => `${ms}ms`;
  const formatPerformance = (perf: string) => {
    const colors = {
      excellent: "text-green-600",
      good: "text-yellow-600",
      needs_optimization: "text-red-600",
    };
    return colors[perf as keyof typeof colors] || "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Real-Time Schema Testing
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Test account creation and validate all database schemas with
            real-time IP tracking, screen time monitoring, and conversion
            analytics.
          </p>
        </div>

        {/* Real-Time Monitoring Toggle */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? "destructive" : "default"}
            className="flex items-center"
          >
            <Activity className="h-4 w-4 mr-2" />
            {isMonitoring ? "Stop" : "Start"} Real-Time Monitoring
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Account Creation Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Creation Test
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button
                    onClick={generateTestData}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Test Data
                  </Button>

                  <Button
                    onClick={runSchemaTest}
                    className="w-full"
                    disabled={loading || !formData.email}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Test All Schemas
                  </Button>

                  <Button
                    onClick={createRealAccount}
                    variant="secondary"
                    className="w-full"
                    disabled={loading || !formData.email}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <User className="h-4 w-4 mr-2" />
                    )}
                    Create Real Account
                  </Button>
                </div>

                {/* Screen Time Display */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Screen Time:
                    </span>
                    <Badge variant="outline">{screenTime}s</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-Time Status and Test Results */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Real-Time Status */}
            {realTimeStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Monitor className="h-5 w-5 mr-2" />
                    Real-Time Status
                    {isMonitoring && (
                      <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="font-medium">IP Tracking</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>IP Address:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {realTimeStatus.ipAddress}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Usage:</span>
                          <Badge variant="outline">
                            {realTimeStatus.realTimeTracking.currentUsage}/3
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Soft Limit:</span>
                          <Badge
                            variant={
                              realTimeStatus.realTimeTracking
                                .shouldShowSoftLimit
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {realTimeStatus.realTimeTracking.shouldShowSoftLimit
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">System Health</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Database:</span>
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
                        <div className="flex justify-between">
                          <span>Latency:</span>
                          <span className="text-green-600">
                            {
                              realTimeStatus.systemHealth
                                .realTimeTrackingLatency
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Response Time:</span>
                          <span className="text-green-600">
                            {realTimeStatus.systemHealth.averageResponseTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Activity</h4>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {realTimeStatus.recentActivity.totalRecentUsage}
                        </div>
                        <div className="text-xs">Recent Usage</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {realTimeStatus.recentActivity.activeSessions}
                        </div>
                        <div className="text-xs">Active Sessions</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="text-2xl font-bold text-purple-600">
                          {realTimeStatus.recentActivity.todayConversions}
                        </div>
                        <div className="text-xs">Today's Conversions</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schema Test Results */}
            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Schema Test Results
                  </CardTitle>
                  <div className="text-sm text-gray-600">
                    Test ID: {testResult.testId} | Total Time:{" "}
                    <span
                      className={formatPerformance(
                        testResult.performance.performance,
                      )}
                    >
                      {formatTime(testResult.performance.totalTimeMs)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* User Schema Results */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">User Schema</h4>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span className="text-green-600">
                            {formatTime(testResult.schemas.user.timeMs)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Password Hashing:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex justify-between">
                          <span>Virtual Fields:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex justify-between">
                          <span>User Methods:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                      </div>
                    </div>

                    {/* IP Usage Schema Results */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">IP Usage Schema</h4>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span className="text-green-600">
                            {formatTime(testResult.schemas.ipUsageLog.timeMs)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Usage Count:</span>
                          <Badge variant="outline">
                            {testResult.schemas.ipUsageLog.features.usageCount}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Session Tracking:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex justify-between">
                          <span>Conversion Tracking:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                      </div>
                    </div>

                    {/* Usage Schema Results */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Usage Schema</h4>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span className="text-green-600">
                            {formatTime(testResult.schemas.usage.timeMs)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Device Detection:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex justify-between">
                          <span>Tool Category:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex justify-between">
                          <span>Real-time Updates:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                      </div>
                    </div>

                    {/* Feedback Schema Results */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Feedback Schema</h4>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span className="text-green-600">
                            {formatTime(testResult.schemas.feedback.timeMs)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>User Association:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex justify-between">
                          <span>Timestamps:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex justify-between">
                          <span>Metadata Support:</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Real-Time Features */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Real-Time Features Validation
                    </h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium">Screen Time</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {testResult.realTimeTracking.screenTimeTracking
                            ?.timeOnPage || screenTime}
                          s
                        </div>
                        <div className="text-xs text-gray-500">
                          Real-time tracking
                        </div>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium">IP Tracking</div>
                        <div className="text-2xl font-bold text-green-600">
                          {testResult.realTimeTracking.features.ipTracking
                            ?.currentUsage || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          Current usage count
                        </div>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium">Performance</div>
                        <div
                          className={`text-2xl font-bold ${formatPerformance(testResult.performance.performance)}`}
                        >
                          {testResult.performance.performance
                            .replace(/_/g, " ")
                            .toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">
                          System performance
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountTest;
