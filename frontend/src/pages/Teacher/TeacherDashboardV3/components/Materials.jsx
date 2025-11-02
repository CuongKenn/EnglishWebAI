import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { ArrowUpTrayIcon, PlusIcon, MagnifyingGlassIcon, EyeIcon, ArrowDownTrayIcon, TrashIcon, DocumentTextIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, DocumentIcon, FolderIcon } from '@heroicons/react/24/outline';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';

const Materials = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  const folders = [
    { id: '1', name: 'Unit 1 - Listening Materials', count: 12, type: 'audio' },
    { id: '2', name: 'Unit 2 - Reading Passages', count: 8, type: 'document' },
    { id: '3', name: 'Grammar Worksheets', count: 15, type: 'document' },
    { id: '4', name: 'Speaking Practice Videos', count: 20, type: 'video' },
    { id: '5', name: 'Vocabulary Flashcards', count: 50, type: 'image' }
  ];

  const materials = [
    {
      id: '1',
      name: 'Unit 5 - Listening Exercise.mp3',
      type: 'audio',
      size: '4.2 MB',
      class: '10A1',
      uploadDate: '24/10/2025',
      downloads: 32,
      folder: 'Unit 1 - Listening Materials'
    },
    {
      id: '2',
      name: 'Reading Comprehension - Environment.pdf',
      type: 'document',
      size: '1.8 MB',
      class: '10A2',
      uploadDate: '23/10/2025',
      downloads: 28,
      folder: 'Unit 2 - Reading Passages'
    },
    {
      id: '3',
      name: 'Grammar - Present Perfect.pptx',
      type: 'presentation',
      size: '3.5 MB',
      class: 'All',
      uploadDate: '22/10/2025',
      downloads: 65,
      folder: 'Grammar Worksheets'
    },
    {
      id: '4',
      name: 'Speaking Sample - IELTS Part 2.mp4',
      type: 'video',
      size: '45.2 MB',
      class: '11B1',
      uploadDate: '21/10/2025',
      downloads: 18,
      folder: 'Speaking Practice Videos'
    },
    {
      id: '5',
      name: 'Vocabulary Set 10 - Technology.jpg',
      type: 'image',
      size: '0.8 MB',
      class: '10A1',
      uploadDate: '20/10/2025',
      downloads: 42,
      folder: 'Vocabulary Flashcards'
    }
  ];

  const getFileIcon = (type) => {
    switch (type) {
      case 'audio': return <MusicalNoteIcon className="w-5 h-5 text-purple-500" />;
      case 'video': return <VideoCameraIcon className="w-5 h-5 text-red-500" />;
      case 'image': return <PhotoIcon className="w-5 h-5 text-blue-500" />;
      case 'document': return <DocumentTextIcon className="w-5 h-5 text-green-500" />;
      case 'presentation': return <DocumentTextIcon className="w-5 h-5 text-orange-500" />;
      default: return <DocumentIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'audio': return 'bg-purple-100 text-purple-700';
      case 'video': return 'bg-red-100 text-red-700';
      case 'image': return 'bg-blue-100 text-blue-700';
      case 'document': return 'bg-green-100 text-green-700';
      case 'presentation': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       m.folder.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = selectedType === 'all' || m.type === selectedType;
    const matchClass = selectedClass === 'all' || m.class === selectedClass || m.class === 'All';
    return matchSearch && matchType && matchClass;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tài liệu giảng dạy</h1>
        <p className="text-gray-600">Quản lý tài liệu, bài giảng và học liệu</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FolderIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Thư mục</p>
              <p className="text-xl font-bold text-gray-900">{folders.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Tài liệu</p>
              <p className="text-xl font-bold text-gray-900">{materials.filter(m => m.type === 'document').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <VideoCameraIcon className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Video</p>
              <p className="text-xl font-bold text-gray-900">{materials.filter(m => m.type === 'video').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MusicalNoteIcon className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Audio</p>
              <p className="text-xl font-bold text-gray-900">{materials.filter(m => m.type === 'audio').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <PhotoIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Hình ảnh</p>
              <p className="text-xl font-bold text-gray-900">{materials.filter(m => m.type === 'image').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm tài liệu..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Loại file" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="document">Tài liệu</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="image">Hình ảnh</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              <SelectItem value="10A1">10A1</SelectItem>
              <SelectItem value="10A2">10A2</SelectItem>
              <SelectItem value="11B1">11B1</SelectItem>
              <SelectItem value="11B2">11B2</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FolderIcon className="w-4 h-4" />
                Tạo thư mục
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo thư mục mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Tên thư mục</Label>
                  <Input placeholder="VD: Unit 6 - Reading Materials" />
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Textarea placeholder="Mô tả ngắn về nội dung thư mục..." rows={3} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Hủy</Button>
                  <Button onClick={() => setIsCreateFolderOpen(false)}>Tạo thư mục</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <ArrowUpTrayIcon className="w-4 h-4" />
                Tải lên
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tải lên tài liệu</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-base text-gray-600 mb-2">Kéo thả file hoặc click để chọn</p>
                  <p className="text-sm text-gray-500 mb-4">Hỗ trợ: PDF, DOCX, PPTX, MP3, MP4, JPG, PNG (tối đa 100MB)</p>
                  <Button variant="outline">Chọn file</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Thư mục</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thư mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lớp</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lớp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả lớp</SelectItem>
                        <SelectItem value="10a1">10A1</SelectItem>
                        <SelectItem value="10a2">10A2</SelectItem>
                        <SelectItem value="11b1">11B1</SelectItem>
                        <SelectItem value="11b2">11B2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Mô tả (tùy chọn)</Label>
                  <Textarea placeholder="Mô tả ngắn về tài liệu..." rows={3} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Hủy</Button>
                  <Button onClick={() => setIsUploadOpen(false)}>Tải lên</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Folders Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thư mục</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {folders.map((folder) => (
            <Card key={folder.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <FolderIcon className="w-16 h-16 text-blue-500 mb-3" />
                <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{folder.name}</h4>
                <p className="text-xs text-gray-500">{folder.count} file</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Materials List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Tài liệu ({filteredMaterials.length})
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(material.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{material.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className={getTypeColor(material.type)}>
                      {material.type === 'audio' ? 'Audio' :
                       material.type === 'video' ? 'Video' :
                       material.type === 'image' ? 'Hình ảnh' :
                       material.type === 'document' ? 'Tài liệu' : 'File'}
                    </Badge>
                    <span className="text-xs text-gray-500">{material.size}</span>
                    <span className="text-xs text-gray-500">{material.folder}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{material.class}</span>
                  <span>•</span>
                  <span>{material.uploadDate}</span>
                  <span>•</span>
                  <span>{material.downloads} tải</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Materials;
