import { useEffect, useRef } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [React.RefObject<T>, React.RefObject<HTMLDivElement>] {
  const containerRef = useRef<T>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Initial mount scroll
  useEffect(() => {
    const container = containerRef.current;
    const bottomElement = bottomRef.current;
    
    if (container && bottomElement) {
      bottomElement.scrollIntoView({ behavior: 'auto' });
    }
  }, []); // Only run once on mount

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // More lenient check for "at bottom" - within 100px
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      shouldAutoScrollRef.current = isAtBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle new content
  useEffect(() => {
    const container = containerRef.current;
    const bottomElement = bottomRef.current;

    if (container && bottomElement && shouldAutoScrollRef.current) {
      bottomElement.scrollIntoView({ behavior: 'smooth' });
    }
  });

  return [containerRef, bottomRef];
}
