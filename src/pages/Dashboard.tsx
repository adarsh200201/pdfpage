import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Progress removed - no daily usage limits
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Crown,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Settings,
  CreditCard,
  Shield,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<any[]>([]);
  const [totalOperations, setTotalOperations] = useState(0);
  const [todayOperations, setTodayOperations] = useState(0);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:5000/api/auth/me"
        : "/api/auth/me";
      const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch user profile");
      const data = await response.json();
      // Use stats from the profile response - the auth/me endpoint returns user data directly
      setTotalOperations(data.user?.totalUploads || 0);
      setTodayOperations(data.user?.dailyUploads || 0);
      setUsageData([]); // Optionally, fill with real chart data if available
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
    }
  };

  // All users have unlimited usage - no daily limits
  const remainingToday = "Unlimited";
  const usagePercentage = 0;

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-heading-medium text-text-dark mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-body-large text-text-light">
              Here's your PDF processing overview
            </p>
          </div>

          {!user?.isPremium && (
            <Button
              asChild
              className="bg-brand-yellow text-black hover:bg-yellow-400"
            >
              <Link to="/pricing">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Usage
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayOperations}</div>
              <p className="text-xs text-muted-foreground">
                {remainingToday} remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Operations
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOperations}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
              {user?.isPremium ? (
                <Crown className="h-4 w-4 text-yellow-500" />
              ) : (
                <Shield className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.isPremium ? "Premium" : "Free"}
              </div>
              <p className="text-xs text-muted-foreground">
                {user?.isPremium
                  ? `Expires ${user.premiumExpiryDate}`
                  : "Limited features"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Files Processed
              </CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user?.totalUploads ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Successfully</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Usage Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="operations" fill="#E5322D" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Plan Info */}
          <div className="space-y-6">
            {/* Plan Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {user?.isPremium ? (
                    <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                  ) : (
                    <Shield className="w-5 h-5 mr-2" />
                  )}
                  Your Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.isPremium ? (
                  <div>
                    <p className="font-semibold text-yellow-600">
                      Premium Active
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unlimited operations
                    </p>
                    <p className="text-sm text-muted-foreground">
                      No ads • Priority support
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold">Free Plan</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Unlimited tool usage • Login after 2 tools for convenience
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-brand-red hover:bg-red-600"
                    >
                      <Link to="/pricing">Upgrade for Premium Features</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link to="/merge">
                    <FileText className="w-4 h-4 mr-2" />
                    Merge PDFs
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link to="/compress">
                    <Zap className="w-4 h-4 mr-2" />
                    Compress PDF
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Link>
                </Button>
                {user?.isPremium && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link to="/billing">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing & Usage
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user?.lastActivity ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-dark">
                          PDF processed
                        </p>
                        <p className="text-xs text-text-light">
                          {new Date(user.lastActivity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-text-light">No recent activity</p>
                      <p className="text-sm text-text-light">
                        Start processing PDFs to see your activity
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
