import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VocabularyExercise from '../../components/VocabularyExercise/VocabularyExercise';
import './VocabularyCourse.css';

const VocabularyCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [exerciseProgress, setExerciseProgress] = useState({});

  // Mock data - trong thực tế sẽ fetch từ API
  const courseData = {
    id: courseId,
    title: "Khóa học từ vựng tiếng Anh",
    sections: [
      {
        id: 1,
        title: "Ngoại hình",
        exercises: [
          {
            id: 1,
            title: "Exercise 8. Chọn 1 từ thích hợp để điền vào chỗ trống trong mỗi 3 câu sau.",
            parts: [
              {
                id: 'a',
                sentences: [
                  "Please turn the _____ off when you leave the room.",
                  "She changed her hair color from _____ to dark in only three days.",
                  "I'd love a room with good natural _____."
                ],
                correctAnswer: "light",
                userAnswer: ""
              },
              {
                id: 'b',
                sentences: [
                  "Kareem always bragged about how _____ he was until he failed the final exam.",
                  "Peter looks very _____ in his new suit, doesn't he?",
                  "I need a _____ jacket for my interview."
                ],
                correctAnswer: "smart",
                userAnswer: ""
              },
              {
                id: 'c',
                sentences: [
                  "They are able to offer _____ career opportunities for fresh graduates.",
                  "I find men look more _____ as they age.",
                  "I thought Julia Roberts was the most _____ woman I'd ever seen."
                ],
                correctAnswer: "attractive",
                userAnswer: ""
              }
            ]
          }
        ]
      }
    ]
  };

  const currentSectionData = courseData.sections[currentSection];
  const currentExerciseData = currentSectionData?.exercises[currentExercise];

  useEffect(() => {
    // Calculate score when answers are shown
    if (showAnswers) {
      let correctCount = 0;
      currentExerciseData?.parts.forEach((part, index) => {
        if (userAnswers[`${currentSection}-${currentExercise}-${part.id}`] === part.correctAnswer) {
          correctCount++;
        }
      });
      setScore(correctCount);
    }
  }, [showAnswers, userAnswers, currentExerciseData]);

  const handleAnswerChange = (answerKey, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [answerKey]: answer
    }));
  };

  const handleExerciseComplete = () => {
    setShowAnswers(true);
    setIsSubmitted(true);
  };

  const handleSubmit = () => {
    setShowAnswers(true);
    setIsSubmitted(true);
  };

  const handleNextExercise = () => {
    if (currentExercise < currentSectionData.exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setShowAnswers(false);
      setIsSubmitted(false);
    } else {
      // Move to next section or complete course
      if (currentSection < courseData.sections.length - 1) {
        setCurrentSection(prev => prev + 1);
        setCurrentExercise(0);
        setShowAnswers(false);
        setIsSubmitted(false);
      } else {
        // Course completed
        alert('Chúc mừng! Bạn đã hoàn thành khóa học!');
      }
    }
  };

  const getAnswerForPart = (partId) => {
    const answerKey = `${currentSection}-${currentExercise}-${partId}`;
    return userAnswers[answerKey] || '';
  };

  const isAnswerCorrect = (partId) => {
    const answerKey = `${currentSection}-${currentExercise}-${partId}`;
    const userAnswer = userAnswers[answerKey];
    const part = currentExerciseData?.parts.find(p => p.id === partId);
    return userAnswer === part?.correctAnswer;
  };

  return (
    <div className="vocabulary-course">
      <div className="course-container">
        {/* Header */}
        <div className="course-header">
          <div className="header-left">
            <button 
              className="submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitted}
            >
              <span className="check-icon">✓</span>
              <span>Đạt</span>
            </button>
          </div>
          
          <div className="header-center">
            <h1 className="section-title">
              Section {currentSection + 1}: {currentSectionData?.title}
            </h1>
          </div>
          
          <div className="header-right">
            <div className="score-display">
              <div className="score-label">Số Questions đúng</div>
              <div className="score-value">
                {showAnswers ? `${score}/${currentExerciseData?.parts.length}` : '0/0'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="exercise-content">
          {currentExerciseData && (
            <VocabularyExercise
              exercise={currentExerciseData}
              onAnswerChange={handleAnswerChange}
              onComplete={handleExerciseComplete}
              userAnswers={userAnswers}
              showAnswers={showAnswers}
              isSubmitted={isSubmitted}
            />
          )}

          {showAnswers && (
            <div className="exercise-actions">
              <button 
                className="next-btn"
                onClick={handleNextExercise}
              >
                {currentExercise < currentSectionData.exercises.length - 1 ? 'Bài tiếp theo' : 
                 currentSection < courseData.sections.length - 1 ? 'Phần tiếp theo' : 'Hoàn thành'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyCourse;
