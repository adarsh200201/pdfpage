import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Copy,
  ExternalLink,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const OAuthRedirectChecker: React.FC = () => {
  const { toast } = useToast();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const currentBackend = 'https://pdf-backend-935131444417.asia-south1.run.app';
  const currentCallback = `${currentBackend}/api/auth/google/callback`;
  const wrongCallback = 'https://pdfpage-app.onrender.com/api/auth/google/callback';
  const clientId = '924753913138-7fdalk1kou5esta2gj837nfs6sht4ci1.apps.googleusercontent.com';

  const recommendedURIs = [
    {
      uri: currentCallback,
      description: 'Current Google Cloud Run backend',
      priority: 'HIGH',
      required: true
    },
    {
      uri: 'https://pdfpage.in/api/auth/google/callback',
      description: 'Production domain (if using custom domain)',
      priority: 'MEDIUM',
      required: false
    },
    {
      uri: 'http://localhost:5000/api/auth/google/callback',
      description: 'Local development',
      priority: 'LOW',
      required: false
    }
  ];

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      toast({
        title: "Copied!",
        description: `${item} copied to clipboard`,
      });
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive"
      });
    }
  };

  const openGoogleConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            OAuth Redirect URI Mismatch Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Issue Found:</strong> Your Google OAuth client is configured for the wrong redirect URI.
              The error shows it&apos;s looking for the old Render URL instead of your current Google Cloud Run backend.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="p-3 bg-red-100 border border-red-300 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-800">Currently Configured (WRONG):</span>
              </div>
              <div className="font-mono text-sm bg-white p-2 rounded border">
                {wrongCallback}
              </div>
              <p className="text-sm text-red-700 mt-1">This is the old Render URL that&apos;s causing the error</p>
            </div>

            <div className="p-3 bg-green-100 border border-green-300 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Should Be Configured (CORRECT):</span>
              </div>
              <div className="font-mono text-sm bg-white p-2 rounded border flex items-center justify-between">
                <span>{currentCallback}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(currentCallback, 'Callback URI')}
                  className="ml-2"
                >
                  <Copy className="w-3 h-3" />
                  {copiedItem === 'Callback URI' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-sm text-green-700 mt-1">This matches your current Google Cloud Run backend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            How to Fix This
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-medium">Open Google Cloud Console</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Navigate to APIs &amp; Services &gt; Credentials
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openGoogleConsole}
                  className="inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Google Console
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-medium">Find Your OAuth Client</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Look for this Client ID:
                </p>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded border flex items-center justify-between">
                  <span className="break-all">{clientId}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(clientId, 'Client ID')}
                    className="ml-2 flex-shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedItem === 'Client ID' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-medium">Update Authorized Redirect URIs</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Replace the old Render URL with these URIs:
                </p>
                <div className="space-y-2">
                  {recommendedURIs.map((item, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={item.priority === 'HIGH' ? 'default' : item.priority === 'MEDIUM' ? 'secondary' : 'outline'}>
                          {item.priority} PRIORITY
                        </Badge>
                        {item.required && <Badge variant="destructive">REQUIRED</Badge>}
                      </div>
                      <div className="font-mono text-sm bg-gray-50 p-2 rounded mt-2 flex items-center justify-between">
                        <span className="break-all">{item.uri}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(item.uri, `URI ${index + 1}`)}
                          className="ml-2 flex-shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedItem === `URI ${index + 1}` ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-medium">Save and Test</h3>
                <p className="text-sm text-gray-600">
                  Save the changes in Google Console, wait 5-10 minutes for propagation, then test Google Sign In again.
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>After the fix:</strong> Google Sign In should work immediately. 
              The error will disappear and users will be redirected to your callback page successfully.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthRedirectChecker;
