# 🎨 ADDITIONAL CSS FOR EXERCISE MANAGEMENT

## 📝 THÊM VÀO `ExerciseManagement.css`

Append các styles sau vào cuối file `frontend/src/pages/Teacher/TeacherDashboardV3/components/ExerciseManagement/ExerciseManagement.css`:

```css
/* ========== FILE UPLOAD ZONES ========== */
.file-upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f5f7fa;
  border: 2px dashed #e8eaf6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  min-height: 200px;
}

.file-upload-zone:hover {
  background: #edf2f7;
  border-color: #667eea;
}

.file-upload-zone .upload-icon {
  color: #a0aec0;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.file-upload-zone:hover .upload-icon {
  color: #667eea;
  transform: scale(1.1);
}

.file-upload-zone p {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.file-upload-zone .upload-hint {
  font-size: 12px;
  color: #a0aec0;
}

.file-upload-zone-large {
  padding: 48px;
  min-height: 250px;
}

.file-upload-zone-multiple {
  padding: 40px;
  min-height: 220px;
}

/* File Preview */
.file-preview-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 2px solid #667eea;
  border-radius: 12px;
  width: 100%;
}

.file-preview-box .file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-preview-box .file-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.file-preview-box .file-size {
  font-size: 12px;
  color: #718096;
}

.file-preview-box-large {
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px;
}

.file-info-large {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.file-name-large {
  font-size: 16px;
  font-weight: 600;
}

.file-size-large,
.file-type-large {
  font-size: 13px;
  color: #718096;
}

.audio-preview {
  width: 100%;
  margin-top: 12px;
}

.btn-remove-file,
.btn-remove-file-large {
  padding: 8px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-remove-file:hover,
.btn-remove-file-large:hover {
  background: #ff5252;
  transform: translateY(-2px);
}

/* ========== IMPORT SECTION ========== */
.import-form-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.import-header {
  text-align: center;
  padding: 24px;
}

.import-header h3 {
  font-size: 24px;
  font-weight: 700;
  margin-top: 16px;
  color: #2d3748;
}

.import-header p {
  font-size: 14px;
  color: #718096;
  margin-top: 8px;
}

/* ========== AI SECTION ========== */
.ai-form-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ai-source-selection {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 24px 0;
}

.ai-source-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 24px;
  background: white;
  border: 2px solid #e8eaf6;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.ai-source-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
}

.ai-source-card input[type="radio"] {
  margin-top: 4px;
}

.ai-source-card input[type="radio"]:checked ~ .source-content {
  color: #667eea;
}

.ai-source-card .source-content {
  flex: 1;
}

.ai-source-card .source-content h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2d3748;
}

.ai-source-card .source-content p {
  font-size: 13px;
  color: #718096;
  line-height: 1.5;
}

.ai-files-section,
.ai-qb-section {
  margin-top: 16px;
}

.uploaded-files-list {
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
}

.uploaded-files-list h5 {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 12px;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
}

.uploaded-file-item:last-child {
  margin-bottom: 0;
}

.uploaded-file-item .file-name {
  flex: 1;
  font-size: 13px;
  color: #2d3748;
}

.btn-remove-file-small {
  padding: 4px 8px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-remove-file-small:hover {
  background: #ff5252;
}

/* ========== QUESTION BANK SELECTOR MODAL ========== */
.qb-selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s;
}

.qb-selector-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s;
}

.qb-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e8eaf6;
}

.qb-modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
}

.qb-modal-header p {
  font-size: 13px;
  color: #718096;
  margin-top: 4px;
}

.qb-close-btn {
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.qb-close-btn:hover {
  background: #f5f7fa;
}

.qb-filters {
  padding: 16px 24px;
  border-bottom: 1px solid #e8eaf6;
  background: #f8f9fc;
}

.qb-search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e8eaf6;
  border-radius: 12px;
  margin-bottom: 12px;
}

.qb-search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
}

.qb-filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.qb-filter-select {
  flex: 1;
  min-width: 150px;
  padding: 10px 14px;
  border: 1px solid #e8eaf6;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.qb-filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.qb-select-all-btn {
  padding: 10px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.qb-select-all-btn:hover {
  background: #5568d3;
}

.qb-questions-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.qb-empty {
  text-align: center;
  padding: 48px;
  color: #a0aec0;
}

.qb-question-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 2px solid #e8eaf6;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.qb-question-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.qb-question-item.selected {
  background: #f0f4ff;
  border-color: #667eea;
}

.qb-checkbox {
  position: relative;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.qb-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.qb-checkbox .check-icon {
  position: absolute;
  top: 3px;
  left: 3px;
  color: #667eea;
  pointer-events: none;
}

.qb-question-content {
  flex: 1;
}

.qb-question-header-row {
  margin-bottom: 8px;
}

.qb-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.qb-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qb-badge-skill {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.qb-badge-type {
  background: rgba(67, 233, 123, 0.1);
  color: #43e97b;
}

.qb-badge-difficulty {
  background: rgba(250, 112, 154, 0.1);
  color: #fa709a;
}

.qb-badge-difficulty.diff-easy {
  background: rgba(67, 233, 123, 0.1);
  color: #43e97b;
}

.qb-badge-difficulty.diff-medium {
  background: rgba(250, 176, 5, 0.1);
  color: #fab005;
}

.qb-badge-difficulty.diff-hard {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.qb-badge-points {
  background: rgba(79, 172, 254, 0.1);
  color: #4facfe;
}

.qb-question-text {
  font-size: 14px;
  color: #2d3748;
  line-height: 1.6;
  margin-bottom: 8px;
}

.qb-options-preview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.qb-option {
  font-size: 12px;
  color: #718096;
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 6px;
}

.qb-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #e8eaf6;
  background: #f8f9fc;
}

.qb-selected-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qb-selected-count .count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  font-weight: 700;
}

.qb-footer-actions {
  display: flex;
  gap: 12px;
}

.qb-cancel-btn {
  padding: 10px 20px;
  background: transparent;
  color: #718096;
  border: 1px solid #e8eaf6;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.qb-cancel-btn:hover {
  background: #f5f7fa;
  color: #2d3748;
}

.qb-confirm-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.qb-confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.qb-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== MISC ========== */
.info-box-note {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f0f9ff;
  border-left: 4px solid #4facfe;
  border-radius: 8px;
  margin-top: 16px;
}

.info-box-note .info-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.info-box-note p,
.info-box-note ul {
  font-size: 13px;
  color: #2d3748;
  line-height: 1.6;
}

.info-box-note ul {
  margin-top: 8px;
  padding-left: 20px;
}

.info-box-note li {
  margin-bottom: 4px;
}

.text-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 13px;
  color: #718096;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .ai-source-selection {
    grid-template-columns: 1fr;
  }
  
  .qb-options-preview {
    grid-template-columns: 1fr;
  }
  
  .qb-filter-row {
    flex-direction: column;
  }
  
  .qb-filter-select {
    width: 100%;
  }
}
```

---

## ✅ HOW TO APPLY

1. Open `frontend/src/pages/Teacher/TeacherDashboardV3/components/ExerciseManagement/ExerciseManagement.css`
2. Scroll to the end
3. Paste all styles above
4. Save file

**Done!** All components will now have proper styling.

---

**Next:** Import `design-system.css` in main entry point (`main.jsx` or `App.jsx`):

```javascript
import '../design-system.css';
```

This ensures unified styles are available globally.

