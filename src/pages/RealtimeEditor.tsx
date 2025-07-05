import React from "react";
import { ProfessionalPDFEditor } from "@/components/pdf-editor/ProfessionalPDFEditor";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Users,
  Layers,
  Eye,
  Shield,
  Globe,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function RealtimeEditor() {
  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-heading-large text-text-dark">
              Real-time PDF Editor
            </h1>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <p className="text-body-large text-text-light max-w-2xl mx-auto">
            Edit PDFs with real-time collaboration, instant preview, and
            professional tools. Experience the future of PDF editing with our
            advanced real-time platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-2">Live Collaboration</h3>
              <p className="text-sm text-gray-600">
                Work together with team members in real-time with live cursors
                and instant updates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Layers className="w-10 h-10 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-2">Advanced Canvas</h3>
              <p className="text-sm text-gray-600">
                Multi-layer canvas system with professional editing tools and
                effects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="w-10 h-10 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold mb-2">Instant Preview</h3>
              <p className="text-sm text-gray-600">
                See changes instantly with high-quality rendering and zoom
                controls
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Real-time Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Live collaborative editing</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Real-time cursor tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Instant change synchronization</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Safe canvas error handling</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>PDF.js worker optimization</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Array bounds safety</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Conflict resolution</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Auto-save functionality</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Performance */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm">End-to-end encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm">No server-side storage</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm">GDPR compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Safe error handling</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                Performance Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Optimized PDF.js workers</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Immediate fallback systems</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Canvas error recovery</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Memory efficient rendering</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Editor */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
          <ProfessionalPDFEditor
            className="min-h-[600px]"
            onSave={(pdfData) => {
              console.log("PDF saved:", pdfData);
              // Handle save logic here
            }}
          />
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Getting Started with Real-time Editing
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Upload a PDF file to start collaborative editing</p>
              <p>
                • Share your session ID with team members for real-time
                collaboration
              </p>
              <p>
                • Use the tools panel on the right to add text, shapes, and
                signatures
              </p>
              <p>
                • All changes are automatically synchronized across all
                participants
              </p>
              <p>
                • Experience the power of lightpdf.com-style real-time editing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
