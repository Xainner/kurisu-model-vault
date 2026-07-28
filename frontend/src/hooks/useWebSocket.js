
import { useEffect, useRef } from 'react';
import { connectWS, disconnectWS, getToken } from '../utils/api';

export function useWebSocket(onMessage) {
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const ws = connectWS((msg) => {
      callbackRef.current?.(msg);
    });
    return () => disconnectWS();
  }, []);
}
