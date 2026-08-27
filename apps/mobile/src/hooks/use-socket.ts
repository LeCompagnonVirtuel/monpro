import { useState, useEffect, useCallback } from 'react';
import { socketService, ConnectionStatus } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    const unsub = socketService.onStatus(setStatus);
    return () => {
      unsub();
    };
  }, [isAuthenticated]);

  const reconnect = useCallback(() => {
    socketService.disconnect();
    socketService.connect();
  }, []);

  return { status, reconnect };
}
