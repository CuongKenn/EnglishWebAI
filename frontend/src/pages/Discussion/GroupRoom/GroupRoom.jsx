import React, { useState, useEffect } from 'react';
import { Users, Plus, Trophy, Video, X, BookOpen } from 'lucide-react';
import './GroupRoom.css';
import GroupRoomDetail from './GroupRoomDetail';
import { chatRoomAPI, quizAPI } from '../../../services/api';

const GroupRoom = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mode: 'chat',
    max_participants: 10
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Fetch both chat rooms and quiz rooms
      const [chatRooms, quizRooms] = await Promise.all([
        chatRoomAPI.getRooms().catch(() => []),
        quizAPI.getRooms().catch(() => [])
      ]);
      
      // Mark quiz rooms
      const markedQuizRooms = Array.isArray(quizRooms) ? quizRooms.map(room => ({
        ...room,
        is_quiz: true,
        name: room.title, // Normalize name field
      })) : [];
      
      const markedChatRooms = Array.isArray(chatRooms) ? chatRooms.map(room => ({
        ...room,
        is_quiz: false
      })) : [];
      
      // Combine both types
      setGroups([...markedChatRooms, ...markedQuizRooms]);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên nhóm!');
      return;
    }

    try {
      let newGroup;
      
      // Tạo theo mode đã chọn
      if (formData.mode === 'quiz') {
        // Tạo Quiz Room
        newGroup = await quizAPI.createRoom({
          title: formData.name,
          description: formData.description || 'Phòng quiz thi đấu',
          topic: 'general',
          difficulty: 'medium',
          time_limit: 30,
          total_questions: 10
        });
        // Add marker để biết đây là quiz room
        newGroup.is_quiz = true;
      } else {
        // Tạo Chat Room
        newGroup = await chatRoomAPI.createRoom({
          name: formData.name,
          description: formData.description || 'Nhóm học tập',
          max_participants: parseInt(formData.max_participants) || 10
        });
        newGroup.is_quiz = false;
      }
      
      setGroups([newGroup, ...groups]);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', mode: 'chat', max_participants: 10 });
      
      // Auto-join nếu là chat room
      if (!newGroup.is_quiz) {
        setSelectedGroup(newGroup);
      } else {
        // Nếu là quiz, thông báo và refresh
        alert('Đã tạo phòng quiz! Vào tab "Chế độ Solo" để tham gia.');
        fetchGroups();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      const errorMsg = error.response?.data?.detail || error.detail || 'Không thể tạo nhóm. Vui lòng thử lại!';
      alert(errorMsg);
    }
  };

  if (selectedGroup) {
    return (
      <GroupRoomDetail 
        group={selectedGroup} 
        onBack={() => {
          setSelectedGroup(null);
          fetchGroups();
        }} 
      />
    );
  }

  return (
    <div className="group-room-container">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <Users size={28} />
          <h1>Trao Đổi Nhóm</h1>
        </div>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Tạo nhóm mới
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="create-group-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-group-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo Nhóm Mới</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="modal-form">
              <div className="form-group">
                <label>Tên nhóm *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Học tiếng Anh cùng nhau"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả (tùy chọn)</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Mô tả ngắn về nhóm..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Chế độ nhóm</label>
                <div className="mode-selector">
                  <div
                    className={`mode-option ${formData.mode === 'quiz' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, mode: 'quiz' })}
                  >
                    <Trophy size={24} />
                    <div className="mode-name">Quiz</div>
                    <div className="mode-desc">Thi đấu câu hỏi</div>
                  </div>

                  <div
                    className={`mode-option ${formData.mode === 'chat' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, mode: 'chat' })}
                  >
                    <Video size={24} />
                    <div className="mode-name">Trò chuyện</div>
                    <div className="mode-desc">Chat & Video call</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Số lượng thành viên tối đa</label>
                <select
                  className="form-input"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                >
                  <option value={5}>5 người</option>
                  <option value={10}>10 người</option>
                  <option value={20}>20 người</option>
                  <option value={50}>50 người</option>
                </select>
              </div>

              <div className="btn-group">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  <Plus size={18} />
                  Tạo nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Groups List */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Đang tải...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <Users size={64} className="empty-icon" />
          <h3>Chưa có nhóm nào</h3>
          <p>Tạo nhóm mới để học tập và trao đổi cùng bạn bè!</p>
          <button className="btn-create" onClick={() => setShowCreateModal(true)}>
            <Plus size={20} />
            Tạo nhóm đầu tiên
          </button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div 
              key={`${group.is_quiz ? 'quiz' : 'chat'}-${group.id}`} 
              className="group-card" 
              onClick={() => {
                if (group.is_quiz) {
                  alert('Quiz room! Vui lòng vào tab "Chế độ Solo" để tham gia quiz này.');
                } else {
                  setSelectedGroup(group);
                }
              }}
            >
              <div className="group-card-header">
                <div className={`group-icon ${group.is_quiz ? 'quiz-icon' : ''}`}>
                  {group.is_quiz ? <Trophy size={24} /> : <Video size={24} />}
                </div>
                <div className={`group-badge ${group.is_quiz ? 'quiz-badge' : ''}`}>
                  {group.is_quiz ? (
                    `${group.total_questions || 10} câu`
                  ) : (
                    `${group.participant_count || 0}/${group.max_participants}`
                  )}
                </div>
              </div>

              <h3 className="group-name">{group.name || group.title}</h3>
              {(group.description) && (
                <p className="group-description">{group.description}</p>
              )}

              <div className="group-footer">
                <div className="group-code">
                  {group.is_quiz ? (
                    <>
                      <Trophy size={14} />
                      <span>{group.difficulty || 'medium'} • {group.topic || 'general'}</span>
                    </>
                  ) : (
                    <>
                      <BookOpen size={14} />
                      <span>Mã: {group.room_code}</span>
                    </>
                  )}
                </div>
                <button className="btn-join">
                  {group.is_quiz ? 'Vào Quiz' : 'Tham gia'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupRoom;
