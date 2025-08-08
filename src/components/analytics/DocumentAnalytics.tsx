import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Clock,
  Download,
  Users,
  FileText,
  Signature,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  Target,
  Zap,
  Filter
} from 'lucide-react';

interface DocumentMetrics {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  created: string;
  views: number;
  timeSpent: number; // minutes
  downloads: number;
  signatures: number;
  totalSigners: number;
  completionRate: number;
  avgTimeToSign: number; // hours
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  locations: string[];
  engagement: {
    pageViews: number[];
    timeSpentPerPage: number[];
  };
}

const mockDocuments: DocumentMetrics[] = [
  {
    id: '1',
    name: 'Sales Proposal - TechCorp Q1 2024',
    status: 'completed',
    created: '2024-01-15',
    views: 47,
    timeSpent: 128,
    downloads: 12,
    signatures: 3,
    totalSigners: 3,
    completionRate: 100,
    avgTimeToSign: 18.5,
    devices: { desktop: 32, mobile: 12, tablet: 3 },
    locations: ['New York, US', 'London, UK', 'Toronto, CA'],
    engagement: {
      pageViews: [12, 8, 15, 7, 5],
      timeSpentPerPage: [45, 32, 78, 23, 18]
    }
  },
  {
    id: '2',
    name: 'Service Agreement - StartupXYZ',
    status: 'in_progress',
    created: '2024-01-20',
    views: 23,
    timeSpent: 67,
    downloads: 3,
    signatures: 1,
    totalSigners: 2,
    completionRate: 50,
    avgTimeToSign: 24.2,
    devices: { desktop: 18, mobile: 4, tablet: 1 },
    locations: ['San Francisco, US', 'Austin, US'],
    engagement: {
      pageViews: [8, 6, 5, 3, 1],
      timeSpentPerPage: [52, 28, 35, 15, 8]
    }
  },
  {
    id: '3',
    name: 'Employment Contract - John Smith',
    status: 'pending',
    created: '2024-01-22',
    views: 8,
    timeSpent: 23,
    downloads: 1,
    signatures: 0,
    totalSigners: 1,
    completionRate: 0,
    avgTimeToSign: 0,
    devices: { desktop: 6, mobile: 2, tablet: 0 },
    locations: ['Chicago, US'],
    engagement: {
      pageViews: [3, 2, 2, 1, 0],
      timeSpentPerPage: [15, 8, 0, 0, 0]
    }
  }
];

const DocumentAnalytics = () => {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredDocuments = mockDocuments.filter(doc => 
    filterStatus === 'all' || doc.status === filterStatus
  );

  const overallMetrics = {
    totalDocuments: mockDocuments.length,
    totalViews: mockDocuments.reduce((sum, doc) => sum + doc.views, 0),
    totalSignatures: mockDocuments.reduce((sum, doc) => sum + doc.signatures, 0),
    avgCompletionRate: mockDocuments.reduce((sum, doc) => sum + doc.completionRate, 0) / mockDocuments.length,
    avgTimeToSign: mockDocuments.reduce((sum, doc) => sum + doc.avgTimeToSign, 0) / mockDocuments.length
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Document Analytics</h1>
          <p className="text-gray-600">Track performance and engagement metrics for your documents</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold">{overallMetrics.totalDocuments}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{overallMetrics.totalViews}</p>
              </div>
              <Eye className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signatures</p>
                <p className="text-2xl font-bold">{overallMetrics.totalSignatures}</p>
              </div>
              <Signature className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+8%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{overallMetrics.avgCompletionRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              <span className="text-red-600">-3%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Time to Sign</p>
                <p className="text-2xl font-bold">{overallMetrics.avgTimeToSign.toFixed(1)}h</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">-5%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Document Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedDocument === doc.id ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDocument(selectedDocument === doc.id ? null : doc.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <h3 className="font-semibold">{doc.name}</h3>
                      <p className="text-sm text-gray-600">Created {new Date(doc.created).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-right">
                      <p className="font-semibold">{doc.completionRate}%</p>
                      <p className="text-sm text-gray-600">completed</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 lg:grid-cols-6 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span>{doc.views} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{formatTime(doc.timeSpent)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-gray-400" />
                    <span>{doc.downloads} downloads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Signature className="w-4 h-4 text-gray-400" />
                    <span>{doc.signatures}/{doc.totalSigners} signed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span>{doc.avgTimeToSign}h avg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{doc.locations.length} locations</span>
                  </div>
                </div>

                {selectedDocument === doc.id && (
                  <div className="mt-6 space-y-4 border-t pt-4">
                    {/* Device Breakdown */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Device Usage
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <Monitor className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                          <p className="font-semibold">{doc.devices.desktop}</p>
                          <p className="text-xs text-gray-600">Desktop</p>
                        </div>
                        <div className="text-center">
                          <Smartphone className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                          <p className="font-semibold">{doc.devices.mobile}</p>
                          <p className="text-xs text-gray-600">Mobile</p>
                        </div>
                        <div className="text-center">
                          <Tablet className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                          <p className="font-semibold">{doc.devices.tablet}</p>
                          <p className="text-xs text-gray-600">Tablet</p>
                        </div>
                      </div>
                    </div>

                    {/* Page Engagement */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Page Engagement
                      </h4>
                      <div className="grid grid-cols-5 gap-2">
                        {doc.engagement.pageViews.map((views, index) => (
                          <div key={index} className="text-center">
                            <div 
                              className="bg-emerald-200 rounded-t"
                              style={{ height: `${(views / Math.max(...doc.engagement.pageViews)) * 60}px` }}
                            />
                            <div className="text-xs mt-1">
                              <p className="font-semibold">{views}</p>
                              <p className="text-gray-600">Page {index + 1}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Locations */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Viewing Locations
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {doc.locations.map((location, index) => (
                          <Badge key={index} variant="outline">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Performance Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Increase Engagement</h4>
              <p className="text-blue-800 text-sm">
                Documents with personalized content see 40% higher engagement rates. Try customizing your templates.
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <h4 className="font-semibold text-emerald-900 mb-2">Faster Signatures</h4>
              <p className="text-emerald-800 text-sm">
                Adding clear instructions and deadlines can reduce signing time by up to 25%.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Mobile Optimization</h4>
              <p className="text-purple-800 text-sm">
                35% of signatures happen on mobile. Ensure your documents are mobile-friendly.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">Follow-up Strategy</h4>
              <p className="text-orange-800 text-sm">
                Automated reminders can improve completion rates by 60%. Set up reminder workflows.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentAnalytics;
