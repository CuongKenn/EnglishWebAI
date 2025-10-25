import React from 'react';
import { Link } from 'react-router-dom';
import './VocabularyTest.css';

const VocabularyTest = () => {
  return (
    <div className="vocabulary-test">
      <div className="test-container">
        <h1>🧪 Vocabulary Course Test Page</h1>
        <p>Trang test để kiểm tra routing cho khóa học từ vựng</p>
        
        <div className="test-links">
          <h2>Test Links:</h2>
          <ul>
            <li>
              <Link to="/vocabulary-demo" className="test-link">
                📚 Vocabulary Demo Page
              </Link>
            </li>
            <li>
              <Link to="/vocabulary/basic-vocabulary" className="test-link">
                🎯 Basic Vocabulary Course
              </Link>
            </li>
            <li>
              <Link to="/vocabulary/intermediate-vocabulary" className="test-link">
                🎯 Intermediate Vocabulary Course
              </Link>
            </li>
            <li>
              <Link to="/vocabulary/advanced-vocabulary" className="test-link">
                🎯 Advanced Vocabulary Course
              </Link>
            </li>
            <li>
              <Link to="/vocabulary/business-vocabulary" className="test-link">
                🎯 Business Vocabulary Course
              </Link>
            </li>
          </ul>
        </div>

        <div className="test-info">
          <h2>Thông tin test:</h2>
          <ul>
            <li>✅ VocabularyCourse component đã được tạo</li>
            <li>✅ VocabularyExercise component đã được tạo</li>
            <li>✅ Routing đã được thêm vào App.jsx</li>
            <li>✅ MyCourses routing đã được cập nhật</li>
            <li>✅ CSS styling đã hoàn thành</li>
          </ul>
        </div>

        <div className="test-instructions">
          <h2>Hướng dẫn test:</h2>
          <ol>
            <li>Click vào "Vocabulary Demo Page" để xem trang chọn khóa học</li>
            <li>Click vào các link khóa học cụ thể để test trang bài tập</li>
            <li>Kiểm tra giao diện và tính năng tương tác</li>
            <li>Test responsive design trên mobile</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default VocabularyTest;
