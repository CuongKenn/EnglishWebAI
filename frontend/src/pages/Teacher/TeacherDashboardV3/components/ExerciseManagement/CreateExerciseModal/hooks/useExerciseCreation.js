import { useState, useEffect, useCallback } from 'react';
import { apiV1 } from '../../../../../../services/api';

/**
 * Custom hook for managing exercise creation state and submission
 */
export const useExerciseCreation = (onClose, onCreate, showWarning) => {
  // Classes
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  
  // Exercise settings
  const [testType, setTestType] = useState('skill_exercise');
  const [selectedSkill, setSelectedSkill] = useState('listening');
  const [inputMethod, setInputMethod] = useState('manual');
  
  // Basic fields
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  
  // Listening
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  
  // Reading
  const [passageText, setPassageText] = useState('');
  const [readingInputMethod, setReadingInputMethod] = useState('text');
  const [passageFile, setPassageFile] = useState(null);
  
  // Speaking
  const [speakingPrompt, setSpeakingPrompt] = useState('');
  const [speakingInstructions, setSpeakingInstructions] = useState(['']);
  const [prepTime, setPrepTime] = useState(60);
  const [speakTime, setSpeakTime] = useState(180);
  
  // Writing
  const [writingPrompt, setWritingPrompt] = useState('');
  const [writingType, setWritingType] = useState('essay');
  const [writingInstructions, setWritingInstructions] = useState(['']);
  const [minWords, setMinWords] = useState(250);
  const [maxWords, setMaxWords] = useState(400);
  
  // Files
  const [wordFile, setWordFile] = useState(null);
  const [importFile, setImportFile] = useState(null);
  
  // AI
  const [aiSource, setAiSource] = useState('curriculum');
  const [aiFiles, setAiFiles] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [qbNumQuestions, setQbNumQuestions] = useState(20);
  const [qbDifficulty, setQbDifficulty] = useState('mixed');
  const [aiFormData, setAiFormData] = useState({ semester: '1' });
  
  // Helpers
  const requiresSkill = testType === 'skill_exercise' || testType === 'test_15min';
  const isMidtermOrFinal = testType === 'midterm' || testType === 'final';
  
  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await apiV1.get('/classes/teaching');
        setClasses(response.data);
        if (response.data.length > 0 && !classId) {
          setClassId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);
  
  // Auto-switch to AI for midterm/final
  useEffect(() => {
    if (isMidtermOrFinal) setInputMethod('ai');
  }, [testType]);
  
  // Submit handler
  const handleSubmit = useCallback((questions) => {
    if (!title) {
      showWarning('Vui lòng nhập tiêu đề!');
      return;
    }
    
    const exercise = {
      title,
      type: testType,
      skill: requiresSkill ? selectedSkill : null,
      classId,
      dueDate,
      maxScore,
      description: '',
      content: {},
    };
    
    if (isMidtermOrFinal) {
      exercise.content = { type: 'comprehensive_test' };
      if (transcript || audioUrl) {
        exercise.content.listening = {
          script: transcript,
          audio_url: audioUrl,
          questions: questions.filter(q => q.section === 'listening' || q.skill === 'listening')
        };
      }
      if (passageText) {
        exercise.content.reading = {
          passage: passageText,
          word_count: passageText.split(/\s+/).filter(Boolean).length,
          questions: questions.filter(q => q.section === 'reading' || q.skill === 'reading')
        };
      }
      if (writingPrompt) {
        exercise.content.writing = {
          prompt: writingPrompt,
          type: writingType,
          instructions: writingInstructions.filter(Boolean),
          word_limit: { min: minWords, max: maxWords }
        };
      }
      if (speakingPrompt) {
        exercise.content.speaking = {
          prompt: speakingPrompt,
          instructions: speakingInstructions.filter(Boolean),
          preparation_time: prepTime,
          time_limit: speakTime
        };
      }
      if (!exercise.content.listening && !exercise.content.reading && !exercise.content.writing && !exercise.content.speaking) {
        exercise.content.questions = questions;
      }
    } else {
      if (selectedSkill === 'listening') {
        exercise.content = { audio_url: audioUrl, transcript, show_transcript: showTranscript, questions };
      } else if (selectedSkill === 'speaking') {
        exercise.content = {
          prompt: speakingPrompt,
          instructions: speakingInstructions.filter(Boolean),
          preparation_time: prepTime,
          time_limit: speakTime
        };
      } else if (selectedSkill === 'reading') {
        exercise.content = {
          passage: passageText,
          word_count: passageText.split(/\s+/).filter(Boolean).length,
          questions
        };
      } else if (selectedSkill === 'writing') {
        exercise.content = {
          prompt: writingPrompt,
          type: writingType,
          instructions: writingInstructions.filter(Boolean),
          word_limit: { min: minWords, max: maxWords }
        };
      }
    }
    
    onCreate(exercise);
  }, [title, testType, selectedSkill, classId, dueDate, maxScore, requiresSkill, isMidtermOrFinal,
      transcript, audioUrl, showTranscript, passageText, writingPrompt, writingType, writingInstructions,
      minWords, maxWords, speakingPrompt, speakingInstructions, prepTime, speakTime, showWarning, onCreate]);
  
  return {
    classes, loadingClasses,
    testType, setTestType,
    selectedSkill, setSelectedSkill,
    inputMethod, setInputMethod,
    title, setTitle,
    classId, setClassId,
    dueDate, setDueDate,
    maxScore, setMaxScore,
    transcript, setTranscript,
    showTranscript, setShowTranscript,
    audioUrl, setAudioUrl,
    audioFile, setAudioFile,
    passageText, setPassageText,
    readingInputMethod, setReadingInputMethod,
    passageFile, setPassageFile,
    speakingPrompt, setSpeakingPrompt,
    speakingInstructions, setSpeakingInstructions,
    prepTime, setPrepTime,
    speakTime, setSpeakTime,
    writingPrompt, setWritingPrompt,
    writingType, setWritingType,
    writingInstructions, setWritingInstructions,
    minWords, setMinWords,
    maxWords, setMaxWords,
    wordFile, setWordFile,
    importFile, setImportFile,
    aiSource, setAiSource,
    aiFiles, setAiFiles,
    aiPrompt, setAiPrompt,
    qbNumQuestions, setQbNumQuestions,
    qbDifficulty, setQbDifficulty,
    aiFormData, setAiFormData,
    requiresSkill,
    isMidtermOrFinal,
    handleSubmit,
  };
};
