import { useState, useEffect } from 'react';

/**
 * Hook to track if scroll position exceeds a threshold
 * Useful for showing/hiding scroll-dependent UI elements
 */
export function useScrollVisibility(threshold: number = 800): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility(); // Initial check

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  return isVisible;
}
