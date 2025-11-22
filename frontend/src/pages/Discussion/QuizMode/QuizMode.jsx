import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Clock, 
  Target, 
  Users, 
  Play, 
  SkipForward,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp
} from 'lucide-react';
import './QuizMode.css';
import { quizAPI } from '../../../services/api';

const QuizMode = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timer, setTimer] = useState(0);
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  useEffect(() => {
    fetchRooms();
  }, [filterTopic, filterDifficulty]);

  useEffect(() => {
    let interval;
    if (session && !quizCompleted && !answerSubmitted) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session, quizCompleted, answerSubmitted]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterTopic !== 'all') params.topic = filterTopic;
      if (filterDifficulty !== 'all') params.difficulty = filterDifficulty;
      
      const data = await quizAPI.getRooms(params);
      setRooms(data);
    } catch (error) {
      console.error('Error fetching quiz rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (room) => {
    try {
      setLoading(true);
      const roomDetail = await quizAPI.getRoom(room.id);
      setSelectedRoom(roomDetail);
      setQuestions(roomDetail.questions);
      
      const sessionData = await quizAPI.startSession(room.id);
      setSession(sessionData);
      setCurrentQuestionIndex(0);
      setTimer(0);
      setQuizCompleted(false);
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Không thể bắt đầu quiz. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || answerSubmitted) return;

    try {
      setLoading(true);
      const currentQuestion = questions[currentQuestionIndex];
      
      const result = await quizAPI.submitAnswer(session.id, {
        question_id: currentQuestion.id,
        student_answer: selectedAnswer,
        time_taken: timer
      });

      setAnswerSubmitted(true);
      setLastAnswerCorrect(result.is_correct);
      
      // Wait a bit to show result, then move to next
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer('');
          setAnswerSubmitted(false);
          setLastAnswerCorrect(null);
          setTimer(0);
        } else {
          completeQuiz();
        }
      }, 2000);
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Có lỗi xảy ra khi gửi câu trả lời!');
    } finally {
      setLoading(false);
    }
  };

  const completeQuiz = async () => {
    try {
      const completedSession = await quizAPI.completeSession(session.id);
      setSession(completedSession);
      setQuizCompleted(true);
      
      // Fetch leaderboard
      const leaderboardData = await quizAPI.getLeaderboard(selectedRoom.id);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const resetQuiz = () => {
    setSelectedRoom(null);
    setSession(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setAnswerSubmitted(false);
    setLastAnswerCorrect(null);
    setQuizCompleted(false);
    setTimer(0);
    fetchRooms();
  };

  if (loading && !session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (quizCompleted && session) {
    return (
      <div className="quiz-mode-container">
        <div className="quiz-playing-container">
          <div style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '40px',
            borderRadius: '20px',
            marginBottom: '24px'
          }}>
            <Award size={64} style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Hoàn thành Quiz!</h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
              {session.total_score} điểm
            </div>
            <div style={{ fontSize: '18px', opacity: 0.9 }}>
              {session.correct_answers}/{session.total_questions} câu đúng • {Math.floor(session.time_taken / 60)}:{(session.time_taken % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="leaderboard-container">
            <div className="leaderboard-title">
              <Trophy style={{ display: 'inline', marginRight: '8px' }} />
              Bảng Xếp Hạng
            </div>
            {leaderboard.map((entry, index) => (
              <div key={index} className="leaderboard-item" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="leaderboard-rank">
                  <span style={{ fontSize: '24px' }}>
                    {entry.rank === 1 && '🥇'}
                    {entry.rank === 2 && '🥈'}
                    {entry.rank === 3 && '🥉'}
                    {entry.rank > 3 && `#${entry.rank}`}
                  </span>
                  <span>{entry.student_name}</span>
                </div>
                <div className="leaderboard-score">
                  {entry.total_score} điểm
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button className="btn-quiz btn-quiz-primary" onClick={resetQuiz}>
              <Play size={20} />
              Chơi lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (session && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="quiz-mode-container">
        <div className="quiz-playing-container">
          <div className="quiz-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>{selectedRoom.title}</h3>
              <div className="quiz-timer">
                <Clock size={20} />
                <span>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Câu hỏi {currentQuestionIndex + 1}/{questions.length} • {session.total_score} điểm
            </div>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="quiz-question-card">
            <div className="question-text">
              {currentQuestion.question_text}
            </div>

            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <div className="quiz-options">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`quiz-option ${
                      selectedAnswer === option ? 'selected' : ''
                    } ${
                      answerSubmitted && option === currentQuestion.correct_answer ? 'correct' : ''
                    } ${
                      answerSubmitted && selectedAnswer === option && !lastAnswerCorrect ? 'incorrect' : ''
                    }`}
                    onClick={() => !answerSubmitted && setSelectedAnswer(option)}
                    disabled={answerSubmitted}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'fill_blank' && (
              <input
                type="text"
                className="quiz-fill-input"
                placeholder="Nhập câu trả lời của bạn..."
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={answerSubmitted}
              />
            )}

            {answerSubmitted && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '12px',
                background: lastAnswerCorrect ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                border: `2px solid ${lastAnswerCorrect ? '#28a745' : '#dc3545'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {lastAnswerCorrect ? <CheckCircle color="#28a745" size={24} /> : <XCircle color="#dc3545" size={24} />}
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {lastAnswerCorrect ? 'Chính xác!' : 'Sai rồi!'}
                  </div>
                  {!lastAnswerCorrect && (
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Đáp án đúng: {currentQuestion.correct_answer}
                    </div>
                  )}
                  {currentQuestion.explanation && (
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                      {currentQuestion.explanation}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="quiz-actions">
              <button className="btn-quiz btn-quiz-secondary" onClick={resetQuiz}>
                Thoát
              </button>
              {!answerSubmitted && (
                <button 
                  className="btn-quiz btn-quiz-primary" 
                  onClick={submitAnswer}
                  disabled={!selectedAnswer || loading}
                >
                  <CheckCircle size={20} />
                  Gửi câu trả lời
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-mode-container">
      <div className="section-header">
        <div className="section-title">
          <Trophy />
          Chế độ Solo - Thách thức bản thân
        </div>
      </div>

      <div className="quiz-filters">
        <select 
          className="filter-select" 
          value={filterTopic} 
          onChange={(e) => setFilterTopic(e.target.value)}
        >
          <option value="all">Tất cả chủ đề</option>
          <option value="grammar">Ngữ pháp</option>
          <option value="vocabulary">Từ vựng</option>
          <option value="listening">Nghe</option>
        </select>
        <select 
          className="filter-select" 
          value={filterDifficulty} 
          onChange={(e) => setFilterDifficulty(e.target.value)}
        >
          <option value="all">Tất cả độ khó</option>
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
      </div>

      {rooms.length === 0 ? (
        <div className="empty-state">
          <Trophy size={80} />
          <h3>Chưa có quiz nào</h3>
          <p>Hãy quay lại sau để tham gia các quiz thú vị!</p>
        </div>
      ) : (
        <div className="quiz-rooms-grid">
          {rooms.map((room) => (
            <div key={room.id} className="quiz-room-card" onClick={() => startQuiz(room)}>
              <div className="quiz-room-header">
                <h3 className="quiz-room-title">{room.title}</h3>
                <span className={`quiz-difficulty-badge difficulty-${room.difficulty}`}>
                  {room.difficulty === 'easy' && 'Dễ'}
                  {room.difficulty === 'medium' && 'TB'}
                  {room.difficulty === 'hard' && 'Khó'}
                </span>
              </div>
              {room.description && (
                <p className="quiz-room-description">{room.description}</p>
              )}
              <div className="quiz-room-meta">
                <div className="meta-item">
                  <Target />
                  <span>{room.total_questions} câu hỏi</span>
                </div>
                <div className="meta-item">
                  <Clock />
                  <span>{room.time_limit}s/câu</span>
                </div>
                <div className="meta-item">
                  <TrendingUp />
                  <span style={{ textTransform: 'capitalize' }}>{room.topic}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizMode;
