import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Search, X, CheckCircle, XCircle, Upload, FileSpreadsheet, Eye } from 'lucide-react';
import { classesAPI } from '../services/api';

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
    if (isOpen && classId && mode === 'email') {
      loadSuggestions();
    }
  }, [isOpen, classId, mode]);

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
      
      // Parse error message
      let errorMessage = 'Lỗi khi xem trước file Excel';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('❌ Lỗi Preview Excel\n\n' + errorMessage);
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
      
      // Parse error message with better formatting
      let errorMessage = 'Lỗi khi import file Excel';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show formatted error
      alert('❌ Lỗi Import Excel\n\n' + errorMessage);
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
                </>
              )}

              {/* Excel Mode */}
              {mode === 'excel' && (
                <>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-medium text-green-800 mb-3 flex items-center">
                      <span className="text-xl mr-2">📊</span>
                      Hướng dẫn Import Excel (Tự động tạo + Thêm vào lớp):
                    </h3>
                    <ul className="text-green-700 text-sm space-y-2">
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span><strong>Cột bắt buộc:</strong> STT, Mã học sinh, Họ và tên</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">🔄</span>
                        <span><strong>Tự động tạo tài khoản:</strong> Nếu học sinh chưa có trong hệ thống</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">📧</span>
                        <span><strong>Email tự động:</strong> [Mã học sinh]@gmail.com (VD: 2102150966@gmail.com)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">🔐</span>
                        <span><strong>Password:</strong> Mật khẩu mặc định cho tài khoản mới (tùy chỉnh bên dưới)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✅</span>
                        <span><strong>Kết quả:</strong> Tất cả học sinh được thêm vào lớp ngay lập tức</span>
                      </li>
                    </ul>
                    <div className="mt-4 pt-3 border-t border-green-300">
                      <p className="text-green-800 text-sm font-medium mb-2">💡 Tip: Sử dụng file Excel mẫu</p>
                      <button
                        onClick={() => {
                          const csvContent = `STT,Mã học sinh,Họ và tên,Ngày sinh
1,2102150966,Bàn Thảo An,27/01/2015
2,2102150967,Dương Tuệ Anh,20/08/2015
3,2102150968,Lê Duy Quang Anh,02/11/2015
4,2102150969,Lê Ngọc Minh Anh,15/03/2015
5,2102150970,Nguyễn Diệp Anh,08/06/2015`;
                          const BOM = '\uFEFF';
                          const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          const url = URL.createObjectURL(blob);
                          link.setAttribute('href', url);
                          link.setAttribute('download', 'mau_danh_sach_lop_hoc.csv');
                          link.style.visibility = 'hidden';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Tải file Excel mẫu
                      </button>
                    </div>
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

          {/* Step 2: Excel Preview */}
          {step === 2 && previewData && (
            <div className="space-y-6">
              <div className="text-center">
                <Eye className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Xem trước dữ liệu Excel
                </h3>
                <p className="text-gray-600">
                  Kiểm tra thông tin trước khi import
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {previewData.total_students}
                  </div>
                  <div className="text-blue-800 text-sm">Tổng học sinh</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {previewData.new_accounts.length}
                  </div>
                  <div className="text-green-800 text-sm">Tài khoản mới</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {previewData.existing_accounts.length}
                  </div>
                  <div className="text-yellow-800 text-sm">Đã có tài khoản</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {previewData.already_in_class.length}
                  </div>
                  <div className="text-gray-800 text-sm">Đã trong lớp</div>
                </div>
              </div>

              {previewData.preview.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Preview dữ liệu (10 dòng đầu):</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">STT</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mã học sinh</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Họ và tên</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.preview.map((student, index) => {
                          const isNew = previewData.new_accounts.some(s => s.ma_hoc_sinh === student.ma_hoc_sinh);
                          const isExisting = previewData.existing_accounts.some(s => s.ma_hoc_sinh === student.ma_hoc_sinh);
                          const isInClass = previewData.already_in_class.some(s => s.ma_hoc_sinh === student.ma_hoc_sinh);
                          
                          let statusClass = '';
                          let statusText = '';
                          
                          if (isInClass) {
                            statusClass = 'text-gray-600 bg-gray-100';
                            statusText = 'Đã trong lớp';
                          } else if (isNew) {
                            statusClass = 'text-green-600 bg-green-100';
                            statusText = 'Tạo mới';
                          } else if (isExisting) {
                            statusClass = 'text-blue-600 bg-blue-100';
                            statusText = 'Thêm vào lớp';
                          }
                          
                          return (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2 text-sm">{student.stt}</td>
                              <td className="px-4 py-2 text-sm font-medium">{student.ma_hoc_sinh}</td>
                              <td className="px-4 py-2 text-sm">{student.ho_va_ten}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs ${statusClass}`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleExcelSubmit}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Upload size={16} className="mr-2" />
                  {loading ? 'Đang import...' : 'Xác nhận Import'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && addResult && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Hoàn thành!
                </h3>
                <p className="text-gray-600">
                  {mode === 'excel' ? 'Import Excel' : 'Thêm học sinh'} đã hoàn tất
                </p>
              </div>

              {/* Summary for Excel Import */}
              {mode === 'excel' && addResult.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {addResult.summary.total_processed}
                    </div>
                    <div className="text-blue-800 text-sm">Tổng xử lý</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {addResult.summary.new_accounts_created}
                    </div>
                    <div className="text-green-800 text-sm">Tạo tài khoản</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {addResult.summary.successfully_added}
                    </div>
                    <div className="text-blue-800 text-sm">Thêm vào lớp</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {addResult.summary.failures}
                    </div>
                    <div className="text-red-800 text-sm">Thất bại</div>
                  </div>
                </div>
              )}

              {/* Summary for Email Mode */}
              {mode === 'email' && (
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
              )}

              {/* Success Results */}
              {((mode === 'email' && addResult.added_students?.length > 0) || 
                (mode === 'excel' && addResult.added_to_class?.length > 0)) && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Học sinh đã thêm vào lớp:</h4>
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
                        {(mode === 'email' ? addResult.added_students : addResult.added_to_class)?.map((student, index) => (
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

              {/* Created Accounts (Excel only) */}
              {mode === 'excel' && addResult.created_accounts?.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-800 mb-3">Tài khoản mới được tạo:</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-green-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-green-700">Họ và tên</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-green-700">Email</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-green-700">Mã HS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addResult.created_accounts.map((student, index) => (
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

              {/* Failed Results */}
              {((mode === 'email' && addResult.failed_emails?.length > 0) || 
                (mode === 'excel' && addResult.failed_students?.length > 0)) && (
                <div>
                  <h4 className="font-medium text-red-800 mb-3">
                    {mode === 'email' ? 'Email không thể thêm:' : 'Học sinh không thể xử lý:'}
                  </h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-red-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-red-700">
                            {mode === 'email' ? 'Email' : 'Mã học sinh'}
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Lỗi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(mode === 'email' ? addResult.failed_emails : addResult.failed_students)?.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-sm">
                              {mode === 'email' ? item.email : item.ma_hoc_sinh}
                            </td>
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