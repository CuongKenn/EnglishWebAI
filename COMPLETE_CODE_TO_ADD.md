# 📝 COMPLETE CODE - THÊM VÀO CreateExerciseModalComplete.jsx

## 🎯 INSTRUCTIONS

Thêm các function sau vào **CUỐI FILE** `CreateExerciseModalComplete.jsx`, **TRƯỚC** dấu `}` cuối cùng.

Tìm dòng:
```javascript
  // CONTINUED IN NEXT MESSAGE...
}
```

Thay bằng toàn bộ code dưới đây:

---

## 📄 CODE TO ADD

```javascript
  // Listening Form
  function renderListeningForm() {
    return (
      <div className="listening-form-content">
        <h4 className="section-title">🎧 Nội dung bài Nghe</h4>
        
        {/* Audio Upload */}
        <div className="form-section-ex">
          <label className="form-label-ex">File Audio * (.mp3, .wav, .ogg)</label>
          <div className="file-upload-zone" onClick={() => audioInputRef.current?.click()}>
            <input 
              ref={audioInputRef}
              type="file" 
              accept="audio/*"
              onChange={handleAudioUpload}
              style={{ display: 'none' }}
            />
            {!audioFile ? (
              <>
                <FileAudio size={40} className="upload-icon" />
                <p>Click để chọn file audio</p>
                <span className="upload-hint">Tối đa 50MB</span>
              </>
            ) : (
              <div className="file-preview-box">
                <FileAudio size={28} />
                <div className="file-info">
                  <span className="file-name">{audioFile.name}</span>
                  <span className="file-size">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <audio controls src={URL.createObjectURL(audioFile)} className="audio-preview" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                  className="btn-remove-file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Transcript */}
        <div className="form-section-ex">
          <label className="form-label-ex">Transcript (Bản ghi âm)</label>
          <textarea 
            className="form-textarea-ex"
            rows="6"
            placeholder="Nhập transcript của audio..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
          <label className="checkbox-label-ex">
            <input 
              type="checkbox"
              checked={showTranscript}
              onChange={(e) => setShowTranscript(e.target.checked)}
            />
            <span>Hiển thị transcript cho học sinh</span>
          </label>
        </div>
        
        {/* Questions */}
        {renderQuestions()}
      </div>
    );
  }
  
  // Speaking Form
  function renderSpeakingForm() {
    return (
      <div className="speaking-form-content">
        <h4 className="section-title">🗣️ Nội dung bài Nói</h4>
        
        {/* Prompt */}
        <div className="form-section-ex">
          <label className="form-label-ex">Đề bài *</label>
          <textarea 
            className="form-textarea-ex"
            rows="4"
            placeholder="Ví dụ: Describe your favorite book and explain why you like it."
            value={speakingPrompt}
            onChange={(e) => setSpeakingPrompt(e.target.value)}
          />
        </div>
        
        {/* Instructions */}
        <div className="form-section-ex">
          <label className="form-label-ex">Hướng dẫn chi tiết</label>
          {speakingInstructions.map((inst, idx) => (
            <div key={idx} className="instruction-row">
              <input 
                type="text"
                className="form-input-ex"
                placeholder={`Hướng dẫn ${idx + 1}`}
                value={inst}
                onChange={(e) => updateSpeakingInstruction(idx, e.target.value)}
              />
              {speakingInstructions.length > 1 && (
                <button 
                  onClick={() => removeSpeakingInstruction(idx)}
                  className="btn-remove-item"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addSpeakingInstruction} className="btn-add-item">
            <Plus size={16} />
            Thêm hướng dẫn
          </button>
        </div>
        
        {/* Time Settings */}
        <div className="form-row-ex">
          <div className="form-section-ex">
            <label className="form-label-ex">Thời gian chuẩn bị (giây)</label>
            <input 
              type="number" 
              className="form-input-ex"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
            />
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Thời gian nói (giây)</label>
            <input 
              type="number" 
              className="form-input-ex"
              value={speakTime}
              onChange={(e) => setSpeakTime(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Reading Form
  function renderReadingForm() {
    return (
      <div className="reading-form-content">
        <h4 className="section-title">📖 Nội dung bài Đọc</h4>
        
        {/* Input Method Tabs */}
        <div className="input-method-tabs">
          <button 
            className={`method-tab ${readingInputMethod === 'text' ? 'active' : ''}`}
            onClick={() => setReadingInputMethod('text')}
          >
            <FileText size={18} />
            Nhập văn bản
          </button>
          <button 
            className={`method-tab ${readingInputMethod === 'upload' ? 'active' : ''}`}
            onClick={() => setReadingInputMethod('upload')}
          >
            <Upload size={18} />
            Upload file
          </button>
        </div>
        
        {/* Text Input */}
        {readingInputMethod === 'text' && (
          <div className="form-section-ex">
            <label className="form-label-ex">Đoạn văn *</label>
            <textarea 
              className="form-textarea-ex"
              rows="15"
              placeholder="Nhập hoặc paste đoạn văn..."
              value={passageText}
              onChange={(e) => setPassageText(e.target.value)}
            />
            <div className="text-stats">
              <span>📊 {passageText.split(/\s+/).filter(w => w).length} từ</span>
              <span>📄 {passageText.length} ký tự</span>
            </div>
          </div>
        )}
        
        {/* File Upload */}
        {readingInputMethod === 'upload' && (
          <div className="form-section-ex">
            <label className="form-label-ex">Upload file (.pdf, .docx, .txt)</label>
            <div className="file-upload-zone" onClick={() => passageFileInputRef.current?.click()}>
              <input 
                ref={passageFileInputRef}
                type="file" 
                accept=".pdf,.doc,.docx,.txt"
                onChange={handlePassageFileUpload}
                style={{ display: 'none' }}
              />
              {!passageFile ? (
                <>
                  <File size={40} className="upload-icon" />
                  <p>Click để chọn file</p>
                  <span className="upload-hint">PDF, Word, hoặc Text - Tối đa 10MB</span>
                </>
              ) : (
                <div className="file-preview-box">
                  <File size={28} />
                  <div className="file-info">
                    <span className="file-name">{passageFile.name}</span>
                    <span className="file-size">{(passageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPassageFile(null); }}
                    className="btn-remove-file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Questions */}
        {renderQuestions()}
      </div>
    );
  }
  
  // Writing Form
  function renderWritingForm() {
    return (
      <div className="writing-form-content">
        <h4 className="section-title">✍️ Nội dung bài Viết</h4>
        
        {/* Prompt */}
        <div className="form-section-ex">
          <label className="form-label-ex">Đề bài *</label>
          <textarea 
            className="form-textarea-ex"
            rows="4"
            placeholder="Ví dụ: Write an essay about the importance of learning English..."
            value={writingPrompt}
            onChange={(e) => setWritingPrompt(e.target.value)}
          />
        </div>
        
        {/* Type */}
        <div className="form-section-ex">
          <label className="form-label-ex">Loại bài viết</label>
          <select 
            className="form-select-ex"
            value={writingType}
            onChange={(e) => setWritingType(e.target.value)}
          >
            <option value="essay">Essay (Tiểu luận)</option>
            <option value="letter">Letter (Thư)</option>
            <option value="email">Email</option>
            <option value="report">Report (Báo cáo)</option>
            <option value="story">Story (Truyện ngắn)</option>
            <option value="review">Review (Bài nhận xét)</option>
          </select>
        </div>
        
        {/* Word Limit */}
        <div className="form-row-ex">
          <div className="form-section-ex">
            <label className="form-label-ex">Số từ tối thiểu *</label>
            <input 
              type="number" 
              className="form-input-ex"
              value={minWords}
              onChange={(e) => setMinWords(Number(e.target.value))}
              min="50"
            />
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Số từ tối đa *</label>
            <input 
              type="number" 
              className="form-input-ex"
              value={maxWords}
              onChange={(e) => setMaxWords(Number(e.target.value))}
              min="100"
            />
          </div>
        </div>
        
        {/* Instructions */}
        <div className="form-section-ex">
          <label className="form-label-ex">Yêu cầu chi tiết</label>
          {writingInstructions.map((inst, idx) => (
            <div key={idx} className="instruction-row">
              <input 
                type="text"
                className="form-input-ex"
                placeholder={`Yêu cầu ${idx + 1}`}
                value={inst}
                onChange={(e) => updateWritingInstruction(idx, e.target.value)}
              />
              {writingInstructions.length > 1 && (
                <button 
                  onClick={() => removeWritingInstruction(idx)}
                  className="btn-remove-item"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addWritingInstruction} className="btn-add-item">
            <Plus size={16} />
            Thêm yêu cầu
          </button>
        </div>
      </div>
    );
  }
  
  // Import Form
  function renderImportForm() {
    return (
      <div className="import-form-content">
        <div className="import-header">
          <Upload size={48} />
          <h3>Import đề từ file</h3>
          <p>Hệ thống sẽ tự động phân tích và tạo câu hỏi từ file của bạn</p>
        </div>
        
        <div className="form-section-ex">
          <label className="form-label-ex">Tiêu đề *</label>
          <input 
            type="text" 
            className="form-input-ex" 
            placeholder="Nhập tiêu đề bài tập"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="form-row-ex">
          <div className="form-section-ex">
            <label className="form-label-ex">Lớp học</label>
            <select className="form-select-ex" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Chọn lớp</option>
              <option value="10A1">Lớp 10A1</option>
              <option value="10A2">Lớp 10A2</option>
            </select>
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Hạn nộp</label>
            <input 
              type="datetime-local" 
              className="form-input-ex"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="form-section-ex">
          <label className="form-label-ex">Upload file *</label>
          <div className="file-upload-zone-large" onClick={() => importFileInputRef.current?.click()}>
            <input 
              ref={importFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xlsx"
              onChange={handleImportFileUpload}
              style={{ display: 'none' }}
            />
            {!importFile ? (
              <>
                <FileUp size={64} className="upload-icon" />
                <h4>Kéo thả file vào đây hoặc click để chọn</h4>
                <p>Hỗ trợ: Word (.docx), PDF, Excel (.xlsx)</p>
                <span className="upload-hint">Tối đa 20MB</span>
              </>
            ) : (
              <div className="file-preview-box-large">
                <File size={48} />
                <div className="file-info-large">
                  <span className="file-name-large">{importFile.name}</span>
                  <span className="file-size-large">{(importFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span className="file-type-large">{importFile.type}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                  className="btn-remove-file-large"
                >
                  <Trash2 size={20} />
                  Xóa file
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="info-box-note">
          <span className="info-icon">💡</span>
          <div>
            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>File nên có cấu trúc rõ ràng với câu hỏi và đáp án</li>
              <li>Hệ thống sẽ tự động phân tích và tạo bài tập</li>
              <li>Bạn có thể chỉnh sửa sau khi import</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  // AI Form
  function renderAIForm() {
    return (
      <div className="ai-form-content">
        <h4 className="section-title">🤖 AI Sinh đề</h4>
        
        <div className="form-section-ex">
          <label className="form-label-ex">Tiêu đề *</label>
          <input 
            type="text" 
            className="form-input-ex" 
            placeholder="Nhập tiêu đề bài tập"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="form-row-ex">
          <div className="form-section-ex">
            <label className="form-label-ex">Lớp học</label>
            <select className="form-select-ex" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Chọn lớp</option>
              <option value="10A1">Lớp 10A1</option>
              <option value="10A2">Lớp 10A2</option>
            </select>
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Hạn nộp</label>
            <input 
              type="datetime-local" 
              className="form-input-ex"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        
        {/* AI Source Selection */}
        <div className="ai-source-selection">
          <label className="ai-source-card">
            <input 
              type="radio"
              name="ai-source"
              value="files"
              checked={aiSource === 'files'}
              onChange={(e) => setAiSource(e.target.value)}
            />
            <div className="source-content">
              <FileUp size={32} />
              <h4>Sinh từ Files</h4>
              <p>AI phân tích files bạn upload và tạo đề mới</p>
            </div>
          </label>
          
          <label className="ai-source-card">
            <input 
              type="radio"
              name="ai-source"
              value="question_bank"
              checked={aiSource === 'question_bank'}
              onChange={(e) => setAiSource(e.target.value)}
            />
            <div className="source-content">
              <Database size={32} />
              <h4>Lấy từ Ngân hàng Câu hỏi</h4>
              <p>AI chọn câu hỏi phù hợp từ ngân hàng của bạn</p>
            </div>
          </label>
        </div>
        
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
                    <button onClick={() => removeAiFile(idx)} className="btn-remove-file-small">
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
                placeholder="Ví dụ: Tạo 10 câu hỏi trắc nghiệm về thì hiện tại hoàn thành, độ khó trung bình..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
          </div>
        )}
        
        {/* AI from Question Bank */}
        {aiSource === 'question_bank' && (
          <div className="ai-qb-section">
            <h4>Cấu hình tạo đề từ Ngân hàng</h4>
            
            <div className="form-row-ex">
              <div className="form-section-ex">
                <label className="form-label-ex">Số câu hỏi</label>
                <input 
                  type="number"
                  className="form-input-ex"
                  value={qbNumQuestions}
                  onChange={(e) => setQbNumQuestions(Number(e.target.value))}
                  min="5"
                  max="50"
                />
              </div>
              <div className="form-section-ex">
                <label className="form-label-ex">Độ khó</label>
                <select 
                  className="form-select-ex"
                  value={qbDifficulty}
                  onChange={(e) => setQbDifficulty(e.target.value)}
                >
                  <option value="mixed">Trộn lẫn</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Questions Section
  function renderQuestions() {
    return (
      <div className="questions-section-form">
        <div className="section-header-with-actions">
          <h4>Câu hỏi</h4>
          <div className="question-actions">
            <button 
              className="btn-from-bank"
              onClick={() => setShowQuestionBankModal(true)}
            >
              <Database size={16} />
              Từ Ngân hàng
            </button>
            <button className="btn-add-question" onClick={addQuestion}>
              <Plus size={16} />
              Thêm câu hỏi
            </button>
          </div>
        </div>
        
        {questions.length === 0 ? (
          <div className="empty-questions">
            <p>Chưa có câu hỏi. Click "Thêm câu hỏi" hoặc "Từ Ngân hàng"</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="question-form-card">
              <div className="question-form-header">
                <span>Câu {idx + 1}</span>
                <button onClick={() => removeQuestion(idx)} className="btn-remove-question">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="form-section-ex">
                <label>Loại câu hỏi</label>
                <select 
                  className="form-select-ex"
                  value={q.type}
                  onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                >
                  <option value="multiple_choice">Trắc nghiệm</option>
                  <option value="fill_blank">Điền từ</option>
                  <option value="true_false">Đúng/Sai</option>
                  <option value="short_answer">Tự luận ngắn</option>
                </select>
              </div>
              
              <div className="form-section-ex">
                <label>Câu hỏi</label>
                <input 
                  type="text"
                  className="form-input-ex"
                  placeholder="Nhập câu hỏi..."
                  value={q.question}
                  onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                />
              </div>
              
              {q.type === 'multiple_choice' && (
                <>
                  <div className="form-section-ex">
                    <label>Đáp án</label>
                    {q.options.map((opt, optIdx) => (
                      <input 
                        key={optIdx}
                        type="text"
                        className="form-input-ex"
                        placeholder={`${String.fromCharCode(65 + optIdx)}. Đáp án ${optIdx + 1}`}
                        value={opt}
                        onChange={(e) => updateQuestionOption(idx, optIdx, e.target.value)}
                        style={{ marginBottom: '8px' }}
                      />
                    ))}
                    <select 
                      className="form-select-ex"
                      value={q.correct_answer}
                      onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value)}
                    >
                      <option value="">Chọn đáp án đúng</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </>
              )}
              
              {(q.type === 'fill_blank' || q.type === 'short_answer') && (
                <div className="form-section-ex">
                  <label>Đáp án đúng</label>
                  <input 
                    type="text"
                    className="form-input-ex"
                    placeholder="Nhập đáp án..."
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value)}
                  />
                </div>
              )}
              
              {q.type === 'true_false' && (
                <div className="form-section-ex">
                  <label>Đáp án đúng</label>
                  <select 
                    className="form-select-ex"
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value)}
                  >
                    <option value="">Chọn...</option>
                    <option value="true">Đúng</option>
                    <option value="false">Sai</option>
                  </select>
                </div>
              )}
              
              <div className="form-section-ex">
                <label>Điểm</label>
                <input 
                  type="number"
                  className="form-input-ex"
                  value={q.points}
                  onChange={(e) => updateQuestion(idx, 'points', Number(e.target.value))}
                  min="0.5"
                  step="0.5"
                />
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
}
```

---

## ✅ DONE!

Sau khi thêm code trên, file `CreateExerciseModalComplete.jsx` sẽ hoàn chỉnh với:
- ✅ Mid-term/Final upload Word/PDF
- ✅ Import section với file upload
- ✅ AI section với 2 modes (files & QB)
- ✅ "Từ Ngân hàng" button hoạt động
- ✅ Listening, Speaking, Reading, Writing forms đầy đủ
- ✅ Questions management
- ✅ Clean data structure for backend

**Next:** Create QuestionBankSelectorModal.jsx

