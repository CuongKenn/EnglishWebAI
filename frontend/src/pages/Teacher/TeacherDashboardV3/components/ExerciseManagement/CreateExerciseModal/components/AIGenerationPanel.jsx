import React, { useRef } from 'react';
import { Bot, Sparkles, FileUp, Database, Clock, File, X } from 'lucide-react';
import { AI_SOURCES, QB_DIFFICULTIES } from '../constants';

/**
 * AI Generation Panel component
 * Handles AI-powered exercise generation from curriculum, files, or question bank
 */
const AIGenerationPanel = React.memo(({
  title,
  onTitleChange,
  classId,
  onClassIdChange,
  classes,
  dueDate,
  onDueDateChange,
  maxScore,
  onMaxScoreChange,
  aiSource,
  onAiSourceChange,
  aiFiles,
  onAiFilesChange,
  aiPrompt,
  onAiPromptChange,
  aiFormData,
  onAiFormDataChange,
  qbNumQuestions,
  onQbNumQuestionsChange,
  qbDifficulty,
  onQbDifficultyChange,
  onGenerateAI,
  isGenerating,
}) => {
  const aiFilesInputRef = useRef(null);

  const handleAiFilesUpload = (e) => {
    const newFiles = Array.from(e.target.files || []);
    onAiFilesChange([...aiFiles, ...newFiles]);
  };

  const removeAiFile = (idx) => {
    onAiFilesChange(aiFiles.filter((_, i) => i !== idx));
  };

  const selectedClass = classes.find(c => c.id === parseInt(classId));
  const grade = selectedClass?.grade || selectedClass?.name?.match(/\d+/)?.[0] || '10';

  return (
    <div className="ai-form-content">
      <div className="ai-form-header">
        <div className="ai-header-icon">
          <Bot size={32} />
        </div>
        <div className="ai-header-text">
          <h4>Tạo đề thi bằng AI thông minh</h4>
          <p>AI sẽ tự động tạo đề thi toàn diện với 4 kỹ năng theo chương trình học</p>
        </div>
      </div>
      
      {/* Basic Information */}
      <div className="form-section-ex">
        <label className="form-label-ex">Tiêu đề đề thi *</label>
        <input 
          type="text" 
          className="form-input-ex" 
          placeholder="Ví dụ: Đề kiểm tra giữa kỳ I - Khối 10"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      
      {/* Class, Grade, Semester Row */}
      <div className="form-row-ex">
        <div className="form-section-ex">
          <label className="form-label-ex">Lớp học <span className="required">*</span></label>
          <select 
            className="form-select-ex" 
            value={classId} 
            onChange={(e) => onClassIdChange(e.target.value)}
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.grade && `(Khối ${cls.grade})`}
              </option>
            ))}
          </select>
        </div>
        <div className="form-section-ex">
          <label className="form-label-ex">Khối lớp</label>
          <input 
            type="text" 
            className="form-input-ex"
            value={grade}
            disabled
            style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
          />
        </div>
        <div className="form-section-ex">
          <label className="form-label-ex">Học kỳ</label>
          <select 
            className="form-select-ex"
            value={aiFormData.semester || '1'}
            onChange={(e) => onAiFormDataChange({ ...aiFormData, semester: e.target.value })}
          >
            <option value="1">Học kỳ I</option>
            <option value="2">Học kỳ II</option>
          </select>
        </div>
      </div>
      
      {/* Due Date and Score */}
      <div className="form-row-ex">
        <div className="form-section-ex">
          <label className="form-label-ex">Hạn nộp</label>
          <input 
            type="datetime-local" 
            className="form-input-ex"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
        </div>
        <div className="form-section-ex">
          <label className="form-label-ex">Điểm tối đa</label>
          <input 
            type="number" 
            className="form-input-ex"
            value={maxScore}
            onChange={(e) => onMaxScoreChange(Number(e.target.value))}
            min="1"
            max="10"
          />
        </div>
      </div>
      
      {/* AI Source Selection */}
      <div className="form-section-ex">
        <label className="form-label-ex">Nguồn tạo đề</label>
        <div className="ai-source-selection">
          {AI_SOURCES.map(source => (
            <label 
              key={source.value}
              className={`ai-source-card ${aiSource === source.value ? 'active' : ''}`}
            >
              <input 
                type="radio"
                name="ai-source"
                value={source.value}
                checked={aiSource === source.value}
                onChange={(e) => onAiSourceChange(e.target.value)}
              />
              <div className="source-icon">
                {source.value === 'curriculum' && <Sparkles size={28} />}
                {source.value === 'files' && <FileUp size={28} />}
                {source.value === 'question_bank' && <Database size={28} />}
              </div>
              <div className="source-content">
                <h4>{source.label}</h4>
                <p>{source.value === 'curriculum' ? 'Theo SGK Tiếng Anh 2018' : source.value === 'files' ? 'AI phân tích từ file của bạn' : 'Từ câu hỏi có sẵn'}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* AI from Curriculum */}
      {aiSource === 'curriculum' && (
        <div className="ai-curriculum-section">
          <div className="info-box-highlight">
            <div className="highlight-icon">
              <Sparkles size={24} />
            </div>
            <div className="highlight-content">
              <h5>Tự động sinh đề theo chương trình</h5>
              <p>AI sẽ tạo đề thi toàn diện với 4 kỹ năng dựa trên chương trình Tiếng Anh 2018 cho khối {grade}, học kỳ {aiFormData.semester || '1'}</p>
              <div className="estimate-time">
                <Clock size={16} />
                <span>Thời gian tạo đề: Khoảng 3-5 phút</span>
              </div>
            </div>
          </div>
          
          <div className="advanced-options">
            <h5 className="options-title">Tùy chỉnh nâng cao (không bắt buộc)</h5>
            <div className="form-row-ex">
              <div className="form-section-ex">
                <label className="form-label-ex">Độ khó</label>
                <select 
                  className="form-select-ex"
                  value={aiFormData.difficulty || 'mixed'}
                  onChange={(e) => onAiFormDataChange({ ...aiFormData, difficulty: e.target.value })}
                >
                  {QB_DIFFICULTIES.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-section-ex">
                <label className="form-label-ex">Số câu hỏi mỗi kỹ năng</label>
                <input 
                  type="number" 
                  className="form-input-ex"
                  placeholder="Mặc định: 5-7 câu"
                  value={aiFormData.questionsPerSkill || ''}
                  onChange={(e) => onAiFormDataChange({ ...aiFormData, questionsPerSkill: e.target.value })}
                  min="3"
                  max="15"
                />
              </div>
            </div>
            
            <div className="form-section-ex">
              <label className="form-label-ex">Chú thích thêm cho AI (không bắt buộc)</label>
              <textarea 
                className="form-textarea-ex"
                rows="3"
                placeholder="Ví dụ: Tập trung vào chủ đề môi trường và công nghệ..."
                value={aiFormData.additionalNotes || ''}
                onChange={(e) => onAiFormDataChange({ ...aiFormData, additionalNotes: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* AI from Files */}
      {aiSource === 'files' && (
        <div className="ai-files-section">
          <div className="form-section-ex">
            <label className="form-label-ex">Upload tài liệu tham khảo (có thể nhiều files)</label>
            <div className="file-upload-zone-multiple" onClick={() => aiFilesInputRef.current?.click()}>
              <input 
                ref={aiFilesInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleAiFilesUpload}
                style={{ display: 'none' }}
              />
              <FileUp size={48} />
              <p>Click để chọn files (có thể chọn nhiều)</p>
              <span className="upload-hint">Word, PDF, hoặc Text</span>
            </div>
          </div>
          
          {aiFiles.length > 0 && (
            <div className="uploaded-files-list">
              <h5>📄 Files đã upload ({aiFiles.length})</h5>
              {aiFiles.map((file, idx) => (
                <div key={idx} className="uploaded-file-item">
                  <File size={18} />
                  <span className="file-name">{file.name}</span>
                  <button 
                    onClick={() => removeAiFile(idx)} 
                    className="btn-remove-file-small"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="form-section-ex">
            <label className="form-label-ex">Yêu cầu bổ sung với AI (tùy chọn)</label>
            <textarea 
              className="form-textarea-ex"
              rows="4"
              placeholder="Ví dụ: Tạo 10 câu hỏi trắc nghiệm về thì hiện tại hoàn thành..."
              value={aiPrompt}
              onChange={(e) => onAiPromptChange(e.target.value)}
            />
          </div>
        </div>
      )}
      
      {/* AI from Question Bank */}
      {aiSource === 'question_bank' && (
        <div className="ai-qb-section">
          <div className="form-row-ex">
            <div className="form-section-ex">
              <label className="form-label-ex">Số câu hỏi</label>
              <input 
                type="number" 
                className="form-input-ex"
                value={qbNumQuestions}
                onChange={(e) => onQbNumQuestionsChange(Number(e.target.value))}
                min="5"
                max="50"
              />
            </div>
            <div className="form-section-ex">
              <label className="form-label-ex">Độ khó</label>
              <select 
                className="form-select-ex"
                value={qbDifficulty}
                onChange={(e) => onQbDifficultyChange(e.target.value)}
              >
                {QB_DIFFICULTIES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Generate Button */}
      <div className="ai-action-section">
        <button 
          className="btn-generate-ai"
          onClick={onGenerateAI}
          disabled={isGenerating || !classId}
          type="button"
        >
          {isGenerating ? (
            <>
              <div className="loading-spinner" />
              Đang tạo đề...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Tạo đề thi bằng AI
            </>
          )}
        </button>
      </div>
    </div>
  );
});

AIGenerationPanel.displayName = 'AIGenerationPanel';

export default AIGenerationPanel;
