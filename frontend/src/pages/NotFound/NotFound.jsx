import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Animation */}
        <div className="relative mb-8">
          <div className="text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 leading-none animate-pulse">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center animate-bounce">
              <Search className="w-16 h-16 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          </p>
          <p className="text-gray-500 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all hover:scale-105 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all hover:scale-105 shadow-lg"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </button>

            <button
              onClick={() => navigate('/my-classes')}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all hover:scale-105 shadow-lg"
            >
              <BookOpen className="w-5 h-5" />
              My Classes
            </button>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/news')}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              📰 News
            </button>
            <button
              onClick={() => navigate('/materials')}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              📚 Materials
            </button>
            <button
              onClick={() => navigate('/exercises')}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              ✏️ Exercises
            </button>
            <button
              onClick={() => navigate('/discussion')}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              💬 Discussion
            </button>
          </div>
        </div>

        {/* Footer Message */}
        <p className="mt-8 text-gray-500 text-sm">
          Need help? Contact support or visit our help center.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
