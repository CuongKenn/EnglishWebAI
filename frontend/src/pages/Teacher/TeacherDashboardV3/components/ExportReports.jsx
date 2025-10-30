import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Calendar, Users, Filter, CheckCircle, FileText, Layers } from 'lucide-react';
import exportService from '../../../../services/exportService';
import { apiV1 } from '../../../../services/api';
import { getClasses } from '../../../../services/classService';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';
import './ExportReports.css';

export default function ExportReports() {
  const [exportType, setExportType] = useState('single'); // single | multiple | class
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [format, setFormat] = useState('xlsx'); // xlsx | csv
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [classes, setClasses] = useState([]);
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load classes first
      const classesData = await getClasses();
      const classesMap = {};
      
      const formattedClasses = classesData.map(c => {
        classesMap[c.id] = c.name;
        return {
          id: c.id,
          name: c.name,
          students: c.student_count || 0
        };
      });
      setClasses(formattedClasses);
      
      // Load all exercises from all classes
      const allExercises = [];
      for (const cls of classesData) {
        try {
          const exercisesResponse = await apiV1.get(`/exercises/by-class/${cls.id}`);
          const classExercises = exercisesResponse.data.map(ex => ({
            id: ex.id,
            title: ex.title,
            class: cls.name,
            classId: cls.id,
            date: new Date(ex.created_at).toISOString().split('T')[0],
            students: cls.student_count || 0,
            graded: ex.graded_count || 0,
            type: ex.type || 'assignment'
          }));
          allExercises.push(...classExercises);
        } catch (err) {
          console.error(`Error loading exercises for class ${cls.id}:`, err);
        }
      }
      
      setExercises(allExercises);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Lỗi khi tải dữ liệu. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExercise = (exerciseId) => {
    setSelectedExercises(prev =>
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const handleToggleClass = (classId) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleExport = async () => {
    if (exportType === 'single' && selectedExercises.length === 0) {
      showWarning('Vui lòng chọn ít nhất 1 bài tập');
      return;
    }
    if (exportType === 'multiple' && selectedExercises.length === 0) {
      showWarning('Vui lòng chọn ít nhất 1 bài tập');
      return;
    }
    if (exportType === 'class' && selectedClasses.length === 0) {
      showWarning('Vui lòng chọn ít nhất 1 lớp');
      return;
    }

    try {
      setLoading(true);

      if (exportType === 'single' || exportType === 'multiple') {
        // Export exercises
        for (const exerciseId of selectedExercises) {
          const exercise = exercises.find(e => e.id === exerciseId);
          if (exercise) {
            await exportService.downloadExerciseGrades(
              exerciseId,
              exercise.title,
              format
            );
          }
        }
        showSuccess(`✅ Đã xuất ${selectedExercises.length} bài tập thành công!`);
      } else if (exportType === 'class') {
        // Export class grades
        for (const classId of selectedClasses) {
          const classObj = classes.find(c => c.id === classId);
          if (classObj) {
            const options = {};
            if (dateRange.from) options.from_date = dateRange.from;
            if (dateRange.to) options.to_date = dateRange.to;
            
            await exportService.downloadClassGrades(
              classId,
              classObj.name,
              format,
              options
            );
          }
        }
        showSuccess(`✅ Đã xuất ${selectedClasses.length} lớp thành công!`);
      }

      // Reset selections
      setSelectedExercises([]);
      setSelectedClasses([]);
    } catch (error) {
      console.error('Error exporting:', error);
      showError('❌ Lỗi khi xuất file. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-reports-container">
      {/* Header */}
      <div className="export-header">
        <div className="export-header-left">
          <h1>Xuất Báo cáo</h1>
          <p>Xuất điểm số và thống kê ra file Excel để báo cáo hoặc in ấn</p>
        </div>
      </div>

      {loading && exercises.length === 0 ? (
        <div className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
      {/* Export Type Selection */}
      <div className="export-type-section">
        <h2>Chọn loại báo cáo</h2>
        <div className="export-type-grid">
          <button
            className={`export-type-card ${exportType === 'single' ? 'active' : ''}`}
            onClick={() => setExportType('single')}
          >
            <FileText size={32} />
            <h3>1 Bài tập</h3>
            <p>Xuất điểm của một bài tập cụ thể</p>
            <span className="type-label">Đơn giản</span>
          </button>

          <button
            className={`export-type-card ${exportType === 'multiple' ? 'active' : ''}`}
            onClick={() => setExportType('multiple')}
          >
            <Layers size={32} />
            <h3>Nhiều Bài tập</h3>
            <p>Xuất điểm của nhiều bài trong một file</p>
            <span className="type-label">Tổng hợp</span>
          </button>

          <button
            className={`export-type-card ${exportType === 'class' ? 'active' : ''}`}
            onClick={() => setExportType('class')}
          >
            <Users size={32} />
            <h3>Theo Lớp</h3>
            <p>Xuất toàn bộ điểm của một hoặc nhiều lớp</p>
            <span className="type-label">Chi tiết</span>
          </button>
        </div>
      </div>

      {/* Selection Area */}
      <div className="selection-area">
        {/* Single Exercise */}
        {exportType === 'single' && (
          <div className="selection-content">
            <div className="selection-header">
              <h3>Chọn bài tập cần xuất</h3>
              <span className="selected-count">{selectedExercises.length} đã chọn</span>
            </div>
            
            {exercises.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                <p>Chưa có bài tập nào. Vui lòng tạo bài tập trước!</p>
              </div>
            ) : (
            <div className="exercise-list-export">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={`exercise-card-export ${selectedExercises.includes(exercise.id) ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedExercises([exercise.id]); // Only one for single mode
                  }}
                >
                  <div className="exercise-card-header">
                    <div className="checkbox-custom">
                      {selectedExercises.includes(exercise.id) && <CheckCircle size={20} />}
                    </div>
                    <div className="exercise-info-export">
                      <h4>{exercise.title}</h4>
                      <div className="exercise-meta">
                        <span className="class-tag">{exercise.class}</span>
                        <span>•</span>
                        <span>{exercise.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="exercise-stats-export">
                    <div className="stat-item">
                      <Users size={14} />
                      <span>{exercise.students} HS</span>
                    </div>
                    <div className="stat-item">
                      <CheckCircle size={14} />
                      <span>{exercise.graded} đã chấm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}

            <div className="export-options-box">
              <h4>📄 File sẽ bao gồm:</h4>
              <ul>
                <li>Danh sách học sinh</li>
                <li>Điểm số từng học sinh</li>
                <li>Nhận xét (nếu có)</li>
                <li>Thống kê chung (điểm TB, cao nhất, thấp nhất)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Multiple Exercises */}
        {exportType === 'multiple' && (
          <div className="selection-content">
            <div className="selection-header">
              <h3>Chọn các bài tập cần xuất</h3>
              <span className="selected-count">{selectedExercises.length} đã chọn</span>
            </div>
            
            <div className="filter-bar-export">
              <select className="filter-select">
                <option>Tất cả lớp</option>
                <option>Lớp 10A1</option>
                <option>Lớp 10A2</option>
                <option>Lớp 11B1</option>
              </select>
              <div className="date-range-filter">
                <Calendar size={16} />
                <input type="date" placeholder="Từ ngày" onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} />
                <span>-</span>
                <input type="date" placeholder="Đến ngày" onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} />
              </div>
            </div>

            <div className="exercise-list-export">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={`exercise-card-export ${selectedExercises.includes(exercise.id) ? 'selected' : ''}`}
                  onClick={() => handleToggleExercise(exercise.id)}
                >
                  <div className="exercise-card-header">
                    <div className="checkbox-custom">
                      {selectedExercises.includes(exercise.id) && <CheckCircle size={20} />}
                    </div>
                    <div className="exercise-info-export">
                      <h4>{exercise.title}</h4>
                      <div className="exercise-meta">
                        <span className="class-tag">{exercise.class}</span>
                        <span>•</span>
                        <span>{exercise.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="exercise-stats-export">
                    <div className="stat-item">
                      <Users size={14} />
                      <span>{exercise.students} HS</span>
                    </div>
                    <div className="stat-item">
                      <CheckCircle size={14} />
                      <span>{exercise.graded} đã chấm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="export-options-box">
              <h4>📊 File sẽ bao gồm:</h4>
              <ul>
                <li>1 sheet tổng hợp với điểm tất cả bài</li>
                <li>Mỗi bài tập 1 sheet riêng (chi tiết)</li>
                <li>Sheet thống kê và biểu đồ</li>
                <li>So sánh tiến độ giữa các bài</li>
              </ul>
            </div>
          </div>
        )}

        {/* By Class */}
        {exportType === 'class' && (
          <div className="selection-content">
            <div className="selection-header">
              <h3>Chọn lớp cần xuất báo cáo</h3>
              <span className="selected-count">{selectedClasses.length} lớp đã chọn</span>
            </div>
            
            <div className="class-list-export">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`class-card-export ${selectedClasses.includes(cls.id) ? 'selected' : ''}`}
                  onClick={() => handleToggleClass(cls.id)}
                >
                  <div className="class-card-left">
                    <div className="checkbox-custom">
                      {selectedClasses.includes(cls.id) && <CheckCircle size={20} />}
                    </div>
                    <div className="class-info-export">
                      <Users size={24} />
                      <div>
                        <h4>{cls.name}</h4>
                        <p>{cls.students} học sinh</p>
                      </div>
                    </div>
                  </div>
                  <div className="class-exercises-count">
                    {exercises.filter(ex => ex.class === cls.name).length} bài tập
                  </div>
                </div>
              ))}
            </div>

            <div className="date-range-section">
              <h4>Chọn khoảng thời gian (tùy chọn)</h4>
              <div className="date-inputs">
                <div className="date-input-group">
                  <label>Từ ngày:</label>
                  <input type="date" onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} />
                </div>
                <div className="date-input-group">
                  <label>Đến ngày:</label>
                  <input type="date" onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} />
                </div>
              </div>
              <p className="date-hint">Để trống để xuất tất cả bài tập của lớp</p>
            </div>

            <div className="export-options-box">
              <h4>📚 File sẽ bao gồm:</h4>
              <ul>
                <li>Toàn bộ điểm của lớp theo từng bài</li>
                <li>Bảng tổng hợp điểm trung bình từng học sinh</li>
                <li>Điểm theo 4 kỹ năng (nếu có)</li>
                <li>Thống kê chi tiết và ranking</li>
                <li>Biểu đồ tiến độ học tập</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Preview & Export */}
      <div className="preview-export-section">
        <div className="preview-box">
          <FileSpreadsheet size={48} />
          <h3>Xem trước file Excel</h3>
          <div className="preview-info">
            {exportType === 'single' && selectedExercises.length > 0 && (
              <>
                <p><strong>Loại:</strong> Báo cáo 1 bài tập</p>
                <p><strong>Bài tập:</strong> {exercises.find(ex => ex.id === selectedExercises[0])?.title}</p>
                <p><strong>Số học sinh:</strong> {exercises.find(ex => ex.id === selectedExercises[0])?.students}</p>
              </>
            )}
            {exportType === 'multiple' && selectedExercises.length > 0 && (
              <>
                <p><strong>Loại:</strong> Báo cáo nhiều bài tập</p>
                <p><strong>Số bài tập:</strong> {selectedExercises.length}</p>
                <p><strong>Sheets:</strong> {selectedExercises.length + 2} (bài tập + tổng hợp + thống kê)</p>
              </>
            )}
            {exportType === 'class' && selectedClasses.length > 0 && (
              <>
                <p><strong>Loại:</strong> Báo cáo theo lớp</p>
                <p><strong>Số lớp:</strong> {selectedClasses.length}</p>
                <p><strong>Tổng HS:</strong> {classes.filter(c => selectedClasses.includes(c.id)).reduce((sum, c) => sum + c.students, 0)}</p>
              </>
            )}
          </div>

          {/* Format selection */}
          <div className="format-selection">
            <label>Định dạng file:</label>
            <div className="format-options">
              <button
                className={`format-btn ${format === 'xlsx' ? 'active' : ''}`}
                onClick={() => setFormat('xlsx')}
              >
                <FileSpreadsheet size={18} />
                Excel (.xlsx)
              </button>
              <button
                className={`format-btn ${format === 'csv' ? 'active' : ''}`}
                onClick={() => setFormat('csv')}
              >
                <FileText size={18} />
                CSV (.csv)
              </button>
            </div>
          </div>
        </div>

        <button
          className="btn-export-main"
          onClick={handleExport}
          disabled={
            loading ||
            (exportType === 'single' && selectedExercises.length === 0) ||
            (exportType === 'multiple' && selectedExercises.length === 0) ||
            (exportType === 'class' && selectedClasses.length === 0)
          }
        >
          <Download size={20} />
          {loading ? 'Đang xuất...' : `Xuất file ${format.toUpperCase()}`}
        </button>
      </div>

      {/* Info Box */}
      <div className="info-box-export">
        <div className="info-icon-export">
          <FileSpreadsheet size={24} />
        </div>
        <div className="info-content-export">
          <h4>💡 Hướng dẫn xuất báo cáo</h4>
          <ul>
            <li><strong>1 Bài tập:</strong> Phù hợp để in điểm cho 1 bài kiểm tra cụ thể</li>
            <li><strong>Nhiều bài tập:</strong> Xuất nhiều bài cùng lúc, tiện cho báo cáo tổng hợp</li>
            <li><strong>Theo lớp:</strong> Xuất toàn bộ điểm của lớp, phù hợp cho họp phụ huynh</li>
            <li><strong>File Excel:</strong> Có thể mở bằng Excel, Google Sheets hoặc in ra giấy</li>
          </ul>
        </div>
      </div>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
      </>
      )}
    </div>
  );
}
