import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Upload, Plus, BookOpen, Users, FileText, Video, Calendar, Eye, Trash2, Edit } from 'lucide-react';
import { apiV1 } from '../../../../services/api';

const MyClassesTeacher = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState(false);

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassDetails(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassDetails = async (classId) => {
    try {
      const [lessonsRes, materialsRes, exercisesRes, studentsRes] = await Promise.all([
        apiV1.get(`/classes/${classId}/lessons`),
        apiV1.get(`/classes/${classId}/materials`),
        apiV1.get(`/classes/${classId}/exercises`),
        apiV1.get(`/classes/${classId}/students`)
      ]);
      
      setLessons(lessonsRes.data);
      setMaterials(materialsRes.data);
      setExercises(exercisesRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching class details:', error);
    }
  };

  const handleCreateLesson = async (lessonData) => {
    try {
      await apiV1.post(`/classes/${selectedClass.id}/lessons`, lessonData);
      fetchClassDetails(selectedClass.id);
    } catch (error) {
      console.error('Error creating lesson:', error);
    }
  };

  const handleUploadMaterial = async (file, materialData) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', materialData.title);
      formData.append('type', materialData.type);
      formData.append('description', materialData.description);
      
      await apiV1.post(`/classes/${selectedClass.id}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsUploadOpen(false);
      fetchClassDetails(selectedClass.id);
    } catch (error) {
      console.error('Error uploading material:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có lớp học nào</h3>
          <p className="text-gray-600">Bạn chưa được phân công giảng dạy lớp nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
  {/* Updated heading color for better contrast with background; supports dark mode */}
  <h1 className="text-4xl font-extrabold mb-2 text-slate-900 dark:text-white">Lớp học của tôi</h1>
        <p className="text-gray-600">Quản lý bài giảng, tài liệu và bài tập cho các lớp</p>
      </div>

      {/* Class Selection */}
      <div className="mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedClass?.id === cls.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={18} />
                <span>{cls.name}</span>
                <Badge variant="secondary" className="ml-2">{cls.student_count} HS</Badge>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Class Info Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedClass.name}</h2>
                <p className="text-gray-600 mb-4">{selectedClass.description || 'Không có mô tả'}</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} />
                    <span>{selectedClass.student_count} học sinh</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>{selectedClass.schedule || 'Chưa có lịch'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Upload size={18} />
                      Upload tài liệu
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload tài liệu bài giảng</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Tiêu đề</Label>
                        <Input placeholder="VD: Bài giảng Unit 7 - Technology" />
                      </div>
                      <div>
                        <Label>Loại tài liệu</Label>
                        <select className="w-full p-2 border rounded">
                          <option value="powerpoint">PowerPoint</option>
                          <option value="pdf">PDF</option>
                          <option value="video">Video</option>
                          <option value="link">Link</option>
                        </select>
                      </div>
                      <div>
                        <Label>Mô tả</Label>
                        <Textarea placeholder="Mô tả tài liệu..." rows={3} />
                      </div>
                      <div>
                        <Label>Tải lên file</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">Kéo thả file hoặc click để chọn</p>
                          <p className="text-xs text-gray-500">Hỗ trợ: PowerPoint, PDF, Video (tối đa 50MB)</p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Hủy</Button>
                        <Button>Upload</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isCreateExerciseOpen} onOpenChange={setIsCreateExerciseOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Plus size={18} />
                      Tạo bài tập
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tạo bài tập mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Tiêu đề</Label>
                        <Input placeholder="VD: Bài tập về nhà - Unit 7" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Loại</Label>
                          <select className="w-full p-2 border rounded">
                            <option value="assignment">Bài tập</option>
                            <option value="quiz">Kiểm tra</option>
                            <option value="test">Bài kiểm tra</option>
                          </select>
                        </div>
                        <div>
                          <Label>Điểm tối đa</Label>
                          <Input type="number" placeholder="10" />
                        </div>
                      </div>
                      <div>
                        <Label>Hạn nộp</Label>
                        <Input type="datetime-local" />
                      </div>
                      <div>
                        <Label>Mô tả</Label>
                        <Textarea placeholder="Mô tả bài tập..." rows={4} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="ai-grading" />
                        <Label htmlFor="ai-grading">Bật chấm điểm tự động bằng AI</Label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setIsCreateExerciseOpen(false)}>Hủy</Button>
                        <Button>Tạo bài tập</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>

          {/* Tabs for Lessons, Materials, Exercises, Students */}
          <Tabs defaultValue="lessons">
            <TabsList className="mb-6">
              <TabsTrigger value="lessons" className="gap-2">
                <BookOpen size={18} />
                Bài giảng ({lessons.length})
              </TabsTrigger>
              <TabsTrigger value="materials" className="gap-2">
                <Video size={18} />
                Tài liệu ({materials.length})
              </TabsTrigger>
              <TabsTrigger value="exercises" className="gap-2">
                <FileText size={18} />
                Bài tập ({exercises.length})
              </TabsTrigger>
              <TabsTrigger value="students" className="gap-2">
                <Users size={18} />
                Học sinh ({students.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lessons">
              <div className="space-y-4">
                {lessons.length === 0 ? (
                  <Card className="p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có bài giảng nào</p>
                    <Button className="mt-4" disabled>
                      Tạo bài giảng đầu tiên
                    </Button>
                  </Card>
                ) : (
                  lessons.map((lesson) => (
                    <Card key={lesson.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {lesson.session_number && (
                              <Badge variant="outline">Buổi {lesson.session_number}</Badge>
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                          </div>
                          <p className="text-gray-600 mb-2">{lesson.content || 'Không có nội dung'}</p>
                          {lesson.lesson_date && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar size={14} />
                              <span>{new Date(lesson.lesson_date).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit size={16} />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="materials">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.length === 0 ? (
                  <Card className="col-span-full p-12 text-center">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có tài liệu nào</p>
                  </Card>
                ) : (
                  materials.map((material) => (
                    <Card key={material.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {material.type === 'video' ? <Video className="text-purple-600" size={24} /> : <FileText className="text-purple-600" size={24} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{material.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye size={14} />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="exercises">
              <div className="space-y-4">
                {exercises.length === 0 ? (
                  <Card className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có bài tập nào</p>
                  </Card>
                ) : (
                  exercises.map((exercise) => (
                    <Card key={exercise.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{exercise.title}</h3>
                          <p className="text-gray-600 mb-3">{exercise.description}</p>
                          <div className="flex gap-4">
                            <div className="text-sm">
                              <span className="text-gray-500">Loại:</span>
                              <span className="ml-2 font-medium">{exercise.type === 'assignment' ? 'Bài tập' : 'Kiểm tra'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Hạn nộp:</span>
                              <span className="ml-2 font-medium">
                                {exercise.due_at ? new Date(exercise.due_at).toLocaleDateString('vi-VN') : 'Không có'}
                              </span>
                            </div>
                            {exercise.enable_ai_grading && (
                              <Badge className="bg-purple-100 text-purple-700">AI Grading</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Chi tiết</Button>
                          <Button size="sm" variant="outline">Chấm điểm</Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="students">
              <Card className="overflow-hidden">
                {students.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có học sinh nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tham gia</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.map((student, index) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.email || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(student.joined_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Button size="sm" variant="outline">Xem tiến độ</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default MyClassesTeacher;

