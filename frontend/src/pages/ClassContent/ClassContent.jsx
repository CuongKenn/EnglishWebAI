import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { classesAPI } from '../../services/api';
import './ClassContent.css';

const ClassContent = () => {
  const { classId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [expanded, setExpanded] = useState({}); // { [lessonId]: bool }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!classId) return;
    setLoading(true);
    setError('');
    try {
      const [mats, exs, lsn] = await Promise.all([
        classesAPI.getClassMaterials(classId).catch(() => []),
        classesAPI.getClassExercises(classId).catch(() => []),
        classesAPI.getClassLessons(classId).catch(() => []),
      ]);
      setMaterials(Array.isArray(mats) ? mats : []);
      setExercises(Array.isArray(exs) ? exs : []);
      setLessons(Array.isArray(lsn) ? lsn : []);
    } catch (e) {
      setError(e?.detail || 'Không tải được nội dung lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [classId]);

  const grouped = useMemo(() => {
    const byLesson = {};
    lessons.forEach(lsn => { byLesson[lsn.id] = { lesson: lsn, materials: [], exercises: [] }; });
    (materials || []).forEach(m => {
      if (m.lesson_id && byLesson[m.lesson_id]) byLesson[m.lesson_id].materials.push(m);
    });
    (exercises || []).forEach(e => {
      if (e.lesson_id && byLesson[e.lesson_id]) byLesson[e.lesson_id].exercises.push(e);
    });
    return byLesson;
  }, [lessons, materials, exercises]);

  return (
    <div className="cc-page">
      <div className="cc-header">
        <h1>Nội dung lớp #{classId}</h1>
        <div className="cc-actions">
          <button className="btn-primary" onClick={loadData} disabled={loading}>Tải lại</button>
          <Link to="/join-class" className="btn-secondary">← Quay lại danh sách lớp</Link>
        </div>
      </div>

      {error && <div className="cc-error">{error}</div>}
      {loading && <div className="cc-loading">Đang tải...</div>}

      <div className="cc-section">
        <div className="cc-section-header"><h2>Nội dung khóa học</h2></div>
        {(!lessons || lessons.length === 0) ? (
          <div>
            <div className="cc-empty">Chưa có bài học</div>
            {(materials.length > 0 || exercises.length > 0) && (() => {
              const miscOpen = !!expanded.__other;
              const mCount = materials.length;
              const eCount = exercises.length;
              return (
                <div className="lesson-row" style={{ marginTop: 10 }}>
                  <div className="lesson-summary" onClick={() => setExpanded(s => ({ ...s, __other: !miscOpen }))}>
                    <div className="lesson-title">Khác</div>
                    <div className="lesson-badges">
                      <span className="badge">📄 {mCount}</span>
                      <span className="badge">✏️ {eCount}</span>
                      <button className="expand-btn" aria-label="toggle">{miscOpen ? 'Ẩn' : 'Xem'}</button>
                    </div>
                  </div>
                  {miscOpen && (
                    <div className="lesson-details">
                      {mCount > 0 && (
                        <div className="cc-lesson-block">
                          <h3>Tài liệu</h3>
                          <ul className="cc-list">
                            {materials.map(m => (
                              <li key={m.id} className="cc-item">
                                <div className="cc-title">{m.title}</div>
                                {m.description && <div className="cc-desc">{m.description}</div>}
                                <div className="cc-meta">{m.type}{m.url ? ' · Link' : ''}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {eCount > 0 && (
                        <div className="cc-lesson-block">
                          <h3>Bài tập</h3>
                          <ul className="cc-list">
                            {exercises.map(ex => (
                              <li key={ex.id} className="cc-item">
                                <div className="cc-title">{ex.title}</div>
                                {ex.description && <div className="cc-desc">{ex.description}</div>}
                                <div className="cc-meta">{ex.type}{ex.max_score ? ` · ${ex.max_score} điểm` : ''}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="cc-lessons">
            {lessons.map(lsn => {
              const info = grouped[lsn.id] || { materials: [], exercises: [] };
              const mCount = info.materials.length;
              const eCount = info.exercises.length;
              const isOpen = !!expanded[lsn.id];
              return (
                <div key={lsn.id} className="lesson-row">
                  <div className="lesson-summary" onClick={() => setExpanded(s => ({ ...s, [lsn.id]: !isOpen }))}>
                    <div className="lesson-title">Bài {lsn.order_index || ''}: {lsn.title}</div>
                    <div className="lesson-badges">
                      <span className="badge">📄 {mCount}</span>
                      <span className="badge">✏️ {eCount}</span>
                      <button className="expand-btn" aria-label="toggle">{isOpen ? 'Ẩn' : 'Xem'}</button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="lesson-details">
                      <div className="cc-lesson-block">
                        <h3>Tài liệu</h3>
                        {mCount === 0 ? (
                          <div className="cc-empty">Chưa có tài liệu</div>
                        ) : (
                          <ul className="cc-list">
                            {info.materials.map(m => (
                              <li key={m.id} className="cc-item">
                                <div className="cc-title">{m.title}</div>
                                {m.description && <div className="cc-desc">{m.description}</div>}
                                <div className="cc-meta">{m.type}{m.url ? ' · Link' : ''}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="cc-lesson-block">
                        <h3>Bài tập</h3>
                        {eCount === 0 ? (
                          <div className="cc-empty">Chưa có bài tập</div>
                        ) : (
                          <ul className="cc-list">
                            {info.exercises.map(ex => (
                              <li key={ex.id} className="cc-item">
                                <div className="cc-title">{ex.title}</div>
                                {ex.description && <div className="cc-desc">{ex.description}</div>}
                                <div className="cc-meta">{ex.type}{ex.max_score ? ` · ${ex.max_score} điểm` : ''}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {(materials.some(m => !m.lesson_id) || exercises.some(e => !e.lesson_id)) && (() => {
              const miscOpen = !!expanded.__other;
              const mCount = materials.filter(m => !m.lesson_id).length;
              const eCount = exercises.filter(e => !e.lesson_id).length;
              return (
                <div className="lesson-row">
                  <div className="lesson-summary" onClick={() => setExpanded(s => ({ ...s, __other: !miscOpen }))}>
                    <div className="lesson-title">Khác</div>
                    <div className="lesson-badges">
                      <span className="badge">📄 {mCount}</span>
                      <span className="badge">✏️ {eCount}</span>
                      <button className="expand-btn" aria-label="toggle">{miscOpen ? 'Ẩn' : 'Xem'}</button>
                    </div>
                  </div>
                  {miscOpen && (
                    <div className="lesson-details">
                      {mCount > 0 && (
                        <div className="cc-lesson-block">
                          <h3>Tài liệu khác</h3>
                          <ul className="cc-list">
                            {materials.filter(m => !m.lesson_id).map(m => (
                              <li key={m.id} className="cc-item">
                                <div className="cc-title">{m.title}</div>
                                {m.description && <div className="cc-desc">{m.description}</div>}
                                <div className="cc-meta">{m.type}{m.url ? ' · Link' : ''}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {eCount > 0 && (
                        <div className="cc-lesson-block">
                          <h3>Bài tập khác</h3>
                          <ul className="cc-list">
                            {exercises.filter(e => !e.lesson_id).map(ex => (
                              <li key={ex.id} className="cc-item">
                                <div className="cc-title">{ex.title}</div>
                                {ex.description && <div className="cc-desc">{ex.description}</div>}
                                <div className="cc-meta">{ex.type}{ex.max_score ? ` · ${ex.max_score} điểm` : ''}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassContent;
