from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.news import NewsPost
from app.schemas.student import NewsListResponse, NewsPostResponse

router = APIRouter()

@router.get("/", response_model=List[NewsListResponse])
async def get_news(
    category: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách tin tức và sự kiện
    """
    # Mock data matching frontend expectations
    mock_news = [
        {
            "id": 1,
            "title": "🎉 Mua VIP tặng ngay Bộ đề ôn tập kiểm tra giữa kỳ I",
            "description": "Bộ đề ôn tập kiểm tra giữa kỳ giúp học sinh ôn tập hiệu quả và giáo viên xây dựng đề thi dễ dàng.",
            "content": "Chương trình ưu đãi đặc biệt trong tháng 10! Khi mua gói VIP, bạn sẽ nhận được hoàn toàn miễn phí bộ đề ôn tập kiểm tra giữa kỳ I với đầy đủ các môn học.",
            "icon": "🎁",
            "type": "promotion",
            "category": "Khuyến mãi",
            "date": "15/10/2025",
            "image": "https://via.placeholder.com/600x400/667eea/ffffff?text=VIP+Promotion"
        },
        {
            "id": 2,
            "title": "🔥 Chỉ còn ít tuổi! Giải pháp bứt phá điểm kiểm tra cho con",
            "description": "Phương pháp học thông minh giúp con tiến bộ vượt bậc trong thời gian ngắn với công nghệ AI cá nhân hóa.",
            "content": "Hệ thống AI của chúng tôi sẽ phân tích điểm mạnh, điểm yếu của từng học sinh và đưa ra lộ trình học tập phù hợp nhất.",
            "icon": "🚀",
            "type": "tips",
            "category": "Học tập",
            "date": "12/10/2025",
            "image": "https://via.placeholder.com/600x400/764ba2/ffffff?text=Study+Tips"
        },
        {
            "id": 3,
            "title": "📚 Hướng dẫn tham gia lớp học trực tuyến năm 2025-2026",
            "description": "Hướng dẫn chi tiết cách tham gia lớp học trực tuyến, sử dụng các tính năng học tập hiệu quả.",
            "content": "Video hướng dẫn từng bước để phụ huynh và học sinh có thể dễ dàng tham gia vào lớp học trực tuyến.",
            "icon": "📖",
            "type": "guide",
            "category": "Hướng dẫn",
            "date": "10/10/2025",
            "image": "https://via.placeholder.com/600x400/f093fb/ffffff?text=Online+Class"
        },
        {
            "id": 4,
            "title": "🏆 Đấu trường Trí thức 2025 - 2026 chính thức trở lại!",
            "description": "Cuộc thi tri thức lớn nhất năm dành cho học sinh trên toàn quốc với nhiều giải thưởng hấp dẫn.",
            "content": "Cuộc thi với tổng giá trị giải thưởng lên đến 100 triệu đồng. Đăng ký ngay hôm nay!",
            "icon": "🎯",
            "type": "event",
            "category": "Sự kiện",
            "date": "08/10/2025",
            "image": "https://via.placeholder.com/600x400/4facfe/ffffff?text=Contest+2025"
        },
        {
            "id": 5,
            "title": "✨ Ra mắt tính năng AI Speaking Coach",
            "description": "Luyện phát âm tiếng Anh với trợ lý AI thông minh, nhận phản hồi tức thì về cách phát âm của bạn.",
            "content": "Tính năng mới cho phép học sinh luyện tập phát âm với AI, nhận được đánh giá chi tiết về độ chính xác.",
            "icon": "🎤",
            "type": "feature",
            "category": "Tính năng mới",
            "date": "05/10/2025",
            "image": "https://via.placeholder.com/600x400/00f2fe/ffffff?text=AI+Speaking"
        },
        {
            "id": 6,
            "title": "📅 Lịch thi học kỳ I năm học 2025-2026",
            "description": "Công bố lịch thi chính thức cho học kỳ I, các em học sinh cần lưu ý và chuẩn bị kỹ càng.",
            "content": "Kỳ thi giữa kỳ I sẽ diễn ra từ ngày 15/11 - 20/11/2025. Kỳ thi cuối kỳ từ 20/12 - 25/12/2025.",
            "icon": "📆",
            "type": "announcement",
            "category": "Thông báo",
            "date": "01/10/2025",
            "image": "https://via.placeholder.com/600x400/a18cd1/ffffff?text=Exam+Schedule"
        }
    ]
    
    # Filter by category
    if category and category != "all":
        return [news for news in mock_news if news["category"] == category]
    
    return mock_news

@router.get("/{news_id}", response_model=NewsPostResponse)
async def get_news_detail(
    news_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy chi tiết một tin tức
    """
    news = db.query(NewsPost).filter(
        NewsPost.id == news_id,
        NewsPost.status == "published"
    ).first()
    
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tin tức"
        )
    
    return news
