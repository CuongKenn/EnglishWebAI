import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Play,
  Award,
  Clock,
  BookOpen,
  Target,
  ChevronRight
} from 'lucide-react';
import './CourseLessons.css';

const CourseLessons = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // State management
  const [courseData, setCourseData] = useState(null);
  const [completedLessons, setCompletedLessons] = useState({});

  // Load completed lessons from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`course_${courseId}_completed_lessons`);
    if (stored) {
      setCompletedLessons(JSON.parse(stored));
    }
  }, [courseId]);

  // Mock course data based on courseId - sẽ được thay thế bằng API call
  const getCourseData = (courseId) => {
    const courseConfigs = {
      'speaking': {
        title: 'Khóa học IELTS Speaking',
        description: 'Nâng cao kỹ năng Speaking cho kỳ thi IELTS',
        totalLessons: 20,
        units: [
          {
            id: 1,
            title: 'Unit 1: Introduction',
            lessons: [
              {
                id: '1-1',
                title: 'Part 1: Personal Information',
                type: 'speaking',
                estimatedTime: 15,
                difficulty: 'Beginner'
              },
              {
                id: '1-2',
                title: 'Part 2: Individual Long Turn',
                type: 'speaking',
                estimatedTime: 20,
                difficulty: 'Beginner'
              }
            ]
          },
          {
            id: 2,
            title: 'Unit 2: Daily Life',
            lessons: [
              {
                id: '2-1',
                title: 'Talking about Hobbies',
                type: 'speaking',
                estimatedTime: 15,
                difficulty: 'Intermediate'
              },
              {
                id: '2-2',
                title: 'Describing Daily Routine',
                type: 'speaking',
                estimatedTime: 25,
                difficulty: 'Intermediate'
              }
            ]
          }
        ]
      },
      'writing': {
        title: 'Khóa học IELTS Writing',
        description: 'Nâng cao kỹ năng Writing cho kỳ thi IELTS',
        totalLessons: 15,
        units: [
          {
            id: 1,
            title: 'Unit 1: Task 1 - Academic',
            lessons: [
              {
                id: '1-1',
                title: 'Bar Charts & Line Graphs',
                type: 'writing',
                estimatedTime: 30,
                difficulty: 'Beginner'
              },
              {
                id: '1-2',
                title: 'Pie Charts & Tables',
                type: 'writing',
                estimatedTime: 30,
                difficulty: 'Beginner'
              }
            ]
          },
          {
            id: 2,
            title: 'Unit 2: Task 2 - Opinion Essays',
            lessons: [
              {
                id: '2-1',
                title: 'Agree/Disagree Essays',
                type: 'writing',
                estimatedTime: 35,
                difficulty: 'Intermediate'
              },
              {
                id: '2-2',
                title: 'Advantages/Disadvantages',
                type: 'writing',
                estimatedTime: 35,
                difficulty: 'Intermediate'
              }
            ]
          }
        ]
      },
      'reading': {
        title: 'Khóa học IELTS Reading',
        description: 'Nâng cao kỹ năng Reading cho kỳ thi IELTS',
        totalLessons: 18,
        units: [
          {
            id: 1,
            title: 'Unit 1: Skimming & Scanning',
            lessons: [
              {
                id: '1-1',
                title: 'True/False/Not Given',
                type: 'reading',
                estimatedTime: 20,
                difficulty: 'Beginner'
              },
              {
                id: '1-2',
                title: 'Yes/No/Not Given',
                type: 'reading',
                estimatedTime: 20,
                difficulty: 'Beginner'
              }
            ]
          },
          {
            id: 2,
            title: 'Unit 2: Multiple Choice',
            lessons: [
              {
                id: '2-1',
                title: 'Single Answer Questions',
                type: 'reading',
                estimatedTime: 25,
                difficulty: 'Intermediate'
              },
              {
                id: '2-2',
                title: 'Multiple Answer Questions',
                type: 'reading',
                estimatedTime: 25,
                difficulty: 'Intermediate'
              }
            ]
          }
        ]
      },
      'listening': {
        title: 'Khóa học IELTS Listening',
        description: 'Nâng cao kỹ năng Listening cho kỳ thi IELTS',
        totalLessons: 16,
        units: [
          {
            id: 1,
            title: 'Unit 1: Section 1 - Social Needs',
            lessons: [
              {
                id: '1-1',
                title: 'Filling Forms & Personal Details',
                type: 'listening',
                estimatedTime: 15,
                difficulty: 'Beginner'
              },
              {
                id: '1-2',
                title: 'Numbers & Spelling',
                type: 'listening',
                estimatedTime: 15,
                difficulty: 'Beginner'
              }
            ]
          },
          {
            id: 2,
            title: 'Unit 2: Section 2 - Monologues',
            lessons: [
              {
                id: '2-1',
                title: 'Tour Information',
                type: 'listening',
                estimatedTime: 18,
                difficulty: 'Intermediate'
              },
              {
                id: '2-2',
                title: 'Lecture Notes',
                type: 'listening',
                estimatedTime: 18,
                difficulty: 'Intermediate'
              }
            ]
          }
        ]
      }
    };

    const courseType = courseId.split('-')[0]; // Extract type from courseId like 'speaking-1' -> 'speaking'
    const config = courseConfigs[courseType] || courseConfigs['speaking']; // Default to speaking if not found

    return {
      id: courseId,
      ...config,
      completedLessons: Object.keys(completedLessons).length
    };
  };

  const mockCourseData = getCourseData(courseId);

  useEffect(() => {
    setCourseData(mockCourseData);
  }, [courseId]);

  // Handle lesson click
  const handleLessonClick = (lesson) => {
    const exerciseType = lesson.type;
    const routeMap = {
      speaking: `/speaking-exercise/${courseId}/${lesson.id}`,
      writing: `/writing-exercise/${courseId}/${lesson.id}`,
      reading: `/reading-exercise/${courseId}/${lesson.id}`,
      listening: `/listening-exercise/${courseId}/${lesson.id}`
    };

    if (routeMap[exerciseType]) {
      navigate(routeMap[exerciseType]);
    }
  };

  // Get lesson status
  const getLessonStatus = (lessonId) => {
    return completedLessons[lessonId] ? 'completed' : 'available';
  };

  // Get lesson score
  const getLessonScore = (lessonId) => {
    return completedLessons[lessonId]?.score || null;
  };

  if (!courseData) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="course-lessons-page">
      {/* Header */}
      <div className="course-lessons-header">
        <div className="header-left">
          <button
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>

        <div className="course-info">
          <h1 className="course-title">{courseData.title}</h1>
          <p className="course-description">{courseData.description}</p>
        </div>

        <div className="header-right">
          <div className="progress-info">
            <span>{courseData.completedLessons}/{courseData.totalLessons} bài học</span>
          </div>
        </div>
      </div>

      {/* Course Progress */}
      <div className="course-progress-section">
        <div className="progress-card">
          <div className="progress-header">
            <h3>Tiến độ khóa học</h3>
            <div className="progress-percentage">
              {Math.round((courseData.completedLessons / courseData.totalLessons) * 100)}%
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(courseData.completedLessons / courseData.totalLessons) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Units and Lessons */}
      <div className="units-section">
        {courseData.units.map(unit => (
          <div key={unit.id} className="unit-card">
            <div className="unit-header">
              <h3 className="unit-title">{unit.title}</h3>
              <div className="unit-stats">
                <span>{unit.lessons.length} bài học</span>
              </div>
            </div>

            <div className="lessons-list">
              {unit.lessons.map(lesson => {
                const status = getLessonStatus(lesson.id);
                const score = getLessonScore(lesson.id);

                return (
                  <div
                    key={lesson.id}
                    className={`lesson-item ${status}`}
                    onClick={() => handleLessonClick(lesson)}
                  >
                    <div className="lesson-icon">
                      {status === 'completed' ? (
                        <CheckCircle size={24} className="icon-completed" />
                      ) : (
                        <Circle size={24} className="icon-available" />
                      )}
                    </div>

                    <div className="lesson-content">
                      <div className="lesson-info">
                        <h4 className="lesson-title">{lesson.title}</h4>
                        <div className="lesson-meta">
                          <span className="lesson-type">{lesson.type}</span>
                          <span className="lesson-time">
                            <Clock size={14} />
                            {lesson.estimatedTime} phút
                          </span>
                          <span className="lesson-difficulty">{lesson.difficulty}</span>
                        </div>
                      </div>

                      <div className="lesson-actions">
                        {status === 'completed' && score && (
                          <div className="lesson-score">
                            <Award size={16} />
                            <span>{score}/100</span>
                          </div>
                        )}
                        <button className="lesson-play-btn">
                          <Play size={16} />
                          {status === 'completed' ? 'Làm lại' : 'Bắt đầu'}
                        </button>
                      </div>
                    </div>

                    <div className="lesson-arrow">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseLessons;
