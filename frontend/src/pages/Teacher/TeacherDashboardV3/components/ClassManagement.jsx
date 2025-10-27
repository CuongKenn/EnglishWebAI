import { useState, useEffect } from 'react';
import { Users, UserPlus, Upload, Download, Search, Trash2, Mail, User, CheckCircle, XCircle } from 'lucide-react';
import { apiV1 } from '../../../../services/api';
import './ClassManagement.css';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
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
      alert('Lß╗ùi khi tß║úi danh s├ích lß╗¢p hß╗ìc!');
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
      alert('Lß╗ùi khi tß║úi danh s├ích hß╗ìc sinh!');
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
      alert('Vui l├▓ng nhß║¡p email hß╗ìc sinh!');
      return;
    }

    setLoading(true);
    try {
      await apiV1.post(`/classes/${selectedClass.id}/students`, {
        identifiers: [newStudent.email],
        idType: 'email',
        status: 'active'
      });
      
      alert('Th├¬m hß╗ìc sinh th├ánh c├┤ng!');
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', phone: '' });
      fetchStudents(selectedClass.id); // Refresh list
    } catch (error) {
      console.error('Error adding student:', error);
      alert(error.response?.data?.detail || 'Lß╗ùi khi th├¬m hß╗ìc sinh! Kiß╗âm tra email ─æ├ú ─æ├║ng v├á user ─æ├ú tß╗ôn tß║íi ch╞░a.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selectedClass) return;
    if (!confirm('Bß║ín c├│ chß║»c muß╗æn x├│a hß╗ìc sinh n├áy khß╗Åi lß╗¢p?')) return;

    setLoading(true);
    try {
      await apiV1.delete(`/classes/${selectedClass.id}/students/${studentId}`);
      alert('─É├ú x├│a hß╗ìc sinh khß╗Åi lß╗¢p!');
      fetchStudents(selectedClass.id); // Refresh list
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Lß╗ùi khi x├│a hß╗ìc sinh!');
    } finally {
      setLoading(false);
    }
  };

  const renderAddStudentModal = () => (
    <div className="class-modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="class-modal" onClick={(e) => e.stopPropagation()}>
        <div className="class-modal-header">
          <h2>Th├¬m Hß╗ìc sinh</h2>
          <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>├ù</button>
        </div>

        <div className="class-modal-body">
          <div className="form-group-class">
            <label>Email hß╗ìc sinh <span style={{color: 'red'}}>*</span></label>
            <input 
              type="email" 
              className="form-input-class" 
              placeholder="nguyenvana@gmail.com" 
              value={newStudent.email}
              onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              Nhß║¡p email cß╗ºa t├ái khoß║ún hß╗ìc sinh ─æ├ú ─æ─âng k├╜ trong hß╗ç thß╗æng
            </small>
          </div>
        </div>

        <div className="class-modal-footer">
          <button className="btn-cancel-class" onClick={() => setShowAddModal(false)}>Hß╗ºy</button>
          <button 
            className="btn-add-class"
            onClick={handleAddStudent}
            disabled={loading}
          >
            <UserPlus size={18} />
            {loading ? '─Éang th├¬m...' : 'Th├¬m hß╗ìc sinh'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderImportModal = () => (
    <div className="class-modal-overlay" onClick={() => setShowImportModal(false)}>
      <div className="class-modal" onClick={(e) => e.stopPropagation()}>
        <div className="class-modal-header">
          <h2>Import Hß╗ìc sinh tß╗½ Excel</h2>
          <button className="modal-close-btn" onClick={() => setShowImportModal(false)}>├ù</button>
        </div>

        <div className="class-modal-body">
          {/* Download Template */}
          <div className="download-template-section">
            <div className="template-info">
              <Download size={24} className="template-icon" />
              <div>
                <h4>Tß║úi file mß║½u</h4>
                <p>Tß║úi file Excel mß║½u ─æß╗â import hß╗ìc sinh ─æ├║ng ─æß╗ïnh dß║íng</p>
              </div>
            </div>
            <button className="btn-download-template">
              <Download size={16} />
              Tß║úi file mß║½u
            </button>
          </div>

          {/* Upload Area */}
          <div className="upload-area">
            <Upload size={48} className="upload-icon" />
            <h4>K├⌐o thß║ú file Excel v├áo ─æ├óy</h4>
            <p>hoß║╖c</p>
            <button className="btn-browse">Chß╗ìn file tß╗½ m├íy t├¡nh</button>
            <span className="upload-hint">Hß╗ù trß╗ú: .xlsx, .xls (Tß╗æi ─æa 5MB)</span>
          </div>

          {/* Format Guide */}
          <div className="format-guide">
            <h4>≡ƒôï ─Éß╗ïnh dß║íng file Excel:</h4>
            <table className="format-table">
              <thead>
                <tr>
                  <th>Hß╗ì v├á t├¬n</th>
                  <th>Email</th>
                  <th>Sß╗æ ─æiß╗çn thoß║íi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nguyß╗àn V─ân A</td>
                  <td>nguyenvana@gmail.com</td>
                  <td>0123456789</td>
                </tr>
                <tr>
                  <td>Trß║ºn Thß╗ï B</td>
                  <td>tranthib@gmail.com</td>
                  <td>0987654321</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="class-modal-footer">
          <button className="btn-cancel-class" onClick={() => setShowImportModal(false)}>Hß╗ºy</button>
          <button className="btn-add-class">
            <Upload size={18} />
            Import hß╗ìc sinh
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="class-management-container">
      {/* Header */}
      <div className="class-header">
        <div className="class-header-left">
          <h1>Quß║ún l├╜ Lß╗¢p hß╗ìc</h1>
          <p>Quß║ún l├╜ hß╗ìc sinh trong c├íc lß╗¢p bß║ín ─æang dß║íy</p>
        </div>
      </div>

      <div className="class-content-wrapper">
        {/* Classes List */}
        <div className="classes-sidebar">
          <div className="sidebar-title">
            <Users size={20} />
            <span>Lß╗¢p hß╗ìc cß╗ºa t├┤i</span>
          </div>
          <div className="classes-list">
            {loading && classes.length === 0 ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
                ─Éang tß║úi...
              </div>
            ) : classes.length === 0 ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
                Ch╞░a c├│ lß╗¢p hß╗ìc n├áo
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
                    <div className="class-item-count">{cls.student_count || 0} hß╗ìc sinh</div>
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
              <h3>Chß╗ìn lß╗¢p hß╗ìc</h3>
              <p>Chß╗ìn mß╗Öt lß╗¢p hß╗ìc b├¬n tr├íi ─æß╗â xem danh s├ích hß╗ìc sinh</p>
            </div>
          ) : (
            <>
              {/* Panel Header */}
              <div className="panel-header">
                <div className="panel-header-left">
                  <h2>{selectedClass.name}</h2>
                  <span className="student-count-badge">{students.length} hß╗ìc sinh</span>
                </div>
                <div className="panel-header-actions">
                  <button className="btn-action-class primary" onClick={() => setShowAddModal(true)}>
                    <UserPlus size={18} />
                    Th├¬m hß╗ìc sinh
                  </button>
                  <button className="btn-action-class secondary" onClick={() => setShowImportModal(true)}>
                    <Upload size={18} />
                    Import Excel
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="search-bar-class">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="T├¼m kiß║┐m hß╗ìc sinh theo t├¬n hoß║╖c email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-class"
                />
              </div>

              {/* Students Table */}
              <div className="students-table">
                {loading ? (
                  <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                    ─Éang tß║úi danh s├ích hß╗ìc sinh...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="empty-search-state">
                    <Search size={48} strokeWidth={1} />
                    <p>{searchTerm ? 'Kh├┤ng t├¼m thß║Ñy hß╗ìc sinh n├áo' : 'Ch╞░a c├│ hß╗ìc sinh trong lß╗¢p'}</p>
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
                              <span>─Éang hß╗ìc</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={14} />
                              <span>Nghß╗ë hß╗ìc</span>
                            </>
                          )}
                        </div>
                        <button 
                          className="btn-remove-student" 
                          title="X├│a hß╗ìc sinh"
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

      {/* Info Box */}
      <div className="info-box-class">
        <div className="info-icon-class">
          <Users size={24} />
        </div>
        <div className="info-content-class">
          <h4>≡ƒÆí H╞░ß╗¢ng dß║½n quß║ún l├╜ hß╗ìc sinh</h4>
          <ul>
            <li><strong>Th├¬m hß╗ìc sinh:</strong> Click "Th├¬m hß╗ìc sinh", nhß║¡p email cß╗ºa hß╗ìc sinh ─æ├ú ─æ─âng k├╜ trong hß╗ç thß╗æng</li>
            <li><strong>X├│a hß╗ìc sinh:</strong> Click icon ≡ƒùæ∩╕Å b├¬n cß║ính t├¬n hß╗ìc sinh ─æß╗â gß╗í khß╗Åi lß╗¢p</li>
            <li><strong>T├¼m kiß║┐m:</strong> Sß╗¡ dß╗Ñng thanh t├¼m kiß║┐m ─æß╗â lß╗ìc hß╗ìc sinh theo t├¬n hoß║╖c email</li>
            <li><strong>L╞░u ├╜:</strong> Hß╗ìc sinh phß║úi c├│ t├ái khoß║ún trong hß╗ç thß╗æng tr╞░ß╗¢c khi ─æ╞░ß╗úc th├¬m v├áo lß╗¢p</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
