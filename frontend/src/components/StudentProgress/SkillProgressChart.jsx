import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './SkillProgressChart.css';

/**
 * Skill Progress Chart Component
 * Displays skill scores as animated bar chart
 */
const SkillProgressChart = ({ skillScores, showLabels = true }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const skills = [
    { key: 'reading', label: 'Đọc (Reading)', color: '#4472C4' },
    { key: 'writing', label: 'Viết (Writing)', color: '#ED7D31' },
    { key: 'listening', label: 'Nghe (Listening)', color: '#A5A5A5' },
    { key: 'speaking', label: 'Nói (Speaking)', color: '#FFC000' }
  ];

  const getScoreLevel = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'very-good';
    if (score >= 70) return 'good';
    if (score >= 60) return 'average';
    return 'need-improvement';
  };

  return (
    <div className="skill-progress-chart">
      <div className="chart-container">
        {skills.map((skill) => {
          const score = skillScores[skill.key] || 0;
          const scoreLevel = getScoreLevel(score);
          
          return (
            <div key={skill.key} className="skill-bar-wrapper">
              {showLabels && (
                <div className="skill-label">{skill.label}</div>
              )}
              <div className="skill-bar-container">
                <div
                  className={`skill-bar ${animated ? 'animated' : ''} ${scoreLevel}`}
                  style={{
                    width: animated ? `${score}%` : '0%',
                    backgroundColor: skill.color,
                    transition: 'width 1s ease-out'
                  }}
                >
                  <span className="skill-score">{score.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

SkillProgressChart.propTypes = {
  skillScores: PropTypes.shape({
    reading: PropTypes.number,
    writing: PropTypes.number,
    listening: PropTypes.number,
    speaking: PropTypes.number
  }).isRequired,
  showLabels: PropTypes.bool
};

export default SkillProgressChart;

