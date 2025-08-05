import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, User, Mail } from "lucide-react";
import GoogleOAuthStatus from "@/components/debug/GoogleOAuthStatus";
import "@/utils/run-oauth-test"; // This will auto-run OAuth tests

const OAuthTest: React.FC = () => {
  const { user, isAuthenticated, loginWithGoogle, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      toast({
        title: "Redirecting to Google",
        description: "You will be redirected to Google for authentication.",
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to initiate Google login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <GoogleOAuthStatus />
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Google OAuth Test
            </CardTitle>
            <div className="text-center">
              <Badge 
                variant={isAuthenticated ? "default" : "secondary"}
                className={isAuthenticated ? "bg-green-500" : ""}
              >
                {isAuthenticated ? (
                  <><CheckCircle className="w-4 h-4 mr-1" /> Authenticated</>
                ) : (
                  <><XCircle className="w-4 h-4 mr-1" /> Not Authenticated</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isAuthenticated && user ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Authenticated User
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-green-600" />
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{user.email}</span>
                      {user.email === "adarshkumar200201@gmail.com" && (
                        <Badge className="ml-2 bg-blue-500">Target Email ✓</Badge>
                      )}
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-green-600" />
                      <span className="font-medium">Name:</span>
                      <span className="ml-2">{user.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">User ID:</span>
                      <span className="ml-2 font-mono text-xs">{user.id}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Premium Status:</span>
                      <Badge 
                        variant={user.isPremium ? "default" : "secondary"}
                        className={user.isPremium ? "bg-yellow-500 ml-2" : "ml-2"}
                      >
                        {user.isPremium ? "Premium" : "Free"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Testing Google OAuth for: adarshkumar200201@gmail.com
                  </h3>
                  <p className="text-sm text-blue-700">
                    Click the button below to test Google sign-in functionality. 
                    You will be redirected to Google for authentication.
                  </p>
                </div>
                
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to Google...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-2 h-4 w-4"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Test Google Sign In
                    </>
                  )}
                </Button>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 text-sm mb-2">
                    OAuth Flow Details:
                  </h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Redirects to: https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google</li>
                    <li>• Google OAuth will handle authentication</li>
                    <li>• Returns to: /auth/callback with token</li>
                    <li>• Token processed and user logged in</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OAuthTest;
