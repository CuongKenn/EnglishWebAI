<<<<<<< HEAD
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
=======
import { useState, useEffect } from 'react';
import { 
  FileText, Clock, User, CheckCircle, XCircle, Eye, Edit, 
  Sparkles, Download, Filter, Search, Award, MessageSquare,
  TrendingUp, AlertCircle, PlayCircle, FileAudio, FileImage
} from 'lucide-react';
import './GradingFeedback.css';

export default function GradingFeedback() {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingMode, setGradingMode] = useState('manual'); // manual | ai
  const [loading, setLoading] = useState(false);

  // Mock data - exercises
  const mockExercises = [
    {
      id: 1,
      title: 'Bài tập Nghe Hiểu - Unit 5',
      type: 'skill_exercise',
      skill: 'listening',
      class: 'Lớp 10A1',
      dueDate: '2025-11-05',
      maxScore: 10,
      totalStudents: 25,
      submitted: 20,
      graded: 12,
      pending: 8,
      enableAiGrading: true
    },
    {
      id: 2,
      title: 'Kiểm tra 15 phút - Kỹ năng Viết',
      type: 'test_15min',
      skill: 'writing',
      class: 'Lớp 10A2',
      dueDate: '2025-11-03',
      maxScore: 10,
      totalStudents: 22,
      submitted: 22,
      graded: 20,
      pending: 2,
      enableAiGrading: true
    },
    {
      id: 3,
      title: 'Kiểm tra Cuối kì',
      type: 'final',
      skill: null,
      class: 'Lớp 10A1',
      dueDate: '2025-12-20',
      maxScore: 100,
      totalStudents: 25,
      submitted: 0,
      graded: 0,
      pending: 0,
      enableAiGrading: false
    }
  ];

  // Mock data - submissions
  const mockSubmissions = [
    {
      id: 1,
      student: {
        id: 1,
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@gmail.com',
        avatar: null
      },
      submittedAt: '2025-11-04 14:30',
      contentText: 'Bài làm của học sinh về listening...',
      contentUrl: null,
      status: 'submitted',
      score: null,
      feedback: null,
      aiScore: 8.5,
      aiFeedback: 'Học sinh nghe hiểu tốt các ý chính...',
      aiRubrics: {
        listening: 8.5
      }
    },
    {
      id: 2,
      student: {
        id: 2,
        name: 'Trần Thị B',
        email: 'tranthib@gmail.com',
        avatar: null
      },
      submittedAt: '2025-11-04 15:20',
      contentText: 'Bài làm của học sinh...',
      contentUrl: '/uploads/audio_submission.mp3',
      status: 'graded',
      score: 9.0,
      feedback: 'Làm tốt! Phát âm chuẩn.',
      aiScore: 8.7,
      aiFeedback: 'Phát âm tốt, ngữ điệu tự nhiên...',
      aiRubrics: {
        speaking: 8.7
      }
    },
    {
      id: 3,
      student: {
        id: 3,
        name: 'Lê Văn C',
        email: 'levanc@gmail.com',
        avatar: null
      },
      submittedAt: '2025-11-04 10:15',
      contentText: null,
      contentUrl: null,
      status: 'late',
      score: null,
      feedback: null
    }
  ];

  useEffect(() => {
    setExercises(mockExercises);
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      // Filter submissions for selected exercise
      setSubmissions(mockSubmissions);
    }
  }, [selectedExercise]);

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowGradingModal(true);
  };

  const handleAIGrade = async () => {
    setLoading(true);
    // Simulate AI grading
    setTimeout(() => {
      setLoading(false);
      alert('AI đã chấm điểm thành công!');
      setShowGradingModal(false);
    }, 2000);
  };

  const handleManualSave = () => {
    alert('Lưu điểm thành công!');
    setShowGradingModal(false);
  };

  const getStatusBadge = (status) => {
    const statuses = {
      submitted: { label: 'Chờ chấm', color: '#f59e0b', icon: Clock },
      graded: { label: 'Đã chấm', color: '#10b981', icon: CheckCircle },
      late: { label: 'Nộp muộn', color: '#ef4444', icon: AlertCircle }
    };
    const statusInfo = statuses[status] || statuses.submitted;
    const Icon = statusInfo.icon;
    
    return (
      <span className="status-badge-grading" style={{ background: statusInfo.color }}>
        <Icon size={14} />
        {statusInfo.label}
      </span>
    );
  };

  const renderGradingModal = () => {
    if (!selectedSubmission) return null;

    const hasAI = selectedExercise?.enableAiGrading && selectedSubmission.aiScore;

    return (
      <div className="grading-modal-overlay" onClick={() => setShowGradingModal(false)}>
        <div className="grading-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header-grading">
            <div>
              <h2>Chấm điểm Bài tập</h2>
              <p className="modal-subtitle">{selectedSubmission.student.name} • {selectedExercise?.title}</p>
            </div>
            <button className="modal-close-grading" onClick={() => setShowGradingModal(false)}>×</button>
          </div>

          <div className="modal-body-grading">
            {/* Student Info */}
            <div className="student-info-card">
              <div className="student-avatar-grading">
                <User size={24} />
              </div>
              <div className="student-details">
                <h4>{selectedSubmission.student.name}</h4>
                <p>{selectedSubmission.student.email}</p>
              </div>
              <div className="submission-time">
                <Clock size={16} />
                <span>Nộp lúc: {selectedSubmission.submittedAt}</span>
              </div>
            </div>

            {/* Submission Content */}
            <div className="submission-content-section">
              <h3>📝 Bài làm của học sinh</h3>
              {selectedSubmission.contentText && (
                <div className="content-text-box">
                  {selectedSubmission.contentText}
                </div>
              )}
              {selectedSubmission.contentUrl && (
                <div className="content-file-box">
                  {selectedSubmission.contentUrl.endsWith('.mp3') ? (
                    <>
                      <FileAudio size={24} />
                      <audio controls src={selectedSubmission.contentUrl} className="audio-player" />
                    </>
                  ) : (
                    <>
                      <FileImage size={24} />
                      <a href={selectedSubmission.contentUrl} target="_blank" rel="noopener noreferrer">
                        Xem file đính kèm
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Grading Mode Toggle */}
            <div className="grading-mode-section">
              <h3>Chọn phương thức chấm điểm</h3>
              <div className="grading-mode-tabs">
                <button
                  className={`mode-tab-grading ${gradingMode === 'manual' ? 'active' : ''}`}
                  onClick={() => setGradingMode('manual')}
                >
                  <Edit size={18} />
                  <span>Chấm thủ công</span>
                </button>
                {hasAI && (
                  <button
                    className={`mode-tab-grading ${gradingMode === 'ai' ? 'active' : ''}`}
                    onClick={() => setGradingMode('ai')}
                  >
                    <Sparkles size={18} />
                    <span>Xem gợi ý AI</span>
                  </button>
                )}
              </div>
            </div>

            {/* Manual Grading */}
            {gradingMode === 'manual' && (
              <div className="manual-grading-section">
                <div className="form-row-grading">
                  <div className="form-group-grading">
                    <label>Điểm số (/{selectedExercise?.maxScore})</label>
                    <input
                      type="number"
                      className="form-input-grading"
                      placeholder="0"
                      min="0"
                      max={selectedExercise?.maxScore}
                      step="0.5"
                      defaultValue={selectedSubmission.score}
                    />
                  </div>
                </div>

                {selectedExercise?.skill && (
                  <div className="skill-rubric-section">
                    <h4>Đánh giá theo kỹ năng: {selectedExercise.skill}</h4>
                    <div className="rubric-sliders">
                      <div className="rubric-item">
                        <label>
                          {selectedExercise.skill === 'listening' && '🎧 Nghe hiểu'}
                          {selectedExercise.skill === 'speaking' && '🗣️ Nói'}
                          {selectedExercise.skill === 'reading' && '📖 Đọc hiểu'}
                          {selectedExercise.skill === 'writing' && '✍️ Viết'}
                        </label>
                        <input type="range" min="0" max="10" step="0.5" className="rubric-slider" />
                        <span className="rubric-value">8.5/10</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group-grading">
                  <label>Nhận xét và phản hồi</label>
                  <textarea
                    className="form-textarea-grading"
                    rows="6"
                    placeholder="Nhập nhận xét chi tiết cho học sinh..."
                    defaultValue={selectedSubmission.feedback}
                  />
                </div>
              </div>
            )}

            {/* AI Grading View */}
            {gradingMode === 'ai' && hasAI && (
              <div className="ai-grading-section">
                <div className="ai-result-card">
                  <div className="ai-header">
                    <Sparkles size={24} />
                    <h3>Kết quả chấm điểm AI</h3>
                  </div>
                  
                  <div className="ai-score-display">
                    <div className="ai-score-main">
                      <Award size={32} />
                      <div>
                        <div className="ai-score-value">{selectedSubmission.aiScore}/10</div>
                        <div className="ai-score-label">Điểm AI đề xuất</div>
                      </div>
                    </div>
                  </div>

                  {selectedSubmission.aiRubrics && (
                    <div className="ai-rubrics-display">
                      <h4>Chi tiết đánh giá:</h4>
                      {Object.entries(selectedSubmission.aiRubrics).map(([skill, score]) => (
                        <div key={skill} className="ai-rubric-item">
                          <span className="skill-label">
                            {skill === 'listening' && '🎧 Nghe'}
                            {skill === 'speaking' && '🗣️ Nói'}
                            {skill === 'reading' && '📖 Đọc'}
                            {skill === 'writing' && '✍️ Viết'}
                          </span>
                          <div className="progress-bar-ai">
                            <div className="progress-fill-ai" style={{ width: `${score * 10}%` }} />
                          </div>
                          <span className="skill-score">{score}/10</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="ai-feedback-box">
                    <h4>💬 Nhận xét của AI:</h4>
                    <p>{selectedSubmission.aiFeedback}</p>
                  </div>

                  <div className="ai-actions">
                    <button className="btn-use-ai">
                      <CheckCircle size={18} />
                      Sử dụng điểm AI
                    </button>
                    <button className="btn-edit-ai" onClick={() => setGradingMode('manual')}>
                      <Edit size={18} />
                      Chỉnh sửa trước khi lưu
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* No AI Available */}
            {gradingMode === 'ai' && !hasAI && (
              <div className="no-ai-message">
                <AlertCircle size={48} />
                <h4>AI chưa chấm bài này</h4>
                <p>Bài tập không bật AI chấm điểm hoặc AI chưa xử lý xong.</p>
                <button className="btn-trigger-ai" onClick={handleAIGrade}>
                  <Sparkles size={18} />
                  Yêu cầu AI chấm điểm
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer-grading">
            <button className="btn-cancel-grading" onClick={() => setShowGradingModal(false)}>
              Hủy
            </button>
            {gradingMode === 'manual' && (
              <button className="btn-save-grading" onClick={handleManualSave}>
                <CheckCircle size={18} />
                Lưu điểm
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grading-feedback-container">
      {/* Header */}
      <div className="grading-header">
        <div className="grading-header-left">
          <h1>Chấm điểm & Phản hồi</h1>
          <p>Chấm bài thủ công hoặc sử dụng AI để chấm tự động</p>
        </div>
      </div>

      <div className="grading-content-wrapper">
        {/* Exercise List Sidebar */}
        <div className="exercise-list-sidebar">
          <div className="sidebar-title-grading">
            <FileText size={20} />
            <span>Bài tập cần chấm</span>
          </div>
          
          <div className="exercise-list-grading">
            {mockExercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`exercise-item-grading ${selectedExercise?.id === exercise.id ? 'active' : ''}`}
                onClick={() => handleSelectExercise(exercise)}
              >
                <div className="exercise-item-header">
                  <h4>{exercise.title}</h4>
                  <span className="class-badge">{exercise.class}</span>
                </div>
                <div className="exercise-item-stats">
                  <div className="stat-item-grading pending">
                    <Clock size={14} />
                    <span>{exercise.pending} chờ chấm</span>
                  </div>
                  <div className="stat-item-grading graded">
                    <CheckCircle size={14} />
                    <span>{exercise.graded} đã chấm</span>
                  </div>
                </div>
                {exercise.enableAiGrading && (
                  <div className="ai-badge-small">
                    <Sparkles size={12} />
                    AI
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submissions Panel */}
        <div className="submissions-panel">
          {!selectedExercise ? (
            <div className="empty-state-grading">
              <FileText size={80} strokeWidth={1} />
              <h3>Chọn bài tập</h3>
              <p>Chọn một bài tập bên trái để xem danh sách bài nộp</p>
            </div>
          ) : (
            <>
              {/* Panel Header */}
              <div className="panel-header-grading">
                <div className="panel-header-left">
                  <h2>{selectedExercise.title}</h2>
                  <div className="panel-stats">
                    <span className="stat-badge total">{selectedExercise.submitted} bài nộp</span>
                    <span className="stat-badge pending">{selectedExercise.pending} chờ chấm</span>
                  </div>
                </div>
                <div className="panel-header-actions">
                  <button className="btn-action-grading">
                    <Download size={18} />
                    Xuất Excel
                  </button>
                  {selectedExercise.enableAiGrading && (
                    <button className="btn-action-grading primary">
                      <Sparkles size={18} />
                      AI Chấm tất cả
                    </button>
                  )}
                </div>
              </div>

              {/* Search & Filter */}
              <div className="search-filter-bar">
                <div className="search-box-grading">
                  <Search size={18} />
                  <input type="text" placeholder="Tìm kiếm học sinh..." />
                </div>
                <select className="filter-select-grading">
                  <option>Tất cả trạng thái</option>
                  <option>Chờ chấm</option>
                  <option>Đã chấm</option>
                  <option>Nộp muộn</option>
                </select>
              </div>

              {/* Submissions Table */}
              <div className="submissions-table">
                {submissions.length === 0 ? (
                  <div className="empty-submissions">
                    <AlertCircle size={48} strokeWidth={1} />
                    <p>Chưa có bài nộp nào</p>
                  </div>
                ) : (
                  submissions.map((submission) => (
                    <div key={submission.id} className="submission-row">
                      <div className="submission-row-left">
                        <div className="student-avatar-small">
                          <User size={20} />
                        </div>
                        <div className="submission-info">
                          <h4>{submission.student.name}</h4>
                          <p>
                            <Clock size={12} />
                            {submission.submittedAt}
                          </p>
                        </div>
                      </div>
                      <div className="submission-row-center">
                        {getStatusBadge(submission.status)}
                        {submission.status === 'graded' && (
                          <div className="score-display">
                            <Award size={16} />
                            <span>{submission.score}/{selectedExercise.maxScore}</span>
                          </div>
                        )}
                        {submission.aiScore && submission.status === 'submitted' && (
                          <div className="ai-score-badge">
                            <Sparkles size={14} />
                            AI: {submission.aiScore}/10
                          </div>
                        )}
                      </div>
                      <div className="submission-row-actions">
                        <button
                          className="btn-grade"
                          onClick={() => handleGradeSubmission(submission)}
                        >
                          {submission.status === 'graded' ? (
                            <>
                              <Eye size={16} />
                              Xem chi tiết
                            </>
                          ) : (
                            <>
                              <Edit size={16} />
                              Chấm điểm
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {showGradingModal && renderGradingModal()}

      {/* Info Box */}
      <div className="info-box-grading">
        <div className="info-icon-grading">
          <Sparkles size={24} />
        </div>
        <div className="info-content-grading">
          <h4>💡 Hướng dẫn chấm điểm</h4>
          <ul>
            <li><strong>Chấm thủ công:</strong> Nhập điểm và nhận xét trực tiếp</li>
            <li><strong>AI gợi ý:</strong> Xem điểm và feedback từ AI, có thể chỉnh sửa trước khi lưu</li>
            <li><strong>Rubrics:</strong> Với bài tập kỹ năng, có thể chấm chi tiết theo từng tiêu chí</li>
            <li><strong>Xuất Excel:</strong> Export điểm của 1 bài hoặc nhiều bài để báo cáo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
>>>>>>> develop
