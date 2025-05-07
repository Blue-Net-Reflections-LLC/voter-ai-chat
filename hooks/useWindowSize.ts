import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

// Default size used for SSR to prevent hydration mismatch
const defaultSize: WindowSize = {
  width: 1024,
  height: 768
};

/**
 * Hook that tracks browser window size with a fallback for SSR.
 * @returns Object containing window width and height
 */
export function useWindowSize(): WindowSize {
  // Initialize with default to avoid hydration mismatch
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    // Return default size for SSR
    if (typeof window === 'undefined') return defaultSize;
    
    // Return actual window size for client-side
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away to set initial size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures effect runs only on mount and unmount

  return windowSize;
}

// Convenience hook to only get width
export function useWindowWidth(): number {
  const { width } = useWindowSize();
  return width;
}

// Predefined breakpoints matching Tailwind defaults
export function useBreakpoint(breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl'): boolean {
  const { width } = useWindowSize();
  
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };
  
  return width >= breakpoints[breakpoint];
}

// Useful hook to check if viewport is mobile
export function useMobileView(): boolean {
  const { width } = useWindowSize();
  return width < 640; // 'sm' breakpoint in Tailwind
} 