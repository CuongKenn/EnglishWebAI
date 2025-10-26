import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Plus, Search, Upload, BookOpen, Users, Clock, Edit, Trash2, Eye, PlayCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { Progress } from '../../../../components/ui/progress';

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [editFormData, setEditFormData] = useState({
    title: '',
    skill: '',
    level: '',
    grade: '',
    description: '',
    lessons: 0,
    duration: 0
  });

  const courses = [
    {
      id: '1',
      title: 'Speaking Cơ Bản Plus',
      level: 'PRE-INTERMEDIATE',
      skill: 'speaking',
      grade: 10,
      lessons: 24,
      students: 32,
      status: 'active',
      progress: 65,
      thumbnail: '🗣️',
      description: 'Khóa học phát triển kỹ năng nói tiếng Anh cơ bản với các chủ đề thực tế'
    },
    {
      id: '2',
      title: 'Writing Cơ Bản Plus 2',
      level: 'PRE-INTERMEDIATE',
      skill: 'writing',
      grade: 10,
      lessons: 20,
      students: 30,
      status: 'active',
      progress: 45,
      thumbnail: '✍️',
      description: 'Nâng cao kỹ năng viết tiếng Anh học thuật và giao tiếp'
    },
    {
      id: '3',
      title: 'Reading Cơ Bản',
      level: 'PRE-INTERMEDIATE',
      skill: 'reading',
      grade: 11,
      lessons: 18,
      students: 28,
      status: 'active',
      progress: 80,
      thumbnail: '📖',
      description: 'Phát triển khả năng đọc hiểu với các văn bản đa dạng'
    },
    {
      id: '4',
      title: 'Từ Vựng Cơ Bản Plus',
      level: 'PRE-INTERMEDIATE',
      skill: 'vocabulary',
      grade: 10,
      lessons: 30,
      students: 35,
      status: 'active',
      progress: 30,
      thumbnail: '📚',
      description: 'Mở rộng vốn từ vựng tiếng Anh theo chủ đề'
    },
    {
      id: '5',
      title: 'Listening Nâng Cao',
      level: 'INTERMEDIATE',
      skill: 'listening',
      grade: 11,
      lessons: 22,
      students: 25,
      status: 'draft',
      progress: 0,
      thumbnail: '🎧',
      description: 'Luyện nghe tiếng Anh với nhiều giọng nói và tốc độ khác nhau'
    },
    {
      id: '6',
      title: 'Grammar Foundation',
      level: 'BEGINNER',
      skill: 'grammar',
      grade: 10,
      lessons: 25,
      students: 40,
      status: 'completed',
      progress: 100,
      thumbnail: '📝',
      description: 'Nền tảng ngữ pháp tiếng Anh cơ bản'
    }
  ];

  const skills = [
    { id: 'all', label: 'Tất cả', count: courses.length },
    { id: 'vocabulary', label: 'Từ vựng', count: courses.filter(c => c.skill === 'vocabulary').length },
    { id: 'grammar', label: 'Ngữ pháp', count: courses.filter(c => c.skill === 'grammar').length },
    { id: 'reading', label: 'Đọc', count: courses.filter(c => c.skill === 'reading').length },
    { id: 'writing', label: 'Viết', count: courses.filter(c => c.skill === 'writing').length },
    { id: 'listening', label: 'Nghe', count: courses.filter(c => c.skill === 'listening').length },
    { id: 'speaking', label: 'Nói', count: courses.filter(c => c.skill === 'speaking').length }
  ];

  const filteredCourses = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGrade = selectedGrade === 'all' || c.grade.toString() === selectedGrade;
    const matchSkill = selectedSkill === 'all' || c.skill === selectedSkill;
    return matchSearch && matchGrade && matchSkill;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Đang học';
      case 'draft': return 'Chưa học';
      case 'completed': return 'Đã hoàn thành';
      default: return status;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Khóa học</h1>
        <p className="text-gray-600">Quản lý khóa học và cung cấp cho học sinh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tổng khóa học</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">{courses.filter(c => c.status === 'completed').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Đang học</p>
              <p className="text-2xl font-bold text-gray-900">{courses.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tổng học sinh</p>
              <p className="text-2xl font-bold text-gray-900">{courses.reduce((sum, c) => sum + c.students, 0)}</p>
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
              placeholder="Tìm kiếm khóa học..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Chọn lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                <SelectItem key={grade} value={grade.toString()}>Lớp {grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Tạo khóa học
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Tạo khóa học mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label>Tên khóa học</Label>
                  <Input placeholder="VD: Speaking Cơ Bản Plus" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Kỹ năng</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn kỹ năng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vocabulary">Từ vựng</SelectItem>
                        <SelectItem value="grammar">Ngữ pháp</SelectItem>
                        <SelectItem value="listening">Nghe</SelectItem>
                        <SelectItem value="speaking">Nói</SelectItem>
                        <SelectItem value="reading">Đọc</SelectItem>
                        <SelectItem value="writing">Viết</SelectItem>
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
                        <SelectItem value="beginner">BEGINNER</SelectItem>
                        <SelectItem value="pre-intermediate">PRE-INTERMEDIATE</SelectItem>
                        <SelectItem value="intermediate">INTERMEDIATE</SelectItem>
                        <SelectItem value="upper-intermediate">UPPER-INTERMEDIATE</SelectItem>
                        <SelectItem value="advanced">ADVANCED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Khối lớp</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lớp" />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 11, 12].map(grade => (
                          <SelectItem key={grade} value={grade.toString()}>Lớp {grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Mô tả khóa học</Label>
                  <Textarea placeholder="Mô tả nội dung và mục tiêu của khóa học..." rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Số bài học</Label>
                    <Input type="number" placeholder="20" />
                  </div>
                  <div>
                    <Label>Thời lượng (giờ)</Label>
                    <Input type="number" placeholder="40" />
                  </div>
                </div>
                <div>
                  <Label>Upload thumbnail</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Kéo thả ảnh hoặc click để chọn</p>
                    <p className="text-xs text-gray-500">PNG, JPG (tối đa 2MB)</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                  <Button variant="outline">Lưu nháp</Button>
                  <Button onClick={() => setIsCreateOpen(false)}>Tạo khóa học</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Skills Tabs */}
      <Tabs value={selectedSkill} onValueChange={setSelectedSkill} className="mb-6">
        <TabsList className="flex-wrap h-auto">
          {skills.map(skill => (
            <TabsTrigger key={skill.id} value={skill.id}>
              {skill.label} ({skill.count})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative">
              <div className={`h-40 flex items-center justify-center text-6xl ${
                course.skill === 'speaking' ? 'bg-purple-100' :
                course.skill === 'writing' ? 'bg-orange-100' :
                course.skill === 'reading' ? 'bg-blue-100' :
                course.skill === 'listening' ? 'bg-green-100' :
                course.skill === 'vocabulary' ? 'bg-yellow-100' : 'bg-pink-100'
              }`}>
                {course.thumbnail}
              </div>
              <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
                {course.level}
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{course.title}</h3>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getStatusColor(course.status)}>
                  {getStatusText(course.status)}
                </Badge>
                <span className="text-xs text-gray-500">Lớp {course.grade}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {course.lessons} bài học
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {course.students} HS
                </span>
              </div>
              {course.status === 'active' && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Tiến độ</span>
                    <span className="text-gray-900">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedCourse(course);
                    setIsDetailOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedCourse(course);
                    setEditFormData({
                      title: course.title,
                      skill: course.skill,
                      level: course.level,
                      grade: course.grade.toString(),
                      description: course.description,
                      lessons: course.lessons,
                      duration: 0
                    });
                    setIsEditOpen(true);
                  }}
                >
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

      {/* Edit Course Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-course-name">Tên khóa học</Label>
              <Input
                id="edit-course-name"
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Kỹ năng</Label>
                <Select value={editFormData.skill} onValueChange={(value) => setEditFormData({...editFormData, skill: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vocabulary">Từ vựng</SelectItem>
                    <SelectItem value="grammar">Ngữ pháp</SelectItem>
                    <SelectItem value="listening">Nghe</SelectItem>
                    <SelectItem value="speaking">Nói</SelectItem>
                    <SelectItem value="reading">Đọc</SelectItem>
                    <SelectItem value="writing">Viết</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cấp độ</Label>
                <Select value={editFormData.level} onValueChange={(value) => setEditFormData({...editFormData, level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">BEGINNER</SelectItem>
                    <SelectItem value="PRE-INTERMEDIATE">PRE-INTERMEDIATE</SelectItem>
                    <SelectItem value="INTERMEDIATE">INTERMEDIATE</SelectItem>
                    <SelectItem value="UPPER-INTERMEDIATE">UPPER-INTERMEDIATE</SelectItem>
                    <SelectItem value="ADVANCED">ADVANCED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Khối lớp</Label>
                <Select value={editFormData.grade} onValueChange={(value) => setEditFormData({...editFormData, grade: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 11, 12].map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>Lớp {grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Mô tả khóa học</Label>
              <Textarea 
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số bài học</Label>
                <Input 
                  type="number" 
                  value={editFormData.lessons}
                  onChange={(e) => setEditFormData({...editFormData, lessons: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Thời lượng (giờ)</Label>
                <Input 
                  type="number" 
                  value={editFormData.duration}
                  onChange={(e) => setEditFormData({...editFormData, duration: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div>
              <Label>Upload thumbnail mới (tùy chọn)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Kéo thả ảnh hoặc click để chọn</p>
                <p className="text-xs text-gray-500">PNG, JPG (tối đa 2MB)</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
              <Button onClick={() => {
                // TODO: Handle update course
                console.log('Updating course:', editFormData);
                setIsEditOpen(false);
              }}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm bài học mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="lesson-title">Tiêu đề bài học</Label>
              <Input
                id="lesson-title"
                placeholder="VD: Unit 1 - Introduction to English"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Thứ tự</Label>
                <Input type="number" placeholder="1" defaultValue="1" />
              </div>
              <div>
                <Label>Thời lượng (phút)</Label>
                <Input type="number" placeholder="45" defaultValue="45" />
              </div>
            </div>

            <div>
              <Label htmlFor="lesson-description">Mô tả bài học</Label>
              <textarea
                id="lesson-description"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Mô tả nội dung bài học..."
              />
            </div>

            <div>
              <Label>Tài liệu bài học</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Upload tài liệu, video, audio...</p>
                <p className="text-xs text-gray-500">PDF, DOCX, MP4, MP3 (tối đa 50MB)</p>
              </div>
            </div>

            <div>
              <Label>Bài tập kèm theo (tùy chọn)</Label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Chưa có bài tập nào</p>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm bài tập
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddLessonOpen(false)}>
                Hủy
              </Button>
              <Button className="flex-1" onClick={() => {
                setIsAddLessonOpen(false);
              }}>
                Thêm bài học
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCourse?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
              <div>
                <p className="text-xs text-gray-500">Kỹ năng</p>
                <p className="text-sm text-gray-900 capitalize">{selectedCourse?.skill}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cấp độ</p>
                <p className="text-sm text-gray-900">{selectedCourse?.level}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Số bài học</p>
                <p className="text-sm text-gray-900">{selectedCourse?.lessons} bài</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Học sinh</p>
                <p className="text-sm text-gray-900">{selectedCourse?.students} người</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mô tả</h3>
              <p className="text-gray-600 text-sm">{selectedCourse?.description}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách bài học</h3>
                <Button size="sm" onClick={() => {
                  setIsDetailOpen(false);
                  setIsAddLessonOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm bài học
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Array.from({ length: Math.min(selectedCourse?.lessons || 0, 10) }, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-gray-400 font-medium text-sm">{i + 1}</span>
                      <div>
                        <p className="text-sm text-gray-900 font-medium">Unit {Math.floor(i / 3) + 1} - Lesson {(i % 3) + 1}</p>
                        <p className="text-xs text-gray-500">30 phút • 5 bài tập</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Chưa học</Badge>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end border-t pt-4">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
              <Button>Chỉnh sửa khóa học</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;
