import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './ProgressTimelineChart.css';

/**
 * Progress Timeline Chart Component
 * Displays progress over time as line chart
 */
const ProgressTimelineChart = ({ timelineData }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="progress-timeline-chart">
        <div className="no-data">Chưa có dữ liệu tiến bộ</div>
      </div>
    );
  }

  // Calculate chart dimensions
  const maxScore = 100;
  const minScore = 0;
  const chartHeight = 300;
  const chartWidth = 100; // percentage

  // Calculate points
  const points = timelineData.map((item, index) => {
    const x = (index / (timelineData.length - 1)) * chartWidth;
    const y = ((maxScore - item.average_score) / (maxScore - minScore)) * chartHeight;
    return { x, y, ...item };
  });

  // Create SVG path
  const linePath = points.map((point, i) => {
    const command = i === 0 ? 'M' : 'L';
    return `${command} ${point.x}% ${point.y}`;
  }).join(' ');

  // Create area path
  const areaPath = `${linePath} L ${points[points.length - 1].x}% ${chartHeight} L 0% ${chartHeight} Z`;

  return (
    <div className="progress-timeline-chart">
      <h3 className="chart-title">Tiến bộ theo thời gian</h3>
      
      <div className="chart-wrapper">
        {/* Y-axis labels */}
        <div className="y-axis">
          <span className="y-label">100%</span>
          <span className="y-label">75%</span>
          <span className="y-label">50%</span>
          <span className="y-label">25%</span>
          <span className="y-label">0%</span>
        </div>

        {/* Chart area */}
        <div className="chart-area">
          <svg className="chart-svg" viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100%" y2="0" className="grid-line" />
            <line x1="0" y1={chartHeight * 0.25} x2="100%" y2={chartHeight * 0.25} className="grid-line" />
            <line x1="0" y1={chartHeight * 0.5} x2="100%" y2={chartHeight * 0.5} className="grid-line" />
            <line x1="0" y1={chartHeight * 0.75} x2="100%" y2={chartHeight * 0.75} className="grid-line" />
            <line x1="0" y1={chartHeight} x2="100%" y2={chartHeight} className="grid-line" />

            {/* Area under line */}
            <path
              d={areaPath}
              className={`area-path ${animated ? 'animated' : ''}`}
              fill="url(#areaGradient)"
            />

            {/* Line */}
            <path
              d={linePath}
              className={`line-path ${animated ? 'animated' : ''}`}
              fill="none"
              stroke="#4472C4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={`${point.x}%`}
                  cy={point.y}
                  r="4"
                  className={`data-point ${animated ? 'animated' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                />
                <title>{`${point.period_label}: ${point.average_score.toFixed(1)}%`}</title>
              </g>
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4472C4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4472C4" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>

          {/* X-axis labels */}
          <div className="x-axis">
            {points.map((point, index) => (
              <div
                key={index}
                className="x-label"
                style={{ left: `${point.x}%` }}
                title={point.period_label}
              >
                {point.period_label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#4472C4' }}></span>
          <span>Điểm trung bình</span>
        </div>
      </div>
    </div>
  );
};

ProgressTimelineChart.propTypes = {
  timelineData: PropTypes.arrayOf(
    PropTypes.shape({
      period_label: PropTypes.string,
      average_score: PropTypes.number,
      snapshot_date: PropTypes.string
    })
  )
};

export default ProgressTimelineChart;

