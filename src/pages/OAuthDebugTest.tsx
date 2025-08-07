import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import OAuthTroubleshooter from '@/components/OAuthTroubleshooter';
import StatsDebugger from '@/components/StatsDebugger';
import OAuthRedirectChecker from '@/components/OAuthRedirectChecker';
import NetlifyProxyFixer from '@/components/NetlifyProxyFixer';
import NetlifyEnvironmentFixer from '@/components/NetlifyEnvironmentFixer';

const OAuthDebugTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google OAuth Troubleshooter
          </h1>
          <p className="text-gray-600">
            This tool will help diagnose why Google Sign In is not working with your updated credentials.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚨 ISSUE IDENTIFIED: Netlify Environment Variable Conflict
          </h2>
          <NetlifyEnvironmentFixer />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            General OAuth Diagnostics
          </h2>
          <OAuthTroubleshooter />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Stats Service Debugger
          </h2>
          <StatsDebugger />
        </div>
      </div>
    </div>
  );
};

export default OAuthDebugTest;
