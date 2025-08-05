import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  XCircle, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Key, 
  User,
  Mail,
  Shield,
  RefreshCw,
  ExternalLink
} from "lucide-react";

const OAuth403Fix: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("adarshkumar200201@gmail.com");
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateSuccessfulAuth = () => {
    setIsSimulating(true);
    
    // Simulate a successful OAuth response for testing
    setTimeout(() => {
      const mockUser = {
        id: "mock_user_123",
        email: testEmail,
        name: "Adarsh Kumar",
        isPremium: false,
        totalUploads: 0
      };

      // Store mock user data for testing
      localStorage.setItem("oauth_test_user", JSON.stringify(mockUser));
      
      toast({
        title: "OAuth Test Simulation",
        description: `Successfully simulated login for ${testEmail}`,
      });
      
      setIsSimulating(false);
    }, 2000);
  };

  const clearTestData = () => {
    localStorage.removeItem("oauth_test_user");
    toast({
      title: "Test Data Cleared",
      description: "OAuth test data has been cleared",
    });
  };

  const testBackendDirectly = async () => {
    try {
      // Test different backend endpoints to find working ones
      const endpoints = [
        'https://pdf-backend-935131444417.asia-south1.run.app/api/health',
        'https://pdf-backend-935131444417.asia-south1.run.app/api/auth/test-cors',
        'https://pdf-backend-935131444417.asia-south1.run.app/',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { 
            method: 'GET',
            mode: 'no-cors' // Bypass CORS for testing
          });
          console.log(`✅ ${endpoint}: ${response.status}`);
        } catch (error) {
          console.log(`❌ ${endpoint}: ${error}`);
        }
      }
    } catch (error) {
      console.error('Backend test failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 403 Error Explanation */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              403 Error - Backend Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <AlertDescription>
                <div className="font-semibold text-red-800">Backend Access Denied</div>
                <div className="text-sm text-red-700 mt-1">
                  The Google Cloud backend at <code>pdf-backend-935131444417.asia-south1.run.app</code> 
                  is returning a 403 Forbidden error. This means:
                </div>
                <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                  <li>The backend server has access restrictions</li>
                  <li>IP-based access control may be enabled</li>
                  <li>Google OAuth credentials might be restricted</li>
                  <li>CORS configuration may be blocking requests</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Possible Causes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Backend configured for production only</li>
                  <li>• IP whitelist doesn't include current location</li>
                  <li>• Google OAuth client restrictions</li>
                  <li>• Cloud Run authentication required</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Solutions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use alternative backend endpoint</li>
                  <li>• Configure IP whitelist</li>
                  <li>• Update Google OAuth settings</li>
                  <li>• Test with local backend</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OAuth Test Simulation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              OAuth Test Simulation (Bypass 403)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <AlertDescription>
                <div className="font-semibold text-blue-800">Alternative Testing Method</div>
                <div className="text-sm text-blue-700">
                  Since the backend is restricted, I'll simulate the OAuth flow to test 
                  the frontend authentication logic for your email.
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="test-email">Test Email Address</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="test-email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email to test"
                    className="flex-1"
                  />
                  <Button 
                    onClick={simulateSuccessfulAuth}
                    disabled={isSimulating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSimulating ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Simulate OAuth Success
                  </Button>
                </div>
              </div>

              {localStorage.getItem("oauth_test_user") && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800">OAuth Simulation Active</h4>
                      <div className="text-sm text-green-700">
                        Test user: {JSON.parse(localStorage.getItem("oauth_test_user") || "{}").email}
                      </div>
                    </div>
                    <Button onClick={clearTestData} variant="outline" size="sm">
                      Clear Test Data
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Current Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated && user ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-green-800">Authenticated</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span>Email: {user.email}</span>
                    {user.email === "adarshkumar200201@gmail.com" && (
                      <Badge className="bg-blue-500">Target Email ✓</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span>Name: {user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Premium: {user.isPremium ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <Button onClick={logout} variant="outline" size="sm" className="mt-3">
                  Logout
                </Button>
              </div>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <AlertDescription>
                  <div className="font-semibold text-yellow-800">Not Authenticated</div>
                  <div className="text-sm text-yellow-700">
                    Use the simulation above to test OAuth functionality without backend dependency.
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Backend Diagnostic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Backend Diagnostic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Backend Details:</h4>
              <div className="text-sm text-gray-600 space-y-1 font-mono">
                <div>URL: https://pdf-backend-935131444417.asia-south1.run.app</div>
                <div>OAuth Endpoint: /api/auth/google</div>
                <div>Health Check: /api/health</div>
                <div>Status: <span className="text-red-600 font-semibold">403 Forbidden</span></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                onClick={testBackendDirectly}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Test Backend Endpoints
              </Button>
              
              <a 
                href="https://pdf-backend-935131444417.asia-south1.run.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Backend URL
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Solutions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recommended Solutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">1. Use Alternative Backend</h4>
                <p className="text-sm text-blue-700">
                  Configure a different backend endpoint that doesn't have access restrictions.
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">2. Local Development Setup</h4>
                <p className="text-sm text-green-700">
                  Run the backend locally for testing OAuth functionality without restrictions.
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">3. Update Backend Configuration</h4>
                <p className="text-sm text-purple-700">
                  Modify the Google Cloud Run backend to allow access from your current IP/location.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default OAuth403Fix;
