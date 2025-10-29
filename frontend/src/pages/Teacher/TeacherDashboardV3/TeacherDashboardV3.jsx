import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClassManagement from './components/ClassManagement';
import CoursesManagement from '../CoursesManagement/CoursesManagement';
import QuestionBank from './components/QuestionBankV2';
import ExercisesTests from './components/ExercisesTests';
import ExerciseManagement from './components/ExerciseManagement/ExerciseManagementV2';
import GradingFeedback from './components/GradingFeedback';
import Statistics from './components/Statistics';
import Materials from './components/Materials';
import Messages from './components/Messages';
import Settings from './components/Settings';
import NewsArticles from './components/NewsArticles';
import OnlineTeaching from './components/OnlineTeaching';
import Schedule from './components/Schedule';
import MyClassesTeacher from './components/MyClassesTeacher';
import WorksheetGenerator from './components/WorksheetGenerator';
import StudentAnalytics from './components/StudentAnalytics';
import SupportGroups from './components/SupportGroups';
import ProgressAnalytics from './components/ProgressAnalytics';
import ExportReports from './components/ExportReports';
import LessonPlans from '../LessonPlans/LessonPlans';
import Worksheets from '../Worksheets/Worksheets';
import WeeklyAssessments from '../WeeklyAssessments/WeeklyAssessments';
import ErrorAnalysisExport from '../ErrorAnalysis/ErrorAnalysisExport';
import Navbar from '../../../components/Navbar/Navbar';
import authService from '../../../services/authService';
import './TeacherDashboardV3.css';
import './components/common.css';
import './components/enhanced-ui.css';

const TeacherDashboardV3 = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      authService.logout();
      navigate('/');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'class-management':
        return <ClassManagement />;
      case 'courses':
        return <CoursesManagement />;
      case 'question-bank':
        return <QuestionBank />;
      case 'news-articles':
        return <NewsArticles />;
      case 'exercises-tests':
        return <ExerciseManagement />;
      case 'grading-feedback':
        return <GradingFeedback />;
      case 'weekly-assessments':
        return <WeeklyAssessments />;
      case 'error-analysis':
        return <ErrorAnalysisExport />;
      case 'worksheet-generator':
        return <WorksheetGenerator />;
      case 'lesson-plans':
        return <LessonPlans />;
      case 'worksheets':
        return <Worksheets />;
      case 'student-analytics':
        return <StudentAnalytics />;
      case 'support-groups':
        return <SupportGroups />;
      case 'statistics':
        return <Statistics />;
      case 'export-reports':
        return <ExportReports />;
      case 'materials':
        return <Materials />;
      case 'online-teaching':
        return <OnlineTeaching />;
      case 'schedule':
        return <Schedule />;
      case 'messages':
        return <Messages />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Navbar userRole="teacher" isLoggedIn={true} onLogout={handleLogout} />
      <div className="teacher-dashboard-v3">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <div className="dashboard-main">
          {renderPage()}
        </div>
      </div>
    </>
  );
};

export default TeacherDashboardV3;

