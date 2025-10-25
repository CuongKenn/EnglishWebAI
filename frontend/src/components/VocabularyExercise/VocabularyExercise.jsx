import React, { useState, useEffect } from 'react';
import './VocabularyExercise.css';

const VocabularyExercise = ({ 
  exercise, 
  onAnswerChange, 
  onComplete, 
  userAnswers = {}, 
  showAnswers = false,
  isSubmitted = false 
}) => {
  const [currentPart, setCurrentPart] = useState(0);
  const [partAnswers, setPartAnswers] = useState({});
  const [animations, setAnimations] = useState({});

  useEffect(() => {
    // Initialize part answers from userAnswers prop
    const initialAnswers = {};
    exercise.parts.forEach((part, index) => {
      const answerKey = `${exercise.id}-${part.id}`;
      initialAnswers[part.id] = userAnswers[answerKey] || '';
    });
    setPartAnswers(initialAnswers);
  }, [exercise, userAnswers]);

  const handleAnswerChange = (partId, answer) => {
    const newAnswers = {
      ...partAnswers,
      [partId]: answer
    };
    setPartAnswers(newAnswers);
    
    // Notify parent component
    if (onAnswerChange) {
      const answerKey = `${exercise.id}-${partId}`;
      onAnswerChange(answerKey, answer);
    }
  };

  const handlePartSubmit = (partId) => {
    // Add animation for part completion
    setAnimations(prev => ({
      ...prev,
      [partId]: 'success'
    }));

    // Move to next part or complete exercise
    if (currentPart < exercise.parts.length - 1) {
      setTimeout(() => {
        setCurrentPart(prev => prev + 1);
      }, 1000);
    } else {
      // All parts completed
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    }
  };

  const getAnswerForPart = (partId) => {
    return partAnswers[partId] || '';
  };

  const isAnswerCorrect = (partId) => {
    const userAnswer = partAnswers[partId];
    const part = exercise.parts.find(p => p.id === partId);
    return userAnswer.toLowerCase().trim() === part?.correctAnswer.toLowerCase().trim();
  };

  const calculateScore = () => {
    let correctCount = 0;
    exercise.parts.forEach(part => {
      if (isAnswerCorrect(part.id)) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const renderSentence = (sentence, partId) => {
    return sentence.split('_____').map((text, index) => (
      <React.Fragment key={index}>
        {text}
        {index < sentence.split('_____').length - 1 && (
          <input
            type="text"
            className={`blank-input ${
              showAnswers && isAnswerCorrect(partId) ? 'correct' : 
              showAnswers && !isAnswerCorrect(partId) ? 'incorrect' : ''
            } ${animations[partId] ? `animate-${animations[partId]}` : ''}`}
            value={getAnswerForPart(partId)}
            onChange={(e) => handleAnswerChange(partId, e.target.value)}
            disabled={showAnswers || isSubmitted}
            placeholder="____"
            autoComplete="off"
            spellCheck="false"
          />
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="vocabulary-exercise">
      <div className="exercise-header">
        <h2 className="exercise-title">{exercise.title}</h2>
        {showAnswers && (
          <div className="score-display">
            <span className="score-text">Điểm: </span>
            <span className="score-value">
              {calculateScore()}/{exercise.parts.length}
            </span>
          </div>
        )}
      </div>

      <div className="exercise-parts">
        {exercise.parts.map((part, partIndex) => (
          <div 
            key={part.id} 
            className={`exercise-part ${currentPart === partIndex ? 'active' : ''} ${
              partIndex < currentPart ? 'completed' : ''
            }`}
          >
            <div className="part-header">
              <span className="part-label">Phần {String.fromCharCode(97 + partIndex)}</span>
              {partIndex < currentPart && (
                <span className="completed-icon">✓</span>
              )}
            </div>

            <div className="part-sentences">
              {part.sentences.map((sentence, sentenceIndex) => (
                <div key={sentenceIndex} className="sentence">
                  {renderSentence(sentence, part.id)}
                </div>
              ))}
            </div>

            {showAnswers && (
              <div className="answer-reveal">
                <div className="answer-content">
                  <span className="answer-label">⇒ Từ cần điền:</span>
                  <div className="answer-display">
                    <span className="answer-number">{partIndex + 1}</span>
                    <span className="answer-word">{part.correctAnswer}</span>
                  </div>
                </div>
                <div className="answer-feedback">
                  {isAnswerCorrect(part.id) ? (
                    <span className="correct-feedback">Chính xác! 🎉</span>
                  ) : (
                    <span className="incorrect-feedback">
                      Sai rồi! Đáp án đúng là "{part.correctAnswer}"
                    </span>
                  )}
                </div>
              </div>
            )}

            {!showAnswers && currentPart === partIndex && (
              <div className="part-actions">
                <button
                  className="part-submit-btn"
                  onClick={() => handlePartSubmit(part.id)}
                  disabled={!getAnswerForPart(part.id).trim()}
                >
                  Kiểm tra phần {String.fromCharCode(97 + partIndex)}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAnswers && (
        <div className="exercise-summary">
          <div className="summary-content">
            <h3>Kết quả bài tập</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Điểm số:</span>
                <span className="stat-value">{calculateScore()}/{exercise.parts.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tỷ lệ đúng:</span>
                <span className="stat-value">
                  {Math.round((calculateScore() / exercise.parts.length) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyExercise;
