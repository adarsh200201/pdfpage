import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export const OAuthDebug = () => {
  const [authState, setAuthState] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAuthState = async () => {
    setLoading(true);
    try {
      // Get auth state from localStorage or session
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('userData');
      
      setAuthState({
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 10)}...` : null,
        user: user ? JSON.parse(user) : null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setAuthState({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Card className="w-full border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            OAuth Debug Panel
          </CardTitle>
          <Badge variant="outline" className="text-yellow-700 border-yellow-300">
            Development Only
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-yellow-800">Auth Status:</span>
          <div className="flex items-center gap-2">
            {authState?.hasToken ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              {authState?.hasToken ? 'Authenticated' : 'Not Authenticated'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkAuthState}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {authState?.tokenPreview && (
          <div className="text-xs bg-yellow-100 p-2 rounded border">
            <strong>Token Preview:</strong> {authState.tokenPreview}
          </div>
        )}

        {authState?.user && (
          <div className="text-xs bg-yellow-100 p-2 rounded border">
            <strong>User:</strong> {JSON.stringify(authState.user, null, 2)}
          </div>
        )}

        {authState?.error && (
          <div className="text-xs bg-red-100 p-2 rounded border text-red-700">
            <strong>Error:</strong> {authState.error}
          </div>
        )}

        <div className="text-xs text-yellow-600">
          Last checked: {authState?.timestamp ? new Date(authState.timestamp).toLocaleTimeString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
};
