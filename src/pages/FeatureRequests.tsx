import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Users,
  MessageSquare,
} from "lucide-react";

const FeatureRequests = () => {
  const popularRequests = [
    {
      id: 1,
      title: "Batch OCR Processing",
      description: "Add OCR text recognition for multiple PDFs at once",
      votes: 342,
      status: "In Progress",
      category: "OCR",
      author: "Sarah M.",
      date: "Dec 10, 2024",
      comments: 28,
    },
    {
      id: 2,
      title: "Dark Mode Interface",
      description: "Implement dark theme option for better user experience",
      votes: 287,
      status: "Planned",
      category: "UI/UX",
      author: "Alex K.",
      date: "Dec 8, 2024",
      comments: 45,
    },
    {
      id: 3,
      title: "API Rate Limit Increase",
      description: "Higher rate limits for enterprise API customers",
      votes: 156,
      status: "Under Review",
      category: "API",
      author: "Michael R.",
      date: "Dec 5, 2024",
      comments: 12,
    },
    {
      id: 4,
      title: "Mobile App Development",
      description: "Native iOS and Android apps for PDF processing",
      votes: 423,
      status: "Planned",
      category: "Mobile",
      author: "Emma L.",
      date: "Nov 28, 2024",
      comments: 67,
    },
    {
      id: 5,
      title: "Advanced PDF Editing",
      description: "More comprehensive text and image editing capabilities",
      votes: 198,
      status: "In Progress",
      category: "Editing",
      author: "David C.",
      date: "Nov 25, 2024",
      comments: 34,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Planned":
        return "bg-green-100 text-green-800 border-green-200";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Progress":
        return <Clock className="h-3 w-3" />;
      case "Planned":
        return <AlertCircle className="h-3 w-3" />;
      case "Completed":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red/5 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-text-dark mb-6">
              Feature <span className="text-brand-red">Requests</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Help shape the future of PdfPage by suggesting new features and
              voting on existing requests
            </p>
            <Button size="lg" className="bg-brand-red hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Submit New Request
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feature Requests List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-dark">
                Popular Requests
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Most Voted
                </Button>
                <Button variant="outline" size="sm">
                  Recent
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {popularRequests.map((request) => (
                <Card
                  key={request.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Vote Button */}
                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-12 h-12 flex flex-col gap-0 p-1"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span className="text-xs font-bold">
                            {request.votes}
                          </span>
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-text-dark">
                            {request.title}
                          </h3>
                          <Badge
                            className={`ml-2 flex items-center gap-1 ${getStatusColor(request.status)}`}
                          >
                            {getStatusIcon(request.status)}
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-text-medium mb-3">
                          {request.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-text-light">
                          <Badge variant="secondary">{request.category}</Badge>
                          <span>by {request.author}</span>
                          <span>{request.date}</span>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{request.comments} comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submit Request Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-brand-red" />
                  Submit a Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Feature Title</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the feature"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option>Select a category</option>
                    <option>PDF Tools</option>
                    <option>UI/UX</option>
                    <option>API</option>
                    <option>Mobile</option>
                    <option>Security</option>
                    <option>Performance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the feature and why it would be useful..."
                    rows={4}
                  />
                </div>
                <Button className="w-full bg-brand-red hover:bg-red-700">
                  Submit Request
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-red" />
                    <span className="text-sm text-text-medium">
                      Active Contributors
                    </span>
                  </div>
                  <span className="font-semibold">1,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-brand-red" />
                    <span className="text-sm text-text-medium">
                      Total Requests
                    </span>
                  </div>
                  <span className="font-semibold">2,834</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-brand-red" />
                    <span className="text-sm text-text-medium">
                      Features Implemented
                    </span>
                  </div>
                  <span className="font-semibold">156</span>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-text-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Be specific and clear in your description
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Search existing requests before submitting
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Explain the use case and benefits
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Keep it relevant to PDF processing
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FeatureRequests;
