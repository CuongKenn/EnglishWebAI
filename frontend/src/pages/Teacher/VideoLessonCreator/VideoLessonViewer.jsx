import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Clock, Loader2, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { videoLessonAPI } from '../../../api/videoLessons';

/**
 * VideoLessonViewer Component
 * View video lesson details, status, and play completed videos
 */
const VideoLessonViewer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  // Fetch video details
  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      const data = await videoLessonAPI.getVideoLesson(videoId);
      setVideo(data);
      
      // Start polling if still processing
      if (data.status === 'processing' || data.status === 'pending') {
        if (!polling) {
          setPolling(true);
          pollVideoStatus();
        }
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      setError(err.response?.data?.detail || 'Không thể tải thông tin video');
    } finally {
      setLoading(false);
    }
  };

  // Poll video status until completed/failed
  const pollVideoStatus = async () => {
    try {
      const completedVideo = await videoLessonAPI.pollVideoStatus(videoId, 5000, 120);
      setVideo(completedVideo);
      setPolling(false);
    } catch (err) {
      console.error('Polling error:', err);
      setError('Không thể theo dõi trạng thái video');
      setPolling(false);
    }
  };

  useEffect(() => {
    fetchVideoDetails();

    // Cleanup polling on unmount
    return () => setPolling(false);
  }, [videoId]);

  // Status indicator component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        text: 'Đang chờ',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      },
      processing: {
        icon: Loader2,
        text: 'Đang xử lý',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        animate: true,
      },
      completed: {
        icon: CheckCircle,
        text: 'Hoàn thành',
        color: 'bg-green-100 text-green-800 border-green-300',
      },
      failed: {
        icon: XCircle,
        text: 'Thất bại',
        color: 'bg-red-100 text-red-800 border-red-300',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full border ${config.color}`}>
        <Icon className={`w-4 h-4 mr-2 ${config.animate ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    );
  };

  // Format duration (seconds to mm:ss)
  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Lỗi</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 text-center">
        <p className="text-gray-600">Không tìm thấy video</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Video className="w-8 h-8 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">{video.title}</h1>
                <p className="text-blue-100 text-sm mt-1">
                  ID: {video.id} | Tạo lúc: {new Date(video.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
            <StatusBadge status={video.status} />
          </div>
        </div>

        {/* Video Player (if completed) */}
        {video.status === 'completed' && video.video_url && (
          <div className="bg-black">
            <video
              controls
              className="w-full"
              src={video.video_url}
              poster="/placeholder-video.jpg"
            >
              Trình duyệt không hỗ trợ video.
            </video>
          </div>
        )}

        {/* Processing Indicator */}
        {(video.status === 'processing' || video.status === 'pending') && (
          <div className="bg-blue-50 p-12 text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Đang tạo video...
            </h3>
            <p className="text-gray-600 mb-4">
              Quá trình này có thể mất vài phút. Vui lòng không đóng trang.
            </p>
            {video.slides_count && (
              <p className="text-sm text-gray-500">
                Số slide: {video.slides_count}
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {video.status === 'failed' && (
          <div className="bg-red-50 p-12 text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Tạo video thất bại
            </h3>
            {video.error_message && (
              <p className="text-red-700 mb-4">{video.error_message}</p>
            )}
            <button
              onClick={() => navigate('/teacher/video-lessons/create')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Video Info */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin video</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Số slide</p>
              <p className="text-2xl font-bold text-gray-800">
                {video.slides_count || '--'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Thời lượng</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatDuration(video.duration_seconds)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Giọng đọc</p>
              <p className="text-sm font-medium text-gray-800">
                {video.voice_type?.includes('HoaiMy') ? 'Hoài My' :
                 video.voice_type?.includes('NamMinh') ? 'Nam Minh' :
                 video.voice_type || '--'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Ngôn ngữ</p>
              <p className="text-sm font-medium text-gray-800">
                {video.language === 'vi' ? 'Tiếng Việt' : 'English'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {video.status === 'completed' && (
            <div className="mt-6 flex space-x-3">
              <a
                href={video.video_url}
                download
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Tải xuống
              </a>

              <button
                onClick={() => navigate('/teacher/video-lessons')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Danh sách video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoLessonViewer;
