import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  Download,
  Clock,
  Shield,
  Star,
  Globe,
  Zap,
  CheckCircle,
  Award,
  Heart,
  Activity,
  Eye,
  FileCheck
} from "lucide-react";

interface LiveStatsProps {
  variant?: "dashboard" | "banner" | "sidebar";
  toolSpecific?: boolean;
  toolName?: string;
}

const LiveStats = ({ 
  variant = "banner", 
  toolSpecific = false,
  toolName = "PDF Tools"
}: LiveStatsProps) => {
  const [stats, setStats] = useState({
    activeUsers: 2847,
    totalProcessed: 45234891,
    monthlyUsers: 2567000,
    satisfactionRate: 98.5,
    averageTime: 3.2,
    countriesServed: 195,
    filesProcessedToday: 89653,
    upgradeRequests: 0 // Always 0 since we're free
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        totalProcessed: prev.totalProcessed + Math.floor(Math.random() * 3),
        filesProcessedToday: prev.filesProcessedToday + Math.floor(Math.random() * 2)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  if (variant === "dashboard") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.activeUsers)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from yesterday
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full -mr-12 -mt-12 opacity-10"></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Files Processed</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalProcessed)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <Activity className="w-3 h-3 mr-1" />
                  Real-time updates
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500 rounded-full -mr-12 -mt-12 opacity-10"></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats.satisfactionRate}%</p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">15,420+ reviews</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500 rounded-full -mr-12 -mt-12 opacity-10"></div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageTime}s</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Zap className="w-3 h-3 mr-1" />
                  Lightning fast
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500 rounded-full -mr-12 -mt-12 opacity-10"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Live Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Online Now</span>
                </div>
                <span className="font-medium text-sm">{formatNumber(stats.activeUsers)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Today's Files</span>
                <span className="font-medium text-sm">{formatNumber(stats.filesProcessedToday)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Satisfaction</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">{stats.satisfactionRate}%</span>
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Trust Signals</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-600" />
                SSL Secured
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Heart className="w-4 h-4 text-red-600" />
                100% Free Forever
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                No Registration
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4 text-purple-600" />
                {stats.countriesServed} Countries
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-8 px-6 rounded-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Trusted by Millions Worldwide
        </h2>
        <p className="text-blue-100">
          {toolSpecific ? `${toolName} Statistics` : "PDFPage Live Statistics"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div className="text-3xl font-bold mb-1">{formatNumber(stats.monthlyUsers)}</div>
          <div className="text-blue-100 text-sm">Monthly Users</div>
        </div>
        
        <div>
          <div className="text-3xl font-bold mb-1">{formatNumber(stats.totalProcessed)}</div>
          <div className="text-blue-100 text-sm">Files Processed</div>
        </div>
        
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-3xl font-bold">{stats.satisfactionRate}%</span>
            <Star className="w-6 h-6 text-yellow-400 fill-current" />
          </div>
          <div className="text-blue-100 text-sm">Satisfaction Rate</div>
        </div>
        
        <div>
          <div className="text-3xl font-bold mb-1">{stats.countriesServed}+</div>
          <div className="text-blue-100 text-sm">Countries</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-5 h-5 text-green-300" />
          <span className="text-sm">100% Secure</span>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 text-red-300" />
          <span className="text-sm">Always Free</span>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-yellow-300" />
          <span className="text-sm">Lightning Fast</span>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-300" />
          <span className="text-sm">No Registration</span>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-blue-100">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        {formatNumber(stats.activeUsers)} users online right now
      </div>
    </div>
  );
};

export default LiveStats;
