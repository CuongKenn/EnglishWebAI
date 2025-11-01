import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, FileText, Clock, Award, Users, Sparkles, Headphones, BookOpen, PenTool, Mic, Search, List } from 'lucide-react';
import { Card } from '../../../../../components/ui/card';
import { apiV1 } from '../../../../../services/api';
import CreateExerciseModalComplete from './CreateExerciseModalComplete';
import ExerciseDetailModal from './ExerciseDetailModal';
import ExerciseListTable from './ExerciseListTable';
import Toast from '../../../../../components/Toast/Toast';
import useToast from '../../../../../hooks/useToast';

export default function ExerciseManagementV2() {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [exercises, setExercises] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  useEffect(() => {
    fetchClasses();
    fetchExercises();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const classesResponse = await apiV1.get('/classes/teaching');
      let allExercises = [];
      
      for (const cls of classesResponse.data) {
        try {
          const response = await apiV1.get(`/exercises/by-class/${cls.id}`);
          const exercisesWithClass = response.data.map(ex => ({
            id: ex.id,
            title: ex.title,
            type: ex.type || 'skill_exercise',
            skill: ex.skill_type,
            class: cls.name,
            classId: cls.id,
            dueDate: ex.due_at,
            maxScore: ex.max_score || 10,
            submissions: ex.submission_count || 0,  // Use submission_count from API
            totalStudents: cls.student_count || 0,
            status: 'active',
            content: ex.content || {}
          }));
          allExercises = [...allExercises, ...exercisesWithClass];
        } catch (error) {
          console.error(`Error fetching exercises for class ${cls.id}:`, error);
        }
      }
      
      setExercises(allExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = async (newExercise) => {
    try {
      // Call API to create exercise
      const response = await apiV1.post('/exercises/', {
        class_id: parseInt(newExercise.classId),
        title: newExercise.title,
        description: newExercise.description || '',
        type: newExercise.type || 'skill_exercise',
        skill_type: newExercise.skill,
        max_score: newExercise.maxScore || 10,
        due_at: newExercise.dueDate || null,
        content: newExercise.content || {},
        enable_ai_grading: false
      });
      
      console.log('Exercise created successfully:', response.data);
      
      // Refresh exercises list
      await fetchExercises();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating exercise:', error);
      showError(`Không thể tạo bài tập: ${error.response?.data?.detail || error.message}`);
    }
  };


  const handleViewDetail = (exercise) => {
    setSelectedExercise(exercise);
    setShowDetailModal(true);
  };

  const handleUpdateExercise = async (updatedExercise) => {
    try {
      // Call API to update exercise
      await apiV1.put(`/exercises/${updatedExercise.id}`, {
        title: updatedExercise.title,
        description: updatedExercise.description || '',
        max_score: updatedExercise.maxScore || 10,
        due_at: updatedExercise.dueDate || null,
        type: updatedExercise.type,
        skill_type: updatedExercise.skill,
        content: updatedExercise.content || {}
      });
      
      // Update local state
      setExercises(exercises.map(ex => 
        ex.id === updatedExercise.id ? updatedExercise : ex
      ));
      
      showSuccess('✅ Cập nhật bài tập thành công!');
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating exercise:', error);
      showError(`❌ Không thể cập nhật: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (confirm('⚠️ Bạn có chắc muốn xóa bài tập này?\n\nLưu ý: Tất cả bài nộp của học sinh cũng sẽ bị xóa!')) {
      try {
        // Call API to delete exercise
        await apiV1.delete(`/exercises/${exerciseId}`);
        
        // Update local state
        setExercises(exercises.filter(ex => ex.id !== exerciseId));
        
        showSuccess('✅ Đã xóa bài tập thành công!');
        setShowDetailModal(false);
      } catch (error) {
        console.error('Error deleting exercise:', error);
        showError(`❌ Không thể xóa: ${error.response?.data?.detail || error.message}`);
      }
    }
  };

  const getSkillIcon = (skill) => {
    const icons = {
      listening: Headphones,
      speaking: Mic,
      reading: BookOpen,
      writing: PenTool
    };
    return icons[skill] || FileText;
  };

  const getTypeLabel = (type) => {
    const labels = {
      skill_exercise: 'Bài tập Kỹ năng',
      test_15min: 'Kiểm tra 15 phút',
      midterm: 'Kiểm tra Giữa kì',
      final: 'Kiểm tra Cuối kì'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      skill_exercise: 'bg-blue-100 text-blue-800',
      test_15min: 'bg-yellow-100 text-yellow-800',
      midterm: 'bg-orange-100 text-orange-800',
      final: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getSkillColor = (skill) => {
    const colors = {
      listening: 'bg-blue-100 text-blue-800',
      speaking: 'bg-purple-100 text-purple-800',
      reading: 'bg-green-100 text-green-800',
      writing: 'bg-orange-100 text-orange-800'
    };
    return colors[skill] || 'bg-gray-100 text-gray-800';
  };

  // Filter logic
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = !searchTerm || 
      exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.class.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || exercise.type === filterType;
    const matchesClass = !filterClass || exercise.class === filterClass;
    const matchesStatus = !filterStatus || exercise.status === filterStatus;
    
    return matchesSearch && matchesType && matchesClass && matchesStatus;
  });

  return (
    <div className="p-8">
      {/* Header Section - Match Courses style */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Bài tập & Kiểm tra</h1>
            <p className="text-gray-600">Tạo bài tập 4 kỹ năng với upload file, AI, hoặc Ngân hàng câu hỏi</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className={`px-3 py-2 rounded-lg border ${viewMode === 'cards' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'} hidden md:flex items-center gap-2`}
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              title={viewMode === 'cards' ? 'Chuyển sang dạng bảng' : 'Chuyển sang dạng thẻ'}
            >
              <List size={16} />
              {viewMode === 'cards' ? 'Dạng bảng' : 'Dạng thẻ'}
            </button>
            <button 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              Tạo bài tập mới
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Match Courses style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Tổng bài tập</p>
              <p className="text-3xl font-bold text-gray-900">{exercises.length}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Đang mở</p>
              <p className="text-3xl font-bold text-gray-900">{exercises.filter(ex => ex.status === 'active').length}</p>
            </div>
            <div className="bg-pink-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Bài nộp</p>
              <p className="text-3xl font-bold text-gray-900">{exercises.reduce((sum, ex) => sum + ex.submissions, 0)}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Học sinh</p>
              <p className="text-3xl font-bold text-gray-900">{exercises.reduce((sum, ex) => sum + ex.totalStudents, 0)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm bài tập..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Tất cả loại</option>
                <option value="skill_exercise">Bài tập Kỹ năng</option>
                <option value="test_15min">Kiểm tra 15 phút</option>
                <option value="midterm">Kiểm tra Giữa kì</option>
                <option value="final">Kiểm tra Cuối kì</option>
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">Tất cả lớp</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang mở</option>
                <option value="closed">Đã đóng</option>
                <option value="draft">Bản nháp</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Danh sách Bài tập & Kiểm tra</h2>
        {viewMode === 'table' ? (
          <ExerciseListTable
            items={filteredExercises}
            onView={handleViewDetail}
            onDelete={handleDeleteExercise}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => {
            const SkillIcon = getSkillIcon(exercise.skill);
            const progressPercentage = exercise.totalStudents > 0 ? (exercise.submissions / exercise.totalStudents) * 100 : 0;
            
            return (
              <Card key={exercise.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(exercise.type)}`}>
                      {getTypeLabel(exercise.type)}
                    </span>
                    {exercise.skill && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillColor(exercise.skill)}`}>
                        {exercise.skill.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleViewDetail(exercise)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(exercise.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {exercise.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{exercise.class}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Hạn: {exercise.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>{exercise.maxScore} điểm</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Đã nộp: {exercise.submissions}/{exercise.totalStudents}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Đang mở
                  </span>
                  <div className="flex items-center gap-2">
                    {exercise.skill && <SkillIcon className="w-4 h-4 text-gray-400" />}
                    <span className="text-xs text-gray-500">
                      {exercise.type === 'skill_exercise' ? 'Kỹ năng' : 'Kiểm tra'}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        )}

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có bài tập nào</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">💡 Hướng dẫn tạo bài tập</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Listening:</strong> Upload file audio (.mp3, .wav) + câu hỏi</li>
              <li><strong>Speaking:</strong> Đề bài text + hướng dẫn</li>
              <li><strong>Reading:</strong> Upload file (.pdf, .docx) hoặc paste text + câu hỏi</li>
              <li><strong>Writing:</strong> Đề bài text + yêu cầu số từ</li>
              <li><strong>AI:</strong> Sinh đề từ files hoặc từ Ngân hàng câu hỏi</li>
              <li><strong>Download:</strong> Xuất đề ra PDF để in hoặc chia sẻ</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Modals */}
      {showCreateModal && (
        <CreateExerciseModalComplete
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateExercise}
        />
      )}

      {showDetailModal && selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setShowDetailModal(false)}
          onUpdate={handleUpdateExercise}
          onDelete={() => handleDeleteExercise(selectedExercise.id)}
        />
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
}