import React, { useRef } from 'react';
import { X } from 'lucide-react';
import './ExerciseManagement.css';
import QuestionBankSelectorModal from './QuestionBankSelectorModal';
import Toast from '../../../../../components/Toast/Toast';
import useToast from '../../../../../hooks/useToast';
import {
  ExerciseFormFields,
  TestTypeSelector,
  SkillSelector,
  InputMethodSelector,
  ListeningForm,
  ReadingForm,
  WritingForm,
  SpeakingForm,
  MidtermFinalForm,
  QuestionList,
  AIGenerationPanel,
  ImportPanel,
} from './components';
import {
  useExerciseCreation,
  useQuestionManagement,
  useAIGeneration,
  useFileImport,
} from './hooks';

/**
 * Refactored CreateExerciseModal - Main orchestration component
 * Uses extracted components and custom hooks for business logic
 */
export default function CreateExerciseModal({ onClose, onCreate }) {
  const { toast, showSuccess, showWarning, hideToast } = useToast();
  
  // Custom hooks
  const exerciseState = useExerciseCreation(onClose, onCreate, showWarning);
  const questionState = useQuestionManagement();
  const aiGeneration = useAIGeneration(
    exerciseState.classes,
    exerciseState.classId,
    exerciseState.testType,
    exerciseState.aiFormData,
    showWarning,
    showSuccess
  );
  const fileImport = useFileImport(showWarning, showSuccess, onClose, onCreate);
  
  // Refs
  const audioInputRef = useRef(null);
  const [showQuestionBankModal, setShowQuestionBankModal] = React.useState(false);
  
  // Handlers
  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      exerciseState.setAudioFile(file);
      exerciseState.setAudioUrl(URL.createObjectURL(file));
    }
  };
  
  const handleGenerateAI = () => {
    aiGeneration.generateExerciseWithAI({
      setTranscript: exerciseState.setTranscript,
      setAudioUrl: exerciseState.setAudioUrl,
      setShowTranscript: exerciseState.setShowTranscript,
      setPassageText: exerciseState.setPassageText,
      setWritingPrompt: exerciseState.setWritingPrompt,
      setWritingInstructions: exerciseState.setWritingInstructions,
      setMinWords: exerciseState.setMinWords,
      setMaxWords: exerciseState.setMaxWords,
      setSpeakingPrompt: exerciseState.setSpeakingPrompt,
      setSpeakingInstructions: exerciseState.setSpeakingInstructions,
      setPrepTime: exerciseState.setPrepTime,
      setSpeakTime: exerciseState.setSpeakTime,
      setQuestions: questionState.setQuestions,
      setInputMethod: exerciseState.setInputMethod,
    });
  };
  
  const handleImportWord = () => {
    fileImport.importFromWord(
      exerciseState.importFile,
      exerciseState.title,
      exerciseState.classId,
      exerciseState.testType,
      exerciseState.dueDate
    );
  };
  
  const handleSubmit = () => {
    exerciseState.handleSubmit(questionState.questions);
  };
  
  return (
    <div className="modal-overlay-ex" onClick={onClose}>
      <div className="modal-content-ex-large" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-ex">
          <h2 className="modal-title-ex">Tạo đề thi mới</h2>
          <button className="btn-close-ex" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        {/* Body */}
        <div className="modal-body-ex">
          {/* Test Type Selection */}
          <TestTypeSelector
            testType={exerciseState.testType}
            onTestTypeChange={exerciseState.setTestType}
          />
          
          {/* Skill Selection (for skill_exercise and test_15min) */}
          {exerciseState.requiresSkill && (
            <SkillSelector
              selectedSkill={exerciseState.selectedSkill}
              onSkillChange={exerciseState.setSelectedSkill}
            />
          )}
          
          {/* Input Method Selection */}
          <InputMethodSelector
            inputMethod={exerciseState.inputMethod}
            onInputMethodChange={exerciseState.setInputMethod}
            isMidtermOrFinal={exerciseState.isMidtermOrFinal}
          />
          
          {/* Manual Input */}
          {exerciseState.inputMethod === 'manual' && (
            <>
              <ExerciseFormFields
                title={exerciseState.title}
                onTitleChange={exerciseState.setTitle}
                classId={exerciseState.classId}
                onClassIdChange={exerciseState.setClassId}
                classes={exerciseState.classes}
                dueDate={exerciseState.dueDate}
                onDueDateChange={exerciseState.setDueDate}
                maxScore={exerciseState.maxScore}
                onMaxScoreChange={exerciseState.setMaxScore}
              />
              
              {/* Skill Forms */}
              {exerciseState.isMidtermOrFinal ? (
                <MidtermFinalForm
                  // Listening
                  transcript={exerciseState.transcript}
                  onTranscriptChange={exerciseState.setTranscript}
                  audioUrl={exerciseState.audioUrl}
                  showTranscript={exerciseState.showTranscript}
                  onShowTranscriptChange={exerciseState.setShowTranscript}
                  onAudioUpload={handleAudioUpload}
                  audioInputRef={audioInputRef}
                  // Reading
                  passageText={exerciseState.passageText}
                  onPassageTextChange={exerciseState.setPassageText}
                  readingInputMethod={exerciseState.readingInputMethod}
                  onReadingInputMethodChange={exerciseState.setReadingInputMethod}
                  // Writing
                  writingPrompt={exerciseState.writingPrompt}
                  onWritingPromptChange={exerciseState.setWritingPrompt}
                  writingType={exerciseState.writingType}
                  onWritingTypeChange={exerciseState.setWritingType}
                  writingInstructions={exerciseState.writingInstructions}
                  onWritingInstructionsChange={exerciseState.setWritingInstructions}
                  minWords={exerciseState.minWords}
                  onMinWordsChange={exerciseState.setMinWords}
                  maxWords={exerciseState.maxWords}
                  onMaxWordsChange={exerciseState.setMaxWords}
                  // Speaking
                  speakingPrompt={exerciseState.speakingPrompt}
                  onSpeakingPromptChange={exerciseState.setSpeakingPrompt}
                  speakingInstructions={exerciseState.speakingInstructions}
                  onSpeakingInstructionsChange={exerciseState.setSpeakingInstructions}
                  prepTime={exerciseState.prepTime}
                  onPrepTimeChange={exerciseState.setPrepTime}
                  speakTime={exerciseState.speakTime}
                  onSpeakTimeChange={exerciseState.setSpeakTime}
                />
              ) : (
                <>
                  {exerciseState.selectedSkill === 'listening' && (
                    <ListeningForm
                      transcript={exerciseState.transcript}
                      onTranscriptChange={exerciseState.setTranscript}
                      audioUrl={exerciseState.audioUrl}
                      showTranscript={exerciseState.showTranscript}
                      onShowTranscriptChange={exerciseState.setShowTranscript}
                      onAudioUpload={handleAudioUpload}
                      audioInputRef={audioInputRef}
                    />
                  )}
                  {exerciseState.selectedSkill === 'reading' && (
                    <ReadingForm
                      passageText={exerciseState.passageText}
                      onPassageTextChange={exerciseState.setPassageText}
                      readingInputMethod={exerciseState.readingInputMethod}
                      onReadingInputMethodChange={exerciseState.setReadingInputMethod}
                    />
                  )}
                  {exerciseState.selectedSkill === 'writing' && (
                    <WritingForm
                      writingPrompt={exerciseState.writingPrompt}
                      onWritingPromptChange={exerciseState.setWritingPrompt}
                      writingType={exerciseState.writingType}
                      onWritingTypeChange={exerciseState.setWritingType}
                      writingInstructions={exerciseState.writingInstructions}
                      onWritingInstructionsChange={exerciseState.setWritingInstructions}
                      minWords={exerciseState.minWords}
                      onMinWordsChange={exerciseState.setMinWords}
                      maxWords={exerciseState.maxWords}
                      onMaxWordsChange={exerciseState.setMaxWords}
                    />
                  )}
                  {exerciseState.selectedSkill === 'speaking' && (
                    <SpeakingForm
                      speakingPrompt={exerciseState.speakingPrompt}
                      onSpeakingPromptChange={exerciseState.setSpeakingPrompt}
                      speakingInstructions={exerciseState.speakingInstructions}
                      onSpeakingInstructionsChange={exerciseState.setSpeakingInstructions}
                      prepTime={exerciseState.prepTime}
                      onPrepTimeChange={exerciseState.setPrepTime}
                      speakTime={exerciseState.speakTime}
                      onSpeakTimeChange={exerciseState.setSpeakTime}
                    />
                  )}
                </>
              )}
              
              {/* Questions */}
              <QuestionList
                questions={questionState.questions}
                onAddQuestion={questionState.addQuestion}
                onRemoveQuestion={questionState.removeQuestion}
                onUpdateQuestion={questionState.updateQuestion}
                onUpdateQuestionOption={questionState.updateQuestionOption}
                onShowQuestionBank={() => setShowQuestionBankModal(true)}
              />
            </>
          )}
          
          {/* AI Generation */}
          {exerciseState.inputMethod === 'ai' && (
            <AIGenerationPanel
              title={exerciseState.title}
              onTitleChange={exerciseState.setTitle}
              classId={exerciseState.classId}
              onClassIdChange={exerciseState.setClassId}
              classes={exerciseState.classes}
              dueDate={exerciseState.dueDate}
              onDueDateChange={exerciseState.setDueDate}
              maxScore={exerciseState.maxScore}
              onMaxScoreChange={exerciseState.setMaxScore}
              aiSource={exerciseState.aiSource}
              onAiSourceChange={exerciseState.setAiSource}
              aiFiles={exerciseState.aiFiles}
              onAiFilesChange={exerciseState.setAiFiles}
              aiPrompt={exerciseState.aiPrompt}
              onAiPromptChange={exerciseState.setAiPrompt}
              aiFormData={exerciseState.aiFormData}
              onAiFormDataChange={exerciseState.setAiFormData}
              qbNumQuestions={exerciseState.qbNumQuestions}
              onQbNumQuestionsChange={exerciseState.setQbNumQuestions}
              qbDifficulty={exerciseState.qbDifficulty}
              onQbDifficultyChange={exerciseState.setQbDifficulty}
              onGenerateAI={handleGenerateAI}
              isGenerating={aiGeneration.isGeneratingAI}
            />
          )}
          
          {/* Import */}
          {exerciseState.inputMethod === 'import' && (
            <ImportPanel
              title={exerciseState.title}
              onTitleChange={exerciseState.setTitle}
              classId={exerciseState.classId}
              onClassIdChange={exerciseState.setClassId}
              classes={exerciseState.classes}
              dueDate={exerciseState.dueDate}
              onDueDateChange={exerciseState.setDueDate}
              maxScore={exerciseState.maxScore}
              onMaxScoreChange={exerciseState.setMaxScore}
              importFile={exerciseState.importFile}
              onImportFileChange={exerciseState.setImportFile}
              onImportWordFile={handleImportWord}
              isProcessing={fileImport.isProcessing}
              importPreview={null}
            />
          )}
        </div>
        
        {/* Footer */}
        {exerciseState.inputMethod === 'manual' && (
          <div className="modal-footer-ex">
            <button className="btn-cancel-ex" onClick={onClose}>Hủy</button>
            <button className="btn-submit-ex" onClick={handleSubmit}>Tạo đề thi</button>
          </div>
        )}
        
        {/* Question Bank Modal */}
        {showQuestionBankModal && (
          <QuestionBankSelectorModal
            onClose={() => setShowQuestionBankModal(false)}
            onSelectQuestions={questionState.handleQuestionsFromBank}
          />
        )}
        
        {/* Toast */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    </div>
  );
}
