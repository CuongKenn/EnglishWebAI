import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Search, Clock, CheckCircle, MessageSquare, Wand2 } from 'lucide-react';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';

const GradingFeedback = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isGradingOpen, setIsGradingOpen] = useState(false);

  const submissions = [
    {
      id: '1',
      studentId: 'HS001',
      studentName: 'Nguyễn Văn A',
      class: '10A1',
      testTitle: 'Kiểm tra 15 phút - Unit 6',
      submitTime: '27/10/2025 14:30',
      score: null,
      status: 'pending',
      type: 'quiz'
    },
    {
      id: '2',
      studentId: 'HS002',
      studentName: 'Trần Thị B',
      class: '10A1',
      testTitle: 'Kiểm tra 15 phút - Unit 6',
      submitTime: '27/10/2025 15:00',
      score: 8.5,
      status: 'graded',
      feedback: 'Làm bài tốt! Cần chú ý thêm về ngữ pháp.',
      type: 'quiz'
    },
    {
      id: '3',
      studentId: 'HS003',
      studentName: 'Lê Văn C',
      class: '11B2',
      testTitle: 'Kiểm tra giữa kỳ HK1',
      submitTime: '26/10/2025 10:20',
      score: null,
      status: 'pending',
      type: 'midterm'
    },
    {
      id: '4',
      studentId: 'HS004',
      studentName: 'Phạm Thị D',
      class: '11B2',
      testTitle: 'Kiểm tra giữa kỳ HK1',
      submitTime: '26/10/2025 09:45',
      score: 7.0,
      status: 'graded',
      feedback: 'Cần cải thiện kỹ năng đọc hiểu.',
      type: 'midterm'
    },
    {
      id: '5',
      studentId: 'HS005',
      studentName: 'Hoàng Văn E',
      class: '10A2',
      testTitle: 'Bài tập về nhà - Reading',
      submitTime: '25/10/2025 18:30',
      score: null,
      status: 'pending',
      type: 'homework'
    }
  ];

  const filteredSubmissions = submissions.filter(s => {
    const matchSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       s.testTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' ||
                    (activeTab === 'pending' && s.status === 'pending') ||
                    (activeTab === 'graded' && s.status === 'graded');
    return matchSearch && matchTab;
  });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chấm điểm & Phản hồi</h1>
        <p className="text-gray-600">Chấm bài và gửi phản hồi cho học sinh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Chờ chấm</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount} bài</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Đã chấm</p>
              <p className="text-2xl font-bold text-gray-900">{gradedCount} bài</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Điểm TB</p>
              <p className="text-2xl font-bold text-gray-900">
                {gradedCount > 0
                  ? (submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / gradedCount).toFixed(1)
                  : '0'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({submissions.length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ chấm ({pendingCount})</TabsTrigger>
          <TabsTrigger value="graded">Đã chấm ({gradedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên học sinh hoặc bài kiểm tra..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Wand2 className="w-4 h-4" />
            Chấm tự động (AI)
          </Button>
        </div>
      </Card>

      {/* Submissions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MSSV</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Bài kiểm tra</TableHead>
              <TableHead>Thời gian nộp</TableHead>
              <TableHead>Điểm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">{submission.studentId}</TableCell>
                <TableCell>{submission.studentName}</TableCell>
                <TableCell>{submission.class}</TableCell>
                <TableCell className="max-w-xs truncate">{submission.testTitle}</TableCell>
                <TableCell>{submission.submitTime}</TableCell>
                <TableCell>
                  {submission.score !== null ? (
                    <span className="text-green-600 font-semibold">{submission.score}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {submission.status === 'graded' ? (
                    <Badge className="bg-green-100 text-green-700">Đã chấm</Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-700">Chờ chấm</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setIsGradingOpen(true);
                    }}
                  >
                    {submission.status === 'graded' ? 'Xem lại' : 'Chấm điểm'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Grading Dialog */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chấm điểm - {selectedSubmission?.testTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
              <div>
                <p className="text-xs text-gray-500">Học sinh</p>
                <p className="text-sm text-gray-900 font-medium">{selectedSubmission?.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Lớp</p>
                <p className="text-sm text-gray-900 font-medium">{selectedSubmission?.class}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">MSSV</p>
                <p className="text-sm text-gray-900 font-medium">{selectedSubmission?.studentId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Thời gian nộp</p>
                <p className="text-sm text-gray-900 font-medium">{selectedSubmission?.submitTime}</p>
              </div>
            </div>

            <div className="border rounded p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bài làm của học sinh</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-900 mb-2 font-medium">Câu 1: What is the main topic?</p>
                  <p className="text-sm text-gray-600">Đáp án: A. Shopping</p>
                  <Badge className="mt-2 bg-green-100 text-green-700">Đúng</Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-900 mb-2 font-medium">Câu 2: Fill in the blank: She ___ to school.</p>
                  <p className="text-sm text-gray-600">Đáp án: goes</p>
                  <Badge className="mt-2 bg-green-100 text-green-700">Đúng</Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-900 mb-2 font-medium">Câu 3: Describe your hobby (50 words)</p>
                  <p className="text-sm text-gray-600">
                    My hobby is reading books. I like reading because it helps me relax and learn new things...
                  </p>
                  <Badge className="mt-2 bg-yellow-100 text-yellow-700">Cần đánh giá</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Điểm số</Label>
                <Input
                  type="number"
                  placeholder="0 - 10"
                  defaultValue={selectedSubmission?.score || ''}
                  step="0.5"
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <Label>Đánh giá</Label>
                <select className="w-full p-2 border rounded-md">
                  <option>Xuất sắc</option>
                  <option>Tốt</option>
                  <option>Khá</option>
                  <option>Trung bình</option>
                  <option>Yếu</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Nhận xét & Phản hồi</Label>
              <Textarea
                placeholder="Nhập nhận xét chi tiết cho học sinh..."
                rows={4}
                defaultValue={selectedSubmission?.feedback || ''}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsGradingOpen(false)}>Hủy</Button>
              <Button variant="outline" className="gap-2">
                <Wand2 className="w-4 h-4" />
                Gợi ý AI
              </Button>
              <Button onClick={() => setIsGradingOpen(false)}>Lưu & Gửi</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradingFeedback;
