"""
Seed sample news data
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.models.news import NewsPost
from app.models.user import User, UserRole
from datetime import datetime, timedelta

def seed_news():
    """Seed sample news posts"""
    db: Session = SessionLocal()
    
    try:
        # Get admin or teacher user
        admin_user = db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.SUPERADMIN])
        ).first()
        
        if not admin_user:
            print("No admin user found. Creating default admin...")
            # This shouldn't happen in production, but for development...
            admin_user = db.query(User).first()
        
        if not admin_user:
            print("No users found! Please create users first.")
            return
        
        # Sample news data
        news_data = [
            {
                "title": "🎉 Chào mừng đến với English AI - Nền tảng học tiếng Anh thông minh",
                "description": "Khám phá cách học tiếng Anh hiệu quả với công nghệ AI tiên tiến",
                "content": "English AI là nền tảng học tiếng Anh trực tuyến sử dụng công nghệ trí tuệ nhân tạo để cá nhân hóa lộ trình học tập. Với phương pháp học thông minh, bạn sẽ tiến bộ nhanh chóng và đạt được mục tiêu của mình.",
                "category": "Thông báo",
                "icon": "🎉",
                "type": "announcement",
                "image": "https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?w=1200",
                "status": "published",
                "published_at": datetime.now() - timedelta(days=1)
            },
            {
                "title": "🚀 10 mẹo học từ vựng tiếng Anh hiệu quả với AI",
                "description": "Áp dụng công nghệ AI để ghi nhớ từ vựng nhanh hơn 3 lần so với phương pháp truyền thống",
                "content": "Học từ vựng là một trong những thách thức lớn nhất khi học tiếng Anh. Với công nghệ AI, chúng tôi phân tích điểm mạnh, điểm yếu của bạn và đưa ra lộ trình học tập phù hợp nhất.",
                "category": "Học tập",
                "icon": "💡",
                "type": "tips",
                "image": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200",
                "status": "published",
                "published_at": datetime.now() - timedelta(days=2)
            },
            {
                "title": "📚 Hướng dẫn sử dụng tính năng AI Speaking Coach",
                "description": "Luyện phát âm tiếng Anh với trợ lý AI thông minh, nhận phản hồi tức thì",
                "content": "AI Speaking Coach là tính năng độc quyền giúp bạn luyện tập phát âm tiếng Anh với AI. Hệ thống sẽ phân tích giọng nói của bạn và đưa ra phản hồi chi tiết về độ chính xác, ngữ điệu và tốc độ nói.",
                "category": "Hướng dẫn",
                "icon": "🎤",
                "type": "guide",
                "image": "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=1200",
                "status": "published",
                "published_at": datetime.now() - timedelta(days=3)
            },
            {
                "title": "🎯 Đấu trường Trí thức 2025 - Cuộc thi tiếng Anh toàn quốc",
                "description": "Cơ hội giành 100 triệu đồng giải thưởng cho học sinh xuất sắc",
                "content": "Đăng ký ngay hôm nay để tham gia cuộc thi tiếng Anh lớn nhất năm với tổng giá trị giải thưởng lên đến 100 triệu đồng. Thời gian đăng ký từ ngày 01/11 đến 30/11/2025.",
                "category": "Sự kiện",
                "icon": "🏆",
                "type": "event",
                "image": "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200",
                "status": "published",
                "published_at": datetime.now() - timedelta(days=4)
            },
            {
                "title": "🎁 Khuyến mãi Black Friday - Giảm 50% tất cả khóa học",
                "description": "Ưu đãi đặc biệt chỉ có trong tháng 11",
                "content": "Nhân dịp Black Friday, chúng tôi giảm 50% tất cả các khóa học tiếng Anh. Đây là cơ hội tuyệt vời để bắt đầu hành trình chinh phục tiếng Anh của bạn với chi phí tiết kiệm nhất.",
                "category": "Khuyến mãi",
                "icon": "🎁",
                "type": "promotion",
                "image": "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1200",
                "status": "published",
                "published_at": datetime.now() - timedelta(days=5)
            },
            {
                "title": "✨ Ra mắt tính năng AI Grammar Checker",
                "description": "Kiểm tra ngữ pháp tự động với độ chính xác cao",
                "content": "Tính năng AI Grammar Checker mới giúp bạn kiểm tra ngữ pháp tiếng Anh tự động với độ chính xác lên đến 98%. Hệ thống không chỉ phát hiện lỗi mà còn giải thích chi tiết và đưa ra cách sửa đúng.",
                "category": "Tính năng mới",
                "icon": "✨",
                "type": "feature",
                "image": "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1200",
                "status": "published",
                "published_at": datetime.now() - timedelta(days=6)
            }
        ]
        
        # Add news to database
        for news_item in news_data:
            # Check if news already exists
            existing = db.query(NewsPost).filter(
                NewsPost.title == news_item["title"]
            ).first()
            
            if not existing:
                news = NewsPost(
                    **news_item,
                    author_id=admin_user.id,
                    views=0,
                    likes=0,
                    reading_time=5
                )
                db.add(news)
                print(f"✅ Added: {news_item['title']}")
            else:
                print(f"⏭️  Skipped (exists): {news_item['title']}")
        
        db.commit()
        print("\n🎉 News seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding news: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding news data...")
    seed_news()

