# Error Boundaries Documentation

## Overview

Error Boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the entire application.

## Implementation

### Components Created

1. **ErrorBoundary** (`frontend/src/components/ErrorBoundary/ErrorBoundary.jsx`)
   - Main error boundary with full-featured fallback UI
   - Wraps the entire application in `main.jsx`
   - Shows detailed error information in development mode
   - Provides user actions: Try Again, Reload Page, Go Home

2. **RouteErrorBoundary** (`frontend/src/components/ErrorBoundary/RouteErrorBoundary.jsx`)
   - Lightweight error boundary for individual routes
   - Simpler fallback UI suitable for route-level errors
   - Used to wrap critical routes like dashboards and exercises

### Wrapped Routes

The following critical routes are wrapped with `RouteErrorBoundary`:

- `/exercise/:exerciseId` - DoExercise (Student exercise page)
- `/exam/:examId` - TakeExam (Student exam page)
- `/admin-dashboard/*` - AdminDashboardV2
- `/teacher-dashboard/*` - TeacherDashboardV3
- `/parent-dashboard` - ParentDashboardV2

### Usage

#### Using the Error Handler Hook

For catching async errors in functional components:

```jsx
import { useErrorHandler } from '../hooks/useErrorHandler';

function MyComponent() {
  const throwError = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.getData();
      setData(data);
    } catch (error) {
      // This will trigger the nearest error boundary
      throwError(error);
    }
  };

  return <div>...</div>;
}
```

#### Adding Error Boundary to New Routes

```jsx
import RouteErrorBoundary from './components/ErrorBoundary/RouteErrorBoundary';

<Route 
  path="/my-route" 
  element={
    <RouteErrorBoundary routeName="My Feature">
      <MyComponent />
    </RouteErrorBoundary>
  } 
/>
```

#### Custom Fallback UI

```jsx
<ErrorBoundary
  fallback={({ error, resetError, reloadPage }) => (
    <div>
      <h1>Custom Error UI</h1>
      <p>{error.message}</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

## Features

### ErrorBoundary Features

- ✅ Beautiful gradient fallback UI
- ✅ Multiple recovery options (Try Again, Reload, Go Home)
- ✅ Detailed error information in development mode
- ✅ Error count tracking (warns if error occurs multiple times)
- ✅ Component stack trace display
- ✅ Custom fallback UI support via props
- ✅ Responsive design with Tailwind CSS

### RouteErrorBoundary Features

- ✅ Lightweight design for route-level errors
- ✅ Simple retry mechanism
- ✅ Configurable route name for better UX
- ✅ Development mode error details

## Error Prevention Best Practices

1. **Validate Props**
   ```jsx
   MyComponent.propTypes = {
     data: PropTypes.object.isRequired
   };
   ```

2. **Null Checks**
   ```jsx
   const value = data?.nested?.property ?? 'default';
   ```

3. **Try-Catch for Async Operations**
   ```jsx
   try {
     const result = await fetchData();
   } catch (error) {
     throwError(error); // Trigger error boundary
   }
   ```

4. **Default Values**
   ```jsx
   const items = data.items || [];
   ```

## Testing Error Boundaries

To test error boundaries in development:

```jsx
// Create a component that throws an error
function ErrorThrower() {
  throw new Error('Test error for error boundary');
  return <div>This will not render</div>;
}

// Use it in your route
<Route path="/test-error" element={<ErrorThrower />} />
```

## Future Improvements

- [ ] Integrate with error logging service (Sentry, LogRocket)
- [ ] Add error analytics and tracking
- [ ] Implement error recovery strategies
- [ ] Add offline error handling
- [ ] Create error boundary testing utilities

## Related Files

- `frontend/src/components/ErrorBoundary/ErrorBoundary.jsx`
- `frontend/src/components/ErrorBoundary/RouteErrorBoundary.jsx`
- `frontend/src/components/ErrorBoundary/index.js`
- `frontend/src/hooks/useErrorHandler.js`
- `frontend/src/utils/errorBoundaryHelpers.jsx`
- `frontend/src/main.jsx` (app-level wrapper)
- `frontend/src/App.jsx` (route-level wrappers)
