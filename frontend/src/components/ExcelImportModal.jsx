import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Users } from 'lucide-react';
import apiClient from '../services/api';

const ExcelImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: result
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [defaultPassword, setDefaultPassword] = useState('123456');

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setImporting(false);
    setImportResult(null);
    setDefaultPassword('123456');
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/v1/admin/import/students/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPreview(response.data);
      setStep(2);
    } catch (error) {
      console.error('Preview error:', error);
      
      // Parse error message
      let errorMessage = 'Lỗi không xác định khi preview file';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Hiển thị alert với line breaks
      alert('❌ Lỗi Preview Excel\n\n' + errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('default_password', defaultPassword);

      const response = await apiClient.post('/api/v1/admin/import/students/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);
      setStep(3);
      
      if (response.data.success_count > 0) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Import error:', error);
      
      // Parse error message
      let errorMessage = 'Lỗi không xác định khi import học sinh';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Format error message for alert
      const formattedError = errorMessage.split('\n').join('\n');
      
      // Show alert with formatted message
      alert('❌ Lỗi Import Excel\n\n' + formattedError + '\n\n💡 Gợi ý:\n- Thử convert file sang .xlsx\n- Hoặc tải file mẫu và copy dữ liệu vào\n- Kiểm tra file không bị password protection');
      
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Tạo file Excel mẫu với UTF-8 BOM để Excel hiển thị đúng tiếng Việt
    const csvContent = `STT,Mã học sinh,Họ và tên,Ngày sinh
1,2102150966,Bàn Thảo An,27/01/2015
2,2102150967,Dương Tuệ Anh,20/08/2015
3,2102150968,Lê Duy Quang Anh,02/11/2015
4,2102150969,Lê Ngọc Minh Anh,15/03/2015
5,2102150970,Nguyễn Diệp Anh,08/06/2015
6,2200157681,Nguyễn Hoàng Anh,12/09/2015
7,2102150971,Nguyễn Nam Anh,25/12/2015
8,2102150972,Nông Trâm Anh,03/04/2015
9,2102150973,Trịnh Kim Anh,18/07/2015
10,2102150975,Nguyễn Liên Chi,21/10/2015`;
    
    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'mau_danh_sach_hoc_sinh.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Import Học Sinh từ Excel
            </h2>
            <button
              onClick={() => { resetModal(); onClose(); }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mb-6">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Chọn File</span>
            </div>
            <div className={`w-16 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Xem Trước</span>
            </div>
            <div className={`w-16 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Kết Quả</span>
            </div>
          </div>

          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                  <span className="text-xl mr-2">📋</span>
                  Hướng dẫn Import Excel:
                </h3>
                <ul className="text-blue-700 text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span><strong>Cột bắt buộc:</strong> STT, Mã học sinh, Họ và tên</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span><strong>Username:</strong> Tự động = Mã học sinh (VD: 2102150966)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span><strong>Email:</strong> Tự động = [Mã học sinh]@gmail.com</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span><strong>Password:</strong> Mật khẩu mặc định (có thể tùy chỉnh bên dưới)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span>Hệ thống tự động bỏ qua các dòng header thừa và dòng trống</span>
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-blue-300">
                  <p className="text-blue-800 text-sm font-medium mb-2">📄 Tải file mẫu để bắt đầu:</p>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Tải file Excel mẫu (CSV)
                  </button>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-file"
                />
                <label htmlFor="excel-file" className="cursor-pointer">
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    Chọn file Excel
                  </div>
                  <div className="text-gray-500 mb-4">
                    Kéo thả file hoặc click để chọn
                  </div>
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg inline-block hover:bg-blue-600">
                    Chọn File
                  </div>
                </label>
              </div>

              {file && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <div>
                        <span className="font-medium text-green-800">
                          Đã chọn: {file.name}
                        </span>
                        <div className="text-sm text-green-600">
                          Kích thước: {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mặc định cho tất cả học sinh:
                  </label>
                  <input
                    type="text"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    placeholder="Nhập mật khẩu mặc định"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { resetModal(); onClose(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                {file && (
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePreview}
                      disabled={importing}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        'Xem Trước'
                      )}
                    </button>
                    
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang import...
                        </>
                      ) : (
                        'Import Trực Tiếp'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && preview && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-medium text-green-800">
                    Tìm thấy {preview.total_students} học sinh trong file
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-3">Xem trước dữ liệu:</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">STT</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mã HS</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Họ và tên</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email sẽ tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.map((student, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2 text-sm">{student.stt}</td>
                          <td className="px-4 py-2 text-sm font-medium">{student.ma_hoc_sinh}</td>
                          <td className="px-4 py-2 text-sm">{student.ho_va_ten}</td>
                          <td className="px-4 py-2 text-sm text-blue-600">{student.ma_hoc_sinh}@gmail.com</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.total_students > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Và {preview.total_students - 10} học sinh khác...
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">Lưu ý:</div>
                    <div className="text-yellow-700 text-sm">
                      Các học sinh đã tồn tại sẽ bị bỏ qua. Mật khẩu mặc định: <strong>{defaultPassword}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang import...
                    </>
                  ) : (
                    'Bắt đầu Import'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && importResult && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Import Hoàn Thành!
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.success_count}
                  </div>
                  <div className="text-green-800">Thành công</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.failed_count}
                  </div>
                  <div className="text-red-800">Thất bại</div>
                </div>
              </div>

              {importResult.created_students.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Học sinh đã tạo thành công:</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Username</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Họ và tên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.created_students.map((student, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-sm font-medium">{student.username}</td>
                            <td className="px-4 py-2 text-sm text-blue-600">{student.email}</td>
                            <td className="px-4 py-2 text-sm">{student.full_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResult.failed_students.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 mb-3">Học sinh không thể tạo:</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-red-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Mã HS</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Họ và tên</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-red-700">Lỗi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.failed_students.map((student, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-sm">{student.ma_hoc_sinh}</td>
                            <td className="px-4 py-2 text-sm">{student.ho_va_ten}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{student.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => { resetModal(); onClose(); }}
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

export default ExcelImportModal;