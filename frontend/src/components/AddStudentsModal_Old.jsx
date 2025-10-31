import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Search, X, CheckCircle, XCircle, Upload, FileSpreadsheet, Eye } from 'lucide-react';
import { classesAPI } from '../../../services/api';

const AddStudentsModal = ({ isOpen, onClose, classId, className, onSuccess }) => {
  const [mode, setMode] = useState('email'); // 'email' hoặc 'excel'
  const [step, setStep] = useState(1); // 1: input/upload, 2: preview (excel only), 3: result
  const [emails, setEmails] = useState(['']);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [addResult, setAddResult] = useState(null);
  
  // Excel import states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [defaultPassword, setDefaultPassword] = useState('123456');

  useEffect(() => {
    if (isOpen && classId) {
      loadSuggestions();
    }
  }, [isOpen, classId]);

  const loadSuggestions = async (search = '') => {
    try {
      const response = await classesAPI.get(`/${classId}/students/available-emails`, {
        params: { search, limit: 20 }
      });
      setSuggestions(response.data.available_students || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      loadSuggestions(value);
    } else {
      loadSuggestions();
    }
  };

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const updateEmail = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addFromSuggestion = (email) => {
    // Thêm email vào ô trống đầu tiên hoặc tạo ô mới
    const emptyIndex = emails.findIndex(e => e === '');
    if (emptyIndex !== -1) {
      updateEmail(emptyIndex, email);
    } else {
      setEmails([...emails, email]);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'email') {
      await handleEmailSubmit();
    } else {
      await handleExcelSubmit();
    }
  };

  const handleEmailSubmit = async () => {
    const validEmails = emails.filter(email => email.trim() !== '');
    
    if (validEmails.length === 0) {
      alert('Vui lòng nhập ít nhất một email');
      return;
    }

    setLoading(true);
    try {
      const response = await classesAPI.post(`/${classId}/students/add-by-email`, {
        emails: validEmails
      });
      
      setAddResult(response.data);
      setStep(3);
      
      if (response.data.success_count > 0) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error adding students:', error);
      alert(error.response?.data?.detail || 'Lỗi khi thêm học sinh');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      event.target.value = '';
    }
  };

  const handlePreviewExcel = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file Excel');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await classesAPI.post(`/${classId}/students/import-excel/preview`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPreviewData(response.data);
      setStep(2);
    } catch (error) {
      console.error('Error previewing Excel:', error);
      alert(error.response?.data?.detail || 'Lỗi khi xem trước file Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelSubmit = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file Excel');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('default_password', defaultPassword);

      const response = await classesAPI.post(`/${classId}/students/import-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setAddResult(response.data);
      setStep(3);
      
      if (response.data.success_count > 0) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert(error.response?.data?.detail || 'Lỗi khi import file Excel');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setMode('email');
    setEmails(['']);
    setSearchTerm('');
    setSuggestions([]);
    setAddResult(null);
    setSelectedFile(null);
    setPreviewData(null);
    setDefaultPassword('123456');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Thêm Học Sinh Vào Lớp
              </h2>
              <p className="text-gray-600 mt-1">
                Lớp: <span className="font-medium">{className}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Step 1: Choose Mode & Input */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Mode Selection */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">Chọn phương thức thêm học sinh:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('email')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      mode === 'email' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Mail className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Nhập Email</div>
                    <div className="text-sm text-gray-600">Thêm từng email học sinh</div>
                  </button>
                  
                  <button
                    onClick={() => setMode('excel')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      mode === 'excel' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-medium">Import Excel</div>
                    <div className="text-sm text-gray-600">Tải file Excel danh sách</div>
                  </button>
                </div>
              </div>

              {/* Email Mode */}
              {mode === 'email' && (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Hướng dẫn:</h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Nhập email của các học sinh cần thêm vào lớp</li>
                      <li>• Chỉ những học sinh đã được tạo tài khoản mới có thể được thêm</li>
                      <li>• Email có dạng: [mã học sinh]@gmail.com</li>
                      <li>• Sử dụng gợi ý bên dưới để chọn nhanh</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Email Input */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-800">Danh sách Email:</h3>
                      
                      {emails.map((email, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="flex-1">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => updateEmail(index, e.target.value)}
                              placeholder="Nhập email học sinh..."
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          {emails.length > 1 && (
                            <button
                              onClick={() => removeEmailField(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button
                        onClick={addEmailField}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <UserPlus size={16} className="mr-1" />
                        Thêm ô email
                      </button>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-800">Học sinh có thể thêm:</h3>
                      
                      <div className="relative">
                        <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="Tìm kiếm học sinh..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {suggestions.map((student) => (
                          <div
                            key={student.id}
                            onClick={() => addFromSuggestion(student.email)}
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {student.full_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {student.email} • {student.username}
                              </div>
                            </div>
                            <UserPlus size={16} className="text-blue-500" />
                          </div>
                        ))}
                        {suggestions.length === 0 && (
                          <p className="text-gray-500 text-center py-4">
                            Không có học sinh phù hợp
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Excel Mode */}
              {mode === 'excel' && (
                <>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2">Hướng dẫn Import Excel:</h3>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• File Excel phải có các cột: STT, Mã học sinh, Họ và tên, Ngày sinh (tùy chọn)</li>
                      <li>• Hệ thống sẽ tự động tạo tài khoản cho học sinh chưa có</li>
                      <li>• Email sẽ được tạo theo dạng: [mã học sinh]@gmail.com</li>
                      <li>• Mật khẩu mặc định cho tài khoản mới có thể tùy chỉnh</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn file Excel (.xlsx, .xls):
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      {selectedFile && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu mặc định cho tài khoản mới:
                      </label>
                      <input
                        type="text"
                        value={defaultPassword}
                        onChange={(e) => setDefaultPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mặc định..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    {selectedFile && (
                      <div className="flex space-x-3">
                        <button
                          onClick={handlePreviewExcel}
                          disabled={loading}
                          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                        >
                          <Eye size={16} className="mr-2" />
                          {loading ? 'Đang xem trước...' : 'Xem trước'}
                        </button>
                        
                        <button
                          onClick={() => handleExcelSubmit()}
                          disabled={loading}
                          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                        >
                          <Upload size={16} className="mr-2" />
                          {loading ? 'Đang import...' : 'Import ngay'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                    {suggestions.length > 0 ? (
                      suggestions.map((student) => (
                        <div
                          key={student.id}
                          className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => addFromSuggestion(student.email)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-800">
                                {student.full_name}
                              </div>
                              <div className="text-sm text-blue-600">
                                {student.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {student.username}
                              </div>
                            </div>
                            <button className="text-blue-500 hover:text-blue-700">
                              <UserPlus size={20} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {searchTerm ? 'Không tìm thấy học sinh' : 'Đang tải...'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || emails.filter(e => e.trim()).length === 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="mr-2" />
                      Thêm học sinh
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Result */}
          {step === 2 && addResult && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Hoàn Thành!
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {addResult.success_count}
                  </div>
                  <div className="text-green-800">Thêm thành công</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {addResult.failed_count}
                  </div>
                  <div className="text-red-800">Thất bại</div>
                </div>
              </div>

              {addResult.added_students.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Học sinh đã thêm:</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Họ và tên</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mã HS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addResult.added_students.map((student, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-sm">{student.full_name}</td>
                            <td className="px-4 py-2 text-sm text-blue-600">{student.email}</td>
                            <td className="px-4 py-2 text-sm font-medium">{student.username}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {addResult.failed_emails.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 mb-3">Email không thể thêm:</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-red-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Email</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Lỗi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addResult.failed_emails.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-sm">{item.email}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{item.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddStudentsModal;