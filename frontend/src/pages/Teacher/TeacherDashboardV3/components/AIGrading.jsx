import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { SparklesIcon, CheckCircleIcon, ClockIcon, PencilIcon, PaperAirplaneIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { apiV1 } from '../../../../services/api';
import { Textarea } from '../../../../components/ui/textarea';

const AIGrading = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState('');
  const [editedScore, setEditedScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSubmissions(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchTeacherClasses = async () => {
    try {
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (classId) => {
    try {
      const response = await apiV1.get(`/teacher/classes/${classId}/submissions`, {
        params: { status: 'pending_review' }
      });
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRunAIGrading = async (submissionId) => {
    try {
      // Simulate AI grading (replace with actual AI API call)
      const mockAIResult = {
        ai_score: 8.5,
        ai_feedback: 'Bài làm tốt, có sử dụng từ vựng phong phú. Cần chú ý thêm về ngữ pháp ở câu thứ 3.',
        rubrics_scores: [
          { skill: 'reading', score: 8, max_score: 10, feedback: 'Hiểu đúng ý chính của bài đọc' },
          { skill: 'writing', score: 9, max_score: 10, feedback: 'Viết mạch lạc, rõ ràng' }
        ],
        error_analysis: [
          { error_type: 'grammar', description: 'Sai thì quá khứ đơn', suggestion: 'Sửa "go" thành "went"' },
          { error_type: 'spelling', description: 'Lỗi chính tả', suggestion: 'Sửa "recieve" thành "receive"' }
        ]
      };

      await apiV1.post(`/teacher/submissions/${submissionId}/ai-grade`, mockAIResult);
      
      // Refresh submissions
      fetchSubmissions(selectedClass.id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSaveFeedback = async () => {
    try {
      await apiV1.put(`/teacher/submissions/${selectedSubmission.id}/feedback`, {
        feedback: editedFeedback,
        score: editedScore
      });
      
      setIsDetailOpen(false);
      fetchSubmissions(selectedClass.id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openSubmissionDetail = (submission) => {
    setSelectedSubmission(submission);
    setEditedFeedback(submission.ai_feedback || '');
    setEditedScore(submission.ai_score || null);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SparklesIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Chấm điểm</h1>
        </div>
        <p className="text-gray-600">Sử dụng AI để chấm điểm tự động và đánh giá bài làm của học sinh</p>
      </div>

      {/* Class Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn lớp</label>
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
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chờ AI chấm</p>
              <p className="text-2xl font-bold text-gray-900">{submissions.filter(s => !s.ai_score).length}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI đã chấm</p>
              <p className="text-2xl font-bold text-gray-900">{submissions.filter(s => s.ai_score && !s.score).length}</p>
            </div>
            <SparklesIcon className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã phê duyệt</p>
              <p className="text-2xl font-bold text-gray-900">{submissions.filter(s => s.score).length}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng bài nộp</p>
              <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Submissions List */}
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Chờ AI chấm ({submissions.filter(s => !s.ai_score).length})</TabsTrigger>
          <TabsTrigger value="ai-graded">AI đã chấm ({submissions.filter(s => s.ai_score && !s.score).length})</TabsTrigger>
          <TabsTrigger value="approved">Đã phê duyệt ({submissions.filter(s => s.score).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {submissions.filter(s => !s.ai_score).length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không có bài nộp nào chờ chấm</p>
              </Card>
            ) : (
              submissions.filter(s => !s.ai_score).map((submission) => (
                <Card key={submission.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{submission.student_name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Nộp lúc: {new Date(submission.submitted_at).toLocaleString('vi-VN')}
                      </p>
                      <p className="text-gray-700 line-clamp-2">{submission.content_text}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleRunAIGrading(submission.id)} className="gap-2">
                        <SparklesIcon size={16} />
                        Chấm bằng AI
                      </Button>
                      <Button variant="outline" onClick={() => openSubmissionDetail(submission)}>
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai-graded">
          <div className="space-y-4">
            {submissions.filter(s => s.ai_score && !s.score).length === 0 ? (
              <Card className="p-12 text-center">
                <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không có bài nào đang chờ phê duyệt</p>
              </Card>
            ) : (
              submissions.filter(s => s.ai_score && !s.score).map((submission) => (
                <Card key={submission.id} className="p-6 border-2 border-purple-200 bg-purple-50/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{submission.student_name}</h3>
                        <Badge className="bg-purple-100 text-purple-700">AI đã chấm</Badge>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Điểm AI:</span>
                          <span className="text-lg font-bold text-purple-600">{submission.ai_score}/10</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Chấm lúc: {new Date(submission.ai_graded_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg mb-3">
                        <p className="text-sm text-gray-600 mb-1">Nhận xét của AI:</p>
                        <p className="text-gray-700">{submission.ai_feedback}</p>
                      </div>
                      {submission.error_analysis && submission.error_analysis.length > 0 && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Phân tích lỗi:</p>
                          <div className="space-y-2">
                            {submission.error_analysis.map((error, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-red-600">{error.error_type}:</span>
                                <span className="text-gray-700 ml-2">{error.description}</span>
                                <span className="text-green-600 ml-2">→ {error.suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => openSubmissionDetail(submission)} className="gap-2">
                        <PencilIcon size={16} />
                        Chỉnh sửa & Phê duyệt
                      </Button>
                      <Button variant="outline" onClick={() => handleSaveFeedback()}>
                        Chấp nhận kết quả AI
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="space-y-4">
            {submissions.filter(s => s.score).length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chưa có bài nào được phê duyệt</p>
              </Card>
            ) : (
              submissions.filter(s => s.score).map((submission) => (
                <Card key={submission.id} className="p-6 border-2 border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{submission.student_name}</h3>
                        <Badge className="bg-green-100 text-green-700">Đã phê duyệt</Badge>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Điểm cuối:</span>
                          <span className="text-lg font-bold text-green-600">{submission.score}/10</span>
                        </div>
                        {submission.ai_score && submission.ai_score !== submission.score && (
                          <div className="text-sm text-gray-500">(AI: {submission.ai_score}/10)</div>
                        )}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Nhận xét:</p>
                        <p className="text-gray-700">{submission.feedback}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openSubmissionDetail(submission)}>
                      Xem chi tiết
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Submission Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết bài làm - {selectedSubmission?.student_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Nội dung bài làm:</p>
              <p className="text-gray-900">{selectedSubmission?.content_text}</p>
            </div>

            {selectedSubmission?.ai_feedback && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Nhận xét của AI:</p>
                <p className="text-gray-900">{selectedSubmission.ai_feedback}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chỉnh sửa nhận xét (tùy chọn)
              </label>
              <Textarea
                value={editedFeedback}
                onChange={(e) => setEditedFeedback(e.target.value)}
                rows={6}
                className="w-full"
                placeholder="Nhập nhận xét của bạn..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điểm số
              </label>
              <input
                type="number"
                value={editedScore || ''}
                onChange={(e) => setEditedScore(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
                placeholder="Nhập điểm (0-10)"
                min="0"
                max="10"
                step="0.5"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveFeedback} className="gap-2">
                <PaperAirplaneIcon size={16} />
                Lưu và gửi cho học sinh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIGrading;

