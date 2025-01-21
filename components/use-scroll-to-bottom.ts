import { useEffect, useRef } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [React.RefObject<T>, React.RefObject<HTMLDivElement>] {
  const containerRef = useRef<T>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Consider user "at bottom" if they're within 100px of the bottom
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      shouldAutoScrollRef.current = isAtBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const bottomElement = bottomRef.current;

    if (container && bottomElement && shouldAutoScrollRef.current) {
      bottomElement.scrollIntoView({ behavior: 'smooth' });
    }
  });

  return [containerRef, bottomRef];
}
