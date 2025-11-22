import React from 'react';
import './Teachers.css';

const Teachers = () => {
  const teachers = [
    {
      id: 1,
      name: 'Ms. Sarah Johnson',
      title: 'Senior English Teacher',
      specialization: 'IELTS & Academic Writing',
      experience: '10+ years',
      students: 500,
      rating: 4.9,
      avatar: '👩‍🏫',
      color: 'blue'
    },
    {
      id: 2,
      name: 'Mr. David Smith',
      title: 'Grammar Specialist',
      specialization: 'English Grammar & Speaking',
      experience: '8+ years',
      students: 450,
      rating: 4.8,
      avatar: '👨‍🏫',
      color: 'purple'
    },
    {
      id: 3,
      name: 'Ms. Emily Brown',
      title: 'Kids English Expert',
      specialization: 'Primary English Education',
      experience: '12+ years',
      students: 600,
      rating: 5.0,
      avatar: '👩‍🎓',
      color: 'pink'
    },
    {
      id: 4,
      name: 'Mr. Michael Lee',
      title: 'Pronunciation Coach',
      specialization: 'Phonics & Listening Skills',
      experience: '7+ years',
      students: 380,
      rating: 4.7,
      avatar: '👨‍💼',
      color: 'green'
    }
  ];

  return (
    <section className="teachers-section">
      <div className="section-header">
        <div className="header-badge badge-purple">
          <span className="badge-icon">👨‍🏫</span>
          <span className="badge-text">Expert Teachers</span>
        </div>
        <h2 className="section-title">Giáo viên</h2>
        <p className="section-subtitle">
          Đội ngũ giáo viên giàu kinh nghiệm, tận tâm và chuyên nghiệp
        </p>
      </div>

      <div className="teachers-grid">
        {teachers.map((teacher) => (
          <div key={teacher.id} className={`teacher-card teacher-card-${teacher.color}`}>
            <div className="teacher-avatar">
              <span className="avatar-emoji">{teacher.avatar}</span>
              <div className="rating-badge">
                <i className="fas fa-star"></i>
                {teacher.rating}
              </div>
            </div>
            <div className="teacher-info">
              <h3>{teacher.name}</h3>
              <p className="teacher-title">{teacher.title}</p>
              <p className="teacher-specialization">
                <i className="fas fa-graduation-cap"></i>
                {teacher.specialization}
              </p>
              <div className="teacher-stats">
                <div className="stat">
                  <i className="fas fa-clock"></i>
                  <span>{teacher.experience}</span>
                </div>
                <div className="stat">
                  <i className="fas fa-users"></i>
                  <span>{teacher.students}+ students</span>
                </div>
              </div>
              <button className="contact-teacher-btn">
                <i className="fas fa-paper-plane"></i>
                Liên hệ
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="view-all-container">
        <button className="view-all-large-btn">
          <span>Xem tất cả giáo viên</span>
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </section>
  );
};

export default Teachers;

