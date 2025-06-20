import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Database,
  Crown,
  Calendar,
  Activity,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  totalOperations: number;
  monthlyRevenue: number;
  dailyActiveUsers: number;
  popularTools: Array<{
    tool: string;
    count: number;
  }>;
  recentSignups: Array<{
    name: string;
    email: string;
    date: string;
    isPremium: boolean;
  }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    premiumUsers: 0,
    totalOperations: 0,
    monthlyRevenue: 0,
    dailyActiveUsers: 0,
    popularTools: [],
    recentSignups: [],
  });

  useEffect(() => {
    // In a real app, fetch from admin API
    // This is mock data to show what MongoDB stores
    setStats({
      totalUsers: 1247,
      premiumUsers: 156,
      totalOperations: 12456,
      monthlyRevenue: 46644, // ₹46,644
      dailyActiveUsers: 89,
      popularTools: [
        { tool: "merge", count: 4567 },
        { tool: "compress", count: 3456 },
        { tool: "split", count: 2345 },
        { tool: "pdf-to-word", count: 1234 },
      ],
      recentSignups: [
        {
          name: "Rahul Sharma",
          email: "rahul@example.com",
          date: "2025-01-18",
          isPremium: true,
        },
        {
          name: "Priya Patel",
          email: "priya@example.com",
          date: "2025-01-18",
          isPremium: false,
        },
        {
          name: "Amit Kumar",
          email: "amit@example.com",
          date: "2025-01-17",
          isPremium: true,
        },
      ],
    });
  }, []);

  const premiumConversionRate = (
    (stats.premiumUsers / stats.totalUsers) *
    100
  ).toFixed(1);

  return (
    <div className="p-6 space-y-6 bg-bg-light min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-dark mb-2">
          MongoDB Data Dashboard
        </h1>
        <p className="text-text-light">
          Real-time insights from your PDF processing business
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.premiumUsers}</div>
            <p className="text-xs text-muted-foreground">
              {premiumConversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.monthlyRevenue}</div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Operations
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOperations}</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MongoDB Collections Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-green-500" />
              MongoDB Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Users Collection</h4>
                  <p className="text-sm text-gray-600">
                    User profiles, premium status, payment history
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {stats.totalUsers} docs
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Usage Collection</h4>
                  <p className="text-sm text-gray-600">
                    Tool usage, analytics, daily limits tracking
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  {stats.totalOperations} docs
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Payments Collection</h4>
                  <p className="text-sm text-gray-600">
                    Razorpay transactions, subscription data
                  </p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                  {stats.premiumUsers} docs
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Popular Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.popularTools.map((tool, index) => (
                <div key={tool.tool} className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
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
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(tool.count / stats.popularTools[0].count) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-500" />
            Recent User Signups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentSignups.map((user, index) => (
              <div
                key={index}
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
                    <p className="text-sm text-gray-600">{user.email}</p>
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
                  <p className="text-xs text-gray-500 mt-1">{user.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MongoDB Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Why MongoDB is Perfect for PDF Business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600">
                💰 Revenue Tracking
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Payment history per user</li>
                <li>• Subscription status tracking</li>
                <li>• Revenue analytics by plan</li>
                <li>• Churn rate calculations</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-blue-600">
                📊 Usage Analytics
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Tool popularity metrics</li>
                <li>• Daily/monthly active users</li>
                <li>• File processing statistics</li>
                <li>• Performance monitoring</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-purple-600">
                👥 User Management
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• User profiles and preferences</li>
                <li>• Authentication and security</li>
                <li>• Premium vs free user tracking</li>
                <li>• Support ticket history</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-orange-600">
                🚀 Business Growth
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Conversion rate optimization</li>
                <li>• Feature usage insights</li>
                <li>• User behavior patterns</li>
                <li>• Marketing campaign tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
