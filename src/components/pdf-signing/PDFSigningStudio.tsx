import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  Signature, 
  Send, 
  Eye, 
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Move,
  Type,
  Calendar
} from 'lucide-react';

interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  assignedTo?: string;
  required: boolean;
  value?: string;
  signed?: boolean;
}

interface Signer {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'approver' | 'viewer';
  status: 'pending' | 'signed' | 'declined';
  signedAt?: Date;
  color: string;
}

interface PDFSigningStudioProps {
  pdfFile: File | null;
  onComplete: (signedDocument: Blob) => void;
}

const PDFSigningStudio: React.FC<PDFSigningStudioProps> = ({ pdfFile, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'prepare' | 'sign' | 'complete'>('upload');
  const [signers, setSigners] = useState<Signer[]>([]);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [selectedTool, setSelectedTool] = useState<'signature' | 'initial' | 'date' | 'text' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentMessage, setDocumentMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize PDF when file is provided
  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      setCurrentStep('prepare');
      setDocumentTitle(pdfFile.name.replace('.pdf', ''));
    }
  }, [pdfFile]);

  // Add a new signer
  const addSigner = () => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
    const newSigner: Signer = {
      id: `signer-${Date.now()}`,
      name: '',
      email: '',
      role: 'signer',
      status: 'pending',
      color: colors[signers.length % colors.length]
    };
    setSigners([...signers, newSigner]);
  };

  // Update signer information
  const updateSigner = (id: string, updates: Partial<Signer>) => {
    setSigners(signers.map(signer => 
      signer.id === id ? { ...signer, ...updates } : signer
    ));
  };

  // Remove a signer
  const removeSigner = (id: string) => {
    setSigners(signers.filter(signer => signer.id !== id));
    // Remove signature fields assigned to this signer
    setSignatureFields(fields => fields.filter(field => field.assignedTo !== id));
  };

  // Add signature field to PDF
  const addSignatureField = (x: number, y: number) => {
    if (!selectedTool) return;

    const newField: SignatureField = {
      id: `field-${Date.now()}`,
      type: selectedTool,
      x,
      y,
      width: selectedTool === 'signature' ? 200 : selectedTool === 'date' ? 120 : 150,
      height: selectedTool === 'signature' ? 60 : 30,
      page: currentPage,
      required: true,
      assignedTo: signers[0]?.id // Assign to first signer by default
    };

    setSignatureFields([...signatureFields, newField]);
    setSelectedTool(null);
  };

  // Handle canvas click for adding fields
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTool) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    addSignatureField(x, y);
  };

  // Send document for signing
  const sendForSigning = async () => {
    if (signers.length === 0) {
      alert('Please add at least one signer');
      return;
    }

    if (signatureFields.length === 0) {
      alert('Please add at least one signature field');
      return;
    }

    // Simulate sending document
    setCurrentStep('sign');
    
    // In real implementation, this would:
    // 1. Upload PDF to server
    // 2. Create signing session
    // 3. Send emails to signers
    // 4. Set up real-time collaboration
    
    console.log('Sending document for signing:', {
      title: documentTitle,
      message: documentMessage,
      signers,
      fields: signatureFields
    });
  };

  // Simulate real-time signing updates
  useEffect(() => {
    if (currentStep === 'sign' && isRealTimeEnabled) {
      const interval = setInterval(() => {
        // Simulate random signing activity
        setSigners(prevSigners => 
          prevSigners.map(signer => {
            if (signer.status === 'pending' && Math.random() < 0.1) {
              return {
                ...signer,
                status: Math.random() < 0.8 ? 'signed' : 'declined',
                signedAt: new Date()
              };
            }
            return signer;
          })
        );
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [currentStep, isRealTimeEnabled]);

  const renderUploadStep = () => (
    <div className="text-center py-12">
      <FileText className="w-16 h-16 mx-auto mb-4 text-blue-500" />
      <h2 className="text-2xl font-bold mb-4">Upload PDF Document</h2>
      <p className="text-gray-600 mb-6">
        Upload the PDF document you want to send for signing
      </p>
      {!pdfFile && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <p>Drag and drop your PDF here or click to browse</p>
        </div>
      )}
    </div>
  );

  const renderPrepareStep = () => (
    <div className="space-y-6">
      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Document Title</label>
            <Input
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message to Signers</label>
            <Textarea
              value={documentMessage}
              onChange={(e) => setDocumentMessage(e.target.value)}
              placeholder="Add a message for the signers..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Signers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Signers ({signers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {signers.map((signer) => (
              <div key={signer.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: signer.color }}
                />
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <Input
                    placeholder="Full Name"
                    value={signer.name}
                    onChange={(e) => updateSigner(signer.id, { name: e.target.value })}
                  />
                  <Input
                    placeholder="Email Address"
                    type="email"
                    value={signer.email}
                    onChange={(e) => updateSigner(signer.id, { email: e.target.value })}
                  />
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={signer.role}
                    onChange={(e) => updateSigner(signer.id, { role: e.target.value as any })}
                  >
                    <option value="signer">Signer</option>
                    <option value="approver">Approver</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSigner(signer.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button onClick={addSigner} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Signer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signature Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signature className="w-5 h-5" />
            Signature Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Field Tools */}
            <div className="flex gap-2">
              {[
                { type: 'signature', icon: Signature, label: 'Signature' },
                { type: 'initial', icon: Type, label: 'Initial' },
                { type: 'date', icon: Calendar, label: 'Date' },
                { type: 'text', icon: Type, label: 'Text' }
              ].map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant={selectedTool === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool(selectedTool === type ? null : type as any)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>

            {/* PDF Canvas */}
            <div className="border rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="w-full cursor-crosshair"
                style={{ minHeight: '600px', backgroundColor: '#f9fafb' }}
              />
            </div>

            {/* Field List */}
            <div className="space-y-2">
              {signatureFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{field.type}</Badge>
                    <span className="text-sm">Page {field.page}</span>
                    <span className="text-sm text-gray-600">
                      Assigned to: {signers.find(s => s.id === field.assignedTo)?.name || 'Unassigned'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSignatureFields(fields => fields.filter(f => f.id !== field.id))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('upload')}>
          Back
        </Button>
        <Button onClick={sendForSigning} className="bg-blue-600 hover:bg-blue-700">
          <Send className="w-4 h-4 mr-2" />
          Send for Signing
        </Button>
      </div>
    </div>
  );

  const renderSigningStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Document Status: {documentTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Real-time status */}
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Real-time updates enabled
            </div>

            {/* Signer Status */}
            <div className="space-y-3">
              {signers.map((signer) => (
                <div key={signer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: signer.color }}
                    />
                    <div>
                      <p className="font-medium">{signer.name}</p>
                      <p className="text-sm text-gray-600">{signer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {signer.status === 'pending' && (
                      <Badge variant="outline" className="text-yellow-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {signer.status === 'signed' && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Signed
                      </Badge>
                    )}
                    {signer.status === 'declined' && (
                      <Badge variant="outline" className="text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Declined
                      </Badge>
                    )}
                    {signer.signedAt && (
                      <span className="text-xs text-gray-500">
                        {signer.signedAt.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Signing Progress</span>
                <span>
                  {signers.filter(s => s.status === 'signed').length} / {signers.length} signed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(signers.filter(s => s.status === 'signed').length / signers.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          Preview Document
        </Button>
        <Button variant="outline">
          <Send className="w-4 h-4 mr-2" />
          Send Reminder
        </Button>
        {signers.every(s => s.status === 'signed') && (
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setCurrentStep('complete')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Signed Document
          </Button>
        )}
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center py-12">
      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
      <h2 className="text-2xl font-bold mb-4">Document Completed!</h2>
      <p className="text-gray-600 mb-6">
        All signers have successfully signed the document.
      </p>
      <div className="flex justify-center gap-4">
        <Button className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          Download Signed PDF
        </Button>
        <Button variant="outline">
          <Send className="w-4 h-4 mr-2" />
          Send Copies to Signers
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PDF Signing Studio</h1>
        <p className="text-gray-600">Create, send, and track document signatures in real-time</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {[
          { key: 'upload', label: 'Upload', icon: FileText },
          { key: 'prepare', label: 'Prepare', icon: Users },
          { key: 'sign', label: 'Sign', icon: Signature },
          { key: 'complete', label: 'Complete', icon: CheckCircle }
        ].map(({ key, label, icon: Icon }, index) => (
          <div key={key} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep === key ? 'bg-blue-600 text-white' : 
              ['prepare', 'sign', 'complete'].includes(currentStep) && index < ['upload', 'prepare', 'sign', 'complete'].indexOf(currentStep) 
                ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="ml-2 text-sm font-medium">{label}</span>
            {index < 3 && <div className="w-8 h-px bg-gray-300 mx-4" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'prepare' && renderPrepareStep()}
          {currentStep === 'sign' && renderSigningStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};

export default PDFSigningStudio;
