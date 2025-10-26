import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import {
  Plus,
  Search,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  X,
  FileText
} from 'lucide-react';
import apiClient from '../../../../services/api';
import './LessonManagement.css';

const LessonManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  // Form data
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadLessons(selectedClass.id);
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/classes/teaching');
      const classList = Array.isArray(res.data) ? res.data : [];
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClass(classList[0]);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (classId) => {
    try {
      const res = await apiClient.get(`/api/v1/classes/${classId}/lessons`);
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load lessons:', error);
      setLessons([]);
    }
  };

  const handleCreateLesson = () => {
    setLessonTitle('');
    setLessonContent('');
    setShowCreateModal(true);
  };

  const handleEditLesson = (lesson) => {
    setSelectedLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonContent(lesson.content || '');
    setShowEditModal(true);
  };

  const submitCreateLesson = async (e) => {
    e.preventDefault();
    if (!selectedClass || !lessonTitle) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      await apiClient.post(`/api/v1/classes/${selectedClass.id}/lessons`, {
        title: lessonTitle,
        content: lessonContent
      });
      
      alert('Tạo bài học thành công');
      setShowCreateModal(false);
      setLessonTitle('');
      setLessonContent('');
      await loadLessons(selectedClass.id);
    } catch (error) {
      console.error('Failed to create lesson:', error);
      alert('Tạo bài học thất bại');
    }
  };

  const submitEditLesson = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedLesson || !lessonTitle) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      await apiClient.put(
        `/api/v1/classes/${selectedClass.id}/lessons/${selectedLesson.id}`,
        {
          title: lessonTitle,
          content: lessonContent
        }
      );
      
      alert('Cập nhật bài học thành công');
      setShowEditModal(false);
      setSelectedLesson(null);
      setLessonTitle('');
      setLessonContent('');
      await loadLessons(selectedClass.id);
    } catch (error) {
      console.error('Failed to update lesson:', error);
      alert('Cập nhật bài học thất bại');
    }
  };

  const handleDeleteLesson = async (lesson) => {
    if (!confirm(`Bạn có chắc muốn xóa bài học "${lesson.title}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/classes/${selectedClass.id}/lessons/${lesson.id}`);
      alert('Đã xóa bài học');
      await loadLessons(selectedClass.id);
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      alert('Xóa bài học thất bại');
    }
  };

  const filteredLessons = lessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="lesson-management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý bài học</h1>
          <p className="page-subtitle">Tạo và quản lý nội dung bài học cho từng lớp</p>
        </div>
      </div>

      {/* Class Selector */}
      {classes.length > 0 && (
        <Card className="class-selector-card">
          <div className="class-selector">
            <label className="selector-label">Chọn lớp:</label>
            <select
              className="form-select"
              value={selectedClass?.id || ''}
              onChange={(e) => {
                const cls = classes.find(c => c.id === parseInt(e.target.value));
                setSelectedClass(cls);
              }}
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.student_count || 0} học sinh)
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <Card className="toolbar-card">
        <div className="toolbar-content">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <Input
              placeholder="Tìm kiếm bài học..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateLesson} className="create-btn">
            <Plus size={16} />
            Tạo bài học mới
          </Button>
        </div>
      </Card>

      {/* Lessons List */}
      {loading ? (
        <div className="loading-state">Đang tải...</div>
      ) : !selectedClass ? (
        <div className="empty-state">
          <BookOpen size={48} color="#cbd5e1" />
          <p>Chọn một lớp để quản lý bài học</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} color="#cbd5e1" />
          <p>Chưa có bài học nào</p>
          <Button onClick={handleCreateLesson} variant="outline">
            <Plus size={16} />
            Tạo bài học đầu tiên
          </Button>
        </div>
      ) : (
        <div className="lessons-list">
          {filteredLessons.map((lesson, index) => (
            <Card key={lesson.id} className="lesson-card">
              <div className="lesson-header">
                <div className="lesson-index">#{index + 1}</div>
                <div className="lesson-info">
                  <h3 className="lesson-title">{lesson.title}</h3>
                  <p className="lesson-meta">
                    Tạo lúc: {new Date(lesson.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
              
              {lesson.content && (
                <div className="lesson-preview">
                  <p>{lesson.content.substring(0, 150)}...</p>
                </div>
              )}

              <div className="lesson-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditLesson(lesson)}
                >
                  <Edit size={16} />
                  Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteLesson(lesson)}
                  className="delete-btn"
                >
                  <Trash2 size={16} />
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tạo bài học mới</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitCreateLesson}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Lớp</label>
                  <Input disabled value={selectedClass?.name || ''} />
                </div>

                <div className="form-group">
                  <label className="form-label">Tiêu đề bài học *</label>
                  <Input
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="VD: Unit 1 - Greetings"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nội dung bài học</label>
                  <textarea
                    className="form-textarea"
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    placeholder="Nhập nội dung bài học..."
                    rows={10}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">Tạo bài học</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chỉnh sửa bài học</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitEditLesson}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Lớp</label>
                  <Input disabled value={selectedClass?.name || ''} />
                </div>

                <div className="form-group">
                  <label className="form-label">Tiêu đề bài học *</label>
                  <Input
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="VD: Unit 1 - Greetings"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nội dung bài học</label>
                  <textarea
                    className="form-textarea"
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    placeholder="Nhập nội dung bài học..."
                    rows={10}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">Lưu thay đổi</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonManagement;

