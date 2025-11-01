# Performance Optimization Guide

> **Status**: 🟢 In Progress - 9 optimization tasks completed  
> **Branch**: `optimize-production-code`  
> **Commits**: 9 optimization commits ready for review  
> **Build Status**: ✅ All tests passing

---

## 📋 Quick Summary

This guide documents all performance optimizations applied to EnglishWebAI project:

- ✅ **Completed**: 9 major optimizations
- 🔄 **In Progress**: Timing constants (partial)
- ⏳ **Pending**: Component refactoring

**Expected Performance Impact**:
- Bundle size: ↓ 35-40%
- Load time: ↓ 40-50%
- Re-renders: ↓ 30-40%
- Search performance: ↓ 60% filter operations

---

## ✅ Đã hoàn thành (Completed)

### 1. Logger Utility
- ✅ Frontend: `src/utils/logger.js`
- ✅ Backend: `app/utils/logger.py`
- ✅ Environment-aware logging (dev only)
- ✅ Replaced 60+ console.log and 35+ print()

### 2. Error Boundaries
- ✅ `src/components/ErrorBoundary/ErrorBoundary.jsx`
- ✅ Wrapped all routes in App.jsx
- ✅ Elegant fallback UI with reset/reload

### 3. Lazy Loading
- ✅ Converted 40+ components to React.lazy()
- ✅ Code splitting for heavy components
- ✅ Suspense with loading fallback
- ✅ Expected: -40~50% initial load time

### 4. Constants Configuration
- ✅ `src/config/constants.js`
- ✅ Centralized magic numbers and hardcoded values
- ✅ API config, file limits, test types, etc.

### 5. Custom Hooks
- ✅ `src/hooks/useFetch.js` - API calls with loading states
- ✅ useFetchMultiple - Parallel requests
- ✅ usePaginatedFetch - Built-in pagination

### 6. Loading Components
- ✅ `src/components/Loading/LoadingSpinner.jsx`
- ✅ Multiple variants: Spinner, Skeleton, Overlay, Pulse, Progress

### 7. React.memo Optimization
- ✅ `ExerciseListTable.jsx` - Table component (wrapped with React.memo)
- ✅ `ExerciseList.jsx` - Card grid (wrapped with React.memo)
- ✅ `QuestionBankSelectorModal.jsx` - Modal (wrapped with React.memo)
- ✅ `AISidebar.jsx`, `ScrollArea.jsx`, `Slider.jsx` - UI components
- ✅ Expected: ~30-40% reduction in unnecessary re-renders

### 8. Debouncing for Search Inputs
- ✅ `src/hooks/useDebounce.js` - Custom debounce hook (300ms delay)
- ✅ Applied to `QuestionBankV2.jsx` search (2000+ questions)
- ✅ Applied to `ExerciseManagementV2.jsx` search
- ✅ Prevents filter operations on every keystroke
- ✅ Expected: ~50-60% reduction in filter operations, smoother UX

### 9. Timing Constants (Partial Progress)
- ✅ Expanded `UI_CONFIG` with 10+ timing constants
- ✅ Constants added: NOTIFICATION_DURATION (3000ms), COPIED_INDICATOR_DURATION (2000ms), RIPPLE_DURATION (600ms), FOCUS_DELAY (100ms), TIMER_INTERVAL (1000ms)
- ✅ Applied to: `ShareModal.jsx` (2 setTimeout replacements)
- ⏳ **Remaining work:** 20+ files with hardcoded setTimeout values need constant replacement
- 📄 Files identified: ListeningExercise.jsx, WritingExercise.jsx, DoExercise.jsx, Login.jsx, Register.jsx, Profile.jsx, Admin/Settings.jsx, AISettings.jsx

---

## 🔧 Cần implement (To Do)

### 1. useMemo và useCallback cho Heavy Computations

**⚠️ Priority:** HIGH - CreateExerciseModalComplete.jsx cần refactor trước

**Lý do skip tạm thời:**
- File quá lớn (2000+ lines)
- Có nhiều state dependencies phức tạp
- Cần split thành smaller components trước
- Adding useMemo/useCallback vào file lớn không hiệu quả

**Kế hoạch:**
1. Split CreateExerciseModalComplete thành:
   - `ListeningSection.jsx`
   - `ReadingSection.jsx`
   - `WritingSection.jsx`
   - `SpeakingSection.jsx`
   - `QuestionList.jsx`
2. Sau khi split, áp dụng useMemo/useCallback cho từng section

**Files khác cần optimize:**

**useMemo - Cho expensive computations:**

```jsx
// ❌ Before - Re-calculates mỗi lần render
function ExerciseList({ exercises, searchTerm }) {
  const filteredExercises = exercises.filter(ex => 
    ex.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return <div>{filteredExercises.map(...)}</div>;
}

// ✅ After - Chỉ re-calculate khi exercises hoặc searchTerm thay đổi
function ExerciseList({ exercises, searchTerm }) {
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => 
      ex.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exercises, searchTerm]);
  
  return <div>{filteredExercises.map(...)}</div>;
}
```

**useCallback - Cho functions được pass vào child components:**

```jsx
// ❌ Before - New function mỗi lần render
function Parent() {
  const [data, setData] = useState([]);
  
  const handleDelete = (id) => {
    setData(data.filter(item => item.id !== id));
  };
  
  return <ChildComponent onDelete={handleDelete} />;
}

// ✅ After - Stable function reference
function Parent() {
  const [data, setData] = useState([]);
  
  const handleDelete = useCallback((id) => {
    setData(prev => prev.filter(item => item.id !== id));
  }, []); // Empty deps vì dùng functional update
  
  return <ChildComponent onDelete={handleDelete} />;
}
```

**Files cần optimize:**
- `CreateExerciseModalComplete.jsx` (2000+ lines)
  - Wrap render functions (renderQuestions, renderListeningForm, etc.)
  - useMemo cho filtered questions
  - useCallback cho event handlers
  
- `QuestionBankV2.jsx` (2200+ lines)
  - useMemo cho filtered/sorted questions
  - useCallback cho handleAddQuestion, handleEditQuestion
  - Expensive computations trong AI generation

- `DoExercise.jsx` (87KB)
  - useMemo cho question validation
  - useCallback cho submission handlers

---

### 3. Implement TODOs

**High Priority TODOs cần hoàn thiện:**

1. **Course Management** (`Courses.jsx:524`)
   ```javascript
   // TODO: Handle update course
   const handleUpdateCourse = async (courseId, updatedData) => {
     // Implement API call
   };
   ```

2. **Thumbnail Upload** (`CoursesManagement.jsx:143,155,182,874`)
   ```javascript
   // TODO: Add thumbnail upload
   const handleThumbnailUpload = async (file) => {
     const formData = new FormData();
     formData.append('thumbnail', file);
     // Call API
   };
   ```

3. **Backup/Restore** (`Admin Backup.jsx:34,40`)
   ```javascript
   // TODO: Implement download backup
   // TODO: Implement restore from backup
   ```

4. **Notification API** (`NotificationDropdown.jsx:28`)
   ```javascript
   // TODO: Fetch from API instead of mock data
   const fetchNotifications = async () => {
     const response = await api.getNotifications();
     setNotifications(response.data);
   };
   ```

5. **Profile Features** (`Profile.jsx:259,272`)
   ```javascript
   // TODO: Save to backend
   // TODO: Email verification
   ```

**Backend Endpoints cần thêm:**
- `GET /api/courses/thumbnails`
- `POST /api/courses/{id}/update`
- `GET /api/question-bank/selector`
- `POST /api/admin/backup/download`
- `POST /api/admin/backup/restore`
- `POST /api/profile/verify-email`

---

### 4. Code Splitting Best Practices

**Hiện tại:** Đã lazy load routes

**Cần thêm:** Route-based code splitting cho sub-pages

```jsx
// TeacherDashboardV3 có nhiều sub-pages
const ExerciseManagement = lazy(() => import('./components/ExerciseManagement'));
const QuestionBank = lazy(() => import('./components/QuestionBankV2'));
const GradingFeedback = lazy(() => import('./components/GradingFeedback'));
```

---

### 5. Debouncing cho Search/Input

**Sử dụng constants đã định nghĩa:**

```jsx
import { UI_CONFIG } from '../config/constants';
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

function SearchBar({ onSearch }) {
  const debouncedSearch = useMemo(
    () => debounce(onSearch, UI_CONFIG.SEARCH_DEBOUNCE),
    [onSearch]
  );
  
  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

**Files cần thêm debounce:**
- Search bars trong QuestionBankV2
- Search trong ExerciseManagement
- Filter inputs trong các dashboards

---

### 6. Replace Magic Numbers với Constants

**Ví dụ:**

```jsx
// ❌ Before
const timeout = 180000;
const maxQuestions = 50;
if (file.size > 10 * 1024 * 1024) { ... }

// ✅ After
import { API_CONFIG, EXERCISE_CONFIG, FILE_CONFIG } from '../config/constants';

const timeout = API_CONFIG.AI_GENERATION_TIMEOUT;
const maxQuestions = EXERCISE_CONFIG.MAX_QUESTIONS_PER_TEST;
if (file.size > FILE_CONFIG.MAX_FILE_SIZE) { ... }
```

**Files cần replace:**
- `examService.js`
- `api.js`
- `CreateExerciseModalComplete.jsx`
- All upload handlers

---

## 📊 Expected Performance Gains

After completing all optimizations:

- **Initial Bundle Size**: ↓ 30-40%
- **Initial Load Time**: ↓ 40-50%
- **Re-render Count**: ↓ 60-70% (with React.memo + useMemo)
- **Memory Usage**: ↓ 20-30% (with proper cleanup)
- **API Response Time**: ↓ 30-40% (with backend optimizations)

---

## 🎯 Priority Order

1. ✅ **DONE**: Logger, ErrorBoundary, Lazy Loading
2. ✅ **DONE**: Constants, useFetch, Loading Components
3. **HIGH**: React.memo cho list items và cards
4. **HIGH**: useMemo/useCallback trong large components
5. **MEDIUM**: Replace magic numbers with constants
6. **MEDIUM**: Debounce search inputs
7. **LOW**: Complete TODO features
8. **LOW**: Sub-page code splitting

---

## 🔍 How to Check Performance

### React DevTools Profiler
1. Install React DevTools
2. Open Profiler tab
3. Start recording
4. Perform actions (filter, search, navigate)
5. Stop recording
6. Check:
   - Commit duration (should be < 16ms for 60fps)
   - Component render count
   - Why did this render?

### Chrome DevTools Performance
1. Open Performance tab
2. Start recording
3. Interact with app
4. Stop recording
5. Check:
   - FPS (should be close to 60)
   - Main thread work
   - Long tasks (should minimize)

### Lighthouse Audit
```bash
npm run build
npx serve -s dist
# Open Chrome DevTools > Lighthouse
# Run audit for Performance
```

**Targets:**
- Performance Score: > 90
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.8s
- Total Blocking Time: < 200ms

---

## 📚 Resources

- [React.memo](https://react.dev/reference/react/memo)
- [useMemo](https://react.dev/reference/react/useMemo)
- [useCallback](https://react.dev/reference/react/useCallback)
- [Code Splitting](https://react.dev/learn/code-splitting)
- [Optimizing Performance](https://react.dev/learn/render-and-commit)
