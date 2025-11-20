import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Clock, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { videoLessonAPI } from '../../../api/videoLessons';

/**
 * VideoLessonList Component
 * List all video lessons for teacher
 */
const VideoLessonList = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchVideos();
  }, [page]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await videoLessonAPI.listVideoLessons({
        skip: page * limit,
        limit,
      });
      setVideos(data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Không thể tải danh sách video');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Đang chờ',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      failed: 'Thất bại',
    };
    return statusMap[status] || status;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Video className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Video Bài Giảng</h1>
            <p className="text-sm text-gray-600">Quản lý video được tạo từ PowerPoint</p>
          </div>
        </div>
        
        <button
          onClick={() => navigate('/teacher/video-lessons/create')}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tạo video mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && videos.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Chưa có video nào
          </h3>
          <p className="text-gray-600 mb-6">
            Bắt đầu bằng cách tải lên file PowerPoint để tạo video bài giảng
          </p>
          <button
            onClick={() => navigate('/teacher/video-lessons/create')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tạo video đầu tiên
          </button>
        </div>
      )}

      {/* Video Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => navigate(`/teacher/video-lessons/${video.id}`)}
            >
              {/* Thumbnail */}
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 h-48 flex items-center justify-center">
                <Video className="w-16 h-16 text-white opacity-75" />
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {getStatusIcon(video.status)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                  {video.title}
                </h3>

                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <span className="mr-3">
                    {video.slides_count || '--'} slides
                  </span>
                  <span>
                    {formatDuration(video.duration_seconds)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(video.created_at).toLocaleDateString('vi-VN')}
                  </span>
                  
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    video.status === 'completed' ? 'bg-green-100 text-green-800' :
                    video.status === 'processing' || video.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                    video.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(video.status)}
                  </span>
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/teacher/video-lessons/${video.id}`);
                  }}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination (if needed) */}
      {videos.length >= limit && (
        <div className="flex justify-center mt-8 space-x-3">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-gray-700">
            Trang {page + 1}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoLessonList;
