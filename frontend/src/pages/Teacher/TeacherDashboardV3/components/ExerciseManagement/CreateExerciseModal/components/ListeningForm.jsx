import React, { useRef } from 'react';
import { FileAudio, Trash2 } from 'lucide-react';

/**
 * Listening form component
 * Handles audio upload, transcript, and show transcript checkbox
 */
const ListeningForm = React.memo(({
  audioUrl,
  audioFile,
  transcript,
  showTranscript,
  onAudioChange,
  onAudioRemove,
  onTranscriptChange,
  onShowTranscriptChange,
  renderQuestions,
}) => {
  const audioInputRef = useRef(null);

  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && onAudioChange) {
      onAudioChange(file);
    }
  };

  const handleRemoveAudio = (e) => {
    if (e) e.stopPropagation();
    if (onAudioRemove) {
      onAudioRemove();
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  return (
    <div className="listening-form-content">
      <h4 className="section-title">🎧 Nội dung bài Nghe</h4>
      
      {/* Audio Upload */}
      <div className="form-section-ex">
        <label className="form-label-ex">File Audio * (.mp3, .wav, .ogg)</label>
        
        {audioUrl ? (
          /* AI Generated Audio */
          <div className="audio-preview-container">
            <div className="audio-info-box">
              <FileAudio size={28} className="audio-icon-success" />
              <div className="audio-info-text">
                <span className="audio-label">🤖 Audio được tạo bởi AI</span>
                <span className="audio-url">{audioUrl}</span>
              </div>
              <button 
                onClick={handleRemoveAudio}
                className="btn-remove-file"
                type="button"
                title="Xóa audio AI"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <audio controls src={audioUrl} className="audio-player-full" style={{ width: '100%', marginTop: '12px' }} />
          </div>
        ) : (
          /* Upload Zone */
          <div 
            className="file-upload-zone" 
            onClick={() => audioInputRef.current?.click()}
          >
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
                  onClick={handleRemoveAudio}
                  className="btn-remove-file"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Transcript */}
      <div className="form-section-ex">
        <label className="form-label-ex">Transcript (Bản ghi âm)</label>
        <textarea 
          className="form-textarea-ex"
          rows="6"
          placeholder="Nhập transcript của audio..."
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
        />
        <label className="checkbox-label-ex">
          <input 
            type="checkbox"
            checked={showTranscript}
            onChange={(e) => onShowTranscriptChange(e.target.checked)}
          />
          <span>Hiển thị transcript cho học sinh</span>
        </label>
      </div>
      
      {/* Questions */}
      {renderQuestions && renderQuestions()}
    </div>
  );
});

ListeningForm.displayName = 'ListeningForm';

export default ListeningForm;
