import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline' | 'unknown';

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected === null) {
        setStatus('unknown');
      } else {
        setStatus(state.isConnected ? 'online' : 'offline');
      }
    });
    return unsubscribe;
  }, []);

  return status;
}
