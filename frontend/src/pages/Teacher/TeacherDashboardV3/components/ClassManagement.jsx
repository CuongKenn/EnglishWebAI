import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Plus, Search, Users, BookOpen, TrendingUp, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { Progress } from '../../../../components/ui/progress';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { getClasses, getClassStudents } from '../../../../services/classService';

const ClassManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editClassData, setEditClassData] = useState({
    name: '',
    subject: '',
    grade: '',
    description: '',
    schedule: ''
  });
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClass, setNewClass] = useState({
    name: '',
    subject: '',
    grade: '',
    description: '',
    schedule: ''
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const data = await getClassStudents(classId);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const filteredClasses = classes.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý lớp học</h1>
        <p className="text-gray-600">Quản lý thông tin các lớp học và học sinh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tổng số lớp</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tổng học sinh</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.reduce((sum, c) => sum + (c.enrollments?.length || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Điểm TB chung</p>
              <p className="text-2xl font-bold text-gray-900">7.9</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm lớp học..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-2" onClick={() => setIsCreateClassOpen(true)}>
            <Plus className="w-4 h-4" />
            Thêm lớp mới
          </Button>
        </div>
      </Card>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredClasses.map((cls) => (
          <Card key={cls.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{cls.name}</h3>
                <p className="text-sm text-gray-600">{cls.subject}</p>
              </div>
              <Badge variant="outline">Khối {cls.grade}</Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sĩ số:</span>
                <span className="text-gray-900">{cls.enrollments?.length || 0} học sinh</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Lịch học:</span>
                <span className="text-gray-900 text-xs">{cls.schedule || 'Chưa có'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-2"
                onClick={() => {
                  setSelectedClass(cls.id);
                  setEditClassData({
                    name: cls.name,
                    subject: cls.subject,
                    grade: cls.grade.toString(),
                    schedule: cls.schedule || '',
                    description: ''
                  });
                  setIsEditClassOpen(true);
                }}
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => {
                  setSelectedClass(cls.id);
                  fetchClassStudents(cls.id);
                  setIsStudentListOpen(true);
                }}
              >
                <Users className="w-4 h-4" />
                Học sinh
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Class Dialog */}
      <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lớp học</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-class-name">Tên lớp học</Label>
              <Input
                id="edit-class-name"
                value={editClassData.name}
                onChange={(e) => setEditClassData({ ...editClassData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Môn học</Label>
                <Select value={editClassData.subject} onValueChange={(value) => setEditClassData({ ...editClassData, subject: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGLISH">Tiếng Anh</SelectItem>
                    <SelectItem value="MATH">Toán</SelectItem>
                    <SelectItem value="PHYSICS">Vật Lý</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Khối lớp</Label>
                <Select value={editClassData.grade} onValueChange={(value) => setEditClassData({ ...editClassData, grade: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Khối 10</SelectItem>
                    <SelectItem value="11">Khối 11</SelectItem>
                    <SelectItem value="12">Khối 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-schedule">Lịch học</Label>
              <Input
                id="edit-schedule"
                value={editClassData.schedule}
                onChange={(e) => setEditClassData({ ...editClassData, schedule: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Mô tả (tùy chọn)</Label>
              <textarea
                id="edit-description"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={editClassData.description}
                onChange={(e) => setEditClassData({ ...editClassData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditClassOpen(false)}>
                Hủy
              </Button>
              <Button className="flex-1" onClick={() => {
                // TODO: Handle update class
                console.log('Updating class:', editClassData);
                setIsEditClassOpen(false);
              }}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm lớp học mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="class-name">Tên lớp học</Label>
              <Input
                id="class-name"
                placeholder="VD: Lớp 10A1 - Tiếng Anh"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Môn học</Label>
                <Select value={newClass.subject} onValueChange={(value) => setNewClass({ ...newClass, subject: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn môn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGLISH">Tiếng Anh</SelectItem>
                    <SelectItem value="MATH">Toán</SelectItem>
                    <SelectItem value="PHYSICS">Vật Lý</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Khối lớp</Label>
                <Select value={newClass.grade} onValueChange={(value) => setNewClass({ ...newClass, grade: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khối" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Khối 10</SelectItem>
                    <SelectItem value="11">Khối 11</SelectItem>
                    <SelectItem value="12">Khối 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="schedule">Lịch học</Label>
              <Input
                id="schedule"
                placeholder="VD: Thứ 2, 4, 6 - 14:00-16:00"
                value={newClass.schedule}
                onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Mô tả (tùy chọn)</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Mô tả về lớp học..."
                value={newClass.description}
                onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setIsCreateClassOpen(false)}>
                Hủy
              </Button>
              <Button className="flex-1" onClick={() => {
                // TODO: Handle create class
                console.log('Creating class:', newClass);
                setIsCreateClassOpen(false);
                setNewClass({ name: '', subject: '', grade: '', description: '', schedule: '' });
              }}>
                Tạo lớp học
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student List Dialog */}
      <Dialog open={isStudentListOpen} onOpenChange={setIsStudentListOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Danh sách học sinh - Lớp {classes.find(c => c.id === selectedClass)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Tìm kiếm học sinh..." className="pl-10" />
              </div>
              <Button
                className="gap-2"
                onClick={() => {
                  setIsAddStudentOpen(true);
                  setIsStudentListOpen(false);
                }}
              >
                <UserPlus className="w-4 h-4" />
                Thêm học sinh
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.student?.full_name || 'N/A'}</TableCell>
                      <TableCell>{student.student?.email || 'N/A'}</TableCell>
                      <TableCell>{new Date(student.enrolled_at).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        <Badge variant={student.is_active ? 'default' : 'secondary'}>
                          {student.is_active ? 'Đang học' : 'Ngưng học'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsStudentListOpen(false);
                              setIsEditStudentOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassManagement;

