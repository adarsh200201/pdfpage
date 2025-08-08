import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  FileText, 
  Handshake, 
  CreditCard, 
  FileCheck,
  Building,
  Users,
  Star,
  Download,
  Eye,
  Heart,
  Bookmark
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  downloads: number;
  tags: string[];
  premium: boolean;
  preview: string;
}

const templates: Template[] = [
  {
    id: '1',
    name: 'Sales Proposal Template',
    category: 'Proposals',
    description: 'Professional sales proposal with pricing tables and terms',
    rating: 4.8,
    downloads: 12500,
    tags: ['Sales', 'B2B', 'Professional'],
    premium: false,
    preview: '/api/placeholder/400/300'
  },
  {
    id: '2',
    name: 'Service Agreement Contract',
    category: 'Contracts',
    description: 'Comprehensive service agreement with SLA and payment terms',
    rating: 4.9,
    downloads: 8900,
    tags: ['Services', 'Legal', 'SLA'],
    premium: true,
    preview: '/api/placeholder/400/300'
  },
  {
    id: '3',
    name: 'Project Quote Template',
    category: 'Quotes',
    description: 'Detailed project quote with timeline and deliverables',
    rating: 4.7,
    downloads: 15600,
    tags: ['Projects', 'Timeline', 'Deliverables'],
    premium: false,
    preview: '/api/placeholder/400/300'
  },
  {
    id: '4',
    name: 'Employment Contract',
    category: 'Contracts',
    description: 'Standard employment contract with benefits and policies',
    rating: 4.9,
    downloads: 6700,
    tags: ['HR', 'Employment', 'Legal'],
    premium: true,
    preview: '/api/placeholder/400/300'
  },
  {
    id: '5',
    name: 'NDA Agreement',
    category: 'Agreements',
    description: 'Non-disclosure agreement for confidential information',
    rating: 4.6,
    downloads: 9800,
    tags: ['Legal', 'Confidential', 'Business'],
    premium: false,
    preview: '/api/placeholder/400/300'
  },
  {
    id: '6',
    name: 'SaaS Subscription Agreement',
    category: 'Contracts',
    description: 'Software subscription contract with usage terms',
    rating: 4.8,
    downloads: 5400,
    tags: ['SaaS', 'Software', 'Subscription'],
    premium: true,
    preview: '/api/placeholder/400/300'
  }
];

const categories = ['All', 'Proposals', 'Contracts', 'Quotes', 'Agreements'];

const TemplateLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const toggleFavorite = (templateId: string) => {
    setFavorites(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Proposals':
        return <Handshake className="w-4 h-4" />;
      case 'Contracts':
        return <FileCheck className="w-4 h-4" />;
      case 'Quotes':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Template Library</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose from 750+ professionally designed templates to get started quickly
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search templates, categories, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <div className="flex gap-3 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center gap-2"
                >
                  {category !== 'All' && getCategoryIcon(category)}
                  {category}
                </Button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="name">A-Z</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">750+</div>
          <div className="text-sm text-gray-600">Templates</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">50+</div>
          <div className="text-sm text-gray-600">Categories</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">1M+</div>
          <div className="text-sm text-gray-600">Downloads</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">4.8</div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <FileText className="w-16 h-16 text-gray-400" />
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                {template.premium && (
                  <Badge className="bg-yellow-500 text-yellow-900">
                    Premium
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-8 h-8 p-0 bg-white/80 hover:bg-white"
                  onClick={() => toggleFavorite(template.id)}
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      favorites.includes(template.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-600'
                    }`} 
                  />
                </Button>
              </div>
              <div className="absolute bottom-3 left-3">
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 group-hover:text-emerald-600 transition-colors">
                {template.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {template.description}
              </p>
              
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{template.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  <span>{template.downloads.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Use Template
                </Button>
                <Button size="sm" variant="outline" className="px-3">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {sortedTemplates.length >= 6 && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More Templates
          </Button>
        </div>
      )}

      {/* No Results */}
      {sortedTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters
          </p>
          <Button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
