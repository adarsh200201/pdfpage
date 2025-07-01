import { useState, useRef, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bug,
  Send,
  MessageCircle,
  AlertTriangle,
  FileText,
  Camera,
  Clock,
  CheckCircle,
  User,
  Bot,
  Upload,
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  type?: "text" | "bug-report" | "system";
}

const ReportBug = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content:
        "Hi! I'm here to help you report bugs and get them resolved quickly. What issue are you experiencing?",
      sender: "assistant",
      timestamp: new Date(),
      type: "system",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [bugForm, setBugForm] = useState({
    title: "",
    description: "",
    severity: "medium",
    category: "",
    steps: "",
    expectedBehavior: "",
    actualBehavior: "",
  });
  const [showBugForm, setShowBugForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(
      () => {
        const assistantResponse = generateResponse(inputMessage);
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: assistantResponse,
          sender: "assistant",
          timestamp: new Date(),
          type: "text",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);
      },
      1000 + Math.random() * 2000,
    );
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (
      input.includes("pdf") &&
      (input.includes("crash") || input.includes("error"))
    ) {
      return "I understand you're experiencing PDF-related crashes. Let me help you troubleshoot this. Can you tell me:\n\n1. What specific PDF tool were you using?\n2. What size was the PDF file?\n3. Did you see any error message?\n\nI can also help you create a detailed bug report if needed.";
    }

    if (input.includes("upload") || input.includes("file")) {
      return "Upload issues can be frustrating! Let me help you. Are you:\n\n• Having trouble uploading files?\n• Getting error messages during upload?\n• Files taking too long to process?\n\nPlease share more details and I'll guide you through the troubleshooting steps.";
    }

    if (input.includes("slow") || input.includes("performance")) {
      return "Performance issues can impact your workflow. I'll help you identify the cause:\n\n• What tool is running slowly?\n• How large are the files you're processing?\n• What browser are you using?\n\nWould you like me to create a performance bug report for our technical team?";
    }

    if (input.includes("bug report") || input.includes("report")) {
      setShowBugForm(true);
      return "Perfect! I'll help you create a comprehensive bug report. I've opened the detailed bug report form below. Please fill it out with as much information as possible - this helps our engineers fix the issue faster.";
    }

    // Default responses
    const responses = [
      "Thanks for reporting this issue. Can you provide more details about what exactly happened?",
      "I want to make sure I understand the problem correctly. Could you walk me through the steps you took before encountering this issue?",
      "That sounds frustrating! Let me help you document this properly so our team can investigate. What browser and device are you using?",
      "I'm here to help resolve this issue. Can you tell me if this happens consistently or just occasionally?",
      "Let's get this fixed for you! Would you like to create a detailed bug report, or do you need immediate troubleshooting help?",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSubmitBugReport = () => {
    const bugReportMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `**Bug Report Submitted:**\n\n**Title:** ${bugForm.title}\n**Severity:** ${bugForm.severity}\n**Category:** ${bugForm.category}\n\n**Description:** ${bugForm.description}`,
      sender: "user",
      timestamp: new Date(),
      type: "bug-report",
    };

    setMessages((prev) => [...prev, bugReportMessage]);
    setShowBugForm(false);
    setBugForm({
      title: "",
      description: "",
      severity: "medium",
      category: "",
      steps: "",
      expectedBehavior: "",
      actualBehavior: "",
    });

    // Assistant confirmation
    setTimeout(() => {
      const confirmationMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          "✅ Bug report submitted successfully! Our engineering team has been notified and will investigate this issue. You can expect an update within 24-48 hours. Is there anything else I can help you with?",
        sender: "assistant",
        timestamp: new Date(),
        type: "system",
      };
      setMessages((prev) => [...prev, confirmationMessage]);
    }, 1000);
  };

  const quickActions = [
    {
      label: "PDF Tool Error",
      action: () => setInputMessage("I'm getting an error with a PDF tool"),
    },
    {
      label: "Upload Issue",
      action: () => setInputMessage("I can't upload my file"),
    },
    {
      label: "Performance Problem",
      action: () => setInputMessage("The tool is running very slowly"),
    },
    {
      label: "Create Bug Report",
      action: () => setInputMessage("I want to create a detailed bug report"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <Bug className="h-8 w-8 text-brand-red" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-text-dark mb-4">
              Report a <span className="text-brand-red">Bug</span>
            </h1>
            <p className="text-lg text-text-medium">
              Found an issue? Let's get it fixed! Chat with our AI assistant for
              instant help or submit a detailed bug report.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-brand-red" />
                  Bug Report Assistant
                  <Badge variant="secondary" className="ml-auto">
                    Online
                  </Badge>
                </CardTitle>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.sender === "assistant" && (
                        <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-brand-red text-white"
                            : message.type === "system"
                              ? "bg-blue-50 text-blue-900 border border-blue-200"
                              : message.type === "bug-report"
                                ? "bg-yellow-50 text-yellow-900 border border-yellow-200"
                                : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="whitespace-pre-line text-sm">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-1 opacity-70`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      {message.sender === "user" && (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Quick Actions */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Describe the bug you're experiencing..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bug Report Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bug Report Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Open Issues</span>
                  </div>
                  <span className="font-semibold">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">In Progress</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Fixed This Week</span>
                  </div>
                  <span className="font-semibold">8</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Fixes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Fixes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-green-600">
                    ✓ PDF Merge Memory Issue
                  </div>
                  <div className="text-xs text-gray-500">
                    Fixed large file handling
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-green-600">
                    ✓ Upload Progress Bar
                  </div>
                  <div className="text-xs text-gray-500">
                    Now shows accurate progress
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-green-600">
                    ✓ Mobile UI Issues
                  </div>
                  <div className="text-xs text-gray-500">
                    Improved responsive design
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reporting Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Include steps to reproduce
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Mention your browser/device
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Attach screenshots if possible
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Describe expected vs actual behavior
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Bug Report Form */}
        {showBugForm && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-red" />
                  Detailed Bug Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bug-title">Bug Title *</Label>
                    <Input
                      id="bug-title"
                      value={bugForm.title}
                      onChange={(e) =>
                        setBugForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Brief description of the issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <select
                      id="severity"
                      value={bugForm.severity}
                      onChange={(e) =>
                        setBugForm((prev) => ({
                          ...prev,
                          severity: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Low - Minor inconvenience</option>
                      <option value="medium">
                        Medium - Affects functionality
                      </option>
                      <option value="high">
                        High - Blocks important features
                      </option>
                      <option value="critical">Critical - App unusable</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={bugForm.category}
                    onChange={(e) =>
                      setBugForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a category</option>
                    <option value="pdf-tools">PDF Tools</option>
                    <option value="upload">File Upload</option>
                    <option value="ui">User Interface</option>
                    <option value="performance">Performance</option>
                    <option value="mobile">Mobile Issues</option>
                    <option value="api">API/Backend</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={bugForm.description}
                    onChange={(e) =>
                      setBugForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Detailed description of the bug..."
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected">Expected Behavior</Label>
                    <Textarea
                      id="expected"
                      value={bugForm.expectedBehavior}
                      onChange={(e) =>
                        setBugForm((prev) => ({
                          ...prev,
                          expectedBehavior: e.target.value,
                        }))
                      }
                      placeholder="What should happen?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual">Actual Behavior</Label>
                    <Textarea
                      id="actual"
                      value={bugForm.actualBehavior}
                      onChange={(e) =>
                        setBugForm((prev) => ({
                          ...prev,
                          actualBehavior: e.target.value,
                        }))
                      }
                      placeholder="What actually happens?"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steps">Steps to Reproduce</Label>
                  <Textarea
                    id="steps"
                    value={bugForm.steps}
                    onChange={(e) =>
                      setBugForm((prev) => ({ ...prev, steps: e.target.value }))
                    }
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmitBugReport}
                    disabled={!bugForm.title || !bugForm.description}
                    className="bg-brand-red hover:bg-red-700"
                  >
                    Submit Bug Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBugForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ReportBug;
