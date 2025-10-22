import React from 'react';
import './HomeStudent.css';
import Hero from '../../components/Home/Hero/Hero';
import CourseGrid from '../../components/Home/CourseGrid/CourseGrid';
import QAForum from '../../components/Home/QAForum/QAForum';
import NewsEvents from '../../components/Home/NewsEvents/NewsEvents';
import Footer from '../../components/Home/Footer/Footer';

const HomeStudent = () => {
  return (
    <div className="home-student-page">
      <main>
        <div className="fade-in">
          <Hero />
        </div>
        <div className="slide-up">
          <CourseGrid />
        </div>
        <div className="fade-in">
          <QAForum />
        </div>
        <div className="slide-up">
          <NewsEvents />
        </div>
      </main>
      <div className="fade-in">
        <Footer />
      </div>
    </div>
  );
};

export default HomeStudent;