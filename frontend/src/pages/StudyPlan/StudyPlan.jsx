import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle, ChevronRight, BookOpen } from 'lucide-react';
import ConsistentSidebarLayout from '../../components/Layout/ConsistentSidebarLayout';
import { coursesAPI } from '../../services/api';
import './StudyPlan.css';

const categoryStyles = {
  listening: { bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
  speaking: { bg: '#e9d5ff', border: '#d8b4fe', text: '#6b21a8' },
  reading: { bg: '#e0e7ff', border: '#c7d2fe', text: '#3730a3' },
  writing: { bg: '#fed7aa', border: '#fdba74', text: '#7c2d12' },
  vocabulary: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  grammar: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  pronunciation: { bg: '#fce7f3', border: '#f9a8d4', text: '#831843' },
  general: { bg: '#e2e8f0', border: '#cbd5f5', text: '#1e293b' }
};

const skillLabels = {
  listening: 'Listening',
  speaking: 'Speaking',
  reading: 'Reading',
  writing: 'Writing',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  pronunciation: 'Pronunciation',
  general: 'Kỹ năng chung'
};

const formatSkillLabel = (value) => {
  if (!value) return '';
  return value
    .toString()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const grades = Array.from({ length: 12 }, (_, idx) => `Lớp ${idx + 1}`);

const statusLabelMap = {
  completed: 'Đã hoàn thành',
  'in-progress': 'Đang học',
  'not-started': 'Chưa học'
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'completed':
      return 'session-completed';
    case 'in-progress':
      return 'session-in-progress';
    case 'not-started':
    default:
      return 'session-not-started';
  }
};

const StudyPlan = () => {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState('Lớp 3');
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [units, setUnits] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [unitsError, setUnitsError] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true);
      setCoursesError('');
      try {
        const gradeNumber = parseInt(selectedGrade.replace('Lớp ', ''), 10);
        const data = await coursesAPI.getCourses({ grade: gradeNumber });
        const normalized = Array.isArray(data) ? data : [];
        setCourses(normalized);
        setSelectedCourseId((prev) => {
          if (normalized.some((course) => course.id === prev)) {
            return prev;
          }
          return normalized.length > 0 ? normalized[0].id : null;
        });
      } catch (error) {
        const message = error?.detail || 'Không thể tải danh sách khóa học.';
        setCourses([]);
        setSelectedCourseId(null);
        setCoursesError(message);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [selectedGrade]);

  useEffect(() => {
    const loadUnits = async () => {
      if (!selectedCourseId) {
        setUnits([]);
        return;
      }

      setLoadingUnits(true);
      setUnitsError('');
      try {
        const data = await coursesAPI.getUnits(selectedCourseId);
        const normalized = Array.isArray(data) ? data : [];
        const sorted = normalized.slice().sort((a, b) => {
          const weekA = a.week_index ?? Number.MAX_SAFE_INTEGER;
          const weekB = b.week_index ?? Number.MAX_SAFE_INTEGER;
          if (weekA !== weekB) return weekA - weekB;
          const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
          if (orderA !== orderB) return orderA - orderB;
          return a.id - b.id;
        });
        setUnits(sorted);
      } catch (error) {
        setUnits([]);
        const message = error?.detail || 'Không thể tải kế hoạch học cho khóa học này.';
        setUnitsError(message);
      } finally {
        setLoadingUnits(false);
      }
    };

    loadUnits();
  }, [selectedCourseId]);

  const [selectedSkillFilter, setSelectedSkillFilter] = useState('all');

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const availableSkills = useMemo(() => {
    if (!Array.isArray(units) || units.length === 0) return [];
    const keys = new Set();
    units.forEach((unit) => {
      const key = (unit.skill_type || unit.category || 'general').toLowerCase();
      keys.add(key);
    });
    keys.delete('general');
    return Array.from(keys);
  }, [units]);

  useEffect(() => {
    if (selectedSkillFilter === 'all') return;
    if (availableSkills.length === 0) {
      setSelectedSkillFilter('all');
      return;
    }
    if (!availableSkills.includes(selectedSkillFilter)) {
      setSelectedSkillFilter('all');
    }
  }, [availableSkills, selectedSkillFilter]);

  const sessions = useMemo(() => {
    if (!selectedCourse) {
      return [];
    }

    const completedUnits = selectedCourse.completedUnits || 0;
    const isInProgress = selectedCourse.status === 'in-progress';
    let remainingCups = selectedCourse.cupsEarned || 0;

    return units
      .filter((unit) => {
        if (selectedSkillFilter === 'all') return true;
        const key = (unit.skill_type || unit.category || 'general').toLowerCase();
        return key === selectedSkillFilter;
      })
      .map((unit, index) => {
        let status = 'not-started';
        if (index < completedUnits) {
          status = 'completed';
        } else if (index === completedUnits && isInProgress) {
          status = 'in-progress';
        }

        const maxCups = unit.max_cups ?? 0;
        let cupsEarnedForUnit = 0;
        if (status !== 'not-started' && maxCups > 0 && remainingCups > 0) {
          cupsEarnedForUnit = Math.min(maxCups, remainingCups);
          remainingCups = Math.max(0, remainingCups - cupsEarnedForUnit);
        }

        const weekLabel = unit.week_index ? `Tuần ${unit.week_index}` : 'Chưa có lịch';
        const sessionNumber = index + 1;

        return {
          id: unit.id,
          sessionNumber,
          title: unit.title,
          description: unit.description,
          weekLabel,
          status,
          cupsEarned: cupsEarnedForUnit,
          totalCups: maxCups,
          unitType: unit.unit_type || 'lesson',
          skillKey: (unit.skill_type || unit.category || 'general').toLowerCase()
        };
      });
  }, [units, selectedCourse, selectedSkillFilter]);

  const skillKey = (selectedCourse?.category || selectedCourse?.skill || 'general').toLowerCase();
  const categoryStyle = categoryStyles[skillKey] || categoryStyles.general;
  const categoryLabel = skillLabels[skillKey] || formatSkillLabel(skillKey);

  const handleNavigate = (sessionId) => {
    if (!selectedCourse) {
      return;
    }
    const courseId = selectedCourse.id;
    const skillType = (selectedCourse.category || selectedCourse.skill || '').toLowerCase();

    const skillRoutes = {
      reading: `/reading-exercise/${courseId}/${sessionId}`,
      writing: `/writing-exercise/${courseId}/${sessionId}`,
      listening: `/listening-exercise/${courseId}/${sessionId}`,
      speaking: `/speaking-exercise/${courseId}/${sessionId}`
    };

    if (skillRoutes[skillType]) {
      navigate(skillRoutes[skillType]);
      return;
    }

    navigate(`/course/${courseId}`);
  };

  return (
    <ConsistentSidebarLayout activeMenuItem="study-plan" courseTitle="Học bài">
      <div className="study-plan-content-wrapper">
        <div className="study-plan-header">
          <div className="header-description">
            <h1>Kế hoạch học tập</h1>
            <p>Theo dõi lộ trình học từ các khóa hiện có và tiếp tục những bài học phù hợp.</p>
          </div>
        </div>

        <div className="study-plan-content">
          <div className="study-plan-controls">
            <div className="month-selector">
              {grades.map((grade) => (
                <button
                  key={grade}
                  className={`month-btn ${selectedGrade === grade ? 'active' : ''}`}
                  onClick={() => setSelectedGrade(grade)}
                >
                  {grade}
                </button>
              ))}
            </div>

            {loadingCourses ? (
              <div className="study-plan-loading">Đang tải khóa học...</div>
            ) : coursesError ? (
              <div className="study-plan-error">{coursesError}</div>
            ) : courses.length === 0 ? (
              <div className="study-plan-empty">
                <BookOpen size={48} />
                <p>Chưa có khóa học nào cho {selectedGrade}. Hãy thử chọn lớp khác.</p>
              </div>
            ) : courses.length === 1 ? null : (
              <div className="course-selector">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    className={`course-pill ${course.id === selectedCourseId ? 'active' : ''}`}
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <span className="course-pill-title">{course.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCourse && (
            <>
              {loadingUnits ? (
                <div className="study-plan-loading">Đang tải chi tiết kế hoạch học...</div>
              ) : unitsError ? (
                <div className="study-plan-error">{unitsError}</div>
              ) : sessions.length === 0 ? (
                <div className="study-plan-empty">
                  <BookOpen size={48} />
                  <p>Khóa học này chưa có bài học nào.</p>
                </div>
              ) : (
                <>
                  {availableSkills.length > 0 && (
                    <div className="skill-filter">
                      {['all', ...availableSkills].map((skill) => {
                        const label = skill === 'all' ? 'Tất cả' : (skillLabels[skill] || formatSkillLabel(skill));
                        return (
                          <button
                            key={skill}
                            className={`skill-chip ${selectedSkillFilter === skill ? 'active' : ''}`}
                            onClick={() => setSelectedSkillFilter(skill)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="sessions-grid">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`session-card ${getStatusBadgeClass(session.status)}`}
                      >
                      <div className="session-header">
                        <div
                          className="session-badge"
                          style={{
                            background:
                              session.status === 'completed'
                                ? '#10b981'
                                : session.status === 'in-progress'
                                ? '#f59e0b'
                                : '#94a3b8'
                          }}
                        >
                          Buổi {session.sessionNumber}
                          {(session.status === 'completed' || session.cupsEarned > 0) && (
                            <CheckCircle size={14} className="check-icon" />
                          )}
                        </div>
                        <span className="session-date">{session.weekLabel}</span>
                      </div>
                      <div className="session-content">
                        <div className="session-indicator">
                          <div className="indicator-dot"></div>
                          <span className="session-title">
                            {selectedCourse?.name ? `${selectedCourse.name} · ${session.title}` : session.title}
                          </span>
                        </div>

                        <div
                          className="session-category"
                          style={{
                            background: categoryStyle.bg,
                            borderColor: categoryStyle.border,
                            color: categoryStyle.text
                          }}
                        >
                          {categoryLabel}
                        </div>

                        {session.description && (
                          <p className="session-message">{session.description}</p>
                        )}

                        {session.status === 'not-started' && (
                          <p className="session-message">Bạn chưa bắt đầu buổi học này.</p>
                        )}
                        {session.status === 'in-progress' && (
                          <p className="session-message">Tiếp tục để hoàn thành buổi học.</p>
                        )}
                        {session.status === 'completed' && (
                          <p className="session-message">Đã hoàn thành buổi học.</p>
                        )}
                      </div>

                      <div className="session-footer">
                        <div className="cups-indicator">
                          <Award size={16} className="cup-icon" />
                          <span className="cups-text">
                            {session.cupsEarned}/{session.totalCups}
                          </span>
                        </div>
                        <button
                          className="session-action-btn"
                          onClick={() => handleNavigate(session.id)}
                        >
                          {session.status === 'completed'
                            ? 'Xem lại'
                            : session.status === 'in-progress'
                            ? 'Tiếp tục'
                            : 'Bắt đầu'}
                          <ChevronRight size={16} />
                        </button>
                      </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </ConsistentSidebarLayout>
  );
};

export default StudyPlan;

