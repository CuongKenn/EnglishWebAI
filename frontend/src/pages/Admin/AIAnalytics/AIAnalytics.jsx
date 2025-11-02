import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, Zap, RefreshCw, Calendar, Globe, MessageCircle, Headphones, PenLine, BookOpen, CreditCard, Lightbulb } from 'lucide-react';
import { adminGetAIAnalytics } from '../../../services/adminService';
import './AIAnalytics.css';

const AIAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminGetAIAnalytics(timeRange);
      setStats(data);
    } catch (e) {
      setError('Không tải được dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const handleRefresh = () => fetchStats();

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return (num ?? 0).toString();
  };

  const getFeaturePercentage = (count) => {
    if (!stats || !stats.totalRequests) return 0;
    return ((count / stats.totalRequests) * 100).toFixed(1);
  };

  const features = [
    { id: 'translate', name: 'Dịch bằng AI', icon: <Globe className="inline-block w-5 h-5" />, color: 'blue' },
    { id: 'conversation', name: 'Conversation AI', icon: <MessageCircle className="inline-block w-5 h-5" />, color: 'purple' },
    { id: 'listening', name: 'Luyện nghe AI', icon: <Headphones className="inline-block w-5 h-5" />, color: 'green' },
    { id: 'writing', name: 'Luyện viết AI', icon: <PenLine className="inline-block w-5 h-5" />, color: 'orange' },
    { id: 'reading', name: 'Luyện đọc AI', icon: <BookOpen className="inline-block w-5 h-5" />, color: 'indigo' },
    { id: 'flashcard', name: 'Flashcard AI', icon: <CreditCard className="inline-block w-5 h-5" />, color: 'pink' },
  ];

  const days = useMemo(
    () => stats?.requestsByDay?.length || (timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30),
    [stats, timeRange]
  );

  const topFeature = useMemo(() => {
    if (!stats?.requestsByFeature || !stats.totalRequests) return null;
    const entries = Object.entries(stats.requestsByFeature);
    const [id, count] = entries.reduce((acc, cur) => (cur[1] > acc[1] ? cur : acc), entries[0]);
    return { id, count };
  }, [stats]);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;
  if (!stats) return <div>Không có dữ liệu.</div>;

  const avgDaily = Math.floor((stats.totalRequests || 0) / Math.max(1, days));

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
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon-wrapper gradient-green">
            <Users size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{stats.activeUsers}</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon-wrapper gradient-orange">
            <Calendar size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Trung bình/Ngày</div>
            <div className="stat-value">{formatNumber(avgDaily)}</div>
            <div className="stat-trend neutral">—</div>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon-wrapper gradient-purple">
            <BarChart3 size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tính năng phổ biến nhất</div>
            <div className="stat-value-text">
              {topFeature ? (features.find(f => f.id === topFeature.id)?.name || topFeature.id) : '—'}
            </div>
            <div className="stat-trend neutral">
              {topFeature ? `${getFeaturePercentage(topFeature.count)}% tổng usage` : '—'}
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
              const count = stats.requestsByFeature?.[feature.id] || 0;
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
                    <div className={`progress-fill gradient-${feature.color}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Usage Trend */}
        <div className="chart-card">
          <h3 className="chart-title">Xu hướng {days} ngày qua</h3>
          <div className="trend-chart">
            {(() => {
              const data = stats.requestsByDay || [];
              const maxCount = Math.max(1, ...data.map(d => d.count));
              return data.map((day, index) => {
                const heightPercentage = (day.count / maxCount) * 100;
                return (
                  <div key={index} className="trend-bar-wrapper">
                    <div className="trend-bar" style={{ height: `${heightPercentage}%` }} title={`${day.date}: ${day.count} requests`}>
                      <div className="trend-bar-fill gradient-purple"></div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          <div className="trend-legend">
            <span>{stats.requestsByDay?.[0]?.date}</span>
            <span>{stats.requestsByDay?.[stats.requestsByDay.length - 1]?.date}</span>
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
                const count = stats.requestsByFeature?.[feature.id] || 0;
                const percentage = getFeaturePercentage(count);
                const avgPerDay = Math.floor(count / Math.max(1, days));
                const trendValue = count > 0 ? 'up' : 'down';
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
                        {percentage}%
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
          <span className="info-icon"><Lightbulb className="inline-block w-5 h-5" /></span>
          <div>
            <strong>Lưu ý:</strong> Dữ liệu từ backend; nếu chưa ghi nhận usage, các số liệu có thể bằng 0.
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

