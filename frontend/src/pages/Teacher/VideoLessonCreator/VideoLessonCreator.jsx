import React, { useState } from 'react';
import { Upload, Video, Loader2, Settings, FileText, Volume2 } from 'lucide-react';
import { videoLessonAPI } from '../../../api/videoLessons';

/**
 * VideoLessonCreator Component
 * UI for teachers to upload PowerPoint and generate video lessons with AI narration
 */
const VideoLessonCreator = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [voiceType, setVoiceType] = useState('vi-VN-HoaiMyNeural');
  const [speechRate, setSpeechRate] = useState(0);
  const [speechPitch, setSpeechPitch] = useState(0);
  const [language, setLanguage] = useState('vi');
  const [autoGenerateScript, setAutoGenerateScript] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Available Azure voices
  const voices = [
    { value: 'vi-VN-HoaiMyNeural', label: 'Hoài My (Nữ - Tiếng Việt)', gender: 'female' },
    { value: 'vi-VN-NamMinhNeural', label: 'Nam Minh (Nam - Tiếng Việt)', gender: 'male' },
    { value: 'en-US-JennyNeural', label: 'Jenny (Female - English US)', gender: 'female' },
    { value: 'en-US-GuyNeural', label: 'Guy (Male - English US)', gender: 'male' },
    { value: 'en-GB-SoniaNeural', label: 'Sonia (Female - English UK)', gender: 'female' },
    { value: 'en-GB-RyanNeural', label: 'Ryan (Male - English UK)', gender: 'male' },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.ppt') && !selectedFile.name.endsWith('.pptx')) {
        setError('Chỉ hỗ trợ file PowerPoint (.ppt, .pptx)');
        return;
      }

      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File quá lớn. Vui lòng chọn file nhỏ hơn 50MB');
        return;
      }

      setFile(selectedFile);
      setError('');

      // Auto-fill title from filename
      if (!title) {
        const filename = selectedFile.name.replace(/\.(ppt|pptx)$/i, '');
        setTitle(filename);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Vui lòng chọn file PowerPoint');
      return;
    }

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề video');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (lessonId) formData.append('lesson_id', lessonId);
      formData.append('voice_type', voiceType);
      formData.append('speech_rate', `${speechRate}%`);
      formData.append('speech_pitch', `${speechPitch}%`);
      formData.append('language', language);
      formData.append('auto_generate_script', autoGenerateScript);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await videoLessonAPI.generateFromPPT(formData);

      clearInterval(progressInterval);
      setProgress(100);

      // Reset form
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setLessonId('');
        setProgress(0);
        setUploading(false);
        
        // Navigate to video status page or show success
        alert(`Video đang được tạo! ID: ${response.id}\nTrạng thái: ${response.status}`);
      }, 1000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Có lỗi xảy ra khi tải lên');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Video className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tạo Video Bài Giảng</h1>
            <p className="text-sm text-gray-600">
              Tải lên PowerPoint và AI sẽ tạo video với giọng đọc tự nhiên
            </p>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="ppt-file"
              accept=".ppt,.pptx"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="ppt-file" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="w-12 h-12 text-green-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-700">
                    Kéo thả file PowerPoint vào đây
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    hoặc nhấn để chọn file (.ppt, .pptx)
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Quality Notice */}
          {file && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    Lưu ý về chất lượng slide
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Để đảm bảo chất lượng tốt nhất, nên sử dụng slide có font đơn giản, tránh hiệu ứng phức tạp. 
                    Các slide có nhiều hiệu ứng hoặc font đặc biệt có thể bị lỗi hiển thị do quá trình chuyển đổi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề video *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề video"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Bài học (tùy chọn)
              </label>
              <input
                type="number"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                placeholder="Liên kết với bài học"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Voice Settings */}
          <div className="border-t pt-6">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 text-gray-700 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Cài đặt giọng đọc</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Volume2 className="w-4 h-4 inline mr-1" />
                  Giọng đọc
                </label>
                <select
                  value={voiceType}
                  onChange={(e) => setVoiceType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={uploading}
                >
                  {voices.map((voice) => (
                    <option key={voice.value} value={voice.value}>
                      {voice.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngôn ngữ kịch bản
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={uploading}
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Speech Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tốc độ đọc: {speechRate > 0 ? '+' : ''}{speechRate}%
                </label>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseInt(e.target.value))}
                  className="w-full"
                  disabled={uploading}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Chậm</span>
                  <span>Bình thường</span>
                  <span>Nhanh</span>
                </div>
              </div>

              {/* Speech Pitch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cao độ: {speechPitch > 0 ? '+' : ''}{speechPitch}%
                </label>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseInt(e.target.value))}
                  className="w-full"
                  disabled={uploading}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Thấp</span>
                  <span>Bình thường</span>
                  <span>Cao</span>
                </div>
              </div>
            </div>

            {/* Auto Generate Script */}
            <div className="mt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerateScript}
                  onChange={(e) => setAutoGenerateScript(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={uploading}
                />
                <span className="text-sm text-gray-700">
                  Tự động tạo kịch bản nếu slide không có ghi chú
                </span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Đang xử lý...</span>
                <span className="font-medium text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors flex items-center justify-center space-x-2 ${
              uploading || !file || !title.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                <span>Tạo Video Bài Giảng</span>
              </>
            )}
          </button>
        </form>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Quá trình tạo video có thể mất vài phút tùy thuộc vào số slide.
            Bạn sẽ nhận được thông báo khi video hoàn thành.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoLessonCreator;
