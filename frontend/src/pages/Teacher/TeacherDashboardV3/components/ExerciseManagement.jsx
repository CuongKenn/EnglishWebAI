import { useState } from 'react';
import { Plus, FileText, Clock, Award, Calendar, Users, Edit, Trash2, Eye, Sparkles, Upload, FileUp, Bot } from 'lucide-react';
import './ExerciseManagement.css';

export default function ExerciseManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testType, setTestType] = useState('skill_exercise'); // skill_exercise, test_15min, midterm, final
  const [creationMethod, setCreationMethod] = useState('manual'); // manual, import, ai
  const [selectedSkill, setSelectedSkill] = useState('listening');

  const exercises = [
    {
      id: 1,
      title: 'Bài tập Nghe Hiểu - Unit 5',
      type: 'skill_exercise',
      skill: 'listening',
      class: 'Lớp 10A1',
      dueDate: '2025-11-05',
      maxScore: 10,
      submissions: 15,
      totalStudents: 25,
      status: 'active'
    },
    {
      id: 2,
      title: 'Kiểm tra 15 phút - Kỹ năng Viết',
      type: 'test_15min',
      skill: 'writing',
      class: 'Lớp 10A2',
      dueDate: '2025-11-03',
      maxScore: 10,
      submissions: 20,
      totalStudents: 22,
      status: 'active'
    },
    {
      id: 3,
      title: 'Kiểm tra Cuối kì',
      type: 'final',
      skill: null, // No skill for comprehensive tests
      class: 'Lớp 10A1',
      dueDate: '2025-12-20',
      maxScore: 100,
      submissions: 0,
      totalStudents: 25,
      status: 'active'
    },
  ];

  // Check if current test type requires skill selection
  const requiresSkill = testType === 'skill_exercise' || testType === 'test_15min';

  const renderCreateModal = () => (
    <div className="exercise-modal-overlay" onClick={() => setShowCreateModal(false)}>
      <div className="exercise-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-ex">
          <h2>Tạo Bài tập / Kiểm tra Mới</h2>
          <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
        </div>

        <div className="modal-body-ex">
          {/* Test Type Selection */}
          <div className="form-section-ex">
            <label className="form-label-ex">Loại bài tập / kiểm tra</label>
            <div className="test-type-grid">
              <button 
                className={`test-type-card ${testType === 'skill_exercise' ? 'active' : ''}`}
                onClick={() => setTestType('skill_exercise')}
              >
                <FileText size={24} />
                <span className="type-title">Bài tập Kỹ năng</span>
                <span className="type-desc">Luyện 1 kỹ năng cụ thể</span>
              </button>
              
              <button 
                className={`test-type-card ${testType === 'test_15min' ? 'active' : ''}`}
                onClick={() => setTestType('test_15min')}
              >
                <Clock size={24} />
                <span className="type-title">Kiểm tra 15 phút</span>
                <span className="type-desc">Test ngắn 1 kỹ năng</span>
              </button>
              
              <button 
                className={`test-type-card ${testType === 'midterm' ? 'active' : ''}`}
                onClick={() => setTestType('midterm')}
              >
                <FileText size={24} />
                <span className="type-title">Kiểm tra Giữa kì</span>
                <span className="type-desc">Tổng hợp nhiều kỹ năng</span>
              </button>
              
              <button 
                className={`test-type-card ${testType === 'final' ? 'active' : ''}`}
                onClick={() => setTestType('final')}
              >
                <Award size={24} />
                <span className="type-title">Kiểm tra Cuối kì</span>
                <span className="type-desc">Tổng hợp toàn bộ</span>
              </button>
            </div>
          </div>

          {/* Skill Selection - Only for skill_exercise and test_15min */}
          {requiresSkill && (
            <div className="form-section-ex">
              <label className="form-label-ex">Kỹ năng đánh giá</label>
              <div className="skill-selector-ex">
                <label className="skill-option-ex">
                  <input 
                    type="radio" 
                    name="skill" 
                    value="listening" 
                    checked={selectedSkill === 'listening'}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                  />
                  <span>🎧 Nghe</span>
                </label>
                <label className="skill-option-ex">
                  <input 
                    type="radio" 
                    name="skill" 
                    value="speaking"
                    checked={selectedSkill === 'speaking'}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                  />
                  <span>🗣️ Nói</span>
                </label>
                <label className="skill-option-ex">
                  <input 
                    type="radio" 
                    name="skill" 
                    value="reading"
                    checked={selectedSkill === 'reading'}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                  />
                  <span>📖 Đọc</span>
                </label>
                <label className="skill-option-ex">
                  <input 
                    type="radio" 
                    name="skill" 
                    value="writing"
                    checked={selectedSkill === 'writing'}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                  />
                  <span>✍️ Viết</span>
                </label>
              </div>
            </div>
          )}

          {/* Creation Method */}
          <div className="form-section-ex">
            <label className="form-label-ex">Phương thức tạo đề</label>
            <div className="creation-method-tabs">
              <button 
                className={`method-tab ${creationMethod === 'manual' ? 'active' : ''}`}
                onClick={() => setCreationMethod('manual')}
              >
                <FileText size={18} />
                <span>Tự nhập</span>
              </button>
              <button 
                className={`method-tab ${creationMethod === 'import' ? 'active' : ''}`}
                onClick={() => setCreationMethod('import')}
              >
                <Upload size={18} />
                <span>Import File</span>
              </button>
              <button 
                className={`method-tab ${creationMethod === 'ai' ? 'active' : ''}`}
                onClick={() => setCreationMethod('ai')}
              >
                <Bot size={18} />
                <span>AI Sinh đề</span>
              </button>
            </div>
          </div>

          {/* Content based on creation method */}
          {creationMethod === 'manual' && (
            <>
              <div className="form-section-ex">
                <label className="form-label-ex">Chọn lớp học</label>
                <select className="form-select-ex">
                  <option>Lớp 10A1</option>
                  <option>Lớp 10A2</option>
                  <option>Lớp 11B1</option>
                </select>
              </div>

              <div className="form-section-ex">
                <label className="form-label-ex">Tiêu đề</label>
                <input 
                  type="text" 
                  className="form-input-ex" 
                  placeholder={
                    testType === 'skill_exercise' ? 'Ví dụ: Bài tập Nghe - Unit 5' :
                    testType === 'test_15min' ? 'Ví dụ: Kiểm tra 15 phút - Kỹ năng Đọc' :
                    testType === 'midterm' ? 'Ví dụ: Kiểm tra Giữa kì - Học kì 1' :
                    'Ví dụ: Kiểm tra Cuối kì - Học kì 1'
                  }
                />
              </div>

              <div className="form-section-ex">
                <label className="form-label-ex">Nội dung đề bài</label>
                <textarea 
                  className="form-textarea-ex" 
                  rows="6"
                  placeholder="Nhập nội dung đề bài, câu hỏi, yêu cầu..."
                ></textarea>
              </div>

              <div className="form-row-ex">
                <div className="form-section-ex">
                  <label className="form-label-ex">Hạn nộp</label>
                  <input type="datetime-local" className="form-input-ex" />
                </div>
                <div className="form-section-ex">
                  <label className="form-label-ex">Điểm tối đa</label>
                  <input 
                    type="number" 
                    className="form-input-ex" 
                    placeholder={
                      testType === 'final' ? '100' : 
                      testType === 'midterm' ? '50' : '10'
                    }
                  />
                </div>
              </div>
            </>
          )}

          {creationMethod === 'import' && (
            <div className="import-section">
              <div className="import-info-box">
                <FileUp size={24} />
                <div>
                  <h4>Import đề từ file</h4>
                  <p>Upload file Word hoặc PDF chứa đề bài đã soạn sẵn</p>
                </div>
              </div>

              <div className="upload-zone">
                <Upload size={40} className="upload-icon-large" />
                <h4>Kéo thả file vào đây</h4>
                <p>hoặc</p>
                <button className="btn-browse-file">Chọn file</button>
                <span className="file-hint">Hỗ trợ: .docx, .doc, .pdf (Tối đa 10MB)</span>
              </div>

              <div className="form-section-ex">
                <label className="form-label-ex">Chọn lớp học</label>
                <select className="form-select-ex">
                  <option>Lớp 10A1</option>
                  <option>Lớp 10A2</option>
                  <option>Lớp 11B1</option>
                </select>
              </div>

              <div className="form-row-ex">
                <div className="form-section-ex">
                  <label className="form-label-ex">Hạn nộp</label>
                  <input type="datetime-local" className="form-input-ex" />
                </div>
                <div className="form-section-ex">
                  <label className="form-label-ex">Điểm tối đa</label>
                  <input type="number" className="form-input-ex" placeholder="10" />
                </div>
              </div>
            </div>
          )}

          {creationMethod === 'ai' && (
            <div className="ai-section">
              <div className="ai-info-box">
                <Sparkles size={24} />
                <div>
                  <h4>AI tự động sinh đề</h4>
                  <p>Upload tài liệu tham khảo, AI sẽ phân tích và tạo đề mới tương tự</p>
                </div>
              </div>

              <div className="ai-upload-zone">
                <Bot size={40} className="ai-icon-large" />
                <h4>Upload tài liệu làm dữ liệu huấn luyện</h4>
                <p>AI sẽ học từ các file này để tạo đề mới</p>
                <button className="btn-upload-ai">
                  <Upload size={18} />
                  Upload tài liệu (có thể nhiều file)
                </button>
                <span className="file-hint">Hỗ trợ: .docx, .pdf, .txt (Tối đa 5 files, mỗi file 10MB)</span>
              </div>

              <div className="ai-uploaded-files">
                <h4>📄 Files đã upload (0)</h4>
                <div className="uploaded-list-empty">
                  Chưa có file nào
                </div>
              </div>

              <div className="form-section-ex">
                <label className="form-label-ex">Yêu cầu với AI (tùy chọn)</label>
                <textarea 
                  className="form-textarea-ex" 
                  rows="4"
                  placeholder="Ví dụ: Tạo 10 câu hỏi trắc nghiệm về thì hiện tại hoàn thành, độ khó trung bình..."
                ></textarea>
              </div>

              <div className="form-section-ex">
                <label className="form-label-ex">Chọn lớp học</label>
                <select className="form-select-ex">
                  <option>Lớp 10A1</option>
                  <option>Lớp 10A2</option>
                  <option>Lớp 11B1</option>
                </select>
              </div>

              <div className="form-row-ex">
                <div className="form-section-ex">
                  <label className="form-label-ex">Hạn nộp</label>
                  <input type="datetime-local" className="form-input-ex" />
                </div>
                <div className="form-section-ex">
                  <label className="form-label-ex">Điểm tối đa</label>
                  <input type="number" className="form-input-ex" placeholder="10" />
                </div>
              </div>
            </div>
          )}

          {/* AI Auto Grading */}
          <div className="form-section-ex">
            <label className="ai-toggle-ex">
              <input type="checkbox" defaultChecked />
              <span className="ai-label-ex">
                <Sparkles size={16} />
                Bật chấm điểm tự động bằng AI
              </span>
            </label>
            <p className="ai-hint-ex">
              {requiresSkill 
                ? `AI sẽ tự động chấm và đưa ra phản hồi chi tiết cho kỹ năng ${selectedSkill}`
                : 'AI sẽ tự động chấm và đưa ra phản hồi tổng hợp cho tất cả kỹ năng'
              }
            </p>
          </div>
        </div>

        <div className="modal-footer-ex">
          <button className="btn-cancel-ex" onClick={() => setShowCreateModal(false)}>
            Hủy
          </button>
          <button className="btn-create-ex">
            {creationMethod === 'ai' ? (
              <>
                <Bot size={18} />
                AI Sinh đề & Tạo
              </>
            ) : (
              <>
                <Plus size={18} />
                Tạo bài tập
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const getTypeDisplay = (type) => {
    const types = {
      'skill_exercise': { label: 'Bài tập', color: '#3b82f6' },
      'test_15min': { label: '15 phút', color: '#f59e0b' },
      'midterm': { label: 'Giữa kì', color: '#ef4444' },
      'final': { label: 'Cuối kì', color: '#a855f7' }
    };
    return types[type] || types['skill_exercise'];
  };

  return (
    <div className="exercise-management">
      {/* Header */}
      <div className="ex-header">
        <div className="ex-header-left">
          <h1>Quản lý Bài tập & Kiểm tra</h1>
          <p>Tạo bài tập, kiểm tra và quản lý với nhiều phương thức linh hoạt</p>
        </div>
        <button className="btn-create-new" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          <span>Tạo bài tập mới</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="ex-stats-grid">
        <div className="ex-stat-card total">
          <div className="stat-icon-ex">
            <FileText size={24} />
          </div>
          <div className="stat-content-ex">
            <div className="stat-value-ex">48</div>
            <div className="stat-label-ex">Tổng bài tập</div>
          </div>
        </div>
        <div className="ex-stat-card active">
          <div className="stat-icon-ex">
            <Clock size={24} />
          </div>
          <div className="stat-content-ex">
            <div className="stat-value-ex">12</div>
            <div className="stat-label-ex">Đang mở</div>
          </div>
        </div>
        <div className="ex-stat-card graded">
          <div className="stat-icon-ex">
            <Award size={24} />
          </div>
          <div className="stat-content-ex">
            <div className="stat-value-ex">36</div>
            <div className="stat-label-ex">Đã chấm</div>
          </div>
        </div>
        <div className="ex-stat-card submissions">
          <div className="stat-icon-ex">
            <Users size={24} />
          </div>
          <div className="stat-content-ex">
            <div className="stat-value-ex">285</div>
            <div className="stat-label-ex">Bài nộp</div>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="ex-list-container">
        <div className="ex-list-header">
          <h3>Danh sách Bài tập & Kiểm tra</h3>
          <div className="ex-filters">
            <select className="filter-select">
              <option>Tất cả lớp</option>
              <option>Lớp 10A1</option>
              <option>Lớp 10A2</option>
            </select>
            <select className="filter-select">
              <option>Tất cả loại</option>
              <option>Bài tập kỹ năng</option>
              <option>Kiểm tra 15 phút</option>
              <option>Kiểm tra giữa kì</option>
              <option>Kiểm tra cuối kì</option>
            </select>
          </div>
        </div>

        <div className="ex-table">
          {exercises.map((exercise) => {
            const typeDisplay = getTypeDisplay(exercise.type);
            
            return (
              <div key={exercise.id} className="ex-row">
                <div className="ex-row-left">
                  <div className="ex-icon-wrapper">
                    {exercise.type === 'final' ? '🏆' : 
                     exercise.type === 'midterm' ? '📋' :
                     exercise.type === 'test_15min' ? '⏱️' : '✏️'}
                  </div>
                  <div className="ex-info">
                    <h4>{exercise.title}</h4>
                    <div className="ex-meta">
                      <span className="type-badge-ex" style={{ background: typeDisplay.color }}>
                        {typeDisplay.label}
                      </span>
                      {exercise.skill && (
                        <>
                          <span>•</span>
                          <span className={`skill-badge-ex ${exercise.skill}`}>
                            {exercise.skill === 'listening' && '🎧'} 
                            {exercise.skill === 'speaking' && '🗣️'} 
                            {exercise.skill === 'reading' && '📖'} 
                            {exercise.skill === 'writing' && '✍️'} 
                            {exercise.skill}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>{exercise.class}</span>
                      <span>•</span>
                      <span>Hạn: {exercise.dueDate}</span>
                    </div>
                  </div>
                </div>
                <div className="ex-row-right">
                  <div className="ex-submission-status">
                    <div className="submission-count">{exercise.submissions}/{exercise.totalStudents}</div>
                    <div className="submission-label">bài nộp</div>
                  </div>
                  <div className="ex-score-badge">{exercise.maxScore} điểm</div>
                  <div className="ex-actions">
                    <button className="action-btn-ex view" title="Xem chi tiết">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn-ex edit" title="Chỉnh sửa">
                      <Edit size={16} />
                    </button>
                    <button className="action-btn-ex delete" title="Xóa">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && renderCreateModal()}

      {/* Info Box */}
      <div className="info-box-ex">
        <div className="info-icon-ex">
          <Sparkles size={24} />
        </div>
        <div className="info-content-ex">
          <h4>💡 Hướng dẫn tạo bài tập</h4>
          <ul>
            <li><strong>Bài tập Kỹ năng / 15 phút:</strong> PHẢI chọn 1 kỹ năng (Nghe, Nói, Đọc, Viết)</li>
            <li><strong>Kiểm tra Giữa kì / Cuối kì:</strong> KHÔNG chọn kỹ năng (test tổng hợp)</li>
            <li><strong>3 cách tạo đề:</strong> Tự nhập, Import file Word/PDF, hoặc AI tự động sinh</li>
            <li><strong>AI Sinh đề:</strong> Upload nhiều file tham khảo, AI học và tạo đề mới tương tự</li>
            <li><strong>AI Chấm điểm:</strong> Tự động chấm và cho feedback chi tiết theo kỹ năng</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
