import React, { useState } from 'react';
import './OnlineTeaching.css';

const OnlineTeaching = () => {
  const [selectedTab, setSelectedTab] = useState('schedule');
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      title: 'English 10A - Grammar Lesson',
      class: 'English 10A',
      date: '2025-01-25',
      time: '14:00',
      duration: 90,
      type: 'scheduled',
      meetingUrl: 'https://zoom.us/j/123456789',
      participants: 28,
      maxParticipants: 30
    },
    {
      id: 2,
      title: 'English 11B - Speaking Practice',
      class: 'English 11B',
      date: '2025-01-26',
      time: '10:00',
      duration: 60,
      type: 'scheduled',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      participants: 0,
      maxParticipants: 25
    }
  ]);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    class: '',
    date: '',
    time: '',
    duration: 60,
    platform: 'zoom'
  });

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    alert('Tạo buổi học thành công!');
    setShowCreateModal(false);
    setNewMeeting({
      title: '',
      class: '',
      date: '',
      time: '',
      duration: 60,
      platform: 'zoom'
    });
  };

  const startInstantMeeting = () => {
    alert('Đang khởi động buổi học ngay lập tức...');
  };

  return (
    <div className="online-teaching">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dạy học trực tuyến 💻</h1>
          <p className="page-subtitle">Quản lý và tổ chức các buổi học trực tuyến</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={startInstantMeeting}>
            ⚡ Bắt đầu ngay
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Lên lịch buổi học
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box blue">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{meetings.filter(m => m.type === 'scheduled').length}</div>
            <div className="stat-label">Buổi học sắp tới</div>
          </div>
        </div>
        <div className="stat-box green">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-number">45</div>
            <div className="stat-label">Buổi đã hoàn thành</div>
          </div>
        </div>
        <div className="stat-box purple">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-number">120h</div>
            <div className="stat-label">Tổng thời gian</div>
          </div>
        </div>
        <div className="stat-box orange">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">85%</div>
            <div className="stat-label">Tỷ lệ tham gia</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${selectedTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setSelectedTab('schedule')}
        >
          📅 Lịch học
        </button>
        <button 
          className={`tab ${selectedTab === 'recordings' ? 'active' : ''}`}
          onClick={() => setSelectedTab('recordings')}
        >
          🎥 Bản ghi
        </button>
        <button 
          className={`tab ${selectedTab === 'settings' ? 'active' : ''}`}
          onClick={() => setSelectedTab('settings')}
        >
          ⚙️ Cài đặt
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'schedule' && (
        <div className="meetings-list">
          {meetings.map(meeting => (
            <div key={meeting.id} className="meeting-card">
              <div className="meeting-card-header">
                <div className="meeting-info">
                  <h3 className="meeting-title">{meeting.title}</h3>
                  <p className="meeting-class">🏫 {meeting.class}</p>
                </div>
                <span className="badge scheduled">📅 Đã lên lịch</span>
              </div>

              <div className="meeting-card-body">
                <div className="meeting-meta-grid">
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span className="meta-text">
                      {new Date(meeting.date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⏰</span>
                    <span className="meta-text">{meeting.time} ({meeting.duration} phút)</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">👥</span>
                    <span className="meta-text">
                      {meeting.participants}/{meeting.maxParticipants} học sinh
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🔗</span>
                    <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer" className="meeting-link">
                      Link tham gia
                    </a>
                  </div>
                </div>
              </div>

              <div className="meeting-card-actions">
                <button className="action-btn primary">🎥 Bắt đầu</button>
                <button className="action-btn">📋 Sao chép link</button>
                <button className="action-btn">✏️ Sửa</button>
                <button className="action-btn delete">🗑️</button>
              </div>
            </div>
          ))}

          {meetings.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Chưa có buổi học nào được lên lịch</h3>
              <p>Tạo buổi học trực tuyến đầu tiên của bạn</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                ➕ Lên lịch buổi học
              </button>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'recordings' && (
        <div className="recordings-section">
          <div className="recordings-grid">
            <div className="recording-card">
              <div className="recording-thumbnail">🎥</div>
              <div className="recording-info">
                <h4>English 10A - Grammar Lesson</h4>
                <p>20/01/2025 - 90 phút</p>
                <div className="recording-actions">
                  <button className="btn-text">▶️ Xem</button>
                  <button className="btn-text">📥 Tải xuống</button>
                  <button className="btn-text">🔗 Chia sẻ</button>
                </div>
              </div>
            </div>
            <div className="recording-card">
              <div className="recording-thumbnail">🎥</div>
              <div className="recording-info">
                <h4>English 11B - Speaking Practice</h4>
                <p>18/01/2025 - 60 phút</p>
                <div className="recording-actions">
                  <button className="btn-text">▶️ Xem</button>
                  <button className="btn-text">📥 Tải xuống</button>
                  <button className="btn-text">🔗 Chia sẻ</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'settings' && (
        <div className="settings-section">
          <div className="settings-card">
            <h3>⚙️ Cài đặt chung</h3>
            <div className="settings-form">
              <div className="form-group">
                <label>Nền tảng mặc định</label>
                <select>
                  <option value="zoom">Zoom</option>
                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                </select>
              </div>
              <div className="form-group">
                <label>Thời lượng mặc định (phút)</label>
                <input type="number" value="60" />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Tự động ghi hình các buổi học</span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Gửi email nhắc nhở học sinh trước buổi học 1 giờ</span>
                </label>
              </div>
              <button className="btn-primary">💾 Lưu cài đặt</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Lên lịch buổi học trực tuyến</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateMeeting}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tiêu đề <span className="required">*</span></label>
                  <input 
                    type="text"
                    required
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                    placeholder="VD: English 10A - Grammar Lesson"
                  />
                </div>

                <div className="form-group">
                  <label>Lớp học <span className="required">*</span></label>
                  <select 
                    required
                    value={newMeeting.class}
                    onChange={(e) => setNewMeeting({...newMeeting, class: e.target.value})}
                  >
                    <option value="">-- Chọn lớp --</option>
                    <option value="English 10A">English 10A</option>
                    <option value="English 10B">English 10B</option>
                    <option value="English 11B">English 11B</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày <span className="required">*</span></label>
                    <input 
                      type="date"
                      required
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Giờ <span className="required">*</span></label>
                    <input 
                      type="time"
                      required
                      value={newMeeting.time}
                      onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Thời lượng (phút) <span className="required">*</span></label>
                    <input 
                      type="number"
                      required
                      min="15"
                      step="15"
                      value={newMeeting.duration}
                      onChange={(e) => setNewMeeting({...newMeeting, duration: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Nền tảng <span className="required">*</span></label>
                    <select 
                      value={newMeeting.platform}
                      onChange={(e) => setNewMeeting({...newMeeting, platform: e.target.value})}
                    >
                      <option value="zoom">Zoom</option>
                      <option value="meet">Google Meet</option>
                      <option value="teams">Microsoft Teams</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  ➕ Tạo buổi học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineTeaching;

