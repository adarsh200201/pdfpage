import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Smartphone,
  BarChart3,
  LayoutTemplate,
  Bot,
  CreditCard,
  FileCheck,
  Workflow,
  FileImage,
  Building,
  Handshake,
  Target,
  PlayCircle,
  TrendingUp,
  Calendar,
  Mail,
  Settings,
  Database,
  Lock,
  Award,
  Rocket,
  Plus,
  Minus,
  RotateCcw,
  Eye,
  Download,
  Share2,
  MousePointer,
  Type,
  Image,
  Calendar as CalendarIcon,
  Table,
  CheckSquare,
  Circle,
  Hash,
  DollarSign,
  Phone,
  MapPin,
  Link,
  Trash2,
  Copy,
  Edit3,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentField {
  id: string;
  type: 'signature' | 'text' | 'date' | 'checkbox' | 'image' | 'table' | 'number' | 'phone' | 'email';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  assignee?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'approver' | 'viewer';
  color: string;
}

const DocumentSigning = () => {
  const [file, setFile] = useState<File | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [fields, setFields] = useState<DocumentField[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', name: 'You', email: 'you@company.com', role: 'signer', color: '#3B82F6' },
  ]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ name: '', email: '', role: 'signer' as const });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fieldTypes = [
    { id: 'signature', label: 'Signature', icon: Signature, color: '#EF4444' },
    { id: 'text', label: 'Text', icon: Type, color: '#3B82F6' },
    { id: 'date', label: 'Date', icon: CalendarIcon, color: '#10B981' },
    { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: '#8B5CF6' },
    { id: 'image', label: 'Image', icon: Image, color: '#F59E0B' },
    { id: 'table', label: 'Table', icon: Table, color: '#6B7280' },
    { id: 'number', label: 'Number', icon: Hash, color: '#EC4899' },
    { id: 'phone', label: 'Phone', icon: Phone, color: '#14B8A6' },
    { id: 'email', label: 'Email', icon: Mail, color: '#F97316' }
  ];

  const recipientColors = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFile = acceptedFiles[0];
    if (pdfFile && pdfFile.type === 'application/pdf') {
      setFile(pdfFile);
      setShowEditor(true);
      setTotalPages(5); // Mock - would be calculated from actual PDF
      toast({
        title: "Document uploaded successfully!",
        description: "Ready to add fields and recipients.",
      });
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

  const addField = (type: string, x: number, y: number) => {
    const newField: DocumentField = {
      id: Date.now().toString(),
      type: type as any,
      x,
      y,
      width: type === 'signature' ? 200 : type === 'checkbox' ? 20 : 150,
      height: type === 'signature' ? 60 : type === 'checkbox' ? 20 : 30,
      page: currentPage,
      assignee: recipients[0].id,
      required: true,
      placeholder: `Enter ${type}`
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
    setSelectedTool(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!selectedTool || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / (zoom / 100));
    const y = ((e.clientY - rect.top) / (zoom / 100));
    
    addField(selectedTool, x, y);
  };

  const updateField = (fieldId: string, updates: Partial<DocumentField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
    setSelectedField(null);
  };

  const addRecipient = () => {
    if (!newRecipient.name || !newRecipient.email) return;
    
    const recipient: Recipient = {
      id: Date.now().toString(),
      ...newRecipient,
      color: recipientColors[recipients.length % recipientColors.length]
    };
    
    setRecipients([...recipients, recipient]);
    setNewRecipient({ name: '', email: '', role: 'signer' });
    setIsAddingRecipient(false);
  };

  const sendForSigning = () => {
    if (fields.length === 0) {
      toast({
        title: "No fields added",
        description: "Please add at least one field before sending.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Document sent for signing!",
      description: `Sent to ${recipients.length} recipients.`,
    });
  };

  if (!showEditor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">PdfPage Hub</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="text-gray-700">Log in</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">Start a trial</Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Create documents
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                that impress
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Build professional documents with drag-and-drop fields, get signatures, and track everything in real-time.
            </p>
          </div>

          {/* Upload Section */}
          <Card className="max-w-3xl mx-auto shadow-xl border-0">
            <CardHeader className="text-center pb-8">
              <CardTitle className="flex items-center gap-3 text-2xl justify-center">
                <Upload className="w-8 h-8 text-emerald-600" />
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
                    ? 'border-emerald-500 bg-emerald-50 scale-[1.02] shadow-lg' 
                    : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-20 h-20 mx-auto mb-8 text-gray-400" />
                {isDragActive ? (
                  <div>
                    <p className="text-2xl font-semibold text-emerald-600 mb-3">
                      Drop your PDF here!
                    </p>
                    <p className="text-gray-600 text-lg">Release to upload and start editing</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-semibold mb-3">
                      Drag & drop your PDF document
                    </p>
                    <p className="text-gray-600 mb-8 text-lg">
                      or click to browse your files
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3">
                        <Upload className="w-5 h-5 mr-3" />
                        Choose PDF File
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-lg px-8 py-3"
                        onClick={() => {
                          setFile(new File(['demo'], 'Demo Document.pdf', { type: 'application/pdf' }));
                          setShowEditor(true);
                          setTotalPages(5);
                          toast({
                            title: "Demo document loaded!",
                            description: "Try the drag-and-drop editor features.",
                          });
                        }}
                      >
                        <PlayCircle className="w-5 h-5 mr-3" />
                        Try Demo
                      </Button>
                    </div>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowEditor(false)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold">{file?.name || 'Document'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              onClick={sendForSigning}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send for Signing
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 m-4">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="flex-1 px-4 pb-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Content Blocks</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {fieldTypes.slice(0, 6).map((type) => (
                      <Button
                        key={type.id}
                        variant={selectedTool === type.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool(selectedTool === type.id ? null : type.id)}
                        className="flex items-center gap-2 justify-start h-10"
                      >
                        <type.icon className="w-4 h-4" style={{ color: type.color }} />
                        <span className="text-xs">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Fillable Fields</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {fieldTypes.slice(6).map((type) => (
                      <Button
                        key={type.id}
                        variant={selectedTool === type.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool(selectedTool === type.id ? null : type.id)}
                        className="flex items-center gap-2 justify-start h-10"
                      >
                        <type.icon className="w-4 h-4" style={{ color: type.color }} />
                        <span className="text-xs">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedField && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Field Properties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Assignee</Label>
                        <select 
                          className="w-full px-2 py-1 border rounded text-sm"
                          value={fields.find(f => f.id === selectedField)?.assignee || ''}
                          onChange={(e) => updateField(selectedField, { assignee: e.target.value })}
                        >
                          {recipients.map(recipient => (
                            <option key={recipient.id} value={recipient.id}>
                              {recipient.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Placeholder</Label>
                        <Input 
                          className="h-8 text-sm"
                          value={fields.find(f => f.id === selectedField)?.placeholder || ''}
                          onChange={(e) => updateField(selectedField, { placeholder: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="required"
                          checked={fields.find(f => f.id === selectedField)?.required || false}
                          onChange={(e) => updateField(selectedField, { required: e.target.checked })}
                        />
                        <Label htmlFor="required" className="text-xs">Required field</Label>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteField(selectedField)}
                        className="w-full text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete Field
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recipients" className="flex-1 px-4 pb-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Recipients ({recipients.length})</h3>
                  <Button 
                    size="sm" 
                    onClick={() => setIsAddingRecipient(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>

                {isAddingRecipient && (
                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <Input 
                        placeholder="Name"
                        value={newRecipient.name}
                        onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
                        className="h-8"
                      />
                      <Input 
                        placeholder="Email"
                        type="email"
                        value={newRecipient.email}
                        onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})}
                        className="h-8"
                      />
                      <select 
                        value={newRecipient.role}
                        onChange={(e) => setNewRecipient({...newRecipient, role: e.target.value as any})}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="signer">Signer</option>
                        <option value="approver">Approver</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addRecipient} className="flex-1">
                          Add
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setIsAddingRecipient(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {recipients.map((recipient, index) => (
                    <Card key={recipient.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: recipient.color }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{recipient.name}</p>
                            <p className="text-xs text-gray-600">{recipient.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {recipient.role}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 px-4 pb-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Document Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Document Title</Label>
                      <Input className="h-8" defaultValue={file?.name} />
                    </div>
                    <div>
                      <Label className="text-sm">Message</Label>
                      <textarea 
                        className="w-full px-3 py-2 border rounded text-sm resize-none"
                        rows={3}
                        placeholder="Please review and sign this document..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="remind" />
                      <Label htmlFor="remind" className="text-sm">Send reminders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="sequential" />
                      <Label htmlFor="sequential" className="text-sm">Sequential signing</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Document Toolbar */}
          <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm min-w-[60px] text-center">{zoom}%</span>
                <Button size="sm" variant="ghost" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {selectedTool && (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-lg">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                <span className="text-sm text-emerald-700">
                  Click anywhere on the document to place a {fieldTypes.find(t => t.id === selectedTool)?.label} field
                </span>
                <Button size="sm" variant="ghost" onClick={() => setSelectedTool(null)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            {!selectedTool && fields.length === 0 && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
                <MousePointer className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Select a field type from the left sidebar, then click on the document to add it
                </span>
              </div>
            )}
          </div>

          {/* Document Viewer */}
          <div className="flex-1 overflow-auto bg-gray-200 p-8">
            <div className="mx-auto" style={{ width: `${8.5 * (zoom / 100) * 96}px` }}>
              <div 
                ref={canvasRef}
                className="relative bg-white shadow-lg mx-auto cursor-crosshair"
                style={{ 
                  width: `${8.5 * (zoom / 100) * 96}px`,
                  height: `${11 * (zoom / 100) * 96}px`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center'
                }}
                onClick={handleCanvasClick}
              >
                {/* Mock PDF Content */}
                <div className="absolute inset-0 p-12">
                  <div className="text-center mb-8">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2Fcf498962cef748de985da6ede216cc30%2F701a8b487df54fbd8d39616545b7a1b3?format=webp&width=800"
                      alt="Project Header"
                      className="mx-auto mb-4 rounded-lg shadow-sm max-w-full h-32 object-cover"
                    />
                    <h1 className="text-2xl font-bold mb-4">PROJECT DEVELOPMENT PROPOSAL</h1>
                    <p className="text-gray-600">Prepared for: Tech Solutions Inc.</p>
                    <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <p>
                      This proposal outlines the comprehensive development plan for your upcoming project. 
                      Our team has carefully analyzed your requirements and prepared a detailed approach 
                      that will ensure successful delivery within the specified timeline.
                    </p>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold">Project Scope:</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Frontend development using React and TypeScript</li>
                        <li>Backend API development with Node.js</li>
                        <li>Database design and implementation</li>
                        <li>Testing and quality assurance</li>
                        <li>Deployment and maintenance</li>
                      </ul>
                    </div>

                    <div className="mt-8">
                      <h3 className="font-semibold">Timeline:</h3>
                      <p>The project is estimated to take 12-16 weeks from start to completion.</p>
                    </div>

                    <div className="mt-8">
                      <h3 className="font-semibold">Investment:</h3>
                      <p>Total project cost: $45,000 - $55,000</p>
                    </div>
                  </div>
                </div>

                {/* Render Fields */}
                {fields
                  .filter(field => field.page === currentPage)
                  .map(field => {
                    const fieldType = fieldTypes.find(t => t.id === field.type);
                    const recipient = recipients.find(r => r.id === field.assignee);
                    const isSelected = selectedField === field.id;
                    
                    return (
                      <div
                        key={field.id}
                        className={`absolute border-2 ${
                          isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-gray-400 bg-gray-50'
                        } cursor-pointer hover:border-emerald-400 group`}
                        style={{
                          left: field.x,
                          top: field.y,
                          width: field.width,
                          height: field.height,
                          borderColor: recipient?.color || '#6B7280'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedField(field.id);
                        }}
                      >
                        <div className="flex items-center justify-center h-full text-xs font-medium relative">
                          {fieldType && (
                            <fieldType.icon 
                              className="w-4 h-4 mr-1" 
                              style={{ color: recipient?.color || '#6B7280' }} 
                            />
                          )}
                          <span style={{ color: recipient?.color || '#6B7280' }}>
                            {field.placeholder}
                          </span>
                          
                          {/* Field controls */}
                          <div className="absolute -top-6 left-0 bg-white border rounded px-2 py-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-xs whitespace-nowrap">
                            {recipient?.name} - {fieldType?.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSigning;
