/**
 * Take Exam Page - Student
 * Trang làm bài thi giữa kỳ/cuối kỳ cho học sinh
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import ExamViewer from '../../../components/ExamViewer';
import './TakeExam.css';

const TakeExam = () => {
  const { examId } = useParams();

  return (
    <div className="take-exam-page">
      <ExamViewer examId={parseInt(examId)} />
    </div>
  );
};

export default TakeExam;

