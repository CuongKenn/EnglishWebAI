import React from 'react';
import CourseCard from '../CourseCard/CourseCard';
import './CourseGrid.css';

// Dữ liệu mẫu cho các lớp học
const courseData = [
 
  {
    title: 'Lớp 1',
    subjects: [
      { name: 'Toán', courses: 3, link: '#' },
      { name: 'Tiếng Việt', courses: 3, link: '#' },
      { name: 'Tiếng Anh', courses: 3, link: '#' },
      { name: 'Các môn khác', courses: 0, link: '#' },
    ],
  },
   {
    title: 'Lớp 2',
    subjects: [
      { name: 'Toán', courses: 3, link: '#' },
      { name: 'Tiếng Việt', courses: 3, link: '#' },
      { name: 'Tiếng Anh', courses: 3, link: '#' },
      { name: 'Các môn khác', courses: 1, link: '#' },
    ],
  },
  // Thêm dữ liệu cho các lớp khác... Lớp 3, 4, 5...
];

const CourseGrid = () => {
  return (
    <div className="course-grid-container">
      <h2 className="grid-title">Các lớp học Toán, Tiếng Việt, Tiếng Anh, Ngữ Văn,...</h2>
      <p className="grid-subtitle">
        Learn App có đầy đủ các lớp học từ mẫu giáo đến lớp 12 cho nhiều bộ sách Cánh diều, Chân trời sáng tạo, Kết nối tri thức với cuộc sống,...
      </p>
      <div className="grid">
        {courseData.map((course, index) => (
          <CourseCard key={index} title={course.title} subjects={course.subjects} />
        ))}
      </div>
    </div>
  );
};

export default CourseGrid;