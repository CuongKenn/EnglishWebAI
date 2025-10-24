import React, { useState, useEffect } from 'react';
// import { useDiscussions } from '../../hooks'; // Bỏ comment dòng này khi dùng hook thật
import { MessageSquarePlus, Search, MessageSquare, Eye, Heart, Share, ThumbsUp, Send, Paperclip } from 'lucide-react';
import './Discussion.css';

// Mock hook và data để component có thể chạy độc lập và hiển thị kết quả
const useDiscussions = () => {
    const mockData = [
        {
            id: 1,
            author: 'Trần Thị Hoa',
            author_role: 'Học sinh',
            avatar: '😊',
            created_at: '4 giờ trước',
            title: 'Từ vựng tiếng Anh về gia đình',
            content: 'Các bạn có thể chia sẻ từ vựng tiếng Anh về gia đình không?',
            tags: ['từ vựng', 'gia đình', 'tiếng anh'],
            answers: 5,
            views: 78,
            likes: 12,
            subject: 'Tiếng Anh',
            grade: 'Lớp 3',
            isVip: false,
            isAnswered: true
        },
        {
            id: 2,
            author: 'Nguyễn Văn An',
            author_role: 'Học sinh',
            avatar: '🤔',
            created_at: '6 giờ trước',
            title: 'Cách sử dụng thì hiện tại hoàn thành',
            content: 'Mình đang gặp khó khăn với thì hiện tại hoàn thành. Ai có thể giải thích cách dùng không?',
            tags: ['ngữ pháp', 'thì', 'hiện tại hoàn thành'],
            answers: 12,
            views: 156,
            likes: 23,
            subject: 'Tiếng Anh',
            grade: 'Lớp 7',
            isVip: false,
            isAnswered: false
        },
    ];
    return { discussions: mockData, loading: false, error: null, createDiscussion: async (data) => { console.log("Creating new discussion:", data) } };
};


const Discussion = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('Tiếng Anh');
    const [showAskForm, setShowAskForm] = useState(false);
    const [likedQuestions, setLikedQuestions] = useState(new Set());
    const [newQuestion, setNewQuestion] = useState({ title: '', content: '', subject: '', tags: '' });
    
    // --- [BẮT ĐẦU] CODE MỚI ---
    const [replyingTo, setReplyingTo] = useState(null); // Lưu ID của câu hỏi đang trả lời
    const [commentText, setCommentText] = useState(""); // Lưu nội dung comment
    // --- [KẾT THÚC] CODE MỚI ---

    const { discussions: questions, loading, error, createDiscussion } = useDiscussions();

    const filteredQuestions = questions.filter(question => {
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'answered' && question.isAnswered) ||
            (activeTab === 'unanswered' && !question.isAnswered) ||
            (activeTab === 'vip' && question.isVip);
        const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) || question.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = selectedSubject === 'all' || question.subject === selectedSubject;
        return matchesTab && matchesSearch && matchesSubject;
    });

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (newQuestion.title && newQuestion.content) {
            try {
                await createDiscussion({
                    title: newQuestion.title,
                    content: newQuestion.content,
                    subject: newQuestion.subject,
                    tags: newQuestion.tags.split(',').map(tag => tag.trim())
                });
                alert('Câu hỏi của bạn đã được gửi!');
                setNewQuestion({ title: '', content: '', subject: '', tags: '' });
                setShowAskForm(false);
            } catch (err) {
                alert(err.message || 'Có lỗi xảy ra khi gửi câu hỏi');
            }
        }
    };

    const handleLikeQuestion = (questionId) => {
        setLikedQuestions(prev => {
            const newLiked = new Set(prev);
            if (newLiked.has(questionId)) {
                newLiked.delete(questionId);
            } else {
                newLiked.add(questionId);
            }
            return newLiked;
        });
    };

    // --- [BẮT ĐẦU] CODE MỚI ---
    // Hàm để bật/tắt ô trả lời
    const handleToggleReply = (questionId) => {
        if (replyingTo === questionId) {
            setReplyingTo(null); // Nếu đang mở thì đóng lại
        } else {
            setReplyingTo(questionId); // Mở ô trả lời cho câu hỏi này
            setCommentText(""); // Xóa nội dung cũ khi mở
        }
    };

    // Hàm xử lý khi gửi trả lời (hiện tại chỉ log ra console)
    const handleReplySubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            console.log(`Submitting reply for question ${replyingTo}:`, commentText);
            // Sau khi gửi, đóng ô trả lời và xóa nội dung
            setReplyingTo(null);
            setCommentText("");
        }
    };
    // --- [KẾT THÚC] CODE MỚI ---

    const tabs = [
        { id: 'all', label: 'Tất cả', count: questions.length },
        { id: 'answered', label: 'Đã trả lời', count: questions.filter(q => q.isAnswered).length },
        { id: 'unanswered', label: 'Chưa trả lời', count: questions.filter(q => !q.isAnswered).length },
        
    ];

    return (
        <div className="discussion-page">
            <div className="page-content">
                {/* ... (Các phần code không đổi) ... */}
                <div className="ask-section">
                    <div className="ask-header-text">
                        <h2>Đặt câu hỏi</h2>
                        <p>Chia sẻ câu hỏi và nhận câu trả lời từ cộng đồng</p>
                    </div>
                    <button className="ask-btn" onClick={() => setShowAskForm(!showAskForm)}>
                        <MessageSquarePlus size={18} /> {showAskForm ? 'Đóng' : 'Đặt câu hỏi'}
                    </button>
                </div>

                {showAskForm && (
                    <div className="ask-form-container">
                        <form className="ask-form" onSubmit={handleAskQuestion}>
                            <div className="form-group">
                                <label className="form-label">Tiêu đề câu hỏi:</label>
                                <input type="text" value={newQuestion.title} onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })} className="form-input" placeholder="Nhập tiêu đề câu hỏi của bạn..." required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Môn học:</label>
                                    <select value={newQuestion.subject} onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })} className="form-select" required >
                                        <option value="">Chọn môn học</option>
                                        <option value="Kĩ năng nghe">Kĩ năng nghe</option>
                                        <option value="Kĩ năng nói">Kĩ năng nói</option>
                                        <option value="Kĩ năng viết">Kĩ năng viết</option>
                                        <option value="Kĩ năng đọc">Kĩ năng đọc</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tags:</label>
                                    <input type="text" value={newQuestion.tags} onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })} className="form-input" placeholder="Ví dụ: phép cộng, có nhớ, lớp 2" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nội dung câu hỏi:</label>
                                <textarea value={newQuestion.content} onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })} className="form-textarea" placeholder="Mô tả chi tiết câu hỏi của bạn..." rows="4" required ></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowAskForm(false)} > Hủy </button>
                                <button type="submit" className="submit-btn">
                                    Gửi câu hỏi
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="search-filter-section">
                    <div className="search-box">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm câu hỏi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label" htmlFor="subject-select">Môn học:</label>
                        <select
                            id="subject-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Tất cả</option>
                            <option value="Kĩ năng nghe">Kĩ năng nghe</option>
                            <option value="Kĩ năng nói">Kĩ năng nói</option>
                            <option value="Kĩ năng viết">Kĩ năng viết</option>
                            <option value="Kĩ năng đọc">Kĩ năng đọc</option>
                        </select>
                    </div>
                </div>

                <div className="tabs-section">
                    <div className="tabs-container">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                                <span className="tab-count">{tab.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="questions-section">
                    {loading ? ( <div><p>Đang tải câu hỏi...</p></div> ) : 
                     error ? ( <div><p>{error}</p></div> ) : 
                     (
                        <div className="questions-list">
                            {filteredQuestions.map((question) => (
                                <div key={question.id} className="question-card-wrapper">
                                    <div className={`question-card ${question.isVip ? 'vip' : ''}`}>
                                        {/* ... (Phần header, content, tags của card không đổi) ... */}
                                        <div className="question-header">
                                            <div className="author-avatar">
                                                <span className="avatar-emoji">{question.avatar || '👤'}</span>
                                            </div>
                                            <div className="author-details">
                                                <h4 className="author-name">{question.author || question.author_name || 'Ẩn danh'}</h4>
                                                <span className="author-role">{question.authorRole || question.author_role || 'Học sinh'}</span>
                                            </div>
                                            <span className="question-time">{question.createdAt || question.created_at || 'Vừa xong'}</span>
                                        </div>
                                        <div className="question-content">
                                            <h3 className="question-title">{question.title}</h3>
                                            <p className="question-text">{question.content}</p>
                                        </div>
                                        <div className="question-tags">
                                            {question.tags.map((tag, index) => ( <span key={index} className="tag">#{tag}</span> ))}
                                        </div>
                                        <div className="question-footer-internal">
                                            <div className="question-stats">
                                                <div className="stat-item">
                                                    <MessageSquare size={20} />
                                                    <span>{question.answers}</span>
                                                </div>
                                                <div className="stat-item">
                                                    <Eye size={20} />
                                                    <span>{question.views}</span>
                                                </div>
                                                <button
                                                    className={`stat-item-btn ${likedQuestions.has(question.id) ? 'liked' : ''}`}
                                                    onClick={() => handleLikeQuestion(question.id)}
                                                >
                                                    <Heart size={20} className="lucide-heart" />
                                                    <span>{question.likes}</span>
                                                </button>
                                            </div>
                                            <div className="badges-container">
                                                <span className="subject-badge">{question.subject}</span>
                                                <span className="grade-badge">{question.grade}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="question-actions">
                                        {/* --- CẬP NHẬT ONCLICK CHO NÚT TRẢ LỜI --- */}
                                        <button className="action-btn" onClick={() => handleToggleReply(question.id)}>
                                            <Send size={16}/> Trả lời
                                        </button>
                                        <button
                                            className={`action-btn ${likedQuestions.has(question.id) ? 'liked' : ''}`}
                                            onClick={() => handleLikeQuestion(question.id)}
                                        >
                                            <ThumbsUp size={16}/> Thích
                                        </button>
                                        <button className="action-btn">
                                            <Share size={16}/> Chia sẻ
                                        </button>
                                    </div>

                                    {/* --- [BẮT ĐẦU] CODE MỚI: Ô TRẢ LỜI HIỂN THỊ CÓ ĐIỀU KIỆN --- */}
                                    {replyingTo === question.id && (
                                        <div className="reply-box-container">
                                            <form onSubmit={handleReplySubmit}>
                                                <textarea
                                                    className="reply-textarea"
                                                    placeholder="Viết câu trả lời của bạn..."
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="reply-actions">
                                                    <button type="submit" className="reply-submit-btn">
                                                        Gửi trả lời
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                    {/* --- [KẾT THÚC] CODE MỚI --- */}

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Discussion;