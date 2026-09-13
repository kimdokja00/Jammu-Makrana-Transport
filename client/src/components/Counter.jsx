import { useEffect, useRef, useState } from 'react';

/** Counts up to `value` the first time the element scrolls into view. */
export function Counter({ value, suffix = '', duration = 1800 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started.current) return;
          started.current = true;

          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className="counter__value">
      {display}
      <span className="counter__suffix">{suffix}</span>
    </span>
  );
}

export default Counter;
