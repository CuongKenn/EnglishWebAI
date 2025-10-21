import React, { useState } from 'react';
import { Search, Book, Users, Award, TrendingUp, Star, Play, ChevronRight, Menu, X, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const grades = [
    { id: 'kindergarten', name: 'Mẫu giáo', courses: 1, color: 'bg-pink-500' },
    { id: 'grade1', name: 'Lớp 1', courses: 3, color: 'bg-orange-500' },
    { id: 'grade2', name: 'Lớp 2', courses: 3, color: 'bg-amber-500' },
    { id: 'grade3', name: 'Lớp 3', courses: 6, color: 'bg-yellow-500' },
    { id: 'grade4', name: 'Lớp 4', courses: 6, color: 'bg-lime-500' },
    { id: 'grade5', name: 'Lớp 5', courses: 6, color: 'bg-green-500' },
    { id: 'grade6', name: 'Lớp 6', courses: 10, color: 'bg-emerald-500' },
    { id: 'grade7', name: 'Lớp 7', courses: 11, color: 'bg-teal-500' },
    { id: 'grade8', name: 'Lớp 8', courses: 13, color: 'bg-cyan-500' },
    { id: 'grade9', name: 'Lớp 9', courses: 8, color: 'bg-sky-500' },
    { id: 'grade10', name: 'Lớp 10', courses: 6, color: 'bg-blue-500' },
    { id: 'grade11', name: 'Lớp 11', courses: 4, color: 'bg-indigo-500' },
    { id: 'grade12', name: 'Lớp 12', courses: 6, color: 'bg-violet-500' }
  ];

  const featuredCourses = [
    {
      id: 1,
      title: 'Basic English Grammar',
      level: 'Beginner',
      students: 1234,
      rating: 4.8,
      progress: 45,
      image: '📚',
      bgColor: 'from-blue-400 to-blue-600'
    },
    {
      id: 2,
      title: 'Conversation Skills',
      level: 'Intermediate',
      students: 892,
      rating: 4.9,
      progress: 30,
      image: '💬',
      bgColor: 'from-purple-400 to-purple-600'
    },
    {
      id: 3,
      title: 'IELTS Preparation',
      level: 'Advanced',
      students: 567,
      rating: 4.7,
      progress: 15,
      image: '🎯',
      bgColor: 'from-pink-400 to-pink-600'
    }
  ];

  const learningStats = [
    { icon: <Book className="w-6 h-6" />, label: 'Khóa học', value: '12', color: 'bg-blue-500' },
    { icon: <TrendingUp className="w-6 h-6" />, label: 'Tiến độ', value: '67%', color: 'bg-green-500' },
    { icon: <Award className="w-6 h-6" />, label: 'Điểm số', value: '850', color: 'bg-yellow-500' },
    { icon: <Star className="w-6 h-6" />, label: 'Huy hiệu', value: '8', color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform hover:scale-110 transition-transform">
                AI
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                English Coach
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Học bài</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Hỏi bài</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Kiểm tra</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Thư viện</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Trợ giúp</a>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User className="w-6 h-6 text-gray-600" />
              </button>
              <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <a href="#" className="block py-2 text-gray-700 hover:text-blue-600">Học bài</a>
            <a href="#" className="block py-2 text-gray-700 hover:text-blue-600">Hỏi bài</a>
            <a href="#" className="block py-2 text-gray-700 hover:text-blue-600">Kiểm tra</a>
            <a href="#" className="block py-2 text-gray-700 hover:text-blue-600">Thư viện</a>
            <a href="#" className="block py-2 text-gray-700 hover:text-blue-600">Trợ giúp</a>
          </nav>
        </div>
      )}

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Học Tiếng Anh cùng AI 🚀
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Trải nghiệm học tập thông minh với trợ lý AI - Luyện tập mọi lúc, mọi nơi!
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm bài học, bài tập, mẹo học..."
                  className="w-full px-6 py-4 rounded-full text-gray-800 shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/50 text-lg"
                />
                <button className="absolute right-2 top-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-2 rounded-full hover:shadow-lg transition-all">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {learningStats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 hover:bg-white/20 transition-all transform hover:scale-105">
                  <div className={`${stat.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-white`}>
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Continue Learning */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Tiếp tục học 📖</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
              Xem tất cả <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <div key={course.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2">
                <div className={`h-40 bg-gradient-to-br ${course.bgColor} flex items-center justify-center text-6xl relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all"></div>
                  <span className="relative z-10">{course.image}</span>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-800">
                    {course.level}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.students}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                      {course.rating}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Tiến độ</span>
                      <span className="font-semibold text-blue-600">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center group">
                    <Play className="w-5 h-5 mr-2" />
                    Tiếp tục học
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Grades Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Các lớp học 🎓</h2>
          <p className="text-gray-600 mb-6">Chọn khóa học phù hợp với trình độ của bạn</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {grades.map((grade) => (
              <button
                key={grade.id}
                className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden"
              >
                <div className={`absolute inset-0 ${grade.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className="relative z-10">
                  <div className={`w-16 h-16 ${grade.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                    {grade.name.match(/\d+/)?.[0] || '🌟'}
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-800 mb-1">{grade.name}</div>
                    <div className="text-sm text-gray-500">{grade.courses} khóa học</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* AI Assistant Banner */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48"></div>
            
            <div className="relative z-10 max-w-2xl">
              <div className="text-5xl mb-4">🤖</div>
              <h2 className="text-4xl font-bold mb-4">Trợ lý AI của bạn</h2>
              <p className="text-xl mb-6 text-white/90">
                Hỏi bất cứ điều gì về Tiếng Anh! AI sẽ giúp bạn giải đáp mọi thắc mắc, chấm bài và đưa ra lời khuyên cá nhân hóa.
              </p>
              <button className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105">
                Bắt đầu chat ngay! 💬
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl">
                  AI
                </div>
                <span className="text-xl font-bold">English Coach</span>
              </div>
              <p className="text-gray-400">Học Tiếng Anh thông minh với công nghệ AI</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Khóa học</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Mẫu giáo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tiểu học</a></li>
                <li><a href="#" className="hover:text-white transition-colors">THCS</a></li>
                <li><a href="#" className="hover:text-white transition-colors">THPT</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Theo dõi</h3>
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  f
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                  📷
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                  ▶
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 AI English Coach. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentHomePage;