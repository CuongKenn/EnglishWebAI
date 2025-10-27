import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Upload, Plus, Search, Filter, Edit, Trash2, Eye, Headphones, Mic, BookOpen, PenTool, FileText } from 'lucide-react';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';

const QuestionBank = () => {
  const [activeSkill, setActiveSkill] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const questions = [
    {
      id: '1',
      skill: 'listening',
      type: 'multiple-choice',
      content: 'What is the main topic of the conversation?',
      level: 'medium',
      topic: 'Unit 5 - Daily Activities',
      answers: ['Shopping', 'Traveling', 'Working', 'Studying'],
      correctAnswer: 0,
      createdDate: '26/10/2025'
    },
    {
      id: '2',
      skill: 'reading',
      type: 'multiple-choice',
      content: 'According to the passage, what is the author\'s main argument?',
      level: 'hard',
      topic: 'Unit 6 - Environment',
      answers: ['Climate change is real', 'We need to act now', 'Both A and B', 'None of the above'],
      correctAnswer: 2,
      createdDate: '25/10/2025'
    },
    {
      id: '3',
      skill: 'writing',
      type: 'essay',
      content: 'Write an essay about the advantages and disadvantages of social media (200 words)',
      level: 'hard',
      topic: 'Unit 7 - Technology',
      createdDate: '24/10/2025'
    },
    {
      id: '4',
      skill: 'speaking',
      type: 'speaking',
      content: 'Describe your favorite place to visit and explain why you like it',
      level: 'medium',
      topic: 'Unit 8 - Travel',
      createdDate: '23/10/2025'
    }
  ];

  const skills = [
    { id: 'all', label: 'Tất cả', icon: FileText, count: questions.length },
    { id: 'listening', label: 'Nghe', icon: Headphones, count: questions.filter(q => q.skill === 'listening').length },
    { id: 'speaking', label: 'Nói', icon: Mic, count: questions.filter(q => q.skill === 'speaking').length },
    { id: 'reading', label: 'Đọc', icon: BookOpen, count: questions.filter(q => q.skill === 'reading').length },
    { id: 'writing', label: 'Viết', icon: PenTool, count: questions.filter(q => q.skill === 'writing').length },
    { id: 'comprehensive', label: 'Tổng hợp', icon: FileText, count: 0 }
  ];

  const filteredQuestions = questions.filter(q => {
    const matchSkill = activeSkill === 'all' || q.skill === activeSkill;
    const matchSearch = q.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = selectedLevel === 'all' || q.level === selectedLevel;
    return matchSkill && matchSearch && matchLevel;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return level;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ngân hàng câu hỏi</h1>
        <p className="text-gray-600">Quản lý câu hỏi theo 4 kỹ năng và bộ đề tổng hợp</p>
      </div>

      {/* Skill Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {skills.map((skill) => {
          const Icon = skill.icon;
          return (
            <Card
              key={skill.id}
              className={`p-4 cursor-pointer transition-all ${
                activeSkill === skill.id ? 'border-purple-500 bg-purple-50' : 'hover:border-gray-300'
              }`}
              onClick={() => setActiveSkill(skill.id)}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className={`w-6 h-6 mb-2 ${activeSkill === skill.id ? 'text-purple-600' : 'text-gray-600'}`} />
                <p className={`text-sm mb-1 ${activeSkill === skill.id ? 'text-purple-900 font-semibold' : 'text-gray-900'}`}>
                  {skill.label}
                </p>
                <p className="text-xs text-gray-500">{skill.count} câu</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm câu hỏi theo nội dung hoặc chủ đề..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Độ khó" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả độ khó</SelectItem>
              <SelectItem value="easy">Dễ</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="hard">Khó</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import câu hỏi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Chọn kỹ năng</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kỹ năng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="listening">Nghe</SelectItem>
                      <SelectItem value="speaking">Nói</SelectItem>
                      <SelectItem value="reading">Đọc</SelectItem>
                      <SelectItem value="writing">Viết</SelectItem>
                      <SelectItem value="comprehensive">Tổng hợp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tải lên file</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Kéo thả file hoặc click để chọn</p>
                    <p className="text-xs text-gray-500">Hỗ trợ: .docx, .txt (tối đa 10MB)</p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setIsImportOpen(false)}>Hủy</Button>
                  <Button className="flex-1" onClick={() => setIsImportOpen(false)}>Upload</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm câu hỏi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm câu hỏi mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kỹ năng</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn kỹ năng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="listening">Nghe</SelectItem>
                        <SelectItem value="speaking">Nói</SelectItem>
                        <SelectItem value="reading">Đọc</SelectItem>
                        <SelectItem value="writing">Viết</SelectItem>
                        <SelectItem value="comprehensive">Tổng hợp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Loại câu hỏi</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Trắc nghiệm</SelectItem>
                        <SelectItem value="fill-blank">Điền từ</SelectItem>
                        <SelectItem value="essay">Tự luận</SelectItem>
                        <SelectItem value="speaking">Nói</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Độ khó</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Dễ</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="hard">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chủ đề</Label>
                    <Input placeholder="VD: Unit 5 - Daily Activities" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Nội dung câu hỏi</Label>
                  <Textarea placeholder="Nhập nội dung câu hỏi..." rows={4} />
                </div>
                
                <div className="space-y-2">
                  <Label>Đáp án (mỗi đáp án một dòng)</Label>
                  <Textarea placeholder="A. Đáp án 1&#10;B. Đáp án 2&#10;C. Đáp án 3&#10;D. Đáp án 4" rows={4} />
                </div>
                
                <div className="space-y-2">
                  <Label>Đáp án đúng</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đáp án đúng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">A</SelectItem>
                      <SelectItem value="1">B</SelectItem>
                      <SelectItem value="2">C</SelectItem>
                      <SelectItem value="3">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Hủy</Button>
                  <Button className="flex-1" onClick={() => setIsAddOpen(false)}>Lưu câu hỏi</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            Tìm thấy <span className="font-semibold">{filteredQuestions.length}</span> câu hỏi
          </p>
        </div>

        {filteredQuestions.map((question) => (
          <Card key={question.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <Badge variant="outline" className="mt-1">
                    {question.skill === 'listening' ? 'Nghe' :
                     question.skill === 'speaking' ? 'Nói' :
                     question.skill === 'reading' ? 'Đọc' :
                     question.skill === 'writing' ? 'Viết' : 'Tổng hợp'}
                  </Badge>
                  <Badge className={getLevelColor(question.level)}>
                    {getLevelText(question.level)}
                  </Badge>
                  <span className="text-xs text-gray-500">{question.topic}</span>
                </div>
                <p className="text-gray-900 mb-3 font-medium">{question.content}</p>
                {question.answers && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {question.answers.map((answer, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border text-sm ${
                          idx === question.correctAnswer
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {answer}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">Tạo ngày: {question.createdDate}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Xem
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Sửa
                </Button>
                <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuestionBank;
