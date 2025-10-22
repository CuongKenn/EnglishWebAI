import React from 'react';
import './HomeStudent.css'; // <-- THÊM DÒNG NÀY
import Header from '../../components/Home/Header/Header';
import Hero from '../../components/Home/Hero/Hero';
import CourseGrid from '../../components/Home/CourseGrid/CourseGrid';

const HomeStudent = () => {
  return (
    <div className="home-student-page">
      <Header />
      <main>
        <Hero />
        <CourseGrid />
      </main>
    </div>
  );
};

export default HomeStudent;