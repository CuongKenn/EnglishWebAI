import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Zap, RefreshCw, Calendar } from 'lucide-react';
import aiSettingsService from '../../../services/aiSettingsService';
import './AIAnalytics.css';

const AIAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    let currentStats = aiSettingsService.getUsageStats();
    
    // Nếu chưa có data, generate mock data
    if (currentStats.totalRequests === 0) {
      currentStats = aiSettingsService.generateMockStats();
    }
    
    setStats(currentStats);
  };

  const handleRefresh = () => {
    const newStats = aiSettingsService.generateMockStats();
    setStats(newStats);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getFeaturePercentage = (count) => {
    if (!stats || stats.totalRequests === 0) return 0;
    return ((count / stats.totalRequests) * 100).toFixed(1);
  };

  const features = [
    { id: 'translate', name: 'Dịch bằng AI', icon: '🌐', color: 'blue' },
    { id: 'conversation', name: 'Conversation AI', icon: '💬', color: 'purple' },
    { id: 'listening', name: 'Luyện nghe AI', icon: '🎧', color: 'green' },
    { id: 'writing', name: 'Luyện viết AI', icon: '✍️', color: 'orange' },
    { id: 'reading', name: 'Luyện đọc AI', icon: '📖', color: 'indigo' },
    { id: 'flashcard', name: 'Flashcard AI', icon: '🎴', color: 'pink' },
  ];

  if (!stats) return <div>Đang tải...</div>;

  // Calculate growth (mock)
  const growth = 12.5;
  const avgDaily = Math.floor(stats.totalRequests / 30);

  return (
    <div className="ai-analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">
            <BarChart3 className="title-icon" />
            AI Analytics Dashboard
          </h1>
          <p className="analytics-subtitle">
            Theo dõi usage và hiệu suất của các tính năng AI
          </p>
        </div>
        <div className="header-actions">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">90 ngày qua</option>
          </select>
          <button className="refresh-button" onClick={handleRefresh}>
            <RefreshCw size={18} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon-wrapper gradient-blue">
            <Zap size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tổng Requests</div>
            <div className="stat-value">{formatNumber(stats.totalRequests)}</div>
            <div className="stat-trend positive">
              <TrendingUp size={16} />
              +{growth}% so với tháng trước
            </div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon-wrapper gradient-green">
            <Users size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{stats.activeUsers}</div>
            <div className="stat-trend positive">
              <TrendingUp size={16} />
              +8.2% so với tuần trước
            </div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon-wrapper gradient-orange">
            <Calendar size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Trung bình/Ngày</div>
            <div className="stat-value">{formatNumber(avgDaily)}</div>
            <div className="stat-trend neutral">
              Ổn định trong tuần qua
            </div>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon-wrapper gradient-purple">
            <BarChart3 size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tính năng phổ biến nhất</div>
            <div className="stat-value-text">Dịch AI 🌐</div>
            <div className="stat-trend neutral">
              {getFeaturePercentage(stats.requestsByFeature.translate)}% tổng usage
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Usage by Feature */}
        <div className="chart-card">
          <h3 className="chart-title">Usage theo tính năng</h3>
          <div className="feature-bars">
            {features.map((feature) => {
              const count = stats.requestsByFeature[feature.id] || 0;
              const percentage = getFeaturePercentage(count);
              
              return (
                <div key={feature.id} className="feature-bar-item">
                  <div className="feature-bar-header">
                    <div className="feature-bar-label">
                      <span className="feature-icon">{feature.icon}</span>
                      <span>{feature.name}</span>
                    </div>
                    <div className="feature-bar-value">
                      {formatNumber(count)}
                      <span className="feature-bar-percentage">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill gradient-${feature.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Usage Trend */}
        <div className="chart-card">
          <h3 className="chart-title">Xu hướng 30 ngày qua</h3>
          <div className="trend-chart">
            {stats.requestsByDay.slice(-30).map((day, index) => {
              const maxCount = Math.max(...stats.requestsByDay.map(d => d.count));
              const heightPercentage = (day.count / maxCount) * 100;
              
              return (
                <div key={index} className="trend-bar-wrapper">
                  <div 
                    className="trend-bar"
                    style={{ height: `${heightPercentage}%` }}
                    title={`${day.date}: ${day.count} requests`}
                  >
                    <div className="trend-bar-fill gradient-purple"></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="trend-legend">
            <span>{stats.requestsByDay[0]?.date}</span>
            <span>{stats.requestsByDay[stats.requestsByDay.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* Feature Details Table */}
      <div className="details-card">
        <h3 className="details-title">Chi tiết sử dụng theo tính năng</h3>
        <div className="details-table-wrapper">
          <table className="details-table">
            <thead>
              <tr>
                <th>Tính năng</th>
                <th>Tổng Requests</th>
                <th>% Tổng</th>
                <th>Trung bình/Ngày</th>
                <th>Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => {
                const count = stats.requestsByFeature[feature.id] || 0;
                const percentage = getFeaturePercentage(count);
                const avgPerDay = Math.floor(count / 30);
                const trendValue = Math.random() > 0.5 ? 'up' : 'down';
                
                return (
                  <tr key={feature.id}>
                    <td>
                      <div className="table-feature">
                        <span className="feature-icon">{feature.icon}</span>
                        <span>{feature.name}</span>
                      </div>
                    </td>
                    <td className="table-number">{formatNumber(count)}</td>
                    <td>
                      <span className="percentage-badge">{percentage}%</span>
                    </td>
                    <td className="table-number">{formatNumber(avgPerDay)}</td>
                    <td>
                      <span className={`trend-badge trend-${trendValue}`}>
                        {trendValue === 'up' ? '↑' : '↓'}
                        {(Math.random() * 20 + 5).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="analytics-footer">
        <div className="info-box">
          <span className="info-icon">💡</span>
          <div>
            <strong>Lưu ý:</strong> Đây là dữ liệu mock để demo. 
            Trong production, dữ liệu sẽ được lấy từ backend API và cơ sở dữ liệu thực tế.
          </div>
        </div>
        <div className="last-update-info">
          Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
        </div>
      </div>
    </div>
  );
};

export default AIAnalytics;

