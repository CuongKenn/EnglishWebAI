# Large Files Refactoring Plan

## Overview
This document outlines the strategy for refactoring the three remaining large component files to improve maintainability, testability, and scalability.

---

## 1. CreateExerciseModalComplete.jsx (1999 lines)

**Current State:**
- Single monolithic component handling all exercise creation logic
- Multiple test types (skill_exercise, test_15min, midterm, final)
- Four skill types (listening, reading, writing, speaking)
- Three input methods (manual, AI, import from Word/files/question bank)
- Complex state management (~60 state variables)

**Proposed Modular Structure:**
```
CreateExerciseModal/
├── CreateExerciseModalComplete.jsx  # Main orchestrator
├── components/
│   ├── ExerciseFormFields.jsx      # Title, class, due date, max score
│   ├── TestTypeSelector.jsx        # Test type and skill selection
│   ├── InputMethodSelector.jsx     # Manual, AI, Import tabs
│   ├── ListeningForm.jsx           # Audio upload, transcript
│   ├── ReadingForm.jsx             # Passage text/upload
│   ├── WritingForm.jsx             # Prompt, type, word limits
│   ├── SpeakingForm.jsx            # Prompt, instructions, timers
│   ├── MidtermFinalForm.jsx        # All-skills comprehensive form
│   ├── QuestionList.jsx            # Display/edit questions
│   ├── QuestionEditor.jsx          # Single question CRUD
│   ├── AIGenerationPanel.jsx      # AI generation interface
│   ├── ImportPanel.jsx             # Word/file import interface
│   └── index.js
├── hooks/
│   ├── useExerciseCreation.js     # Main exercise creation logic
│   ├── useQuestionManagement.js   # Question CRUD operations
│   ├── useAIGeneration.js         # AI generation logic
│   ├── useFileImport.js           # File upload/import logic
│   └── index.js
├── utils/
│   ├── exerciseValidation.js      # Form validation rules
│   ├── questionFormatters.js      # Question data formatting
│   ├── skillHelpers.js            # Skill-specific utilities
│   └── index.js
├── constants.js                    # Test types, skills, defaults
└── REFACTORING.md                  # Architecture documentation
```

**Extraction Strategy:**
1. **Phase 1: Constants & Utils** (~100 lines)
   - Extract constants (TEST_TYPES, SKILLS, DEFAULTS)
   - Create validation functions
   - Create formatting utilities

2. **Phase 2: Simple Form Components** (~400 lines)
   - ExerciseFormFields (title, class, dates)
   - TestTypeSelector (radio buttons)
   - InputMethodSelector (tabs)

3. **Phase 3: Skill-Specific Forms** (~600 lines)
   - ListeningForm (audio, transcript)
   - ReadingForm (passage)
   - WritingForm (prompt, limits)
   - SpeakingForm (instructions, timers)
   - MidtermFinalForm (combined)

4. **Phase 4: Complex Components** (~400 lines)
   - QuestionList (display questions)
   - QuestionEditor (edit single question)
   - AIGenerationPanel (AI interface)
   - ImportPanel (file imports)

5. **Phase 5: Custom Hooks** (~300 lines)
   - useExerciseCreation (main logic)
   - useQuestionManagement (question CRUD)
   - useAIGeneration (AI calls)
   - useFileImport (uploads)

6. **Phase 6: Integration** (~200 lines)
   - Update main component
   - Wire up all extracted parts
   - Test functionality

**Expected Results:**
- Main file: ~200 lines (↓90%)
- 12 reusable components
- 4 custom hooks
- 3 utility modules
- Better testability
- Easier maintenance

---

## 2. DoExercise.jsx (2013 lines)

**Current State:**
- Handles exercise submission for all skills
- Real-time validation
- Audio recording for speaking
- File uploads
- Timer management
- Progress tracking

**Proposed Modular Structure:**
```
DoExercise/
├── DoExercise.jsx                 # Main orchestrator
├── components/
│   ├── ExerciseHeader.jsx         # Title, timer, progress
│   ├── ProgressBar.jsx            # Visual progress indicator
│   ├── ListeningSection.jsx      # Audio player + questions
│   ├── ReadingSection.jsx        # Passage + questions
│   ├── WritingSection.jsx        # Text editor + word count
│   ├── SpeakingSection.jsx       # Recording interface
│   ├── QuestionDisplay.jsx       # Single question renderer
│   ├── AnswerInput.jsx            # Answer input component
│   ├── SubmissionSummary.jsx     # Review before submit
│   └── index.js
├── hooks/
│   ├── useExerciseSubmission.js  # Main submission logic
│   ├── useAudioRecording.js      # Speaking recording
│   ├── useTimer.js                # Countdown timer
│   ├── useProgress.js             # Progress tracking
│   └── index.js
├── utils/
│   ├── answerValidation.js       # Validate answers
│   ├── scoringHelpers.js         # Calculate scores
│   ├── timeManagement.js         # Time utilities
│   └── index.js
├── constants.js
└── REFACTORING.md
```

**Extraction Strategy:**
1. Extract header and progress components
2. Extract skill-specific sections
3. Extract question/answer components
4. Create custom hooks for complex logic
5. Create utility functions
6. Integrate and test

**Expected Results:**
- Main file: ~250 lines (↓87%)
- 9 reusable components
- 4 custom hooks
- 3 utility modules

---

## 3. SubmissionGradingPage.jsx (1804 lines)

**Current State:**
- Grade student submissions
- Provide feedback
- AI-assisted grading
- Rubric management
- Score calculation

**Proposed Modular Structure:**
```
SubmissionGrading/
├── SubmissionGradingPage.jsx     # Main orchestrator
├── components/
│   ├── SubmissionHeader.jsx      # Student info, submission time
│   ├── GradingForm.jsx           # Score inputs
│   ├── FeedbackPanel.jsx         # Feedback text editor
│   ├── ScoreDisplay.jsx          # Score breakdown
│   ├── AIFeedbackSection.jsx     # AI suggestions
│   ├── RubricEditor.jsx          # Rubric management
│   ├── AnswerReview.jsx          # Display student answers
│   └── index.js
├── hooks/
│   ├── useGrading.js             # Main grading logic
│   ├── useAIFeedback.js          # AI feedback generation
│   ├── useRubric.js              # Rubric management
│   └── index.js
├── utils/
│   ├── gradingCalculations.js   # Score calculations
│   ├── feedbackFormatting.js    # Format feedback text
│   ├── rubricHelpers.js          # Rubric utilities
│   └── index.js
├── constants.js
└── REFACTORING.md
```

**Extraction Strategy:**
1. Extract display components (header, scores)
2. Extract input components (forms, editors)
3. Extract AI-related components
4. Create custom hooks
5. Create utility functions
6. Integrate and test

**Expected Results:**
- Main file: ~220 lines (↓88%)
- 7 reusable components
- 3 custom hooks
- 3 utility modules

---

## Benefits of Refactoring

### Maintainability
- Single Responsibility Principle
- Easier to locate and fix bugs
- Clear code organization
- Better code documentation

### Testability
- Small, focused units
- Pure functions easy to test
- Isolated components
- Mock-friendly architecture

### Performance
- React.memo on components
- useCallback on functions
- Reduced re-renders
- Lazy loading potential

### Scalability
- Easy to add new features
- Reusable components
- Consistent patterns
- Team collaboration friendly

### Developer Experience
- Faster onboarding
- Better IntelliSense
- Clearer file structure
- Easier code reviews

---

## Implementation Timeline

**Estimated Time: 8-12 hours**

1. CreateExerciseModalComplete: 4-5 hours
2. DoExercise: 3-4 hours
3. SubmissionGradingPage: 2-3 hours

**Approach:**
- Extract and test incrementally
- Commit after each major extraction
- Build and verify after each phase
- Document as we go

---

## Success Metrics

- ✅ All main files < 300 lines
- ✅ All tests passing
- ✅ Build successful
- ✅ No functionality broken
- ✅ Performance maintained or improved
- ✅ Code coverage increased
- ✅ Documentation complete

---

## Next Steps

1. ✅ Create refactoring plan (this document)
2. ⏳ Extract CreateExerciseModalComplete components
3. ⏳ Extract DoExercise components
4. ⏳ Extract SubmissionGradingPage components
5. ⏳ Test all refactored components
6. ⏳ Update documentation
7. ⏳ Create PR for review

---

*Last Updated: November 1, 2025*
*Status: Planning Complete - Ready for Implementation*
