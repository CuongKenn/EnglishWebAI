import React from 'react';
import { BookOpen, Users, TrendingUp, Award } from 'lucide-react';

/**
 * CourseStats Component
 * Displays statistics cards for courses overview
 */
const CourseStats = ({ stats }) => {
  const statsConfig = [
    {
      icon: BookOpen,
      label: 'Tổng khóa học',
      value: stats.total,
      color: '#3b82f6',
    },
    {
      icon: Users,
      label: 'Đang hoạt động',
      value: stats.active,
      color: '#10b981',
    },
    {
      icon: TrendingUp,
      label: 'Hoàn thành',
      value: stats.completed,
      color: '#8b5cf6',
    },
    {
      icon: Award,
      label: 'Tổng bài học',
      value: stats.totalStudents,
      color: '#f97316',
    },
  ];

  return (
    <div className="stats-grid">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
              <Icon size={24} style={{ color: stat.color }} />
            </div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(CourseStats);
