import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { detectWebGL, isMobileDevice, isLowEndDevice } from './WebGLDetector';

interface PerformanceContextType {
  performanceMode: boolean;
  setPerformanceMode: (mode: boolean) => void;
  togglePerformanceMode: () => void;
  webglAvailable: boolean;
  isMobile: boolean;
  isLowEnd: boolean;
  shouldRender3D: boolean;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

const DISABLED_PATHS = [
  '/admin',
  '/dashboard',
  '/checkout',
  '/payment',
  '/crm',
  '/login',
  '/register',
  '/contact',
  '/booking'
];

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [performanceMode, setPerformanceMode] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    setWebglAvailable(detectWebGL());
    setIsMobile(isMobileDevice());
    setIsLowEnd(isLowEndDevice());
    setCurrentPath(window.location.pathname);

    const savedMode = localStorage.getItem('performanceMode');
    if (savedMode === 'true') {
      setPerformanceMode(true);
    }

    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePathChange);
    
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('popstate', handlePathChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('performanceMode', performanceMode.toString());
  }, [performanceMode]);

  const togglePerformanceMode = useCallback(() => {
    setPerformanceMode(prev => !prev);
  }, []);

  const isDisabledPath = DISABLED_PATHS.some(path => currentPath.startsWith(path));
  
  const shouldRender3D = webglAvailable && 
                         !performanceMode && 
                         !isDisabledPath &&
                         !(isMobile && isLowEnd);

  return (
    <PerformanceContext.Provider value={{
      performanceMode,
      setPerformanceMode,
      togglePerformanceMode,
      webglAvailable,
      isMobile,
      isLowEnd,
      shouldRender3D
    }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
}
