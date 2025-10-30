import React, { useEffect, useMemo, useState } from 'react';
import './TeacherMaterials.css';
import { classesAPI, materialsAPI } from '../../../services/api';
import Toast from '../../../components/Toast/Toast';
import useToast from '../../../hooks/useToast';

const TeacherMaterials = () => {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null | material
  const [form, setForm] = useState({ title: '', type: 'file', url: '', description: '' });
  const [file, setFile] = useState(null);

  const selectedClass = useMemo(() => classes.find(c => String(c.id) === String(selectedClassId)) || null, [classes, selectedClassId]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await classesAPI.getTeachingClasses();
      setClasses(Array.isArray(data) ? data : []);
      if (data && data.length && !selectedClassId) {
        setSelectedClassId(String(data[0].id));
      }
    } catch (e) {
      setError(e?.detail || 'Không tải được danh sách lớp dạy');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (clsId) => {
    if (!clsId) { setMaterials([]); return; }
    try {
      setLoading(true);
      setError('');
      const data = await materialsAPI.listByClass(clsId);
      setMaterials(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.detail || 'Không tải được học liệu của lớp');
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (clsId) => {
    if (!clsId) { setLessons([]); setSelectedLessonId(''); return; }
    try {
      const data = await classesAPI.getClassLessons(clsId);
      setLessons(Array.isArray(data) ? data : []);
      if (data && data.length) setSelectedLessonId(String(data[0].id));
    } catch (e) {
      setLessons([]);
    }
  };

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { if (selectedClassId) { loadMaterials(selectedClassId); loadLessons(selectedClassId);} }, [selectedClassId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', type: 'file', url: '', description: '' });
    setFile(null);
    setShowModal(true);
  };

  const openEdit = (material) => {
    setEditing(material);
    setForm({ title: material.title || '', type: material.type || 'file', url: material.url || '', description: material.description || '' });
    setFile(null);
    setSelectedLessonId(material.lesson_id ? String(material.lesson_id) : '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedClassId) { showWarning('Vui lòng chọn lớp'); return; }
    try {
      setLoading(true);
      setError('');

      // Upload file nếu cần
      let file_path;
      let uploadResult = null;
      if (!editing && form.type === 'file' && file) {
        uploadResult = await materialsAPI.upload(file);
        file_path = uploadResult?.file_path;
      }

      if (!editing) {
        // Create (with auto text extraction for .txt/.md)
        let finalType = form.type;
        let finalDescription = form.description || '';
        let finalFilePath = form.type === 'file' ? (file_path || '') : null;

        if (file && file.name && /\.(txt|md)$/i.test(file.name) && file_path) {
            const txt = uploadResult?.text_content;
            if (txt && txt.length > 0) {
              finalType = 'text';
              finalDescription = (finalDescription ? finalDescription + '\n\n' : '') + txt;
            }
        }

        const payload = {
          class_id: Number(selectedClassId),
          lesson_id: selectedLessonId ? Number(selectedLessonId) : null,
          title: form.title || (file?.name ? file.name.replace(/\.[^.]+$/, '') : 'Tài liệu'),
          type: finalType,
          url: finalType === 'link' ? (form.url || '') : null,
          file_path: finalType === 'file' ? (finalFilePath || '') : null,
          description: finalDescription,
        };
        await materialsAPI.createMaterial(payload);
      } else {
        // Update
        await materialsAPI.updateMaterial(editing.id, {
          title: form.title,
          description: form.description,
          url: form.type === 'link' ? (form.url || '') : undefined,
          lesson_id: selectedLessonId ? Number(selectedLessonId) : null,
        });
      }

      setShowModal(false);
      await loadMaterials(selectedClassId);
    } catch (e) {
      setError(e?.detail || 'Lưu học liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (material) => {
    if (!window.confirm(`Xóa học liệu "${material.title}"?`)) return;
    try {
      setLoading(true);
      setError('');
      await materialsAPI.deleteMaterial(material.id);
      await loadMaterials(selectedClassId);
    } catch (e) {
      setError(e?.detail || 'Xóa học liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tm-page">
      <div className="tm-header">
        <div>
          <h1>Quản lý học liệu</h1>
          <p>Tạo và quản lý học liệu cho lớp bạn phụ trách</p>
        </div>
        <div className="tm-actions">
          <select className="tm-select" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
            <option value="" disabled>Chọn lớp</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={openCreate} disabled={!selectedClassId}>
            + Thêm học liệu
          </button>
        </div>
      </div>

      {error && <div className="tm-error">{error}</div>}

      <div className="tm-list">
        {loading && <div className="tm-loading">Đang tải...</div>}
        {!loading && (!materials || materials.length === 0) && (
          <div className="tm-empty">Chưa có học liệu cho lớp này</div>
        )}

        {!loading && materials && materials.length > 0 && (
          <div>
            {/* Group by lesson */}
            {lessons.map((lsn) => {
              const mats = materials.filter(m => String(m.lesson_id || '') === String(lsn.id));
              if (mats.length === 0) return null;
              return (
                <div key={lsn.id} style={{ marginBottom: 16 }}>
                  <div className="section-header"><h3 className="section-title">Bài {lsn.order_index || ''}: {lsn.title}</h3></div>
                  <div className="tm-grid">
                    {mats.map(mat => (
                      <div key={mat.id} className="tm-card">
                        <div className="tm-card-header">
                          <div className="tm-card-title">{mat.title}</div>
                          <div className={`tm-tag tm-${(mat.type || 'file')}`}>{mat.type || 'file'}</div>
                        </div>
                        {mat.description && <div className="tm-desc">{mat.description}</div>}
                        {(mat.url || mat.file_path) && (
                          <div className="tm-link-row">
                            <a className="tm-link" href={mat.url || '#'} onClick={(e) => { if (!mat.url) e.preventDefault(); }} target="_blank" rel="noreferrer">
                              {mat.url ? 'Mở liên kết' : 'Tệp đã tải lên'}
                            </a>
                          </div>
                        )}
                        <div className="tm-card-actions">
                          <button className="btn-secondary" onClick={() => openEdit(mat)}>Sửa</button>
                          <button className="btn-danger" onClick={() => handleDelete(mat)}>Xóa</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Ungrouped materials */}
            {materials.some(m => !m.lesson_id) && (
              <div>
                <div className="section-header"><h3 className="section-title">Tài liệu khác</h3></div>
                <div className="tm-grid">
                  {materials.filter(m => !m.lesson_id).map(mat => (
                    <div key={mat.id} className="tm-card">
                      <div className="tm-card-header">
                        <div className="tm-card-title">{mat.title}</div>
                        <div className={`tm-tag tm-${(mat.type || 'file')}`}>{mat.type || 'file'}</div>
                      </div>
                      {mat.description && <div className="tm-desc">{mat.description}</div>}
                      {(mat.url || mat.file_path) && (
                        <div className="tm-link-row">
                          <a className="tm-link" href={mat.url || '#'} onClick={(e) => { if (!mat.url) e.preventDefault(); }} target="_blank" rel="noreferrer">
                            {mat.url ? 'Mở liên kết' : 'Tệp đã tải lên'}
                          </a>
                        </div>
                      )}
                      <div className="tm-card-actions">
                        <button className="btn-secondary" onClick={() => openEdit(mat)}>Sửa</button>
                        <button className="btn-danger" onClick={() => handleDelete(mat)}>Xóa</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Cập nhật học liệu' : 'Thêm học liệu'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="tm-form">
              <label className="tm-label">
                Tiêu đề
                <input className="tm-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </label>

              {/* Choose Lesson */}
              <div className="tm-label">
                <span>Bài học</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="tm-input" value={selectedLessonId} onChange={(e) => setSelectedLessonId(e.target.value)}>
                    <option value="">— Không gán bài —</option>
                    {lessons.map(lsn => (
                      <option key={lsn.id} value={lsn.id}>Bài {lsn.order_index || ''}: {lsn.title}</option>
                    ))}
                  </select>
                  <button type="button" className="btn-secondary" onClick={() => { setAddingLesson(true); setNewLessonTitle(''); }}>+ Bài mới</button>
                </div>
              </div>

              {addingLesson && (
                <div className="tm-label">
                  <span>Tên bài mới</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <input className="tm-input" value={newLessonTitle} onChange={(e)=>setNewLessonTitle(e.target.value)} placeholder="Ví dụ: Bài 1: Ôn tập số đếm" />
                    <button type="button" className="btn-primary" onClick={async ()=>{
                      if (!newLessonTitle.trim()) return;
                      const l = await classesAPI.createLesson(Number(selectedClassId), { title: newLessonTitle });
                      await loadLessons(selectedClassId);
                      setSelectedLessonId(String(l.id));
                      setAddingLesson(false);
                    }}>Tạo bài</button>
                  </div>
                </div>
              )}

              <label className="tm-label">
                Loại học liệu
                <select className="tm-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} disabled={!!editing}>
                  <option value="file">Tệp tải lên</option>
                  <option value="link">Liên kết</option>
                  <option value="text">Văn bản</option>
                </select>
              </label>

              {form.type === 'link' && (
                <label className="tm-label">
                  URL
                  <input className="tm-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
                </label>
              )}

              {!editing && form.type === 'file' && (
                <label className="tm-label">
                  Tệp học liệu
                  <input type="file" className="tm-input" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              )}

              <label className="tm-label">
                Mô tả
                <textarea className="tm-textarea" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>

              <div className="tm-form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={loading}>{editing ? 'Lưu' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
};

export default TeacherMaterials;
