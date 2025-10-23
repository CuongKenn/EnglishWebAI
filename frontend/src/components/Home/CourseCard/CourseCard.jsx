import React from 'react';
import './CourseCard.css';

const CourseCard = ({ title, icon, color = 'blue', subjects }) => {
  return (
    <div className={`course-card course-card-${color}`}>
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <ul className="subject-list">
        {subjects.map((subject, index) => (
          <li key={index}>
            <a href={subject.link}>
              <i className="fas fa-book"></i>
              <span className="subject-name">{subject.name}</span>
            </a>
            <span className="course-count">
              {subject.courses} <i className="fas fa-chevron-right"></i>
            </span>
          </li>
        ))}
      </ul>
      <div className="card-footer">
        <button className="view-all-btn">
          <i className="fas fa-arrow-right"></i>
          Xem tất cả
        </button>
      </div>
    </div>
  );
};

export default CourseCard;