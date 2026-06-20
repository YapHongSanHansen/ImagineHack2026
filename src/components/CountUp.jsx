import { useEffect, useRef, useState } from 'react';

// Animated number. Counts up from 0 on first mount, and on later value changes
// continues from whatever is currently displayed (no backward jump on interrupt).
export default function CountUp({ value, duration = 900, decimals = 0, className = '' }) {
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0); // live displayed value — the tween's origin
  const rafRef = useRef(0);

  useEffect(() => {
    const from = currentRef.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    let start = null;
    const tick = (ts) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const cur = from + (to - from) * eased;
      currentRef.current = cur;
      setDisplay(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        currentRef.current = to;
        setDisplay(to);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const f = 10 ** decimals;
  return <span className={className}>{Math.round(display * f) / f}</span>;
}
