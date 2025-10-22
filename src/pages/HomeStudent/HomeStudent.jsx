import React from 'react';
import './HomeStudent.css';
import Header from '../../components/Home/Header/Header';
import Hero from '../../components/Home/Hero/Hero';
import CourseGrid from '../../components/Home/CourseGrid/CourseGrid';
import FunEnglish from '../../components/Home/FunEnglish/FunEnglish';
import QAForum from '../../components/Home/QAForum/QAForum';
import NewsEvents from '../../components/Home/NewsEvents/NewsEvents';
import Teachers from '../../components/Home/Teachers/Teachers';
import Footer from '../../components/Home/Footer/Footer';

const HomeStudent = () => {
  return (
    <div className="home-student-page">
      <Header />
      <main>
        <Hero />
        <CourseGrid />
        <FunEnglish />
        <QAForum />
        <NewsEvents />
        <Teachers />
      </main>
      <Footer />
    </div>
  );
};

export default HomeStudent;