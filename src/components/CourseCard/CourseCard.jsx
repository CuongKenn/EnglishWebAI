import React from 'react';
import './CourseCard.css';

// Dữ liệu mẫu, sau này bạn có thể lấy từ API
const CourseCard = ({ title, subjects }) => {
  return (
    <div className="course-card">
      <h3>{title}</h3>
      <ul>
        {subjects.map((subject, index) => (
          <li key={index}>
            <a href={subject.link}>{subject.name}</a>
            <span>{subject.courses} khóa học &gt;&gt;</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseCard;