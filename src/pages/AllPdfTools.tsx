import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import { useState } from "react";
import {
  FileText,
  ArrowRight,
  Search,
  Star,
  Zap,
  Shield,
  Users,
  Combine,
  Scissors,
  Minimize,
  RotateCcw,
  FileImage,
  Lock,
  Edit,
  PenTool,
  Eye,
  Download,
  Upload,
  Layers,
  Settings,
  Crown,
  CheckCircle,
} from "lucide-react";

const AllPdfTools = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const allTools = [
    // Core PDF Tools
    {
      title: "Merge PDF",
      description: "Combine multiple PDF files into one document with drag & drop simplicity",
      href: "/merge",
      icon: Combine,
      category: "Core Tools",
      popular: true,
      keywords: "merge pdf, combine pdf, join pdf files, pdf merger",
      searchTerms: ["merge", "combine", "join", "merg", "combne"]
    },
    {
      title: "Split PDF", 
      description: "Extract specific pages or split PDF into multiple separate files",
      href: "/split",
      icon: Scissors,
      category: "Core Tools",
      popular: true,
      keywords: "split pdf, separate pdf, extract pages, pdf splitter",
      searchTerms: ["split", "separate", "extract", "splt", "divide"]
    },
    {
      title: "Compress PDF",
      description: "Reduce PDF file size while maintaining optimal quality",
      href: "/compress",
      icon: Minimize,
      category: "Core Tools", 
      popular: true,
      keywords: "compress pdf, reduce pdf size, pdf compressor, optimize pdf",
      searchTerms: ["compress", "reduce", "optimize", "compres", "shrink", "smaller"]
    },
    {
      title: "Rotate PDF",
      description: "Rotate PDF pages to correct orientation - 90, 180, or 270 degrees",
      href: "/rotate-pdf",
      icon: RotateCcw,
      category: "Core Tools",
      keywords: "rotate pdf, turn pdf pages, fix pdf orientation",
      searchTerms: ["rotate", "turn", "orientation", "rotat", "spin"]
    },

    // Conversion Tools
    {
      title: "PDF to Word",
      description: "Convert PDF to editable Word documents (DOCX) with perfect formatting",
      href: "/pdf-to-word",
      icon: FileText,
      category: "Conversion",
      popular: true,
      isNew: true,
      keywords: "pdf to word, convert pdf to word, pdf to docx, pdf2word",
      searchTerms: ["pdf to word", "word", "docx", "pd to word", "pdf2word", "doc"]
    },
    {
      title: "Word to PDF",
      description: "Convert Word documents (DOC, DOCX) to PDF format instantly",
      href: "/word-to-pdf", 
      icon: FileText,
      category: "Conversion",
      keywords: "word to pdf, doc to pdf, docx to pdf, convert word",
      searchTerms: ["word to pdf", "doc to pdf", "docx", "word2pdf"]
    },
    {
      title: "PowerPoint to PDF", 
      description: "Convert PowerPoint presentations to PDF for easy sharing",
      href: "/powerpoint-to-pdf",
      icon: FileText,
      category: "Conversion",
      keywords: "powerpoint to pdf, ppt to pdf, slides to pdf",
      searchTerms: ["powerpoint to pdf", "ppt to pdf", "slides"]
    },
    {
      title: "PDF to Excel",
      description: "Extract tables and data from PDF to Excel spreadsheets (XLSX)",
      href: "/pdf-to-excel",
      icon: FileText,
      category: "Conversion",
      isNew: true,
      keywords: "pdf to excel, pdf to xlsx, extract tables from pdf",
      searchTerms: ["excel", "xlsx", "spreadsheet", "tables", "data"]
    },
    {
      title: "Excel to PDF",
      description: "Convert Excel spreadsheets to PDF while preserving formatting",
      href: "/excel-to-pdf",
      icon: FileText,
      category: "Conversion", 
      keywords: "excel to pdf, xlsx to pdf, spreadsheet to pdf",
      searchTerms: ["excel to pdf", "xlsx", "spreadsheet"]
    },
    {
      title: "PDF to JPG",
      description: "Convert PDF pages to high-quality JPG images",
      href: "/pdf-to-jpg",
      icon: FileImage,
      category: "Conversion",
      popular: true,
      keywords: "pdf to jpg, pdf to image, pdf to jpeg, convert pdf to image",
      searchTerms: ["jpg", "jpeg", "image", "picture", "photo"]
    },
    {
      title: "JPG to PDF",
      description: "Convert JPG, PNG, and other images to PDF documents",
      href: "/jpg-to-pdf",
      icon: FileImage,
      category: "Conversion",
      keywords: "jpg to pdf, image to pdf, png to pdf, photo to pdf",
      searchTerms: ["jpg to pdf", "image to pdf", "png", "photo"]
    },
    // PDF Editor Tools
    {
      title: "Edit PDF",
      description: "Add text, images, shapes, and annotations to PDF documents",
      href: "/edit-pdf",
      icon: Edit,
      category: "Editor",
      popular: true,
      keywords: "edit pdf, pdf editor, modify pdf, add text to pdf",
      searchTerms: ["edit", "editor", "modify", "change", "add text"]
    },
    {
      title: "Page Numbers",
      description: "Add customizable page numbers to your PDF documents",
      href: "/page-numbers",
      icon: FileText,
      category: "Editor",
      keywords: "add page numbers, pdf page numbers, number pages",
      searchTerms: ["page numbers", "numbers", "pagination"]
    },
    {
      title: "Crop PDF",
      description: "Crop margins and select specific areas of PDF pages",
      href: "/crop-pdf",
      icon: Scissors,
      category: "Editor",
      keywords: "crop pdf, trim pdf margins, cut pdf",
      searchTerms: ["crop", "trim", "cut", "margins", "resize"]
    },

    // Security Tools
    {
      title: "Protect PDF",
      description: "Add password protection and encryption to secure PDF files",
      href: "/protect-pdf",
      icon: Shield,
      category: "Security",
      keywords: "protect pdf, password protect pdf, encrypt pdf",
      searchTerms: ["protect", "password", "encrypt", "secure", "lock"]
    },
    {
      title: "Unlock PDF", 
      description: "Remove password protection from encrypted PDF files",
      href: "/unlock-pdf",
      icon: Lock,
      category: "Security",
      keywords: "unlock pdf, remove password, decrypt pdf",
      searchTerms: ["unlock", "remove password", "decrypt", "open"]
    },

    // Advanced Tools
    {
      title: "Organize PDF",
      description: "Reorder, remove, and organize pages in your PDF documents",
      href: "/organize-pdf",
      icon: Settings,
      category: "Advanced",
      keywords: "organize pdf, reorder pages, arrange pdf",
      searchTerms: ["organize", "reorder", "arrange", "sort"]
    },
  ];

  const categories = [
    { name: "All Tools", count: allTools.length },
    { name: "Core Tools", count: allTools.filter(t => t.category === "Core Tools").length },
    { name: "Conversion", count: allTools.filter(t => t.category === "Conversion").length },
    { name: "Editor", count: allTools.filter(t => t.category === "Editor").length },
    { name: "Security", count: allTools.filter(t => t.category === "Security").length },
    { name: "Advanced", count: allTools.filter(t => t.category === "Advanced").length },
  ];

  const [selectedCategory, setSelectedCategory] = useState("All Tools");

  // Filter tools based on search and category
  const filteredTools = allTools.filter(tool => {
    const matchesCategory = selectedCategory === "All Tools" || tool.category === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.keywords.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.searchTerms.some(term => term.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const stats = [
    { icon: Users, number: "2M+", label: "Active Users" },
    { icon: FileText, number: "25+", label: "PDF Tools" },
    { icon: Star, number: "4.9", label: "User Rating" },
    { icon: Shield, number: "100%", label: "Secure" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <SEO
        title="All PDF Tools Free Online | Complete PDF Toolkit | PDFPage"
        description="Complete collection of free PDF tools online. Convert PDF to Word, merge, split, compress, edit, sign PDFs and more. 25+ professional tools, no registration required. Works on mobile & desktop."
        keywords="pdf tools, free pdf tools, online pdf tools, pdf toolkit, all pdf tools, pdf converter, merge pdf, split pdf, compress pdf, edit pdf, sign pdf, pdf to word, word to pdf, pdf to jpg, jpg to pdf, pdf to excel, excel to pdf, pdf to powerpoint, powerpoint to pdf, protect pdf, unlock pdf, pdf editor online, pdf processing tools, document tools, file converter, best pdf tools, professional pdf tools, pdf tools without registration, pdf tools no login, secure pdf tools, fast pdf tools, mobile pdf tools, pdf tools chrome, pdf page tools, pdfpage tools, complete pdf suite, pdf software online, pdf utilities, pdf manipulation tools"
        canonical="/all-tools"
        ogImage="/images/all-pdf-tools.jpg"
        toolName="Complete PDF Toolkit"
        toolType="suite"
        schemaData={{
          "@type": "ItemList",
          "name": "Complete PDF Tools Collection",
          "description": "Comprehensive collection of 25+ free PDF processing tools",
          "numberOfItems": allTools.length,
          "itemListElement": allTools.map((tool, index) => ({
            "@type": "SoftwareApplication",
            "position": index + 1,
            "name": tool.title,
            "description": tool.description,
            "url": `https://pdfpage.in${tool.href}`,
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          }))
        }}
      />
      <Header />

      {/* Hero Section */}
      <section className="pt-6 sm:pt-8 pb-8 sm:pb-12 bg-gradient-to-br from-blue-50 via-white to-purple-50/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 sm:mb-6 bg-blue-600/10 text-blue-600 border-blue-600/20 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2">
              🛠️ Complete PDF Toolkit
            </Badge>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4 sm:mb-6 px-4">
              All PDF Tools in One Place
            </h1>

            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-4">
              25+ professional PDF tools for every need. Convert, edit, merge, split, compress and more.
              <span className="font-bold text-gray-900"> All tools are completely free.</span>
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  type="text"
                  placeholder="Search tools... (e.g., 'pdf to word', 'merge', 'compress')"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
              {searchTerm && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  Found {filteredTools.length} tools matching "{searchTerm}"
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto px-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-full flex items-center justify-center mb-2">
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-extrabold text-gray-900 mb-1">
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-semibold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-4 sm:py-6 lg:py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.name)}
                className={`${
                  selectedCategory === category.name
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                } border-gray-200 font-medium px-6 py-2 rounded-full transition-all duration-200`}
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {filteredTools.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No tools found</h3>
              <p className="text-sm sm:text-base text-gray-500">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredTools.map((tool, index) => {
                const IconComponent = tool.icon;

                return (
                  <Link
                    key={tool.href}
                    to={tool.href}
                    className="group relative"
                  >
                    <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-4 sm:p-6">
                        {/* Badges */}
                        <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                          {tool.popular && (
                            <Badge className="bg-orange-500 text-white text-xs font-bold">
                              Popular
                            </Badge>
                          )}
                          {tool.isNew && (
                            <Badge className="bg-green-500 text-white text-xs font-bold">
                              New
                            </Badge>
                          )}
                        </div>

                        {/* Category Badge */}
                        <Badge variant="secondary" className="mb-3 text-xs">
                          {tool.category}
                        </Badge>

                        {/* Icon */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                          <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>

                        {/* Content */}
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors duration-200">
                          {tool.title}
                        </h3>
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                          {tool.description}
                        </p>

                        {/* Keywords for SEO (visible on hover) */}
                        <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Keywords: {tool.keywords}
                        </div>

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6">
            Start Using PDF Tools Now
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8">
            Join millions of users who trust PDFPage for their document processing needs.
            Professional tools, always free.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
              asChild
            >
              <Link to="/pdf-to-word">
                <Upload className="mr-2 h-5 w-5" />
                Try PDF to Word
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 font-bold"
              asChild
            >
              <Link to="/merge">
                <Combine className="mr-2 h-5 w-5" />
                Merge PDFs
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AllPdfTools;
