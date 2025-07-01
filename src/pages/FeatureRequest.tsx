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
  Lightbulb,
  Send,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  User,
  Bot,
  Zap,
  Target,
  Rocket,
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  type?: "text" | "feature-request" | "system";
}

const FeatureRequest = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content:
        "Hello! 🚀 I'm your Feature Request Assistant. I'm here to help you suggest new features, improvements, or enhancements for PdfPage. What brilliant idea do you have for us?",
      sender: "assistant",
      timestamp: new Date(),
      type: "system",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [featureForm, setFeatureForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    useCase: "",
    targetUsers: "",
    businessValue: "",
  });
  const [showFeatureForm, setShowFeatureForm] = useState(false);
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

    if (input.includes("ai") || input.includes("artificial intelligence")) {
      return "AI-powered features are definitely on our radar! 🤖 We're exploring several AI integrations:\n\n• Smart PDF optimization\n• Automated content recognition\n• Intelligent form filling\n• AI-powered document summarization\n\nWhat specific AI functionality would you find most valuable? Let's dive deeper into your vision!";
    }

    if (input.includes("mobile") || input.includes("app")) {
      return "A mobile app is one of our most requested features! 📱 We're actively working on native iOS and Android apps. Some ideas we're considering:\n\n• Offline PDF processing\n• Camera-to-PDF scanning\n• Cloud sync across devices\n• Touch-optimized editing\n\nWhat mobile features would be most important for your workflow?";
    }

    if (input.includes("collaboration") || input.includes("team")) {
      return "Team collaboration features would be amazing! 👥 This could revolutionize how teams work with documents:\n\n• Real-time collaborative editing\n• Comment and annotation system\n• Version control and history\n• Team workspaces and sharing\n\nTell me more about your team's specific collaboration needs!";
    }

    if (input.includes("automation") || input.includes("batch")) {
      return "Automation is a game-changer for productivity! ⚡ We're considering several automation features:\n\n• Batch processing workflows\n• Scheduled document processing\n• API integrations with popular tools\n• Custom automation rules\n\nWhat repetitive tasks would you love to automate?";
    }

    if (input.includes("security") || input.includes("encryption")) {
      return "Security is crucial for document processing! 🔒 Enhanced security features could include:\n\n• Advanced encryption options\n• Digital signatures and certificates\n• Audit trails and compliance tracking\n• Enterprise-grade security controls\n\nWhat security requirements are most important for your use case?";
    }

    if (
      input.includes("feature request") ||
      input.includes("detailed") ||
      input.includes("form")
    ) {
      setShowFeatureForm(true);
      return "Excellent! Let's create a comprehensive feature request. 📝 I've opened the detailed feature request form below. The more specific you are, the better we can understand and prioritize your suggestion!";
    }

    // Default responses
    const responses = [
      "That's an interesting idea! 💡 Can you tell me more about how this feature would improve your workflow?",
      "I love the creativity! 🌟 Let's explore this further - what specific problem would this feature solve?",
      "Great suggestion! 🎯 Who do you think would benefit most from this feature, and in what scenarios?",
      "Fascinating concept! 🚀 Can you walk me through how you'd envision using this feature day-to-day?",
      "This could be really valuable! ✨ What current limitations or pain points would this address?",
      "Excellent thinking! 🎪 Would you like to create a detailed feature request so our product team can evaluate this properly?",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSubmitFeatureRequest = () => {
    const featureRequestMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `**Feature Request Submitted! 🚀**\n\n**Title:** ${featureForm.title}\n**Priority:** ${featureForm.priority}\n**Category:** ${featureForm.category}\n\n**Description:** ${featureForm.description}\n\n**Use Case:** ${featureForm.useCase}`,
      sender: "user",
      timestamp: new Date(),
      type: "feature-request",
    };

    setMessages((prev) => [...prev, featureRequestMessage]);
    setShowFeatureForm(false);
    setFeatureForm({
      title: "",
      description: "",
      category: "",
      priority: "medium",
      useCase: "",
      targetUsers: "",
      businessValue: "",
    });

    // Assistant confirmation
    setTimeout(() => {
      const confirmationMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          "🎉 Feature request submitted successfully! Your idea has been added to our product roadmap and will be reviewed by our product team. We'll keep you updated on its progress!\n\nThank you for helping us make PdfPage better! Do you have any other feature ideas?",
        sender: "assistant",
        timestamp: new Date(),
        type: "system",
      };
      setMessages((prev) => [...prev, confirmationMessage]);
    }, 1000);
  };

  const quickActions = [
    {
      label: "AI-Powered Features",
      action: () =>
        setInputMessage("I'd like to suggest AI-powered PDF features"),
    },
    {
      label: "Mobile App",
      action: () =>
        setInputMessage("When will there be a mobile app available?"),
    },
    {
      label: "Team Collaboration",
      action: () =>
        setInputMessage("I need team collaboration features for my documents"),
    },
    {
      label: "Create Detailed Request",
      action: () =>
        setInputMessage("I want to create a detailed feature request"),
    },
  ];

  const trendingFeatures = [
    { name: "AI PDF Summarization", votes: 234, trend: "+15%" },
    { name: "Real-time Collaboration", votes: 189, trend: "+22%" },
    { name: "Advanced OCR", votes: 156, trend: "+8%" },
    { name: "Mobile App", votes: 298, trend: "+31%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <Lightbulb className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-text-dark mb-4">
              Feature <span className="text-purple-600">Requests</span>
            </h1>
            <p className="text-lg text-text-medium">
              Share your ideas and help shape the future of PdfPage! Chat with
              our AI assistant to refine your suggestions.
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
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  Feature Request Assistant
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-green-100 text-green-800"
                  >
                    ✨ Ready to Innovate
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
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                            : message.type === "system"
                              ? "bg-gradient-to-br from-green-50 to-emerald-50 text-green-900 border border-green-200"
                              : message.type === "feature-request"
                                ? "bg-gradient-to-br from-purple-50 to-blue-50 text-purple-900 border border-purple-200"
                                : "bg-gray-50 text-gray-900 border border-gray-200"
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
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
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
              <div className="p-4 border-t bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="text-xs hover:bg-purple-100 border-purple-200"
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
                    placeholder="Share your feature idea or ask questions..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Trending Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-sm">{feature.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {feature.votes} votes
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {feature.trend}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Development Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Development Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">In Development</span>
                  </div>
                  <span className="font-semibold">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Planned</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Under Review</span>
                  </div>
                  <span className="font-semibold">28</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Shipped This Month</span>
                  </div>
                  <span className="font-semibold">7</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recently Shipped</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-green-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Real-time PDF Editor
                  </div>
                  <div className="text-xs text-gray-500">
                    Advanced editing capabilities
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-green-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Batch Processing
                  </div>
                  <div className="text-xs text-gray-500">
                    Process multiple files at once
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-green-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Enhanced Security
                  </div>
                  <div className="text-xs text-gray-500">
                    Advanced encryption options
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggestion Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Explain the business value
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Describe user scenarios
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Consider technical feasibility
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    Think about user experience
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Feature Request Form */}
        {showFeatureForm && (
          <div className="mt-8">
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  Detailed Feature Request
                </CardTitle>
                <p className="text-sm text-gray-600">
                  The more details you provide, the better we can understand and
                  implement your idea!
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feature-title">Feature Title *</Label>
                    <Input
                      id="feature-title"
                      value={featureForm.title}
                      onChange={(e) =>
                        setFeatureForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Name your feature idea"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={featureForm.priority}
                      onChange={(e) =>
                        setFeatureForm((prev) => ({
                          ...prev,
                          priority: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Nice to Have</option>
                      <option value="medium">Would be Great</option>
                      <option value="high">Really Important</option>
                      <option value="critical">Game Changer</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={featureForm.category}
                    onChange={(e) =>
                      setFeatureForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a category</option>
                    <option value="ai-ml">AI & Machine Learning</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="mobile">Mobile Features</option>
                    <option value="automation">Automation</option>
                    <option value="security">Security & Privacy</option>
                    <option value="ui-ux">User Interface</option>
                    <option value="api">API & Integrations</option>
                    <option value="performance">Performance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Feature Description *</Label>
                  <Textarea
                    id="description"
                    value={featureForm.description}
                    onChange={(e) =>
                      setFeatureForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe your feature idea in detail..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="useCase">Use Case & User Story</Label>
                  <Textarea
                    id="useCase"
                    value={featureForm.useCase}
                    onChange={(e) =>
                      setFeatureForm((prev) => ({
                        ...prev,
                        useCase: e.target.value,
                      }))
                    }
                    placeholder="As a [user type], I want [feature] so that [benefit]..."
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetUsers">Target Users</Label>
                    <Textarea
                      id="targetUsers"
                      value={featureForm.targetUsers}
                      onChange={(e) =>
                        setFeatureForm((prev) => ({
                          ...prev,
                          targetUsers: e.target.value,
                        }))
                      }
                      placeholder="Who would benefit from this feature?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessValue">Business Value</Label>
                    <Textarea
                      id="businessValue"
                      value={featureForm.businessValue}
                      onChange={(e) =>
                        setFeatureForm((prev) => ({
                          ...prev,
                          businessValue: e.target.value,
                        }))
                      }
                      placeholder="How would this impact users and business?"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmitFeatureRequest}
                    disabled={!featureForm.title || !featureForm.description}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Submit Feature Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowFeatureForm(false)}
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

export default FeatureRequest;
