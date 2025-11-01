import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing fullscreen mode with anti-cheat features
 */
export const useFullscreen = (viewMode, showStartScreen, showError) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenWarningCount, setFullscreenWarningCount] = useState(0);
  const isFullscreenRef = useRef(false);
  const viewModeRef = useRef('exercise');
  const showStartScreenRef = useRef(true);
  
  // Sync refs
  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);
  
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);
  
  useEffect(() => {
    showStartScreenRef.current = showStartScreen;
  }, [showStartScreen]);
  
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      return true;
    } catch (error) {
      if (showStartScreenRef.current) {
        showError('Không thể vào chế độ toàn màn hình. Vui lòng thử lại.');
      }
      return false;
    }
  };
  
  const exitFullscreen = () => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.warn('Cannot exit fullscreen:', error);
    }
  };
  
  // Fullscreen blocking for exercise mode
  useEffect(() => {
    if (viewMode === 'exercise' && isFullscreen && !showStartScreen) {
      let reenterTimeout = null;
      
      const preventExit = () => {
        const isInFullscreen = !!(
          document.fullscreenElement || 
          document.webkitFullscreenElement || 
          document.mozFullScreenElement || 
          document.msFullscreenElement
        );
        
        if (!isInFullscreen && viewModeRef.current === 'exercise' && !showStartScreenRef.current) {
          if (reenterTimeout) clearTimeout(reenterTimeout);
          reenterTimeout = setTimeout(() => {
            if (viewModeRef.current === 'exercise' && !showStartScreenRef.current && isFullscreenRef.current) {
              enterFullscreen();
              setFullscreenWarningCount(prev => prev + 1);
            }
          }, 200);
        }
      };
      
      const preventKeys = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27 || e.key === 'F11' || e.keyCode === 122) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
          e.preventDefault();
          return false;
        }
      };
      
      document.addEventListener('fullscreenchange', preventExit, true);
      document.addEventListener('webkitfullscreenchange', preventExit, true);
      document.addEventListener('keydown', preventKeys, { capture: true, passive: false });
      window.addEventListener('keydown', preventKeys, { capture: true, passive: false });
      
      return () => {
        if (reenterTimeout) clearTimeout(reenterTimeout);
        document.removeEventListener('fullscreenchange', preventExit, true);
        document.removeEventListener('webkitfullscreenchange', preventExit, true);
        document.removeEventListener('keydown', preventKeys, true);
        window.removeEventListener('keydown', preventKeys, true);
      };
    } else if (viewMode === 'result') {
      exitFullscreen();
    }
  }, [viewMode, isFullscreen, showStartScreen]);
  
  return {
    isFullscreen,
    fullscreenWarningCount,
    setFullscreenWarningCount,
    enterFullscreen,
    exitFullscreen,
  };
};
