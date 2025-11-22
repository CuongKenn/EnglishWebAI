import React from 'react';
import CourseCard from '../CourseCard/CourseCard';
import './CourseGrid.css';

// Dữ liệu mẫu cho các cấp độ tiếng Anh từ mẫu giáo đến lớp 12
const courseData = [
  {
    title: 'Mẫu giáo',
    icon: '🧸',
    color: 'pink',
    subjects: [
      { name: 'ABC Songs', courses: 10, link: '#' },
      { name: 'Colors & Numbers', courses: 8, link: '#' },
      { name: 'Simple Words', courses: 12, link: '#' },
      { name: 'Fun Games', courses: 15, link: '#' },
    ],
  },
  {
    title: 'Lớp 1',
    icon: '🌈',
    color: 'yellow',
    subjects: [
      { name: 'Alphabet & Phonics', courses: 15, link: '#' },
      { name: 'Basic Vocabulary', courses: 18, link: '#' },
      { name: 'Simple Sentences', courses: 12, link: '#' },
      { name: 'Songs & Stories', courses: 10, link: '#' },
    ],
  },
  {
    title: 'Lớp 2',
    icon: '🎨',
    color: 'orange',
    subjects: [
      { name: 'Reading Practice', courses: 16, link: '#' },
      { name: 'Vocabulary Builder', courses: 20, link: '#' },
      { name: 'Grammar Basics', courses: 14, link: '#' },
      { name: 'Speaking Skills', courses: 12, link: '#' },
    ],
  },
  {
    title: 'Lớp 3',
    icon: '📚',
    color: 'blue',
    subjects: [
      { name: 'Grammar Foundation', courses: 18, link: '#' },
      { name: 'Reading Comprehension', courses: 16, link: '#' },
      { name: 'Writing Skills', courses: 14, link: '#' },
      { name: 'Listening Practice', courses: 12, link: '#' },
    ],
  },
  {
    title: 'Lớp 4',
    icon: '✏️',
    color: 'green',
    subjects: [
      { name: 'Grammar Essentials', courses: 20, link: '#' },
      { name: 'Reading Skills', courses: 18, link: '#' },
      { name: 'Creative Writing', courses: 15, link: '#' },
      { name: 'Speaking Fluency', courses: 16, link: '#' },
    ],
  },
  {
    title: 'Lớp 5',
    icon: '🎯',
    color: 'purple',
    subjects: [
      { name: 'Advanced Grammar', courses: 22, link: '#' },
      { name: 'Essay Writing', courses: 18, link: '#' },
      { name: 'Conversation', courses: 20, link: '#' },
      { name: 'Listening Skills', courses: 16, link: '#' },
    ],
  },
  {
    title: 'Lớp 6',
    icon: '📖',
    color: 'pink',
    subjects: [
      { name: 'Grammar Mastery', courses: 24, link: '#' },
      { name: 'Reading Analysis', courses: 20, link: '#' },
      { name: 'Writing Techniques', courses: 18, link: '#' },
      { name: 'Oral Practice', courses: 16, link: '#' },
    ],
  },
  {
    title: 'Lớp 7',
    icon: '🚀',
    color: 'blue',
    subjects: [
      { name: 'Complex Grammar', courses: 25, link: '#' },
      { name: 'Literature Reading', courses: 22, link: '#' },
      { name: 'Essay Composition', courses: 20, link: '#' },
      { name: 'Debate Skills', courses: 18, link: '#' },
    ],
  },
  {
    title: 'Lớp 8',
    icon: '⚡',
    color: 'orange',
    subjects: [
      { name: 'Advanced Tenses', courses: 26, link: '#' },
      { name: 'Critical Reading', courses: 24, link: '#' },
      { name: 'Academic Writing', courses: 22, link: '#' },
      { name: 'Presentation Skills', courses: 20, link: '#' },
    ],
  },
  {
    title: 'Lớp 9',
    icon: '🎓',
    color: 'green',
    subjects: [
      { name: 'Grammar Expert', courses: 28, link: '#' },
      { name: 'Advanced Reading', courses: 26, link: '#' },
      { name: 'Research Writing', courses: 24, link: '#' },
      { name: 'Public Speaking', courses: 22, link: '#' },
    ],
  },
  {
    title: 'Lớp 10',
    icon: '🏆',
    color: 'purple',
    subjects: [
      { name: 'IELTS Foundation', courses: 30, link: '#' },
      { name: 'Academic English', courses: 28, link: '#' },
      { name: 'Essay Writing', courses: 26, link: '#' },
      { name: 'Listening Advanced', courses: 24, link: '#' },
    ],
  },
  {
    title: 'Lớp 11',
    icon: '💡',
    color: 'yellow',
    subjects: [
      { name: 'IELTS Intermediate', courses: 32, link: '#' },
      { name: 'Business English', courses: 30, link: '#' },
      { name: 'Advanced Writing', courses: 28, link: '#' },
      { name: 'Fluency Training', courses: 26, link: '#' },
    ],
  },
  {
    title: 'Lớp 12',
    icon: '🌟',
    color: 'blue',
    subjects: [
      { name: 'IELTS Advanced', courses: 35, link: '#' },
      { name: 'University Prep', courses: 32, link: '#' },
      { name: 'Professional Writing', courses: 30, link: '#' },
      { name: 'Exam Mastery', courses: 28, link: '#' },
    ],
  },
];

const CourseGrid = () => {
  return (
    <div className="course-grid-container">
      <div className="grid-header">
        <h2 className="grid-title">Khóa học Tiếng Anh AI</h2>
        <p className="grid-subtitle">
          Smart Learn cung cấp chương trình học tiếng Anh toàn diện từ lớp 1 đến lớp 12, 
          được thiết kế bởi đội ngũ giáo viên chuyên nghiệp và công nghệ AI hiện đại. 
          Mỗi khóa học được cá nhân hóa theo năng lực và tiến độ của từng học sinh.
        </p>
      </div>
      <div className="grid">
        {courseData.map((course, index) => {
          // Parse grade number from title 'Lớp X'
          let gradeNumber = null;
          const m = /Lớp\s+(\d+)/i.exec(course.title);
          if (m) gradeNumber = parseInt(m[1], 10);
          // Navigate to JoinClass page to show real classes filtered by grade
          const viewAllLink = gradeNumber ? `/join-class?grade=Lớp ${gradeNumber}` : '/join-class';
          return (
            <CourseCard 
              key={index} 
              title={course.title} 
              icon={course.icon}
              color={course.color}
              subjects={course.subjects}
              viewAllLink={viewAllLink}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CourseGrid;
