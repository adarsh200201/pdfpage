import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  Code,
  Key,
  Globe,
  Zap,
  FileText,
  Download,
  Upload,
  Shield,
  Clock,
  BarChart,
  Users,
  ExternalLink,
  Copy,
  CheckCircle,
} from "lucide-react";

const ApiDocs = () => {
  const endpoints = [
    {
      method: "POST",
      endpoint: "/api/v1/merge",
      description: "Merge multiple PDF files into a single document",
      category: "PDF Operations",
    },
    {
      method: "POST",
      endpoint: "/api/v1/split",
      description: "Split a PDF into multiple files",
      category: "PDF Operations",
    },
    {
      method: "POST",
      endpoint: "/api/v1/compress",
      description: "Compress PDF file size while maintaining quality",
      category: "PDF Operations",
    },
    {
      method: "POST",
      endpoint: "/api/v1/convert/pdf-to-word",
      description: "Convert PDF to Word document",
      category: "Conversion",
    },
    {
      method: "POST",
      endpoint: "/api/v1/convert/word-to-pdf",
      description: "Convert Word document to PDF",
      category: "Conversion",
    },
    {
      method: "POST",
      endpoint: "/api/v1/protect",
      description: "Add password protection to PDF",
      category: "Security",
    },
    {
      method: "POST",
      endpoint: "/api/v1/unlock",
      description: "Remove password protection from PDF",
      category: "Security",
    },
    {
      method: "GET",
      endpoint: "/api/v1/status",
      description: "Check API status and health",
      category: "System",
    },
  ];

  const codeExamples = {
    javascript: `// JavaScript example using fetch
const apiKey = 'your_api_key_here';
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('https://api.pdfpage.com/v1/compress', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
  },
  body: formData
})
.then(response => response.blob())
.then(blob => {
  // Handle the compressed PDF
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'compressed.pdf';
  a.click();
});`,
    python: `# Python example using requests
import requests

api_key = 'your_api_key_here'
url = 'https://api.pdfpage.com/v1/compress'

headers = {
    'Authorization': f'Bearer {api_key}'
}

files = {
    'file': ('document.pdf', open('document.pdf', 'rb'), 'application/pdf')
}

response = requests.post(url, headers=headers, files=files)

if response.status_code == 200:
    with open('compressed.pdf', 'wb') as f:
        f.write(response.content)
    print('PDF compressed successfully!')
else:
    print(f'Error: {response.status_code}')`,
    curl: `# cURL example
curl -X POST https://api.pdfpage.com/v1/compress \\
  -H "Authorization: Bearer your_api_key_here" \\
  -F "file=@document.pdf" \\
  --output compressed.pdf`,
    nodejs: `// Node.js example using axios and form-data
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const apiKey = 'your_api_key_here';
const form = new FormData();
form.append('file', fs.createReadStream('document.pdf'));

axios.post('https://api.pdfpage.com/v1/compress', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': \`Bearer \${apiKey}\`,
  },
  responseType: 'stream'
})
.then(response => {
  response.data.pipe(fs.createWriteStream('compressed.pdf'));
  console.log('PDF compressed successfully!');
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});`,
  };

  const rateLimits = [
    {
      plan: "Free",
      requests: "100 requests/day",
      fileSize: "25 MB max",
      features: "Basic PDF operations",
    },
    {
      plan: "Pro",
      requests: "1,000 requests/day",
      fileSize: "100 MB max",
      features: "All operations + priority",
    },
    {
      plan: "Enterprise",
      requests: "Unlimited",
      fileSize: "Unlimited",
      features: "Custom integrations + SLA",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-brand-red/5 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-text-dark mb-6">
              API <span className="text-brand-red">Documentation</span>
            </h1>
            <p className="text-xl text-text-medium mb-8">
              Integrate PdfPage's powerful PDF processing capabilities directly
              into your applications with our RESTful API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-brand-red hover:bg-red-700">
                <Key className="mr-2 h-4 w-4" />
                Get API Key
              </Button>
              <Button variant="outline" size="lg">
                <Download className="mr-2 h-4 w-4" />
                Download SDKs
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Quick Start Guide
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Key className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-dark mb-3">
                  1. Get API Key
                </h3>
                <p className="text-text-medium text-sm mb-4">
                  Sign up for a free account and generate your API key from the
                  dashboard.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Code className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-dark mb-3">
                  2. Make Request
                </h3>
                <p className="text-text-medium text-sm mb-4">
                  Send HTTP requests to our endpoints with your API key in the
                  Authorization header.
                </p>
                <Button variant="outline" size="sm">
                  View Examples
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-text-dark mb-3">
                  3. Process Files
                </h3>
                <p className="text-text-medium text-sm mb-4">
                  Upload files and receive processed results in seconds with our
                  fast API.
                </p>
                <Button variant="outline" size="sm">
                  Test API
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* API Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            API Overview
          </h2>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-text-dark mb-4">
                    Base URL
                  </h3>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm mb-6">
                    https://api.pdfpage.com/v1
                  </div>

                  <h3 className="text-xl font-semibold text-text-dark mb-4">
                    Authentication
                  </h3>
                  <p className="text-text-medium mb-4">
                    All API requests require authentication using Bearer tokens:
                  </p>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-text-dark mb-4">
                    Response Format
                  </h3>
                  <p className="text-text-medium mb-4">
                    Most endpoints return processed files directly. Error
                    responses use JSON:
                  </p>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                    {`{
  "error": "Invalid file format",
  "code": "INVALID_FORMAT",
  "message": "Only PDF files are supported"
}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Code Examples */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Code Examples
          </h2>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                </TabsList>

                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                        <code>{code}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-4 right-4"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* API Endpoints */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Available Endpoints
          </h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge
                        className={
                          endpoint.method === "POST"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {endpoint.method}
                      </Badge>
                      <span className="font-mono text-sm">
                        {endpoint.endpoint}
                      </span>
                    </div>
                    <Badge variant="secondary">{endpoint.category}</Badge>
                  </div>
                  <p className="text-text-medium mt-3">
                    {endpoint.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Rate Limits & Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {rateLimits.map((plan, index) => (
              <Card
                key={index}
                className={`border-0 shadow-lg ${
                  plan.plan === "Pro"
                    ? "ring-2 ring-brand-red border-brand-red"
                    : ""
                }`}
              >
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-bold text-text-dark">
                    {plan.plan}
                  </CardTitle>
                  {plan.plan === "Pro" && (
                    <Badge className="bg-brand-red text-white">
                      Most Popular
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-text-dark">
                        {plan.requests}
                      </p>
                      <p className="text-text-medium text-sm">API Requests</p>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">
                        {plan.fileSize}
                      </p>
                      <p className="text-text-medium text-sm">File Size</p>
                    </div>
                    <div>
                      <p className="font-semibold text-text-dark">
                        {plan.features}
                      </p>
                      <p className="text-text-medium text-sm">Features</p>
                    </div>
                  </div>
                  <Button
                    className={`w-full mt-6 ${
                      plan.plan === "Pro" ? "bg-brand-red hover:bg-red-700" : ""
                    }`}
                    variant={plan.plan === "Pro" ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/pricing">
                      {plan.plan === "Free" ? "Get Started" : "Upgrade"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SDK Downloads */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Official SDKs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "JavaScript/Node.js", icon: Code, color: "yellow" },
              { name: "Python", icon: Code, color: "blue" },
              { name: "PHP", icon: Code, color: "purple" },
              { name: "Java", icon: Code, color: "red" },
            ].map((sdk, index) => (
              <Card key={index} className="text-center border-0 shadow-md">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 bg-${sdk.color}-100 rounded-lg flex items-center justify-center mx-auto mb-4`}
                  >
                    <sdk.icon className={`h-6 w-6 text-${sdk.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-text-dark mb-3">
                    {sdk.name}
                  </h3>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Error Handling */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-8 text-center">
            Error Handling
          </h2>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-text-dark mb-4">
                    HTTP Status Codes
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-800">200</Badge>
                      <span className="text-text-medium">Success</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        400
                      </Badge>
                      <span className="text-text-medium">Bad Request</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-red-100 text-red-800">401</Badge>
                      <span className="text-text-medium">Unauthorized</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-red-100 text-red-800">429</Badge>
                      <span className="text-text-medium">Rate Limited</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-red-100 text-red-800">500</Badge>
                      <span className="text-text-medium">Server Error</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-text-dark mb-4">
                    Error Response Format
                  </h3>
                  <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                    {`{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File exceeds maximum size limit",
    "details": {
      "max_size": "25MB",
      "received_size": "30MB"
    }
  }
}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Support */}
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-text-dark mb-4">
              Need Help with the API?
            </h2>
            <p className="text-text-medium mb-6 max-w-2xl mx-auto">
              Our developer support team is here to help you integrate and make
              the most of the PdfPage API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-brand-red hover:bg-red-700">
                <Link to="/contact">
                  Contact Support
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://github.com/pdfpage/examples"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Examples
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/status">API Status</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default ApiDocs;
