import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Plus, Search, Upload, BookOpen, Users, Clock, Edit, Trash2, Eye, PlayCircle, Loader2, MessageSquare, PenLine, Headphones, BookMarked, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { Progress } from '../../../../components/ui/progress';
import { coursesManageAPI } from '../../../../services/coursesAPI';

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    skill: '',
    level: '',
    grade: '',
    description: '',
    lessons: 0,
    duration: 0
  });

  // Fetch courses from backend
  useEffect(() => {
    loadCourses();
  }, [selectedGrade, selectedSkill]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedGrade !== 'all') params.grade = selectedGrade;
      if (selectedSkill !== 'all') params.skill = selectedSkill;
      
      const data = await coursesManageAPI.getCourses(params);

      setCourses(data || []);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError(err?.detail || err?.message || 'Không thể tải khóa học');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete course
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      await coursesManageAPI.deleteCourse(selectedCourse.id);
      setIsDeleteOpen(false);
      setSelectedCourse(null);
      // Reload courses
      await loadCourses();
      alert('Đã xóa khóa học thành công!');
    } catch (err) {
      console.error('Error deleting course:', err);
      alert(err?.detail || 'Không thể xóa khóa học. Bạn có thể không có quyền xóa khóa học này.');
    }
  };

  // Handle update course
  const handleUpdateCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      await coursesManageAPI.updateCourse(selectedCourse.id, {
        title: editFormData.title,
        skill: editFormData.skill,
        level: editFormData.level,
        grade: parseInt(editFormData.grade),
        description: editFormData.description
      });
      setIsEditOpen(false);
      setSelectedCourse(null);
      await loadCourses();
      alert('Đã cập nhật khóa học thành công!');
    } catch (err) {
      console.error('Error updating course:', err);
      alert(err?.detail || 'Không thể cập nhật khóa học. Bạn có thể không có quyền sửa khóa học này.');
    }
  };

  // Get skill icon component (uses size prop from lucide for crisp scaling)
  const getSkillIcon = (skill, size = 64, className = '') => {
    const common = { size, className };
    const iconMap = {
      'speaking': <MessageSquare {...common} />,
      'writing': <PenLine {...common} />,
      'reading': <BookOpen {...common} />,
      'listening': <Headphones {...common} />,
      'vocabulary': <BookMarked {...common} />,
      'grammar': <FileText {...common} />
    };
    return iconMap[skill] || <BookMarked {...common} />;
  };

  // Get skill color
  const getSkillColor = (skill) => {
    const colorMap = {
      'speaking': 'bg-purple-100 text-purple-700',
      'writing': 'bg-orange-100 text-orange-700',
      'reading': 'bg-blue-100 text-blue-700',
      'listening': 'bg-green-100 text-green-700',
      'vocabulary': 'bg-yellow-100 text-yellow-700',
      'grammar': 'bg-pink-100 text-pink-700'
    };
    return colorMap[skill] || 'bg-gray-100 text-gray-700';
  };

  const skills = [
    { id: 'all', label: 'Tất cả', count: courses.length },
    { id: 'vocabulary', label: 'Từ vựng', count: courses.filter(c => c.category === 'vocabulary').length },
    { id: 'grammar', label: 'Ngữ pháp', count: courses.filter(c => c.category === 'grammar').length },
    { id: 'reading', label: 'Đọc', count: courses.filter(c => c.category === 'reading').length },
    { id: 'writing', label: 'Viết', count: courses.filter(c => c.category === 'writing').length },
    { id: 'listening', label: 'Nghe', count: courses.filter(c => c.category === 'listening').length },
    { id: 'speaking', label: 'Nói', count: courses.filter(c => c.category === 'speaking').length }
  ];

  const filteredCourses = courses.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGrade = selectedGrade === 'all' || c.gradeLabel?.includes(selectedGrade);
    const matchSkill = selectedSkill === 'all' || c.category === selectedSkill;
    return matchSearch && matchGrade && matchSkill;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'not-started': return 'bg-gray-100 text-gray-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'locked': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in-progress': return 'Đang học';
      case 'not-started': return 'Chưa học';
      case 'completed': return 'Đã hoàn thành';
      case 'locked': return 'Bị khóa';
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
              <p className="text-2xl font-bold text-gray-900">{courses.filter(c => c.status === 'in-progress').length}</p>
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
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Đang tải khóa học...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadCourses} variant="outline">Thử lại</Button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          Không có khóa học nào
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => {
            const progress = course.totalUnits > 0 
              ? Math.round((course.completedUnits / course.totalUnits) * 100) 
              : 0;
            
            return (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <div
                    className={`h-48 flex items-center justify-center ${
                      course.category === 'speaking' ? 'bg-purple-100' :
                      course.category === 'writing' ? 'bg-orange-100' :
                      course.category === 'reading' ? 'bg-blue-100' :
                      course.category === 'listening' ? 'bg-green-100' :
                      course.category === 'vocabulary' ? 'bg-yellow-100' : 'bg-pink-100'
                    }`}
                  >
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm flex items-center justify-center shrink-0">
                      {getSkillIcon(
                        course.category,
                        72,
                        (course.category === 'speaking' ? 'text-purple-600' :
                        course.category === 'writing' ? 'text-orange-600' :
                        course.category === 'reading' ? 'text-blue-600' :
                        course.category === 'listening' ? 'text-green-600' :
                        course.category === 'vocabulary' ? 'text-yellow-600' : 'text-pink-600') + ' block'
                      )}
                    </div>
                  </div>
                  <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
                    {course.level}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{course.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getStatusColor(course.status)}>
                      {getStatusText(course.status)}
                    </Badge>
                    <span className="text-xs text-gray-500">{course.gradeLabel}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {course.totalUnits || 0} bài học
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.completedUnits || 0} hoàn thành
                    </span>
                  </div>
                  {course.status === 'in-progress' && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Tiến độ</span>
                        <span className="text-gray-900">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          const fullCourse = await coursesManageAPI.getCourse(course.id);
                          setSelectedCourse(fullCourse);
                          setIsDetailOpen(true);
                        } catch (err) {
                          console.error('Error loading course details:', err);
                          alert('Không thể tải chi tiết khóa học');
                        }
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={async () => {
                        try {
                          const fullCourse = await coursesManageAPI.getCourse(course.id);
                          setSelectedCourse(fullCourse);
                          setEditFormData({
                            title: fullCourse.title,
                            skill: fullCourse.skill,
                            level: fullCourse.level,
                            grade: fullCourse.grade?.toString() || '',
                            description: fullCourse.description || ''
                          });
                          setIsEditOpen(true);
                        } catch (err) {
                          console.error('Error loading course for edit:', err);
                          alert(err?.detail || 'Không thể tải khóa học để chỉnh sửa');
                        }
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
              <Button onClick={handleUpdateCourse}>
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
            <DialogTitle>{selectedCourse?.title || 'Chi tiết khóa học'}</DialogTitle>
          </DialogHeader>
          {selectedCourse ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                <div>
                  <p className="text-xs text-gray-500">Kỹ năng</p>
                  <p className="text-sm text-gray-900 capitalize">{selectedCourse?.skill}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cấp độ</p>
                  <p className="text-sm text-gray-900">{selectedCourse?.level}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Khối lớp</p>
                  <p className="text-sm text-gray-900">Lớp {selectedCourse?.grade}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mô tả</h3>
                <p className="text-gray-600 text-sm">{selectedCourse?.description || 'Chưa có mô tả'}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin khác</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Trạng thái:</span>
                    <Badge className={selectedCourse?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {selectedCourse?.is_active ? 'Đang hoạt động' : 'Bị khóa'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Ngày tạo:</span>
                    <span className="text-gray-900">
                      {selectedCourse?.created_at ? new Date(selectedCourse.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end border-t pt-4">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
                <Button onClick={() => {
                  setEditFormData({
                    title: selectedCourse.title,
                    skill: selectedCourse.skill,
                    level: selectedCourse.level,
                    grade: selectedCourse.grade?.toString() || '',
                    description: selectedCourse.description || ''
                  });
                  setIsDetailOpen(false);
                  setIsEditOpen(true);
                }}>
                  Chỉnh sửa khóa học
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              Đang tải thông tin khóa học...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa khóa học</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Bạn có chắc chắn muốn xóa khóa học <strong>{selectedCourse?.name || selectedCourse?.title}</strong>?</p>
            <p className="text-sm text-gray-500 mt-2">Hành động này không thể hoàn tác.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCourse}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;
