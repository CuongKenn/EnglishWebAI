import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Plus, Search, Eye, Edit, Trash2, Clock, Newspaper, TrendingUp, Globe, Sparkles } from 'lucide-react';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';

const NewsArticles = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  const articles = [
    {
      id: '1',
      title: 'Breaking News: New Climate Agreement Reached',
      category: 'environment',
      level: 'intermediate',
      source: 'BBC News',
      date: '26/10/2025',
      readTime: '5 phút',
      vocabulary: 25,
      thumbnail: '🌍',
      excerpt: 'World leaders have agreed on a new climate framework to reduce carbon emissions by 50% before 2030...',
      status: 'published'
    },
    {
      id: '2',
      title: 'Technology Breakthrough in AI Language Learning',
      category: 'technology',
      level: 'advanced',
      source: 'TechCrunch',
      date: '25/10/2025',
      readTime: '8 phút',
      vocabulary: 30,
      thumbnail: '🤖',
      excerpt: 'A new AI system has been developed that can help students learn languages more effectively...',
      status: 'published'
    },
    {
      id: '3',
      title: 'Youth Sports Championship Brings Communities Together',
      category: 'sports',
      level: 'beginner',
      source: 'Sports Daily',
      date: '24/10/2025',
      readTime: '4 phút',
      vocabulary: 18,
      thumbnail: '⚽',
      excerpt: 'The annual youth sports championship saw participation from over 500 students across the region...',
      status: 'draft'
    },
    {
      id: '4',
      title: 'Cultural Festival Celebrates Diversity',
      category: 'culture',
      level: 'intermediate',
      source: 'Local Times',
      date: '23/10/2025',
      readTime: '6 phút',
      vocabulary: 22,
      thumbnail: '🎭',
      excerpt: 'The city\'s annual cultural festival showcased performances and traditions from 20 different countries...',
      status: 'published'
    }
  ];

  const categories = [
    { id: 'all', label: 'Tất cả', count: articles.length },
    { id: 'technology', label: 'Công nghệ', count: articles.filter(a => a.category === 'technology').length },
    { id: 'environment', label: 'Môi trường', count: articles.filter(a => a.category === 'environment').length },
    { id: 'sports', label: 'Thể thao', count: articles.filter(a => a.category === 'sports').length },
    { id: 'culture', label: 'Văn hóa', count: articles.filter(a => a.category === 'culture').length },
    { id: 'education', label: 'Giáo dục', count: articles.filter(a => a.category === 'education').length }
  ];

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'beginner': return 'Cơ bản';
      case 'intermediate': return 'Trung cấp';
      case 'advanced': return 'Nâng cao';
      default: return level;
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tin tức & Bài viết</h1>
        <p className="text-gray-600">Quản lý tin tức và bài viết tiếng Anh cho học sinh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tổng bài viết</p>
              <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Đã xuất bản</p>
              <p className="text-2xl font-bold text-gray-900">
                {articles.filter(a => a.status === 'published').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Bản nháp</p>
              <p className="text-2xl font-bold text-gray-900">
                {articles.filter(a => a.status === 'draft').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Từ vựng</p>
              <p className="text-2xl font-bold text-gray-900">
                {articles.reduce((sum, a) => sum + a.vocabulary, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm bài viết..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Tạo bằng AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo bài viết bằng AI</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Chủ đề</Label>
                  <Input placeholder="VD: Climate change and its effects" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Danh mục</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Công nghệ</SelectItem>
                        <SelectItem value="environment">Môi trường</SelectItem>
                        <SelectItem value="sports">Thể thao</SelectItem>
                        <SelectItem value="culture">Văn hóa</SelectItem>
                        <SelectItem value="education">Giáo dục</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cấp độ</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn cấp độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Cơ bản</SelectItem>
                        <SelectItem value="intermediate">Trung cấp</SelectItem>
                        <SelectItem value="advanced">Nâng cao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Độ dài (từ)</Label>
                  <Input type="number" placeholder="300" defaultValue="300" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Hủy</Button>
                  <Button onClick={() => setIsGenerateOpen(false)} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Tạo bài viết
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm bài viết
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Thêm bài viết mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label>Tiêu đề</Label>
                  <Input placeholder="VD: Breaking News: ..." />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Danh mục</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Công nghệ</SelectItem>
                        <SelectItem value="environment">Môi trường</SelectItem>
                        <SelectItem value="sports">Thể thao</SelectItem>
                        <SelectItem value="culture">Văn hóa</SelectItem>
                        <SelectItem value="education">Giáo dục</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cấp độ</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn cấp độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Cơ bản</SelectItem>
                        <SelectItem value="intermediate">Trung cấp</SelectItem>
                        <SelectItem value="advanced">Nâng cao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nguồn</Label>
                    <Input placeholder="VD: BBC News" />
                  </div>
                </div>
                <div>
                  <Label>Tóm tắt</Label>
                  <Textarea placeholder="Tóm tắt ngắn gọn về bài viết..." rows={3} />
                </div>
                <div>
                  <Label>Nội dung</Label>
                  <Textarea placeholder="Nhập nội dung bài viết..." rows={10} />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                  <Button variant="outline">Lưu nháp</Button>
                  <Button onClick={() => setIsCreateOpen(false)}>Xuất bản</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Categories Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="flex-wrap h-auto">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label} ({cat.count})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-40 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-6xl">
              {article.thumbnail}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getLevelColor(article.level)}>
                  {getLevelText(article.level)}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {article.category === 'technology' ? 'Công nghệ' :
                   article.category === 'environment' ? 'Môi trường' :
                   article.category === 'sports' ? 'Thể thao' :
                   article.category === 'culture' ? 'Văn hóa' : 'Giáo dục'}
                </Badge>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{article.source}</span>
                <span>{article.date}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime}
                </span>
                <span>{article.vocabulary} từ vựng</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-2">
                  <Eye className="w-4 h-4" />
                  Xem
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NewsArticles;
