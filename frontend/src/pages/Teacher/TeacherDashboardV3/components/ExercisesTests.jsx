import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Upload, Plus, Search, Edit, Trash2, Eye, Users, Wand2, Copy, X, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { Progress } from '../../../../components/ui/progress';
import { apiV1 } from '../../../../services/api';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';

const ExercisesTests = () => {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [showExerciseLinkModal, setShowExerciseLinkModal] = useState(false);
  const [createdExerciseLink, setCreatedExerciseLink] = useState(null);
  const [tests, setTests] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newExercise, setNewExercise] = useState({
    title: '',
    classId: '',
    type: '',
    duration: '',
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    fetchClasses();
    fetchTests();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const classesResponse = await apiV1.get('/classes/teaching');
      let allTests = [];
      
      for (const cls of classesResponse.data) {
        try {
          const response = await apiV1.get(`/exercises/by-class/${cls.id}`);
          const testsWithClass = response.data.map(test => ({
            id: test.id,
            title: test.title,
            type: test.type || 'homework',
            class: cls.name,
            classId: cls.id,
            skills: test.skill_type ? [test.skill_type] : [],
            totalQuestions: 0,
            duration: test.duration || 0,
            dueDate: test.due_at ? new Date(test.due_at).toLocaleDateString('vi-VN') : null,
            status: 'published',
            totalStudents: cls.student_count || 0,
            completedStudents: test.submission_count || 0,  // Use submission_count from API
            createdDate: new Date(test.created_at).toLocaleDateString('vi-VN'),
            maxScore: test.max_score,
            description: test.description
          }));
          allTests = [...allTests, ...testsWithClass];
        } catch (error) {
          console.error(`Error fetching exercises for class ${cls.id}:`, error);
        }
      }
      
      setTests(allTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = async () => {
    try {
      if (!newExercise.title || !newExercise.classId) {
        showWarning('Vui lòng nhập tên bài kiểm tra và chọn lớp!');
        return;
      }

      const response = await apiV1.post('/exercises/', {
        class_id: parseInt(newExercise.classId),
        title: newExercise.title,
        description: newExercise.description || '',
        type: newExercise.type || 'homework',
        duration: newExercise.duration ? parseInt(newExercise.duration) : null,
        due_at: newExercise.dueDate || null,
        max_score: 10,
        content: {},
        enable_ai_grading: false
      });

      // Hiển thị modal với link
      const exerciseLink = `${window.location.origin}/exercise/${response.data.id}`;
      setCreatedExerciseLink({
        id: response.data.id,
        link: exerciseLink,
        classId: response.data.class_id
      });
      setShowExerciseLinkModal(true);

      // Reset form và refresh
      setNewExercise({
        title: '',
        classId: '',
        type: '',
        duration: '',
        dueDate: '',
        description: ''
      });
      setIsCreateOpen(false);
      await fetchTests();
    } catch (error) {
      console.error('Error creating exercise:', error);
      showError(`Không thể tạo bài tập: ${error.response?.data?.detail || error.message}`);
    }
  };

  const filteredTests = tests.filter(test => {
    const matchSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       test.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' ||
                    (activeTab === 'published' && test.status === 'published') ||
                    (activeTab === 'draft' && test.status === 'draft') ||
                    (activeTab === 'completed' && test.status === 'completed');
    return matchSearch && matchTab;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published': return 'Đã xuất bản';
      case 'draft': return 'Bản nháp';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'homework': return 'Bài tập về nhà';
      case 'quiz': return 'Kiểm tra 15 phút';
      case 'midterm': return 'Kiểm tra giữa kỳ';
      case 'final': return 'Kiểm tra cuối kỳ';
      default: return type;
    }
  };

  const mockQuestions = [
    { id: 1, content: 'What is the main idea of the passage?', type: 'multiple-choice', points: 2 },
    { id: 2, content: 'Fill in the blank: She ___ to school every day.', type: 'fill-blank', points: 1 },
    { id: 3, content: 'Listen and choose the correct answer.', type: 'multiple-choice', points: 2 }
  ];

  const mockSubmissions = [
    { studentId: 'HS001', studentName: 'Nguyễn Văn A', submitTime: '27/10/2025 14:30', score: null, status: 'pending' },
    { studentId: 'HS002', studentName: 'Trần Thị B', submitTime: '27/10/2025 15:00', score: 8.5, status: 'graded' },
    { studentId: 'HS003', studentName: 'Lê Văn C', submitTime: '27/10/2025 16:20', score: 7.0, status: 'graded' }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bài tập & Kiểm tra</h1>
        <p className="text-gray-600">Quản lý đề bài tập, kiểm tra và chấm điểm</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({tests.length})</TabsTrigger>
          <TabsTrigger value="published">Đã xuất bản ({tests.filter(t => t.status === 'published').length})</TabsTrigger>
          <TabsTrigger value="draft">Bản nháp ({tests.filter(t => t.status === 'draft').length})</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành ({tests.filter(t => t.status === 'completed').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm bài kiểm tra..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import đề
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import đề kiểm tra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Tên bài kiểm tra</Label>
                  <Input placeholder="VD: Kiểm tra giữa kỳ - Unit 5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Lớp</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lớp" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.length === 0 ? (
                          <SelectItem value="" disabled>Đang tải...</SelectItem>
                        ) : (
                          classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Loại bài kiểm tra</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homework">Bài tập về nhà</SelectItem>
                        <SelectItem value="quiz">Kiểm tra 15 phút</SelectItem>
                        <SelectItem value="midterm">Kiểm tra giữa kỳ</SelectItem>
                        <SelectItem value="final">Kiểm tra cuối kỳ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Tải lên file đề</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Kéo thả file hoặc click để chọn</p>
                    <p className="text-xs text-gray-500">Hỗ trợ: .docx, .txt (tối đa 10MB)</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsImportOpen(false)}>Hủy</Button>
                  <Button onClick={() => setIsImportOpen(false)}>Upload & Phân tích</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Wand2 className="w-4 h-4" />
                Tạo đề bằng AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Tạo đề kiểm tra tự động bằng AI</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 cursor-pointer border-2 border-purple-500 bg-purple-50">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="radio" name="aiMode" value="database" defaultChecked />
                      <h3 className="text-sm text-gray-900 font-semibold">Từ ngân hàng câu hỏi</h3>
                    </div>
                    <p className="text-xs text-gray-600">AI tạo đề từ các câu hỏi có sẵn trong hệ thống</p>
                  </Card>
                  <Card className="p-4 cursor-pointer border-2 hover:border-purple-300">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="radio" name="aiMode" value="generate" />
                      <h3 className="text-sm text-gray-900 font-semibold">AI tự sinh câu hỏi</h3>
                    </div>
                    <p className="text-xs text-gray-600">AI tạo câu hỏi mới hoàn toàn dựa trên chủ đề</p>
                  </Card>
                </div>

                <div>
                  <Label>Tên bài kiểm tra</Label>
                  <Input placeholder="VD: Kiểm tra Unit 7" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Lớp</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lớp" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.length === 0 ? (
                          <SelectItem value="" disabled>Đang tải...</SelectItem>
                        ) : (
                          classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Số lượng câu hỏi</Label>
                    <Input type="number" placeholder="20" />
                  </div>
                  <div>
                    <Label>Thời gian (phút)</Label>
                    <Input type="number" placeholder="45" />
                  </div>
                </div>
                <div>
                  <Label>Chọn kỹ năng</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" />
                      <span className="text-sm">Nghe</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" />
                      <span className="text-sm">Nói</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" />
                      <span className="text-sm">Đọc</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" />
                      <span className="text-sm">Viết</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Độ khó</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Dễ</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="hard">Khó</SelectItem>
                        <SelectItem value="mixed">Hỗn hợp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Chủ đề</Label>
                    <Input placeholder="VD: Unit 7 - Technology" />
                  </div>
                </div>
                <div>
                  <Label>Yêu cầu đặc biệt (tùy chọn)</Label>
                  <Textarea placeholder="VD: Tập trung vào từ vựng về môi trường, bao gồm cả câu hỏi về thì hiện tại hoàn thành..." rows={3} />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-900 mb-2">💡 Gợi ý:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Chế độ "Từ ngân hàng câu hỏi": Nhanh hơn, đảm bảo chất lượng từ câu hỏi đã kiểm duyệt</li>
                    <li>• Chế độ "AI tự sinh": Đa dạng hơn, phù hợp khi cần câu hỏi mới về chủ đề cụ thể</li>
                  </ul>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Hủy</Button>
                  <Button onClick={() => setIsGenerateOpen(false)} className="gap-2">
                    <Wand2 className="w-4 h-4" />
                    Tạo đề
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Tạo mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Tạo bài kiểm tra mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label>Tên bài kiểm tra</Label>
                  <Input 
                    placeholder="VD: Kiểm tra 15 phút - Unit 6"
                    value={newExercise.title}
                    onChange={(e) => setNewExercise({...newExercise, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Lớp</Label>
                    <Select
                      value={newExercise.classId}
                      onValueChange={(value) => setNewExercise({...newExercise, classId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lớp" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.length === 0 ? (
                          <SelectItem value="" disabled>Đang tải...</SelectItem>
                        ) : (
                          classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Loại</Label>
                    <Select
                      value={newExercise.type}
                      onValueChange={(value) => setNewExercise({...newExercise, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homework">Bài tập về nhà</SelectItem>
                        <SelectItem value="quiz">Kiểm tra 15 phút</SelectItem>
                        <SelectItem value="midterm">Kiểm tra giữa kỳ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Thời gian (phút)</Label>
                    <Input 
                      type="number" 
                      placeholder="45"
                      value={newExercise.duration}
                      onChange={(e) => setNewExercise({...newExercise, duration: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Hạn nộp</Label>
                  <Input 
                    type="date"
                    value={newExercise.dueDate}
                    onChange={(e) => setNewExercise({...newExercise, dueDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Textarea 
                    placeholder="Mô tả bài kiểm tra..." 
                    rows={3}
                    value={newExercise.description}
                    onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
                  />
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Danh sách câu hỏi</Label>
                    <Button size="sm" variant="outline">+ Thêm câu hỏi</Button>
                  </div>
                  <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed rounded">
                    Chưa có câu hỏi. Click "Thêm câu hỏi" để bắt đầu.
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                  <Button variant="outline">Lưu nháp</Button>
                  <Button onClick={handleCreateExercise}>Xuất bản</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Tests List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Đang tải danh sách bài tập...</p>
          </Card>
        ) : filteredTests.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">
              {searchQuery ? 'Không tìm thấy bài tập nào' : 'Chưa có bài tập nào. Hãy tạo bài tập mới!'}
            </p>
          </Card>
        ) : (
          filteredTests.map((test) => (
          <Card key={test.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{test.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{test.class}</Badge>
                      <Badge className={getStatusColor(test.status)}>
                        {getStatusText(test.status)}
                      </Badge>
                      <span className="text-xs text-gray-500">{getTypeText(test.type)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Số câu hỏi</p>
                    <p className="text-sm text-gray-900 font-medium">{test.totalQuestions} câu</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Thời gian</p>
                    <p className="text-sm text-gray-900 font-medium">{test.duration} phút</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hạn nộp</p>
                    <p className="text-sm text-gray-900 font-medium">{test.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Kỹ năng</p>
                    <p className="text-sm text-gray-900 font-medium">{test.skills.join(', ')}</p>
                  </div>
                </div>

                {test.status === 'published' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">
                        Tiến độ: {test.completedStudents}/{test.totalStudents} học sinh
                      </p>
                      <span className="text-xs text-gray-900 font-medium">
                        {Math.round((test.completedStudents / test.totalStudents) * 100)}%
                      </span>
                    </div>
                    <Progress value={(test.completedStudents / test.totalStudents) * 100} className="h-2" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setSelectedTest(test);
                    setIsDetailOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Chi tiết
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Sửa
                </Button>
                {test.status === 'published' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setSelectedTest(test);
                      setIsGradingOpen(true);
                    }}
                  >
                    <Users className="w-4 h-4" />
                    Chấm điểm
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </div>
            </div>
          </Card>
          ))
        )}
      </div>

      {/* Test Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTest?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
              <div>
                <p className="text-xs text-gray-500">Lớp</p>
                <p className="text-sm text-gray-900">{selectedTest?.class}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Loại</p>
                <p className="text-sm text-gray-900">{selectedTest && getTypeText(selectedTest.type)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Số câu hỏi</p>
                <p className="text-sm text-gray-900">{selectedTest?.totalQuestions} câu</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Thời gian</p>
                <p className="text-sm text-gray-900">{selectedTest?.duration} phút</p>
              </div>
            </div>

            {/* Link bài tập */}
            <div className="border-t pt-4">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                📎 Link bài tập cho học sinh:
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={`${window.location.origin}/exercise/${selectedTest?.id}`}
                  readOnly
                  className="flex-1 bg-gray-50 font-mono text-sm"
                />
                <Button
                  onClick={() => {
                    const link = `${window.location.origin}/exercise/${selectedTest?.id}`;
                    navigator.clipboard.writeText(link);
                    showSuccess('✅ Đã copy link vào clipboard!');
                  }}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Copy link này và gửi cho học sinh để họ làm bài tập
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Danh sách câu hỏi</h3>
              <div className="space-y-3">
                {mockQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 border rounded">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">Câu {idx + 1}:</span> {q.content}
                      </p>
                      <Badge variant="outline">{q.points} điểm</Badge>
                    </div>
                    <p className="text-xs text-gray-500">Loại: {q.type}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
              <Button>Chỉnh sửa</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Chấm điểm - {selectedTest?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded">
              <div>
                <p className="text-sm text-gray-600">Đã nộp bài</p>
                <p className="text-xl font-semibold text-gray-900">{selectedTest?.completedStudents}/{selectedTest?.totalStudents} học sinh</p>
              </div>
              <Button className="gap-2">
                <Wand2 className="w-4 h-4" />
                Chấm tự động bằng AI
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MSSV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Thời gian nộp</TableHead>
                  <TableHead>Điểm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSubmissions.map((sub) => (
                  <TableRow key={sub.studentId}>
                    <TableCell>{sub.studentId}</TableCell>
                    <TableCell>{sub.studentName}</TableCell>
                    <TableCell>{sub.submitTime}</TableCell>
                    <TableCell>
                      {sub.score !== null ? (
                        <span className="text-green-600 font-semibold">{sub.score}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.status === 'graded' ? (
                        <Badge className="bg-green-100 text-green-700">Đã chấm</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700">Chờ chấm</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        {sub.status === 'graded' ? 'Xem lại' : 'Chấm điểm'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsGradingOpen(false)}>Đóng</Button>
              <Button>Xuất kết quả</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal hiển thị link bài tập */}
      {showExerciseLinkModal && createdExerciseLink && (
        <Dialog open={showExerciseLinkModal} onOpenChange={setShowExerciseLinkModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-green-600 flex items-center gap-2">
                <Check className="w-6 h-6" />
                Tạo bài tập thành công!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-gray-700 mb-2">
                  <strong>ID Bài tập:</strong> #{createdExerciseLink.id}
                </p>
                {createdExerciseLink.classId && (
                  <p className="text-gray-700 mb-2">
                    <strong>Lớp học:</strong> {classes.find(c => c.id === createdExerciseLink.classId)?.name || createdExerciseLink.classId}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Link bài tập cho học sinh:
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={createdExerciseLink.link}
                    readOnly
                    className="flex-1 bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(createdExerciseLink.link);
                      showSuccess('✅ Đã copy link vào clipboard!');
                    }}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Hướng dẫn:</strong> Copy link này và gửi cho học sinh qua email, tin nhắn hoặc đăng trên lớp học online.
                  Học sinh có thể click vào link để làm bài tập.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(createdExerciseLink.link, '_blank');
                  }}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Xem trước
                </Button>
                <Button
                  onClick={() => setShowExerciseLinkModal(false)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {toast.show && toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
};

export default ExercisesTests;
