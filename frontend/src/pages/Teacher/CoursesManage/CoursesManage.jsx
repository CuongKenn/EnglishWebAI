import React, { useEffect, useMemo, useState } from 'react';
import './CoursesManage.css';
import { coursesAPI } from '../../../services/api';

const skills = [
  { value: 'listening', label: 'Listening' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
];

const grades = Array.from({ length: 12 }, (_, i) => i + 1);

const defaultForm = {
  title: '',
  description: '',
  skill: 'listening',
  grade: 1,
  level: '',
};

const CoursesManage = () => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ skill: 'all', grade: 'all', search: '' });
  const [message, setMessage] = useState(null);

  const filtered = useMemo(() => {
    let data = courses;
    if (filters.skill !== 'all') data = data.filter(c => c.category === filters.skill);
    if (filters.grade !== 'all') data = data.filter(c => c.gradeLabel === `Lớp ${filters.grade}`);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(c => c.name.toLowerCase().includes(q));
    }
    return data;
  }, [courses, filters]);

  const loadCourses = async () => {
    setListLoading(true);
    try {
      const params = {};
      if (filters.skill !== 'all') params.skill = filters.skill;
      if (filters.grade !== 'all') params.grade = Number(filters.grade);
      if (filters.search) params.search = filters.search;
      const data = await coursesAPI.getCourses(params);
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Bảo đảm tải lần đầu khi mở trang (tránh trường hợp effect theo filters không chạy do cache/UI)
  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        grade: Number(form.grade),
        skill: form.skill,
        level: form.level || undefined,
        is_active: true,
      };
      await coursesAPI.createCourse(payload);
      setMessage({ type: 'success', text: 'Đã tạo khóa học công khai!' });
      setForm(defaultForm);
      await loadCourses();
    } catch (err) {
      const text = err?.detail || 'Tạo khóa học thất bại';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="courses-manage-wrapper">
      <h1 className="page-title">Khoá học công khai (4 kỹ năng × 12 lớp)</h1>
      <p className="page-subtitle">Giáo viên có thể tạo khoá học công khai để tất cả học sinh đều thấy và làm</p>

      <div className="grid-2">
        {/* Create Course */}
        <div className="card">
          <h2 className="card-title">Tạo khoá học</h2>
          <form className="course-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Tên khoá học</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ví dụ: Reading Lớp 8"
                required
              />
            </label>

            <label className="form-field">
              <span>Mô tả</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn cho khoá học"
                rows={3}
              />
            </label>

            <div className="row">
              <label className="form-field">
                <span>Kỹ năng</span>
                <select
                  value={form.skill}
                  onChange={(e) => setForm({ ...form, skill: e.target.value })}
                >
                  {skills.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Lớp</span>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                >
                  {grades.map(g => (
                    <option key={g} value={g}>Lớp {g}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="form-field">
              <span>Mức độ (tùy chọn)</span>
              <input
                type="text"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                placeholder="Beginner / Intermediate / Advanced"
              />
            </label>

            <div className="actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Tạo khoá học'}
              </button>
            </div>

            {message && (
              <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {message.text}
              </div>
            )}
          </form>
        </div>

        {/* List Courses */}
        <div className="card">
          <h2 className="card-title">Danh sách khoá học</h2>
          <div className="filters">
            <select
              value={filters.skill}
              onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
            >
              <option value="all">Tất cả kỹ năng</option>
              {skills.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={filters.grade}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
            >
              <option value="all">Tất cả lớp</option>
              {grades.map(g => (
                <option key={g} value={g}>Lớp {g}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Tìm theo tên khoá"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <button className="btn" onClick={loadCourses} disabled={listLoading}>
              {listLoading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          <div className="course-list">
            {filtered.length === 0 && (
              <div className="empty">Không có khoá học phù hợp</div>
            )}
            {filtered.map((c) => (
              <CourseRow key={c.id} course={c} onChanged={loadCourses} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CourseRow = ({ course, onChanged }) => {
  const [show, setShow] = useState(false);
  const [units, setUnits] = useState([]);
  const [newUnit, setNewUnit] = useState({ title: '', week_index: 1, unit_type: 'lesson', max_cups: 2 });
  const [addingQ, setAddingQ] = useState(null); // unitId
  const [qForm, setQForm] = useState({ type: suggestType(course.category), prompt: '', options: ['', '', '', ''], answer: { correct: 0 }, media_url: '', points: 1 });
  const [unitMsg, setUnitMsg] = useState(null);
  const [unitSaving, setUnitSaving] = useState(false);

  const loadUnits = async () => {
    try {
      setUnitMsg(null);
      const data = await coursesAPI.getUnits(course.id);
      setUnits(Array.isArray(data) ? data : []);
    } catch (e) {
      setUnits([]);
      setUnitMsg({ type: 'error', text: e?.detail || 'Không tải được danh sách bài' });
    }
  };

  // Tự động tải danh sách bài khi mở modal
  useEffect(() => { if (show) { loadUnits(); } }, [show]);

  // Removed quick exercise creation; we manage questions per unit instead.

  return (
    <div className="course-item">
      <div className="course-main">
        <div className="course-name">{course.name}</div>
        <div className="course-meta">
          <span className="badge">{course.category}</span>
          <span className="badge">{course.gradeLabel}</span>
          <span className={`badge status ${course.status}`}>{course.status}</span>
        </div>
      </div>
      <div className="course-stats">
        <span>{course.completedUnits}/{course.totalUnits} units</span>
        <span>{course.cupsEarned}/{course.totalCups} cúp</span>
        <button className="btn" onClick={() => setShow(true)}>Cài đặt</button>
      </div>

      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cài đặt khoá — {course.name}</h3>
              <button className="close-btn" onClick={() => setShow(false)}>×</button>
            </div>

            {/* Units & questions */}
            <div style={{ marginTop: 16 }} />
            <h3>Quản lý Bài (Units) & Câu hỏi</h3>
            <div className="row">
              <label className="form-field">
                <span>Tên bài</span>
                <input value={newUnit.title} onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })} />
              </label>
              <label className="form-field">
                <span>Tuần</span>
                <input type="number" value={newUnit.week_index} onChange={(e) => setNewUnit({ ...newUnit, week_index: Number(e.target.value) })} />
              </label>
              <label className="form-field">
                <span>Số cúp tối đa/Bài</span>
                <input type="number" min={0} value={newUnit.max_cups} onChange={(e)=> setNewUnit({ ...newUnit, max_cups: Number(e.target.value)||0 })} />
              </label>
              <div className="actions">
                <button
                  className="btn"
                  disabled={unitSaving || !newUnit.title?.trim()}
                  onClick={async () => {
                    setUnitMsg(null); setUnitSaving(true);
                    try {
                      await coursesAPI.createUnit(course.id, {
                        title: newUnit.title.trim(),
                        week_index: Number(newUnit.week_index) || 1,
                        unit_type: newUnit.unit_type || 'lesson',
                        max_cups: Number(newUnit.max_cups) || 2,
                      });
                      setNewUnit({ title: '', week_index: 1, unit_type: 'lesson', max_cups: 2 });
                      await loadUnits();
                      setUnitMsg({ type: 'success', text: 'Đã thêm bài' });
                    } catch (err) {
                      setUnitMsg({ type: 'error', text: err?.detail || 'Thêm bài thất bại' });
                    } finally { setUnitSaving(false); }
                  }}
                >
                  {unitSaving ? 'Đang thêm...' : 'Thêm bài'}
                </button>
              </div>

            {unitMsg && (
              <div className={`alert ${unitMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{unitMsg.text}</div>
            )}
            </div>

            <div className="course-list" style={{ marginTop: 8 }}>
              {units.map(u => (
                <div key={u.id} className="course-item">
                  <div className="course-main">
                    <div className="course-name">{u.title}</div>
                    <div className="course-meta">
                      <span className="badge">Tuần {u.week_index || 1}</span>
                      <span className="badge">{u.questions} câu hỏi</span>
                    </div>
                  </div>
                  <div className="course-stats">
                    <button className="btn" onClick={() => { setAddingQ(u.id); setQForm({ type: suggestType(course.category), prompt: '', options: ['', '', '', ''], answer: { correct: 0 }, media_url: '', points: 1 }); }}>Thêm câu hỏi</button>
                  </div>
                </div>
              ))}
              {units.length === 0 && <div className="empty">Chưa có bài nào. Hãy thêm bài trước.</div>}
            </div>

            {addingQ && (
              <div className="card" style={{ marginTop: 12 }}>
                <h4>Thêm câu hỏi cho Bài #{addingQ}</h4>
                {renderQuestionEditor(course.category, qForm, setQForm)}
                <div className="actions">
                  <button className="btn" onClick={() => setAddingQ(null)}>Hủy</button>
                  <button className="btn-primary" onClick={async () => { await coursesAPI.createQuestion(addingQ, normalizeQuestionPayload(qForm)); setAddingQ(null); await loadUnits(); }}>Lưu câu hỏi</button>
                </div>
              </div>
            )}
            <div style={{ height: 8 }} />
            <button className="btn" onClick={loadUnits} disabled={unitSaving}>Tải danh sách bài</button>
          </div>
        </div>
      )}
    </div>
  );
};

function suggestType(skill) {
  switch (skill) {
    case 'reading': return 'mcq';
    case 'listening': return 'mcq-audio';
    case 'speaking': return 'prompt';
    case 'writing': return 'essay';
    default: return 'assignment';
  }
}

function suggestTypesForSkill(skill) {
  switch (skill) {
    case 'reading': return ['mcq', 'fill-blank', 'short'];
    case 'listening': return ['mcq-audio', 'dictation'];
    case 'speaking': return ['prompt'];
    case 'writing': return ['essay'];
    default: return ['assignment'];
  }
}

function defaultContent(skill) {
  if (skill === 'reading') return { question: '', options: ['', '', '', ''], correct: 0 };
  if (skill === 'listening') return { audioUrl: '', question: '', options: ['', '', '', ''], correct: 0 };
  if (skill === 'speaking') return { prompt: '' };
  if (skill === 'writing') return { prompt: '' };
  return {};
}

function renderContentEditor(skill, form, setForm) {
  if (skill === 'reading') {
    const c = form.content || defaultContent(skill);
    return (
      <div className="card" style={{ gap: 8 }}>
        <label className="form-field"><span>Câu hỏi</span>
          <input value={c.question} onChange={(e) => setForm({ ...form, content: { ...c, question: e.target.value } })} />
        </label>
        <div className="row">
          {c.options.map((opt, idx) => (
            <label key={idx} className="form-field">
              <span>Đáp án {idx + 1}</span>
              <input value={opt} onChange={(e) => {
                const arr = [...c.options]; arr[idx] = e.target.value; setForm({ ...form, content: { ...c, options: arr } });
              }} />
            </label>
          ))}
        </div>
        <label className="form-field"><span>Đáp án đúng</span>
          <select value={c.correct} onChange={(e) => setForm({ ...form, content: { ...c, correct: Number(e.target.value) } })}>
            {[0,1,2,3].map(i => <option key={i} value={i}>{i+1}</option>)}
          </select>
        </label>
      </div>
    );
  }
  if (skill === 'listening') {
    const c = form.content || defaultContent(skill);
    return (
      <div className="card" style={{ gap: 8 }}>
        <label className="form-field"><span>Audio URL</span>
          <input value={c.audioUrl} onChange={(e) => setForm({ ...form, content: { ...c, audioUrl: e.target.value } })} />
        </label>
        <label className="form-field"><span>Câu hỏi</span>
          <input value={c.question} onChange={(e) => setForm({ ...form, content: { ...c, question: e.target.value } })} />
        </label>
        <div className="row">
          {c.options.map((opt, idx) => (
            <label key={idx} className="form-field">
              <span>Đáp án {idx + 1}</span>
              <input value={opt} onChange={(e) => {
                const arr = [...c.options]; arr[idx] = e.target.value; setForm({ ...form, content: { ...c, options: arr } });
              }} />
            </label>
          ))}
        </div>
        <label className="form-field"><span>Đáp án đúng</span>
          <select value={c.correct} onChange={(e) => setForm({ ...form, content: { ...c, correct: Number(e.target.value) } })}>
            {[0,1,2,3].map(i => <option key={i} value={i}>{i+1}</option>)}
          </select>
        </label>
      </div>
    );
  }
  if (skill === 'speaking') {
    const c = form.content || defaultContent(skill);
    return (
      <label className="form-field"><span>Gợi ý nói</span>
        <textarea rows={3} value={c.prompt} onChange={(e) => setForm({ ...form, content: { ...c, prompt: e.target.value } })} />
      </label>
    );
  }
  if (skill === 'writing') {
    const c = form.content || defaultContent(skill);
    return (
      <label className="form-field"><span>Đề bài viết</span>
        <textarea rows={3} value={c.prompt} onChange={(e) => setForm({ ...form, content: { ...c, prompt: e.target.value } })} />
      </label>
    );
  }
  return null;
}

function renderQuestionEditor(skill, qForm, setQForm) {
  if (skill === 'reading') {
    const c = qForm;
    return (
      <div className="course-form" style={{ gap: 8 }}>
        <label className="form-field"><span>Câu hỏi</span>
          <input value={c.prompt} onChange={(e) => setQForm({ ...c, prompt: e.target.value })} />
        </label>
        <div className="row">
          {c.options.map((opt, idx) => (
            <label key={idx} className="form-field"><span>Đáp án {idx + 1}</span>
              <input value={opt} onChange={(e) => { const arr = [...c.options]; arr[idx] = e.target.value; setQForm({ ...c, options: arr }); }} />
            </label>
          ))}
        </div>
        <label className="form-field"><span>Đáp án đúng</span>
          <select value={c.answer.correct} onChange={(e) => setQForm({ ...c, answer: { correct: Number(e.target.value) } })}>
            {[0,1,2,3].map(i => <option key={i} value={i}>{i+1}</option>)}
          </select>
        </label>
      </div>
    );
  }
  if (skill === 'listening') {
    const c = qForm;
    return (
      <div className="course-form" style={{ gap: 8 }}>
        <label className="form-field"><span>Audio URL</span>
          <input value={c.media_url} onChange={(e) => setQForm({ ...c, media_url: e.target.value })} />
        </label>
        <label className="form-field"><span>Câu hỏi</span>
          <input value={c.prompt} onChange={(e) => setQForm({ ...c, prompt: e.target.value })} />
        </label>
        <div className="row">
          {c.options.map((opt, idx) => (
            <label key={idx} className="form-field"><span>Đáp án {idx + 1}</span>
              <input value={opt} onChange={(e) => { const arr = [...c.options]; arr[idx] = e.target.value; setQForm({ ...c, options: arr }); }} />
            </label>
          ))}
        </div>
        <label className="form-field"><span>Đáp án đúng</span>
          <select value={c.answer.correct} onChange={(e) => setQForm({ ...c, answer: { correct: Number(e.target.value) } })}>
            {[0,1,2,3].map(i => <option key={i} value={i}>{i+1}</option>)}
          </select>
        </label>
      </div>
    );
  }
  if (skill === 'speaking' || skill === 'writing') {
    const c = qForm;
    return (
      <label className="form-field"><span>{skill === 'speaking' ? 'Gợi ý nói' : 'Đề bài viết'}</span>
        <textarea rows={3} value={c.prompt} onChange={(e) => setQForm({ ...c, prompt: e.target.value })} />
      </label>
    );
  }
  return null;
}

function normalizeQuestionPayload(q) {
  const payload = { type: q.type, prompt: q.prompt, points: q.points, order_index: q.order_index };
  if (q.options) payload.options = q.options;
  if (q.answer) payload.answer = q.answer;
  if (q.media_url) payload.media_url = q.media_url;
  return payload;
}

export default CoursesManage;
