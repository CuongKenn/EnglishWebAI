import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useNewsDetail } from '../../hooks';
import ShareModal from '../../components/ShareModal/ShareModal';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { 
  ArrowLeft, 
  Share2, 
  Eye, 
  Heart, 
  Clock, 
  Calendar,
  User,
  Bookmark,
  MessageCircle,
  Tag,
  BookOpen,
  FileText,
  Sparkles,
  Megaphone,
  PartyPopper
} from 'lucide-react';
import './News.css';

const NewsDetail = () => {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const { newsItem, loading, error } = useNewsDetail(newsId);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const getCategoryColor = (category) => {
    const colors = {
      'Khuyến mãi': 'bg-red-500',
      'Học tập': 'bg-teal-500',
      'Hướng dẫn': 'bg-blue-500',
      'Sự kiện': 'bg-orange-500',
      'Tính năng mới': 'bg-green-500',
      'Thông báo': 'bg-purple-500',
    };
    return colors[category] || 'bg-indigo-500';
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Khuyến mãi': PartyPopper,
      'Học tập': BookOpen,
      'Hướng dẫn': FileText,
      'Sự kiện': Tag,
      'Tính năng mới': Sparkles,
      'Thông báo': Megaphone,
    };
    return iconMap[category] || Tag;
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/news/${newsId}`;
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: newsItem?.title, 
          text: newsItem?.description, 
          url: shareUrl 
        });
      } else {
        setShareUrl(shareUrl);
        setShowShareModal(true);
      }
    } catch (err) {
      setShareUrl(shareUrl);
      setShowShareModal(true);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Call API to update like count
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Call API to save/unsave article
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
        <div className="mx-auto max-w-4xl">
          <Button variant="ghost" onClick={() => navigate('/news')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <Card className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-32 rounded-full bg-gray-200"></div>
              <div className="h-12 w-3/4 rounded bg-gray-200"></div>
              <div className="h-4 w-full rounded bg-gray-200"></div>
              <div className="h-4 w-full rounded bg-gray-200"></div>
              <div className="h-64 w-full rounded-lg bg-gray-200"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
        <div className="mx-auto max-w-4xl">
          <Button variant="ghost" onClick={() => navigate('/news')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <span className="text-5xl">📰</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Không tìm thấy bài viết</h2>
            <p className="mb-6 text-gray-600">Bài viết không tồn tại hoặc đã bị xóa.</p>
            <Button onClick={() => navigate('/news')}>
              Về danh sách tin tức
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const formattedDate = newsItem.created_at 
    ? new Date(newsItem.created_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Ngày không xác định';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Back Button */}
      <div className="fixed left-4 top-4 z-50 lg:left-8 lg:top-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/news')} 
          className="bg-white shadow-lg hover:shadow-xl transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      {/* Hero Section - Gradient Background */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 pb-32 pt-24 lg:pb-40 lg:pt-32">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent"></div>
        
        <div className="relative mx-auto max-w-4xl px-4">
          {/* Category Badge */}
          <div className="mb-6 flex items-center gap-3">
            <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white shadow-lg">
              {React.createElement(getCategoryIcon(newsItem.category), { className: "mr-1.5 h-4 w-4" })}
              <span className="font-semibold">{newsItem.category}</span>
            </Badge>
            <span className="text-white/80 text-sm">•</span>
            <span className="text-white/80 text-sm">{newsItem.reading_time || 5} phút đọc</span>
          </div>
          
          {/* Title */}
          <h1 className="mb-6 text-4xl font-black leading-tight text-white lg:text-6xl">
            {newsItem.title}
          </h1>
          
          {/* Description */}
          {newsItem.description && (
            <p className="mb-8 text-xl leading-relaxed text-white/95 lg:text-2xl">
              {newsItem.description}
            </p>
          )}
          
          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-3 border-white/30 shadow-xl ring-4 ring-white/20">
                <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-lg font-bold text-white">
                  {(newsItem.author_name || 'Admin')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-white text-lg">{newsItem.author_name || 'Admin'}</p>
                <p className="text-sm text-white/80">{newsItem.author_role || 'Quản trị viên'}</p>
              </div>
            </div>
            
            <div className="hidden lg:block h-12 w-px bg-white/30"></div>
            
            <div className="flex flex-wrap gap-4 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{newsItem.views || 0} lượt xem</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative -mt-24 lg:-mt-32">
        <div className="mx-auto max-w-4xl px-4">
          
          {/* Floating Action Bar */}
          <Card className="mb-6 flex items-center justify-between p-4 shadow-2xl backdrop-blur-sm bg-white/95 sticky top-4 z-40 border-2">
            <div className="flex items-center gap-2">
              <Button 
                variant={isLiked ? "default" : "ghost"}
                size="sm"
                onClick={handleLike}
                className={`${isLiked ? "bg-red-500 hover:bg-red-600 text-white" : "hover:bg-red-50 hover:text-red-600"} transition-all`}
              >
                <Heart className={`mr-1.5 h-4 w-4 ${isLiked ? "fill-current animate-pulse" : ""}`} />
                <span className="font-semibold">{newsItem.likes || 0}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
                <MessageCircle className="mr-1.5 h-4 w-4" />
                <span className="font-semibold">0</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={isSaved ? "default" : "ghost"}
                size="sm"
                onClick={handleSave}
                className={`${isSaved ? "bg-indigo-500 hover:bg-indigo-600 text-white" : "hover:bg-indigo-50 hover:text-indigo-600"}`}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                <span className="ml-1.5 hidden sm:inline">Lưu</span>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleShare} className="hover:bg-green-50 hover:text-green-600">
                <Share2 className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Chia sẻ</span>
              </Button>
            </div>
          </Card>

          {/* Featured Image Card */}
          {newsItem.image && (
            <Card className="mb-8 overflow-hidden shadow-2xl">
              <div className="relative aspect-video w-full overflow-hidden">
                <img 
                  src={newsItem.image} 
                  alt={newsItem.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </Card>
          )}

          {/* Article Content Card */}
          <Card className="mb-8 bg-white p-8 shadow-2xl lg:p-16">
            <article className="prose prose-lg mx-auto max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-h1:text-4xl prose-h1:mb-6 prose-h2:text-3xl prose-h2:mb-5 prose-h2:mt-12 prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8 prose-p:text-gray-700 prose-p:leading-loose prose-p:mb-6 prose-p:text-lg prose-a:text-indigo-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-bold prose-ul:my-6 prose-li:text-gray-700 prose-li:my-2 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:italic">
              <div className="whitespace-pre-wrap leading-loose">
                {newsItem.content}
              </div>
            </article>
            
            {/* Article Footer - Tags or Related Info */}
            <div className="mt-12 border-t pt-8">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Chia sẻ bài viết:</span>
                <Button variant="ghost" size="sm" onClick={handleShare} className="hover:bg-gray-100">
                  <Share2 className="mr-2 h-4 w-4" />
                  Chia sẻ
                </Button>
              </div>
            </div>
          </Card>

          {/* Bottom CTA Section */}
          <Card className="mb-12 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 text-center shadow-xl border-2 border-indigo-200">
            <h3 className="mb-3 text-2xl font-bold text-gray-900">Bạn thấy bài viết này như thế nào?</h3>
            <p className="mb-6 text-gray-700">Chia sẻ suy nghĩ của bạn với chúng tôi!</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button 
                variant={isLiked ? "default" : "outline"}
                onClick={handleLike}
                className={`${isLiked ? "bg-red-500 hover:bg-red-600 border-red-500" : "border-2 hover:border-red-500 hover:bg-red-50 hover:text-red-600"} px-8`}
                size="lg"
              >
                <Heart className={`mr-2 h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                Thích bài viết
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="border-2 hover:border-green-500 hover:bg-green-50 hover:text-green-600 px-8"
                size="lg"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Chia sẻ
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/news')}
                className="border-2 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 px-8"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Xem thêm tin tức
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        title="Chia sẻ bài viết"
      />
    </div>
  );
};

export default NewsDetail;
