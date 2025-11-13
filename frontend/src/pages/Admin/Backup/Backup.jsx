import React, { useState } from 'react';
import { MdSave, MdAdd, MdSettings, MdBarChart, MdFolder, MdInsertDriveFile, MdSmartToy, MdPerson, MdRefresh, MdDelete, MdHourglassEmpty, MdDownload } from 'react-icons/md';
import './Backup.css';

const Backup = () => {
  const [backups, setBackups] = useState([
    { id: 1, name: 'backup_2024_10_24_10_30.sql', size: '45.2 MB', date: '2024-10-24 10:30:00', type: 'auto' },
    { id: 2, name: 'backup_2024_10_23_10_30.sql', size: '44.8 MB', date: '2024-10-23 10:30:00', type: 'auto' },
    { id: 3, name: 'backup_manual_2024_10_22.sql', size: '44.5 MB', date: '2024-10-22 15:45:00', type: 'manual' },
    { id: 4, name: 'backup_2024_10_22_10_30.sql', size: '44.3 MB', date: '2024-10-22 10:30:00', type: 'auto' },
  ]);
  const [creating, setCreating] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');

  const handleCreateBackup = async () => {
    setCreating(true);
    // Simulate backup creation
    setTimeout(() => {
      const newBackup = {
        id: backups.length + 1,
        name: `backup_manual_${new Date().toISOString().slice(0, 10)}.sql`,
        size: '45.5 MB',
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        type: 'manual'
      };
      setBackups([newBackup, ...backups]);
      setCreating(false);
      alert('Sao lưu thành công!');
    }, 2000);
  };

  const handleDownload = (backup) => {
    alert(`Đang tải xuống: ${backup.name}`);
    // TODO: Implement actual download
  };

  const handleRestore = (backup) => {
    if (window.confirm(`Bạn có chắc muốn khôi phục từ bản sao lưu "${backup.name}"?\n\nCHÚ Ý: Điều này sẽ ghi đè toàn bộ dữ liệu hiện tại!`)) {
      alert('Đang khôi phục dữ liệu...');
      // TODO: Implement restore
    }
  };

  const handleDelete = (backup) => {
    if (window.confirm(`Bạn có chắc muốn xóa bản sao lưu "${backup.name}"?`)) {
      setBackups(backups.filter(b => b.id !== backup.id));
      alert('Đã xóa bản sao lưu');
    }
  };

  return (
    <div className="backup-container">
      <div className="backup-header">
        <div>
          <h1 className="page-title"><MdSave className="inline-block mr-2" /> Sao lưu dữ liệu</h1>
          <p className="page-subtitle">Quản lý và khôi phục dữ liệu hệ thống</p>
        </div>
        <button 
          className="btn-create-backup" 
          onClick={handleCreateBackup}
          disabled={creating}
        >
          {creating ? <><MdHourglassEmpty className="inline-block mr-2" /> Đang tạo...</> : <><MdAdd className="inline-block mr-2" /> Tạo bản sao lưu</>}
        </button>
      </div>

      {/* Backup Settings */}
      <div className="backup-settings-card">
        <h2 className="card-title"><MdSettings className="inline-block mr-2" /> Cài đặt sao lưu tự động</h2>
        <div className="settings-grid">
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
              />
              <span>Bật sao lưu tự động</span>
            </label>
            <small>Tự động tạo bản sao lưu theo lịch định kỳ</small>
          </div>
          {autoBackup && (
            <div className="setting-item">
              <label>Tần suất sao lưu</label>
              <select 
                value={backupFrequency} 
                onChange={(e) => setBackupFrequency(e.target.value)}
                className="frequency-select"
              >
                <option value="hourly">Mỗi giờ</option>
                <option value="daily">Mỗi ngày</option>
                <option value="weekly">Mỗi tuần</option>
                <option value="monthly">Mỗi tháng</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Storage Info */}
      <div className="storage-info-card">
        <div className="storage-header">
          <h2 className="card-title"><MdBarChart className="inline-block mr-2" /> Dung lượng lưu trữ</h2>
          <span className="storage-usage">178.8 MB / 1 GB</span>
        </div>
        <div className="storage-bar">
          <div className="storage-fill" style={{ width: '17.88%' }}></div>
        </div>
        <div className="storage-details">
          <span>Đã sử dụng: 178.8 MB</span>
          <span>Còn lại: 845.2 MB</span>
        </div>
      </div>

      {/* Backups List */}
      <div className="backups-list-card">
        <h2 className="card-title"><MdFolder className="inline-block mr-2" /> Danh sách bản sao lưu ({backups.length})</h2>
        {backups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MdSave size={48} /></div>
            <p>Chưa có bản sao lưu nào</p>
            <button className="btn-primary" onClick={handleCreateBackup}>
              Tạo bản sao lưu đầu tiên
            </button>
          </div>
        ) : (
          <div className="backups-table-wrapper">
            <table className="backups-table">
              <thead>
                <tr>
                  <th>Tên file</th>
                  <th>Loại</th>
                  <th>Dung lượng</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(backup => (
                  <tr key={backup.id}>
                    <td>
                      <div className="backup-name">
                        <span className="file-icon"><MdInsertDriveFile /></span>
                        {backup.name}
                      </div>
                    </td>
                    <td>
                      <span className={`backup-type-badge ${backup.type}`}>
                        {backup.type === 'auto' ? <><MdSmartToy className="inline-block mr-1" /> Tự động</> : <><MdPerson className="inline-block mr-1" /> Thủ công</>}
                      </span>
                    </td>
                    <td>{backup.size}</td>
                    <td>{backup.date}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn download"
                          onClick={() => handleDownload(backup)}
                          title="Tải xuống"
                        >
                          <MdDownload />
                        </button>
                        <button 
                          className="action-btn restore"
                          onClick={() => handleRestore(backup)}
                          title="Khôi phục"
                        >
                          <MdRefresh />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDelete(backup)}
                          title="Xóa"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Backup;

