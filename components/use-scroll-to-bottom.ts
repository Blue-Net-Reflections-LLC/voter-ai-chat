import { useEffect, useRef, useState } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  React.RefObject<T>,
  React.RefObject<HTMLDivElement>,
  boolean,
  () => void
] {
  const containerRef = useRef<T>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Initial mount scroll
  useEffect(() => {
    const container = containerRef.current;
    const bottomElement = bottomRef.current;
    
    if (container && bottomElement) {
      bottomElement.scrollIntoView({ behavior: 'auto' });
      setIsAtBottom(true);
    }
  }, []); // Only run once on mount

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // More lenient check for "at bottom" - within 100px
      const atBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      shouldAutoScrollRef.current = atBottom;
      setIsAtBottom(atBottom);
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

  const scrollToBottom = () => {
    const bottomElement = bottomRef.current;
    if (bottomElement) {
      bottomElement.scrollIntoView({ behavior: 'smooth' });
      shouldAutoScrollRef.current = true;
      setIsAtBottom(true);
    }
  };

  return [containerRef, bottomRef, isAtBottom, scrollToBottom];
}
