import { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, Users, Filter, CheckCircle, FileText, Layers } from 'lucide-react';
import './ExportReports.css';

export default function ExportReports() {
  const [exportType, setExportType] = useState('single'); // single | multiple | class
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Mock data
  const exercises = [
    { id: 1, title: 'Bài tập Nghe Hiểu - Unit 5', class: 'Lớp 10A1', date: '2025-11-05', students: 25, graded: 20 },
    { id: 2, title: 'Kiểm tra 15 phút - Viết', class: 'Lớp 10A2', date: '2025-11-03', students: 22, graded: 22 },
    { id: 3, title: 'Bài tập Đọc - Unit 6', class: 'Lớp 10A1', date: '2025-11-08', students: 25, graded: 18 },
    { id: 4, title: 'Kiểm tra Giữa kì', class: 'Lớp 11B1', date: '2025-11-10', students: 18, graded: 18 },
  ];

  const classes = [
    { id: 1, name: 'Lớp 10A1', students: 25 },
    { id: 2, name: 'Lớp 10A2', students: 22 },
    { id: 3, name: 'Lớp 11B1', students: 18 },
  ];

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

  const handleExport = () => {
    if (exportType === 'single' && selectedExercises.length === 0) {
      alert('Vui lòng chọn ít nhất 1 bài tập');
      return;
    }
    if (exportType === 'multiple' && selectedExercises.length === 0) {
      alert('Vui lòng chọn ít nhất 1 bài tập');
      return;
    }
    if (exportType === 'class' && selectedClasses.length === 0) {
      alert('Vui lòng chọn ít nhất 1 lớp');
      return;
    }

    // Call API to export
    alert('Đang xuất báo cáo Excel...');
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
        </div>

        <button
          className="btn-export-main"
          onClick={handleExport}
          disabled={
            (exportType === 'single' && selectedExercises.length === 0) ||
            (exportType === 'multiple' && selectedExercises.length === 0) ||
            (exportType === 'class' && selectedClasses.length === 0)
          }
        >
          <Download size={20} />
          Xuất file Excel
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
    </div>
  );
}
