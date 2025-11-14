import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  MdCameraAlt, 
  MdUpload, 
  MdClose, 
  MdVolumeUp, 
  MdBook, 
  MdLanguage, 
  MdError,
  MdAutorenew
} from 'react-icons/md';
import { Camera, Upload, Folder, Settings, Sprout, Leaf, TreeDeciduous, Lightbulb, Library, ImageIcon, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { recognizeImage } from '../../api/imageRecognition';

/**
 * AI Image Recognition Component
 * ML-based image recognition for vocabulary learning
 * User takes photo → AI recognizes object → Shows English vocabulary with IPA & examples
 */
const ImageRecognition = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // 'camera' | 'upload'
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [level, setLevel] = useState('beginner');
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const streamRef = useRef(null);

  // Initialize camera when mode is set to 'camera'
  useEffect(() => {
    const initCamera = async () => {
      if (mode !== 'camera' || !videoRef.current) {
        return;
      }

      setIsCameraLoading(true);
      setError(null);

      try {
        console.log('Starting camera...');
        console.log('videoRef.current:', videoRef.current);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });

        console.log('Got media stream:', stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          console.log('Video srcObject set');

          // Wait for video metadata to load
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log('Video playing successfully');
                  setIsCameraActive(true);
                  setIsCameraLoading(false);
                })
                .catch((err) => {
                  console.error('Error playing video:', err);
                  setError('Không thể phát camera. Vui lòng thử lại.');
                  setIsCameraLoading(false);
                  setMode(null);
                });
            }
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setIsCameraLoading(false);
        setMode(null);
        
        if (err.name === 'NotAllowedError') {
          setError('Bạn đã từ chối quyền truy cập camera. Vui lòng cho phép trong cài đặt trình duyệt.');
        } else if (err.name === 'NotFoundError') {
          setError('Không tìm thấy camera. Vui lòng kiểm tra thiết bị.');
        } else {
          setError(`Không thể truy cập camera: ${err.message}`);
        }
      }
    };

    initCamera();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [mode]);

  // Initialize camera button handler
  // Initialize camera button handler
  const startCamera = useCallback(() => {
    setMode('camera');
  }, []);

  // Process image with AI
  const processImage = useCallback(async (imageFile) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const recognition = await recognizeImage(imageFile, { level });
      setResult(recognition);
    } catch (err) {
      console.error('Recognition error:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          localStorage.removeItem('access_token');
          navigate('/login');
        }, 2000);
      } else if (err.response?.status === 500) {
        setError('Lỗi server. Vui lòng thử lại sau.');
      } else {
        setError(
          err.response?.data?.detail ||
          'Không thể nhận diện hình ảnh. Vui lòng thử lại.'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  }, [level, navigate]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      setMode(null);
    }
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        setImagePreview(URL.createObjectURL(blob));
        stopCamera();
        await processImage(file);
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera, processImage]);

  // Handle file upload
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setMode('upload');
    processImage(file);
  }, [processImage]);

  // Play pronunciation audio using Web Speech API
  const playPronunciation = (text, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Reset to start
  const reset = () => {
    stopCamera();
    setMode(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  // Render vocabulary card
  const VocabularyCard = ({ obj, isPrimary = false }) => {
    const vocab = obj.vocabulary;
    
    return (
      <div className={`p-6 rounded-xl border-2 ${
        isPrimary 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Word Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {isPrimary && (
                <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                  PRIMARY
                </span>
              )}
              <span className="text-sm text-gray-500 font-medium">
                {vocab.word_type}
              </span>
              <span className="text-xs text-gray-400">
                {Math.round(obj.confidence * 100)}% confident
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {vocab.word}
            </h3>
          </div>
          <button
            onClick={() => playPronunciation(vocab.word)}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            title="Phát âm"
          >
            <MdVolumeUp className="w-6 h-6" />
          </button>
        </div>

        {/* IPA Pronunciation */}
        <div className="mb-4 p-3 bg-white bg-opacity-70 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">🇺🇸 US</p>
              <p className="text-xl font-mono text-blue-600">{vocab.ipa_us}</p>
            </div>
            {vocab.ipa_uk && (
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">🇬🇧 UK</p>
                <p className="text-xl font-mono text-blue-600">{vocab.ipa_uk}</p>
              </div>
            )}
          </div>
        </div>

        {/* Definition */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <MdBook className="w-4 h-4" />
            Definition:
          </p>
          <p className="text-gray-700 leading-relaxed">{vocab.definition}</p>
        </div>

        {/* Example */}
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
          <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" /> Example:
            <button
              onClick={() => playPronunciation(vocab.example_sentence)}
              className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600"
              title="Phát âm câu ví dụ"
            >
              <MdVolumeUp className="w-3 h-3" />
            </button>
          </p>
          <p className="text-gray-800 italic mb-2">"{vocab.example_sentence}"</p>
          {vocab.example_translation && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MdLanguage className="w-4 h-4" />
              {vocab.example_translation}
            </p>
          )}
        </div>

        {/* Synonyms */}
        {vocab.synonyms && vocab.synonyms.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Library className="w-4 h-4" /> Related Words:
            </p>
            <div className="flex flex-wrap gap-2">
              {vocab.synonyms.map((syn, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {syn}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
          <Camera className="w-10 h-10 text-blue-600" /> AI Vocabulary Finder
        </h1>
        <p className="text-gray-600 text-lg">
          Chụp ảnh đồ vật → Học từ vựng tiếng Anh với phiên âm IPA!
        </p>
      </div>

      {/* Settings */}
      {!mode && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-md">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Settings className="w-5 h-5" /> Cài đặt</h3>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trình độ tiếng Anh
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            >
              <option value="beginner">• Beginner (A1-A2)</option>
              <option value="intermediate">• Intermediate (B1-B2)</option>
              <option value="advanced">• Advanced (C1-C2)</option>
            </select>
          </div>
        </div>
      )}

      {/* Mode Selection */}
      {!mode && !imagePreview && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={startCamera}
            className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-blue-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <MdCameraAlt className="w-20 h-20 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xl text-gray-700 flex items-center gap-2"><Camera className="w-6 h-6" /> Mở Camera</span>
            <span className="text-sm text-gray-500 mt-2">Chụp ảnh trực tiếp</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-green-300 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <MdUpload className="w-20 h-20 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xl text-gray-700 flex items-center gap-2"><Folder className="w-6 h-6" /> Tải ảnh lên</span>
            <span className="text-sm text-gray-500 mt-2">Từ thư viện</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Camera View - Show loading or video */}
      {mode === 'camera' && !imagePreview && (
        <div className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative bg-black" style={{ minHeight: '400px' }}>
            {/* Loading overlay */}
            {isCameraLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-70">
                <div className="text-center">
                  <MdAutorenew className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold text-white">Đang khởi động camera...</p>
                  <p className="text-sm text-gray-300 mt-2">Vui lòng cho phép truy cập camera khi trình duyệt hỏi</p>
                </div>
              </div>
            )}
            
            {/* Video element - always rendered when in camera mode */}
            <video
              ref={videoRef}
              className="w-full"
              autoPlay
              playsInline
              muted
              style={{ 
                display: 'block',
                minHeight: '400px',
                maxHeight: '70vh',
                width: '100%',
                objectFit: 'cover'
              }}
            />
            
            {/* Camera controls - only show when active */}
            {isCameraActive && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={capturePhoto}
                  className="bg-white text-gray-800 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 shadow-2xl flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <MdCameraAlt className="w-6 h-6" />
                  Chụp ảnh
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                  }}
                  className="bg-red-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-red-600 shadow-2xl flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <MdClose className="w-6 h-6" />
                  Hủy
                </button>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-gray-100"
            />
            <button
              onClick={reset}
              className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-full hover:bg-red-600 shadow-lg"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-md">
          <MdAutorenew className="w-16 h-16 text-blue-500 animate-spin mb-4" />
          <p className="text-xl text-gray-600">Đang nhận diện và phân tích...</p>
          <p className="text-sm text-gray-500 mt-2">AI đang xử lý hình ảnh của bạn</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-red-800 text-lg flex items-center gap-2"><XCircle className="w-5 h-5" /> {error}</p>
        </div>
      )}

      {/* Recognition Results */}
      {result && result.success && (
        <div className="space-y-6">
          {/* Scene Description */}
          {result.scene_description && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl">
              <p className="text-gray-700 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span className="font-semibold">Scene: </span>
                {result.scene_description}
              </p>
            </div>
          )}

          {/* Primary Object */}
          {result.primary_object && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center">1</span>
                Từ vựng chính
              </h2>
              <VocabularyCard obj={result.primary_object} isPrimary={true} />
            </div>
          )}

          {/* Other Objects */}
          {result.other_objects && result.other_objects.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-gray-500 text-white w-10 h-10 rounded-full flex items-center justify-center">+</span>
                Các đồ vật khác
              </h2>
              <div className="grid gap-4">
                {result.other_objects.map((obj, idx) => (
                  <VocabularyCard key={idx} obj={obj} isPrimary={false} />
                ))}
              </div>
            </div>
          )}

          {/* Try Again Button */}
          <button
            onClick={reset}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 shadow-lg flex items-center justify-center gap-2"
          >
            <MdCameraAlt className="w-6 h-6" />
            Chụp ảnh mới
          </button>
        </div>
      )}

      {/* Message */}
      {result && result.message && (
        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl">
          <p className="text-blue-800 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" /> {result.message}</p>
        </div>
      )}
    </div>
  );
};

export default ImageRecognition;
