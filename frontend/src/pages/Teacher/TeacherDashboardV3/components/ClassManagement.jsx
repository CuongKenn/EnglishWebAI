import { useState, useEffect } from 'react';
import { Users, UserPlus, Upload, Download, Search, Trash2, Mail, User, CheckCircle, XCircle, FileText, Presentation } from 'lucide-react';
import { apiV1 } from '../../../../services/api';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';
import './ClassManagement.css';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'file'
  });
  const { toast, showSuccess, showError, showWarning, showInfo, hideToast } = useToast();
  // Import students state
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      showError('Lỗi khi tải danh sách lớp học!');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    setLoading(true);
    try {
      const response = await apiV1.get(`/classes/${classId}/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      showError('Lỗi khi tải danh sách học sinh!');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = async () => {
    if (!selectedClass) return;
    if (!newStudent.email) {
      showWarning('Vui lòng nhập email học sinh!');
      return;
    }

    setLoading(true);
    try {
      await apiV1.post(`/classes/${selectedClass.id}/students`, {
        identifiers: [newStudent.email],
        idType: 'email',
        status: 'active'
      });
      
      showSuccess('Thêm học sinh thành công!');
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', phone: '' });
      fetchStudents(selectedClass.id); // Refresh list
    } catch (error) {
      console.error('Error adding student:', error);
      showError(error.response?.data?.detail || 'Lỗi khi thêm học sinh! Kiểm tra email');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selectedClass) return;
    if (!confirm('Bạn có chắc?')) return;

    setLoading(true);
    try {
      await apiV1.delete(`/classes/${selectedClass.id}/students/${studentId}`);
      showSuccess('Đã xóa');
      fetchStudents(selectedClass.id); // Refresh list
    } catch (error) {
      console.error('Error removing student:', error);
      showError('Lỗi khi xóa');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async (classId) => {
    setLoading(true);
    try {
      const response = await apiV1.get(`/classes/${classId}/materials`);
      setMaterials(response.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      showError('Lỗi khi tải danh sách tài liệu!');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedClass) {
      showWarning('Vui lòng chọn file và nhập tiêu đề!');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', uploadFile);
      const uploadRes = await apiV1.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Step 2: Create material record
      await apiV1.post('/materials', {
        title: materialForm.title || uploadFile.name,
        description: materialForm.description,
        type: uploadRes.data.file_type || 'file',
        url: uploadRes.data.file_path,
        class_id: selectedClass.id
      });

      showSuccess('Tải lên thành công!');
      setUploadFile(null);
      setMaterialForm({ title: '', description: '', type: 'file' });
      fetchMaterials(selectedClass.id);
    } catch (error) {
      console.error('Error uploading material:', error);
      showError('Lỗi khi tải lên: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Import students handlers
  const handleDownloadTemplate = async () => {
    try {
      const response = await apiV1.get('/classes/students/import-template', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
      showError('Lỗi khi tải file mẫu');
    }
  };

  const handleImportStudents = async () => {
    if (!importFile || !selectedClass) {
      showWarning('Vui lòng chọn file CSV!');
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await apiV1.post(`/classes/${selectedClass.id}/students/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportResults(response.data);
      
      // Refresh students list
      await fetchStudents(selectedClass.id);
      
      // Show success message
      if (response.data.imported > 0) {
        showSuccess(`${response.data.message}\n\nThành công: ${response.data.imported}\nThất bại: ${response.data.failed}`);
      }
      
      // Clear file input
      setImportFile(null);
      
    } catch (error) {
      console.error('Error importing students:', error);
      showError('Lỗi khi import: ' + (error.response?.data?.detail || error.message));
      setImportResults({
        imported: 0,
        failed: 0,
        errors: [error.response?.data?.detail || error.message]
      });
    } finally {
      setImporting(false);
    }
  };

  const renderAddStudentModal = () => (
    <div className="class-modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="class-modal" onClick={(e) => e.stopPropagation()}>
        <div className="class-modal-header">
          <h2>Thêm Học sinh</h2>
          <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
        </div>

        <div className="class-modal-body">
          <div className="form-group-class">
            <label>Email học sinh <span style={{color: 'red'}}>*</span></label>
            <input 
              type="email" 
              className="form-input-class" 
              placeholder="example@gmail.com" 
              value={newStudent.email}
              onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              Nhập email của tài khoản học sinh.
            </small>
          </div>
        </div>

        <div className="class-modal-footer">
          <button className="btn-cancel-class" onClick={() => setShowAddModal(false)}>Hủy</button>
          <button 
            className="btn-add-class"
            onClick={handleAddStudent}
            disabled={loading}
          >
            <UserPlus size={18} />
            {loading ? 'Đang thêm...' : 'Thêm học sinh'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderImportModal = () => (
    <div className="class-modal-overlay" onClick={() => {
      setShowImportModal(false);
      setImportFile(null);
      setImportResults(null);
    }}>
      <div className="class-modal large-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '900px'}}>
        <div className="class-modal-header">
          <h2>📊 Import Học sinh từ CSV/Excel</h2>
          <button className="modal-close-btn" onClick={() => {
            setShowImportModal(false);
            setImportFile(null);
            setImportResults(null);
          }}>×</button>
        </div>

        <div className="class-modal-body">
          {/* Step 1: Download Template */}
          <div className="download-template-section" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            marginBottom: '25px',
            color: 'white'
          }}>
            <div className="template-info" style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '12px',
                borderRadius: '10px'
              }}>
                <Download size={28} />
              </div>
              <div>
                <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600'}}>Bước 1: Tải file mẫu CSV</h4>
                <p style={{margin: '5px 0 0 0', fontSize: '13px', opacity: 0.9}}>
                  Tải xuống file mẫu và điền thông tin học sinh theo đúng định dạng
                </p>
              </div>
            </div>
            <button 
              className="btn-download-template"
              onClick={handleDownloadTemplate}
              style={{
                background: 'white',
                color: '#667eea',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              <Download size={18} />
              Tải file mẫu
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div style={{marginBottom: '25px'}}>
            <h3 style={{marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#1f2937'}}>
              Bước 2: Chọn file CSV đã điền thông tin
            </h3>
            <div className="upload-area" style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              background: importFile ? '#f0fdf4' : '#f8fafc',
              transition: 'all 0.3s'
            }}>
              <input
                type="file"
                id="csv-upload"
                accept=".csv,.txt"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImportFile(file);
                    setImportResults(null);
                  }
                }}
                style={{display: 'none'}}
              />
              
              {!importFile ? (
                <>
                  <Upload size={48} style={{color: '#94a3b8', margin: '0 auto 15px'}} />
                  <h4 style={{margin: '0 0 8px 0', fontSize: '16px', color: '#1f2937'}}>
                    Kéo thả file CSV vào đây
                  </h4>
                  <p style={{margin: '0 0 15px 0', fontSize: '14px', color: '#64748b'}}>hoặc</p>
                  <label 
                    htmlFor="csv-upload"
                    className="btn-browse"
                    style={{
                      display: 'inline-block',
                      background: '#3b82f6',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Upload size={16} style={{display: 'inline', marginRight: '8px'}} />
                    Chọn file từ máy tính
                  </label>
                  <div style={{marginTop: '12px', fontSize: '13px', color: '#64748b'}}>
                    Hỗ trợ: .csv, .txt (Tối đa 5MB)
                  </div>
                </>
              ) : (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px'}}>
                  <CheckCircle size={32} style={{color: '#10b981'}} />
                  <div style={{textAlign: 'left'}}>
                    <div style={{fontSize: '15px', fontWeight: '600', color: '#1f2937'}}>
                      {importFile.name}
                    </div>
                    <div style={{fontSize: '13px', color: '#64748b', marginTop: '4px'}}>
                      {(importFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    onClick={() => setImportFile(null)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Import Results */}
          {importResults && (
            <div style={{
              padding: '20px',
              background: importResults.imported > 0 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${importResults.imported > 0 ? '#86efac' : '#fecaca'}`,
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: importResults.imported > 0 ? '#166534' : '#991b1b'
              }}>
                {importResults.imported > 0 ? '✅ Kết quả Import' : '❌ Import thất bại'}
              </h4>
              <div style={{fontSize: '14px', color: '#1f2937', marginBottom: '12px'}}>
                <div>✅ Thành công: <strong>{importResults.imported}</strong> học sinh</div>
                <div>❌ Thất bại: <strong>{importResults.failed}</strong> học sinh</div>
                <div>📊 Tổng: <strong>{importResults.total}</strong> dòng</div>
              </div>
              {importResults.errors && importResults.errors.length > 0 && (
                <div>
                  <div style={{fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#dc2626'}}>
                    Lỗi chi tiết:
                  </div>
                  <div style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    background: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    {importResults.errors.map((err, idx) => (
                      <div key={idx} style={{marginBottom: '4px'}}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Format Guide */}
          <div className="format-guide" style={{
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{margin: '0 0 15px 0', fontSize: '15px', fontWeight: '600', color: '#1f2937'}}>
              📋 Định dạng file CSV:
            </h4>
            <table className="format-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <thead>
                <tr style={{background: '#e2e8f0'}}>
                  <th style={{padding: '10px', textAlign: 'left', borderBottom: '2px solid #cbd5e1'}}>email</th>
                  <th style={{padding: '10px', textAlign: 'left', borderBottom: '2px solid #cbd5e1'}}>name</th>
                  <th style={{padding: '10px', textAlign: 'left', borderBottom: '2px solid #cbd5e1'}}>phone</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{padding: '10px', borderBottom: '1px solid #e2e8f0'}}>student1@example.com</td>
                  <td style={{padding: '10px', borderBottom: '1px solid #e2e8f0'}}>Nguyễn Văn A</td>
                  <td style={{padding: '10px', borderBottom: '1px solid #e2e8f0'}}>0123456789</td>
                </tr>
                <tr>
                  <td style={{padding: '10px', borderBottom: '1px solid #e2e8f0'}}>student2@example.com</td>
                  <td style={{padding: '10px', borderBottom: '1px solid #e2e8f0'}}>Trần Thị B</td>
                  <td style={{padding: '10px', borderBottom: '1px solid #e2e8f0'}}>0987654321</td>
                </tr>
              </tbody>
            </table>
            <div style={{marginTop: '12px', fontSize: '12px', color: '#64748b'}}>
              <strong>Lưu ý:</strong>
              <ul style={{margin: '8px 0 0 20px', padding: 0}}>
                <li>Cột <code>email</code> là bắt buộc</li>
                <li>Nếu email chưa có tài khoản, hệ thống tự tạo với mật khẩu mặc định: <code>student123</code></li>
                <li>Học sinh cần đổi mật khẩu khi đăng nhập lần đầu</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="class-modal-footer" style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
          <button 
            className="btn-cancel-class" 
            onClick={() => {
              setShowImportModal(false);
              setImportFile(null);
              setImportResults(null);
            }}
            style={{
              padding: '10px 20px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Đóng
          </button>
          <button 
            className="btn-add-class"
            onClick={handleImportStudents}
            disabled={!importFile || importing}
            style={{
              padding: '10px 20px',
              background: importFile && !importing ? '#3b82f6' : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: importFile && !importing ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {importing ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Đang import...
              </>
            ) : (
              <>
                <Upload size={18} />
                Import học sinh
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const getFileIcon = (type) => {
    const icons = {
      presentation: <Presentation size={24} className="file-type-icon presentation" />,
      document: <FileText size={24} className="file-type-icon document" />,
      pdf: <FileText size={24} className="file-type-icon pdf" />,
      image: <FileText size={24} className="file-type-icon image" />,
      audio: <FileText size={24} className="file-type-icon audio" />,
      video: <FileText size={24} className="file-type-icon video" />,
      text: <FileText size={24} className="file-type-icon text" />
    };
    return icons[type] || <FileText size={24} className="file-type-icon" />;
  };

  const renderMaterialsModal = () => (
    <div className="class-modal-overlay" onClick={() => setShowMaterialsModal(false)}>
      <div className="class-modal large-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '900px'}}>
        <div className="class-modal-header">
          <h2>📁 Tài liệu lớp học - {selectedClass?.name}</h2>
          <button className="modal-close-btn" onClick={() => setShowMaterialsModal(false)}>×</button>
        </div>

        <div className="class-modal-body">
          {/* Upload Form */}
          <form onSubmit={handleFileUpload} className="material-upload-form" style={{marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px'}}>
            <h3 style={{marginBottom: '15px', fontSize: '16px', fontWeight: '600'}}>📤 Tải lên tài liệu mới</h3>
            <div style={{display: 'grid', gap: '15px'}}>
              <div className="form-group-class">
                <label>Tiêu đề:</label>
                <input 
                  type="text"
                  className="form-input-class"
                  placeholder="Tên tài liệu..."
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                />
              </div>
              <div className="form-group-class">
                <label>Mô tả (tùy chọn):</label>
                <textarea 
                  className="form-input-class"
                  placeholder="Mô tả nội dung..."
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                  rows="2"
                  style={{resize: 'vertical'}}
                />
              </div>
              <div className="form-group-class">
                <label>Chọn file (PDF, Word, PowerPoint, Image, Audio, Video):</label>
                <input 
                  type="file"
                  className="form-input-class"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.mp3,.mp4"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  required
                  style={{padding: '8px'}}
                />
                {uploadFile && (
                  <div style={{marginTop: '8px', fontSize: '13px', color: '#666'}}>
                    📎 {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>
            <button 
              type="submit" 
              className="btn-add-class" 
              disabled={!uploadFile || loading}
              style={{marginTop: '15px'}}
            >
              <Upload size={18} />
              {loading ? 'Đang tải lên...' : '📤 Tải lên tài liệu'}
            </button>
          </form>

          {/* Materials List */}
          <div className="materials-list-section">
            <h3 style={{marginBottom: '15px', fontSize: '16px', fontWeight: '600'}}>
              📚 Danh sách tài liệu ({materials.length})
            </h3>
            {loading && materials.length === 0 ? (
              <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                Đang tải...
              </div>
            ) : materials.length === 0 ? (
              <div className="empty-state-class">
                <FileText size={48} strokeWidth={1} />
                <p>Chưa có tài liệu nào</p>
              </div>
            ) : (
              <div style={{display: 'grid', gap: '12px'}}>
                {materials.map(material => (
                  <div 
                    key={material.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '15px',
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }}
                    className="material-card-hover"
                  >
                    <div style={{flexShrink: 0}}>
                      {getFileIcon(material.type)}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <h4 style={{fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#1f2937'}}>
                        {material.title}
                      </h4>
                      <p style={{fontSize: '13px', color: '#6b7280', marginBottom: '6px'}}>
                        {material.description || 'Không có mô tả'}
                      </p>
                      <div style={{display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af'}}>
                        <span>📁 {material.type}</span>
                        <span>📅 {new Date(material.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    {material.url && (
                      <a 
                        href={material.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-action-class secondary"
                        style={{flexShrink: 0}}
                      >
                        <Download size={16} />
                        Tải về
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="class-modal-footer">
          <button className="btn-cancel-class" onClick={() => setShowMaterialsModal(false)}>Đóng</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="class-management-container">
      {/* Header */}
      <div className="class-header">
        <div className="class-header-left">
          <h1>Quản lý Lớp học</h1>
          <p>Quản lý học sinh trong các lớp bạn đang dạy</p>
        </div>
      </div>

      <div className="class-content-wrapper">
        {/* Classes List */}
        <div className="classes-sidebar">
          <div className="sidebar-title">
            <Users size={20} />
      <span>Lớp học của tôi</span>
          </div>
          <div className="classes-list">
            {loading && classes.length === 0 ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
        Đang tải...
              </div>
            ) : classes.length === 0 ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
        Chưa có lớp học nào
              </div>
            ) : (
              classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`class-item ${selectedClass?.id === cls.id ? 'active' : ''}`}
                  onClick={() => setSelectedClass(cls)}
                >
                  <div className="class-item-icon">
                    <Users size={18} />
                  </div>
                  <div className="class-item-info">
                    <div className="class-item-name">{cls.name}</div>
          <div className="class-item-count">{cls.student_count || 0} học sinh</div>
                  </div>
                  {selectedClass?.id === cls.id && <div className="class-item-indicator" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Students List */}
        <div className="students-panel">
          {!selectedClass ? (
            <div className="empty-state-class">
              <Users size={80} strokeWidth={1} />
              <h3>Chọn lớp học</h3>
              <p>Chọn một lớp học bên trái để xem danh sách học sinh</p>
            </div>
          ) : (
            <>
              {/* Panel Header */}
              <div className="panel-header">
                <div className="panel-header-left">
                  <h2>{selectedClass.name}</h2>
                  <span className="student-count-badge">{students.length} học sinh</span>
                </div>
                <div className="panel-header-actions">
                  <button className="btn-action-class primary" onClick={() => setShowAddModal(true)}>
                    <UserPlus size={18} />
                    Thêm học sinh
                  </button>
                  <button className="btn-action-class secondary" onClick={() => setShowImportModal(true)}>
                    <Upload size={18} />
                    Import Excel
                  </button>
                  <button className="btn-action-class secondary" onClick={() => {
                    setShowMaterialsModal(true);
                    fetchMaterials(selectedClass.id);
                  }}>
                    <FileText size={18} />
                    Tài liệu lớp học
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="search-bar-class">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-class"
                />
              </div>

              {/* Students Table */}
              <div className="students-table">
                {loading ? (
                  <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
          Đang tải danh sách học sinh...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="empty-search-state">
                    <Search size={48} strokeWidth={1} />
          <p>{searchTerm ? 'Không tìm thấy học sinh nào' : 'Chưa có học sinh trong lớp'}</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="student-row">
                      <div className="student-row-left">
                        <div className="student-avatar">
                          <User size={20} />
                        </div>
                        <div className="student-info">
                          <div className="student-name">{student.name}</div>
                          <div className="student-email">
                            <Mail size={14} />
                            {student.email}
                          </div>
                        </div>
                      </div>
                      <div className="student-row-right">
                        <div className={`student-status ${student.status}`}>
                          {student.status === 'active' ? (
                            <>
                <CheckCircle size={14} />
                <span>Đang học</span>
                            </>
                          ) : (
                            <>
                <XCircle size={14} />
                <span>Nghỉ học</span>
                            </>
                          )}
                        </div>
                        <button 
                          className="btn-remove-student" 
              title="Xóa học sinh"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && renderAddStudentModal()}
      {showImportModal && renderImportModal()}
      {showMaterialsModal && renderMaterialsModal()}

      {/* Info Box */}
      <div className="info-box-class">
        <div className="info-icon-class">
          <Users size={24} />
        </div>
        <div className="info-content-class">
          <h4>Hướng dẫn quản lý học sinh</h4>
          <ul>
            <li><strong>Thêm học sinh:</strong> Click "Thêm học sinh", nhập email của học sinh đã đăng ký trong hệ thống</li>
            <li><strong>Xóa học sinh:</strong> Click icon thùng rác bên cạnh tên học sinh để gỡ khỏi lớp</li>
            <li><strong>Tìm kiếm:</strong> Sử dụng thanh tìm kiếm để lọc học sinh theo tên hoặc email</li>
            <li><strong>Lưu ý:</strong> Học sinh phải có tài khoản trong hệ thống trước khi được thêm vào lớp</li>
          </ul>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
