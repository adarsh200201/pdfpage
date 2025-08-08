import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import PDFSigningStudio from '@/components/pdf-signing/PDFSigningStudio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Upload, 
  Signature, 
  Users, 
  Send, 
  Zap,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Globe,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DocumentSigning = () => {
  const [file, setFile] = useState<File | null>(null);
  const [showStudio, setShowStudio] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFile = acceptedFiles[0];
    if (pdfFile && pdfFile.type === 'application/pdf') {
      setFile(pdfFile);
      setShowStudio(true);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handleComplete = (signedDocument: Blob) => {
    // Handle completed signing process
    toast({
      title: "Document signed successfully!",
      description: "All signers have completed the document.",
    });
    
    // Reset for new document
    setFile(null);
    setShowStudio(false);
  };

  if (showStudio) {
    return <PDFSigningStudio pdfFile={file} onComplete={handleComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg">
              <Signature className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Professional Document
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
              Signing Platform
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Create, send, and track document signatures in real-time with our PandaDoc-inspired platform. 
            Streamline your workflow with professional e-signature tools.
          </p>
          
          {/* Trust indicators */}
          <div className="flex justify-center items-center gap-8 mb-12 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Legally Binding</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Global Compliance</span>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real-time Updates</h3>
            <p className="text-gray-600 leading-relaxed">
              See signing progress live with instant notifications and status updates
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Legally Binding</h3>
            <p className="text-gray-600 leading-relaxed">
              Compliant e-signatures that meet international legal standards
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="bg-purple-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Multiple Signers</h3>
            <p className="text-gray-600 leading-relaxed">
              Collaborate seamlessly with unlimited signers and approvers
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="bg-orange-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Smartphone className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Mobile Ready</h3>
            <p className="text-gray-600 leading-relaxed">
              Sign documents anywhere, anytime on any device
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="max-w-3xl mx-auto shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <CardTitle className="flex items-center gap-3 text-2xl justify-center">
              <FileText className="w-8 h-8 text-blue-600" />
              Upload Document to Start
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Drag and drop your PDF or click to browse
            </p>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-20 h-20 mx-auto mb-8 text-gray-400" />
              {isDragActive ? (
                <div>
                  <p className="text-2xl font-semibold text-blue-600 mb-3">
                    Drop your PDF here!
                  </p>
                  <p className="text-gray-600 text-lg">Release to upload and start signing</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-semibold mb-3">
                    Drag & drop your PDF document
                  </p>
                  <p className="text-gray-600 mb-8 text-lg">
                    or click to browse your files
                  </p>
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-3">
                    <Upload className="w-5 h-5 mr-3" />
                    Choose PDF File
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Supported format: PDF • Max file size: 50MB • Secure & encrypted
              </p>
              <div className="flex justify-center items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>4.9/5 rating</span>
                </div>
                <span>•</span>
                <span>10M+ documents signed</span>
                <span>•</span>
                <span>99.9% uptime</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and secure document signing in 3 steps</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <div className="bg-blue-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">1</div>
              <h3 className="text-2xl font-semibold mb-4">Upload & Prepare</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload your PDF document and add signature fields, text boxes, and other elements exactly where you need them
              </p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Send className="w-10 h-10 text-white" />
              </div>
              <div className="bg-green-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">2</div>
              <h3 className="text-2xl font-semibold mb-4">Send for Signing</h3>
              <p className="text-gray-600 leading-relaxed">
                Add signers with custom messages and send invitations. Track progress in real-time with live notifications
              </p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="bg-purple-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4">3</div>
              <h3 className="text-2xl font-semibold mb-4">Complete & Download</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor signing progress with real-time updates and download the completed, legally binding document
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">Ready to streamline your document workflow?</h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of professionals who trust PdfPage for their document signing needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
                onClick={() => document.querySelector('[data-rfd-drag-handle-draggable-id]')?.scrollIntoView()}
              >
                <Signature className="w-5 h-5 mr-3" />
                Start Signing Documents
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3"
              >
                Watch Demo
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              No credit card required • Free to start • Enterprise-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSigning;
