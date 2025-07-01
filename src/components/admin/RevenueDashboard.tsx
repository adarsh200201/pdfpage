import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Activity,
  Crown,
  Star,
  Calendar,
} from "lucide-react";

export function RevenueDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    dailyConversions: 0,
    monthlyRevenue: 0,
    popularTools: [],
    recentActivity: [],
  });

  useEffect(() => {
    // Simulate real-time data (replace with actual API calls)
    const updateStats = () => {
      setStats({
        totalUsers: Math.floor(Math.random() * 10000) + 50000,
        premiumUsers: Math.floor(Math.random() * 1000) + 5000,
        dailyConversions: Math.floor(Math.random() * 100) + 200,
        monthlyRevenue: Math.floor(Math.random() * 5000) + 25000,
        popularTools: [
          { name: "PDF to JPG", uses: 15420, revenue: 2840 },
          { name: "PDF to Word", uses: 12330, revenue: 2156 },
          { name: "Word to PDF", uses: 11850, revenue: 1998 },
          { name: "Merge PDF", uses: 18500, revenue: 1850 },
          { name: "Compress PDF", uses: 14200, revenue: 1420 },
          { name: "Split PDF", uses: 13100, revenue: 1310 },
        ],
        recentActivity: [
          {
            tool: "PDF to JPG",
            user: "user_***2341",
            revenue: 9.99,
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
          },
          {
            tool: "PDF to Word",
            user: "user_***5678",
            revenue: 9.99,
            timestamp: new Date(Date.now() - 1000 * 60 * 12),
          },
          {
            tool: "Word to PDF",
            user: "user_***9012",
            revenue: 9.99,
            timestamp: new Date(Date.now() - 1000 * 60 * 18),
          },
          {
            tool: "PDF to JPG",
            user: "user_***3456",
            revenue: 9.99,
            timestamp: new Date(Date.now() - 1000 * 60 * 25),
          },
          {
            tool: "Merge PDF",
            user: "user_***7890",
            revenue: 9.99,
            timestamp: new Date(Date.now() - 1000 * 60 * 33),
          },
        ],
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const conversionRate = (
    (stats.premiumUsers / stats.totalUsers) *
    100
  ).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.premiumUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Daily Conversions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dailyConversions}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from yesterday
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
            <div className="text-2xl font-bold">
              ${stats.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +23.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Popular Tools (Revenue)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularTools.map((tool, index) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tool.name}</p>
                      <p className="text-xs text-gray-500">
                        {tool.uses.toLocaleString()} uses
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      ${tool.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">this month</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-500" />
              Recent Premium Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Crown className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.tool}</p>
                      <p className="text-xs text-gray-500">{activity.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      ${activity.revenue}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.floor(
                        (Date.now() - activity.timestamp.getTime()) / 1000 / 60,
                      )}
                      m ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tool Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-500" />
            Tool Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Merge PDF", status: "live", revenue: true },
              { name: "Split PDF", status: "live", revenue: true },
              { name: "Compress PDF", status: "live", revenue: true },
              {
                name: "PDF to JPG",
                status: "live",
                revenue: true,
                isNew: true,
              },
              {
                name: "PDF to Word",
                status: "live",
                revenue: true,
                isNew: true,
              },
              {
                name: "Word to PDF",
                status: "live",
                revenue: true,
                isNew: true,
              },
              { name: "PDF to Excel", status: "coming-soon", revenue: false },
              { name: "Excel to PDF", status: "coming-soon", revenue: false },
              {
                name: "PDF to PowerPoint",
                status: "coming-soon",
                revenue: false,
              },
              {
                name: "PowerPoint to PDF",
                status: "coming-soon",
                revenue: false,
              },
              { name: "Edit PDF", status: "coming-soon", revenue: false },
              { name: "Sign PDF", status: "coming-soon", revenue: false },
            ].map((tool) => (
              <div
                key={tool.name}
                className={`p-3 rounded-lg border-2 ${
                  tool.status === "live"
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      tool.status === "live" ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
                <p className="font-medium text-sm">{tool.name}</p>
                <p
                  className={`text-xs ${
                    tool.status === "live" ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {tool.status === "live"
                    ? "Generating Revenue"
                    : "Coming Soon"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">
            Next Implementation Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-blue-700">
              🎯 <strong>High Revenue Potential:</strong> PDF to Excel, Excel to
              PDF, PDF to PowerPoint
            </p>
            <p className="text-blue-700">
              💡 <strong>Quick Wins:</strong> Edit PDF, Sign PDF, Watermark PDF
            </p>
            <p className="text-blue-700">
              📈 <strong>Revenue Impact:</strong> Each new working tool adds
              ~$2,000-3,000 monthly revenue
            </p>
            <div className="flex space-x-2 mt-4">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Implement PDF to Excel
              </Button>
              <Button size="sm" variant="outline">
                View Full Roadmap
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
