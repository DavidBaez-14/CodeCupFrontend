import { useEffect, useState, useCallback, useRef } from 'react';

export function useToast() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  const toast = useCallback((text) => {
    setMsg(text);
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), 2400);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const ToastEl = () => (
    <div className={`cc-toast${show ? ' show' : ''}`} role="status" aria-live="polite">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>{msg}</span>
    </div>
  );

  return { Toast: ToastEl, toast };
}
