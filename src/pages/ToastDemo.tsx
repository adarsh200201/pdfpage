import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import toast from '@/lib/toast-utils';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Loader2,
  Bell,
  Smartphone,
  Monitor
} from 'lucide-react';

const ToastDemo = () => {

  const testToasts = [
    {
      title: 'Success Toast',
      description: 'Test success notification',
      icon: CheckCircle,
      color: 'bg-green-500',
      action: () => toast.success({
        title: 'Upload completed successfully!',
        description: 'Your PDF has been processed and is ready for download.',
      })
    },
    {
      title: 'Error Toast',
      description: 'Test error notification',
      icon: XCircle,
      color: 'bg-red-500',
      action: () => toast.error({
        title: 'Upload failed',
        description: 'Please check your file format and try again.',
      })
    },
    {
      title: 'Warning Toast',
      description: 'Test warning notification',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      action: () => toast.warning({
        title: 'File size too large',
        description: 'Please upload a file smaller than 100MB.',
      })
    },
    {
      title: 'Info Toast',
      description: 'Test info notification',
      icon: Info,
      color: 'bg-blue-500',
      action: () => toast.info({
        title: 'Processing started',
        description: 'Your file is being processed. This may take a few moments.',
      })
    },
    {
      title: 'Loading Toast',
      description: 'Test loading notification',
      icon: Loader2,
      color: 'bg-gray-500',
      action: () => {
        const loadingToast = toast.loading('Processing your PDF...');
        setTimeout(() => {
          toast.dismiss(loadingToast);
          toast.success('Processing completed!');
        }, 3000);
      }
    },
    {
      title: 'Promise Toast',
      description: 'Test promise-based notification',
      icon: Bell,
      color: 'bg-purple-500',
      action: () => {
        const mockPromise = new Promise((resolve, reject) => {
          setTimeout(() => {
            Math.random() > 0.5 ? resolve('Success!') : reject('Failed!');
          }, 2000);
        });

        toast.promise(mockPromise, {
          loading: 'Processing...',
          success: 'Operation completed successfully!',
          error: 'Operation failed. Please try again.',
        });
      }
    }
  ];

  const pdfOperationTests = [
    {
      title: 'PDF Upload Success',
      action: () => toast.pdf.uploadSuccess('document.pdf')
    },
    {
      title: 'PDF Upload Error',
      action: () => toast.pdf.uploadError('Invalid file format')
    },
    {
      title: 'PDF Processing',
      action: () => {
        const loadingId = toast.pdf.processingStart('Compressing');
        setTimeout(() => {
          toast.dismiss(loadingId);
          toast.pdf.processingSuccess('Compression');
        }, 2500);
      }
    },
    {
      title: 'File Too Large',
      action: () => toast.pdf.fileTooLarge('100MB')
    },
    {
      title: 'Invalid File Type',
      action: () => toast.pdf.invalidFileType()
    },
    {
      title: 'Network Error',
      action: () => toast.pdf.networkError()
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-blue-600/10 text-blue-600 border-blue-600/20">
              🧪 Toast Testing Lab
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Toast Notification Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Test all toast notification types in top-right position. 
              Works perfectly on both desktop and mobile devices.
            </p>
          </div>

          {/* Device Preview Info */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Monitor className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Desktop View</h3>
                <p className="text-sm text-gray-600">Toasts appear in top-right corner</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Smartphone className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Mobile View</h3>
                <p className="text-sm text-gray-600">Toasts span full width, below header</p>
              </CardContent>
            </Card>
          </div>

          {/* Basic Toast Types */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Basic Toast Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {testToasts.map((test, index) => (
                  <Button
                    key={index}
                    onClick={test.action}
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300"
                    variant="outline"
                  >
                    <div className={`p-2 rounded-full ${test.color} text-white`}>
                      <test.icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{test.title}</div>
                      <div className="text-sm text-gray-600">{test.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PDF-Specific Toasts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>PDF Operation Toasts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pdfOperationTests.map((test, index) => (
                  <Button
                    key={index}
                    onClick={test.action}
                    variant="outline"
                    className="h-auto p-4 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300"
                  >
                    {test.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Advanced Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => {
                    toast.success({
                      title: 'Toast with Action',
                      description: 'This toast has a custom action button.',
                      action: {
                        label: 'Undo',
                        onClick: () => toast.info('Action clicked!')
                      }
                    });
                  }}
                  variant="outline"
                >
                  Toast with Action
                </Button>
                
                <Button
                  onClick={() => {
                    // Show multiple toasts
                    toast.info('First toast');
                    setTimeout(() => toast.success('Second toast'), 500);
                    setTimeout(() => toast.warning('Third toast'), 1000);
                  }}
                  variant="outline"
                >
                  Multiple Toasts
                </Button>
                
                <Button
                  onClick={() => toast.dismissAll()}
                  variant="destructive"
                >
                  Dismiss All Toasts
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Basic Usage:</h4>
                  <code className="text-sm">
                    {`import toast from '@/lib/toast-utils';

toast.success('Upload completed!');
toast.error('Upload failed');
toast.warning('File too large');
toast.info('Processing started');`}
                  </code>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">With Description:</h4>
                  <code className="text-sm">
                    {`toast.success({
  title: 'Upload completed!',
  description: 'Your file is ready for download.'
});`}
                  </code>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">PDF Operations:</h4>
                  <code className="text-sm">
                    {`toast.pdf.uploadSuccess('document.pdf');
toast.pdf.processingStart('Compressing');
toast.pdf.fileTooLarge('100MB');`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ToastDemo;
