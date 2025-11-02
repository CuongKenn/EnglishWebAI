import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Wand2, Download, Eye } from 'lucide-react';

const WorksheetGenerator = () => {
  const [formData, setFormData] = useState({
    week: 1,
    skill: 'reading',
    gradeLevel: 10,
    topic: '',
    difficulty: 'medium',
    numQuestions: 20
  });
  const [generatedWorksheet, setGeneratedWorksheet] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setGeneratedWorksheet({
        title: `Phiếu học tập ${formData.skill} - Tuần ${formData.week}`,
        description: `Phiếu đánh giá kỹ năng ${formData.skill} cho lớp ${formData.gradeLevel}`,
        rubrics: {
          criteria: [
            { name: 'Độ chính xác', weight: 0.3, max_score: 10 },
            { name: 'Độ lưu loát', weight: 0.3, max_score: 10 },
            { name: 'Từ vựng', weight: 0.2, max_score: 10 },
            { name: 'Ngữ pháp', weight: 0.2, max_score: 10 }
          ]
        },
        questions: Array.from({ length: formData.numQuestions }, (_, i) => ({
          id: i + 1,
          content: `Câu hỏi mẫu ${i + 1} về chủ đề ${formData.topic || 'chung'}`,
          type: 'multiple-choice',
          points: 1
        }))
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wand2 className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Trợ lý soạn phiếu học tập</h1>
        </div>
        <p className="text-gray-600">Tạo phiếu đánh giá kỹ năng tự động bằng AI theo chương trình học</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin phiếu học tập</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tuần học</Label>
                <Input
                  type="number"
                  value={formData.week}
                  onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Lớp</Label>
                <Select value={formData.gradeLevel.toString()} onValueChange={(v) => setFormData({ ...formData, gradeLevel: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10, 11, 12].map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>Lớp {grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Kỹ năng</Label>
              <Select value={formData.skill} onValueChange={(v) => setFormData({ ...formData, skill: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="listening">Listening</SelectItem>
                  <SelectItem value="speaking">Speaking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Chủ đề</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="VD: Unit 7 - Technology"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Độ khó</Label>
                <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Dễ</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="hard">Khó</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số câu hỏi</Label>
                <Input
                  type="number"
                  value={formData.numQuestions}
                  onChange={(e) => setFormData({ ...formData, numQuestions: parseInt(e.target.value) })}
                  placeholder="20"
                />
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2 h-12">
              <Wand2 size={20} />
              {loading ? 'Đang tạo phiếu...' : 'Tạo phiếu bằng AI'}
            </Button>
          </div>
        </Card>

        {/* Preview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Xem trước phiếu học tập</h2>
          
          {!generatedWorksheet ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
              <Wand2 size={64} className="mb-4" />
              <p>Nhấn "Tạo phiếu bằng AI" để xem kết quả</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{generatedWorksheet.title}</h3>
                <p className="text-sm text-gray-600">{generatedWorksheet.description}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Rubrics chấm điểm</h4>
                <div className="space-y-2">
                  {generatedWorksheet.rubrics.criteria.map((criterion, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-700">{criterion.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{(criterion.weight * 100).toFixed(0)}%</span>
                        <span className="text-sm font-medium text-purple-600">{criterion.max_score} điểm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Câu hỏi mẫu ({generatedWorksheet.questions.length} câu)</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {generatedWorksheet.questions.slice(0, 5).map((q) => (
                    <div key={q.id} className="bg-gray-50 p-3 rounded text-sm">
                      <span className="font-medium text-gray-900">Câu {q.id}:</span>
                      <span className="text-gray-700 ml-2">{q.content}</span>
                    </div>
                  ))}
                  {generatedWorksheet.questions.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-2">...và {generatedWorksheet.questions.length - 5} câu nữa</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 gap-2">
                  <Download size={16} />
                  Xuất file
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Eye size={16} />
                  Xem đầy đủ
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default WorksheetGenerator;

