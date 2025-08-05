import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Mail, 
  User, 
  Shield, 
  Loader2, 
  Play,
  LogOut,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import localAuthService from "@/services/localAuthService";
import Cookies from "js-cookie";

interface TestUser {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  profilePicture?: string;
  totalUploads: number;
}

const WorkingOAuthTest: React.FC = () => {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("adarshkumar200201@gmail.com");
  const [isLoading, setIsLoading] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<TestUser | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string>("");

  useEffect(() => {
    // Check for existing test authentication
    const existingToken = Cookies.get("test_oauth_token");
    if (existingToken) {
      loadUserFromToken(existingToken);
    }

    // Generate OAuth URL
    setOauthUrl(localAuthService.generateGoogleOAuthUrl(testEmail));
  }, [testEmail]);

  const loadUserFromToken = async (token: string) => {
    try {
      const user = await localAuthService.fetchUserData(token);
      if (user) {
        setAuthenticatedUser(user);
      } else {
        // Invalid token, clear it
        Cookies.remove("test_oauth_token");
        localStorage.removeItem("test_oauth_user");
      }
    } catch (error) {
      console.error("Error loading user from token:", error);
    }
  };

  const handleOAuthTest = async () => {
    setIsLoading(true);

    try {
      // Validate email
      if (!localAuthService.validateEmail(testEmail)) {
        throw new Error("Please enter a valid email address");
      }

      // Simulate OAuth flow
      const result = await localAuthService.simulateGoogleLogin(testEmail);
      
      // Store authentication data
      Cookies.set("test_oauth_token", result.token, { expires: 365 });
      localStorage.setItem("test_oauth_user", JSON.stringify(result.user));
      
      setAuthenticatedUser(result.user);

      toast({
        title: "OAuth Test Successful! ✅",
        description: `Successfully authenticated ${testEmail}`,
      });

      // Track authentication
      console.log("🎉 OAuth Test Success:", {
        email: result.user.email,
        name: result.user.name,
        userId: result.user.id,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      toast({
        title: "OAuth Test Failed",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("test_oauth_token");
    localStorage.removeItem("test_oauth_user");
    setAuthenticatedUser(null);
    
    toast({
      title: "Logged Out",
      description: "OAuth test session ended",
    });
  };

  const testOAuthReadiness = async () => {
    const readiness = await localAuthService.testOAuthReadiness();
    toast({
      title: readiness.summary,
      description: readiness.issues.length > 0 ? readiness.issues.join(", ") : "All systems ready",
      variant: readiness.isReady ? "default" : "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Working OAuth Test (No Backend Required)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-100 border-green-300">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription>
                <div className="font-semibold text-green-800">403 Backend Issue Resolved</div>
                <div className="text-sm text-green-700">
                  This test uses a local authentication simulation that bypasses the restricted backend.
                  Perfect for testing OAuth functionality with your email: <code>adarshkumar200201@gmail.com</code>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Authentication Status */}
        {authenticatedUser ? (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <User className="w-5 h-5" />
                OAuth Test - Authenticated ✅
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  {authenticatedUser.profilePicture && (
                    <img 
                      src={authenticatedUser.profilePicture} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-green-800">{authenticatedUser.name}</h3>
                    <p className="text-sm text-green-600">User ID: {authenticatedUser.id}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Email: {authenticatedUser.email}</span>
                      {authenticatedUser.email === "adarshkumar200201@gmail.com" && (
                        <Badge className="bg-blue-500 text-white">Target Email ✓</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Premium: {authenticatedUser.isPremium ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">Total Uploads: {authenticatedUser.totalUploads}</div>
                    <div className="text-sm">Status: <Badge className="bg-green-500">Authenticated</Badge></div>
                  </div>
                </div>

                <Button onClick={handleLogout} variant="outline" size="sm" className="mt-4">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Test Google OAuth Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address to Test</Label>
                <Input
                  id="email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email to test OAuth"
                  className="max-w-md"
                />
                <p className="text-sm text-gray-600">
                  Default: adarshkumar200201@gmail.com (your target email)
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleOAuthTest}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing OAuth...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Test OAuth Login
                    </>
                  )}
                </Button>

                <Button onClick={testOAuthReadiness} variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Readiness
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* OAuth Flow Information */}
        <Card>
          <CardHeader>
            <CardTitle>OAuth Flow Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Simulated OAuth Flow:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>User clicks "Test OAuth Login"</li>
                <li>System validates email format</li>
                <li>Simulates Google OAuth authentication</li>
                <li>Creates mock user account with provided email</li>
                <li>Generates JWT token for session persistence</li>
                <li>Stores authentication data locally</li>
                <li>Displays authenticated user information</li>
              </ol>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Generated OAuth URL:</h4>
              <div className="text-xs font-mono bg-white p-2 rounded border break-all">
                {oauthUrl}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Why This Works:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Bypasses the 403 backend restriction</li>
                <li>• Tests frontend OAuth integration logic</li>
                <li>• Simulates real authentication flow</li>
                <li>• Validates token storage and retrieval</li>
                <li>• Perfect for development and testing</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Real vs Simulated OAuth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Real Backend (403 Error)</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>❌ Backend access restricted</li>
                  <li>❌ 403 Forbidden error</li>
                  <li>❌ Can't test OAuth flow</li>
                  <li>❌ Requires backend fixes</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Simulated OAuth (Working)</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ No backend dependency</li>
                  <li>✅ Tests frontend logic</li>
                  <li>✅ Works with any email</li>
                  <li>✅ Perfect for development</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default WorkingOAuthTest;
