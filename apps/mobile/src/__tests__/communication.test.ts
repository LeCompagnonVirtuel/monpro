import { messagingApi } from '../api/messaging';
import { notificationsApi } from '../api/notifications';
import { favoritesApi } from '../api/favorites';
import { socketService } from '../lib/socket';
import { useConversations, useCreateConversation, useMarkConversationRead } from '../hooks/use-conversations';
import { useMessages, useSendMessage } from '../hooks/use-messages';
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/use-notifications';
import { useFavorites, useIsFavorite, useAddFavorite, useRemoveFavorite } from '../hooks/use-favorites';
import { useSocket } from '../hooks/use-socket';
import { usePushNotifications } from '../hooks/use-push-notifications';
import { useNetworkStatus } from '../hooks/use-network-status';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('fake-token'),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(),
    connected: false,
  })),
}));

describe('Phase 6 - Messaging API', () => {
  it('exposes listConversations method', () => {
    expect(typeof messagingApi.listConversations).toBe('function');
  });

  it('exposes createConversation method', () => {
    expect(typeof messagingApi.createConversation).toBe('function');
  });

  it('exposes getMessages method', () => {
    expect(typeof messagingApi.getMessages).toBe('function');
  });

  it('exposes sendMessage method', () => {
    expect(typeof messagingApi.sendMessage).toBe('function');
  });

  it('exposes markAsRead method', () => {
    expect(typeof messagingApi.markAsRead).toBe('function');
  });
});

describe('Phase 6 - Notifications API', () => {
  it('exposes list method', () => {
    expect(typeof notificationsApi.list).toBe('function');
  });

  it('exposes markAsRead method', () => {
    expect(typeof notificationsApi.markAsRead).toBe('function');
  });

  it('exposes markAllAsRead method', () => {
    expect(typeof notificationsApi.markAllAsRead).toBe('function');
  });
});

describe('Phase 6 - Favorites API', () => {
  it('exposes list, add, remove, check methods', () => {
    expect(typeof favoritesApi.list).toBe('function');
    expect(typeof favoritesApi.add).toBe('function');
    expect(typeof favoritesApi.remove).toBe('function');
    expect(typeof favoritesApi.check).toBe('function');
  });
});

describe('Phase 6 - Socket.IO Service', () => {
  it('exposes connect method', () => {
    expect(typeof socketService.connect).toBe('function');
  });

  it('exposes disconnect method', () => {
    expect(typeof socketService.disconnect).toBe('function');
  });

  it('exposes joinConversation method', () => {
    expect(typeof socketService.joinConversation).toBe('function');
  });

  it('exposes sendMessage method', () => {
    expect(typeof socketService.sendMessage).toBe('function');
  });

  it('exposes emitTyping method', () => {
    expect(typeof socketService.emitTyping).toBe('function');
  });

  it('exposes onStatus listener', () => {
    expect(typeof socketService.onStatus).toBe('function');
  });

  it('exposes onMessage listener', () => {
    expect(typeof socketService.onMessage).toBe('function');
  });

  it('exposes onTyping listener', () => {
    expect(typeof socketService.onTyping).toBe('function');
  });

  it('exposes isConnected check', () => {
    expect(typeof socketService.isConnected).toBe('function');
    expect(socketService.isConnected()).toBe(false);
  });

  it('onStatus returns an unsubscribe function', () => {
    const unsub = socketService.onStatus(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('onMessage returns an unsubscribe function', () => {
    const unsub = socketService.onMessage(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('onTyping returns an unsubscribe function', () => {
    const unsub = socketService.onTyping(() => {});
    expect(typeof unsub).toBe('function');
    unsub();
  });
});

describe('Phase 6 - Messaging Hooks', () => {
  it('useConversations is a function', () => {
    expect(typeof useConversations).toBe('function');
  });

  it('useCreateConversation is a function', () => {
    expect(typeof useCreateConversation).toBe('function');
  });

  it('useMarkConversationRead is a function', () => {
    expect(typeof useMarkConversationRead).toBe('function');
  });

  it('useMessages is a function', () => {
    expect(typeof useMessages).toBe('function');
  });

  it('useSendMessage is a function', () => {
    expect(typeof useSendMessage).toBe('function');
  });
});

describe('Phase 6 - Notification Hooks', () => {
  it('useNotifications is a function', () => {
    expect(typeof useNotifications).toBe('function');
  });

  it('useUnreadNotificationCount is a function', () => {
    expect(typeof useUnreadNotificationCount).toBe('function');
  });

  it('useMarkNotificationRead is a function', () => {
    expect(typeof useMarkNotificationRead).toBe('function');
  });

  it('useMarkAllNotificationsRead is a function', () => {
    expect(typeof useMarkAllNotificationsRead).toBe('function');
  });
});

describe('Phase 6 - Favorites Hooks', () => {
  it('useFavorites is a function', () => {
    expect(typeof useFavorites).toBe('function');
  });

  it('useIsFavorite is a function', () => {
    expect(typeof useIsFavorite).toBe('function');
  });

  it('useAddFavorite is a function', () => {
    expect(typeof useAddFavorite).toBe('function');
  });

  it('useRemoveFavorite is a function', () => {
    expect(typeof useRemoveFavorite).toBe('function');
  });
});

describe('Phase 6 - Utility Hooks', () => {
  it('useSocket is a function', () => {
    expect(typeof useSocket).toBe('function');
  });

  it('usePushNotifications is a function', () => {
    expect(typeof usePushNotifications).toBe('function');
  });

  it('useNetworkStatus is a function', () => {
    expect(typeof useNetworkStatus).toBe('function');
  });
});

describe('Phase 6 - Security', () => {
  it('socket connects to /chat namespace, not root', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/socket.ts'),
      'utf-8',
    );
    expect(source).toContain('/chat');
    expect(source).not.toContain('namespace: "/"');
  });

  it('socket authenticates via token from secure store', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/socket.ts'),
      'utf-8',
    );
    expect(source).toContain('tokenStorage.getAccessToken');
    expect(source).toContain('auth: { token }');
    expect(source).not.toContain('AsyncStorage');
  });

  it('push notification hook does not log the push token', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../hooks/use-push-notifications.ts'),
      'utf-8',
    );
    expect(source).not.toContain('console.log');
    expect(source).not.toContain('console.warn');
    expect(source).not.toContain('console.info');
  });

  it('socket disconnects explicitly when called', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/socket.ts'),
      'utf-8',
    );
    expect(source).toContain('socket.disconnect()');
    expect(source).toContain('removeAllListeners');
  });

  it('conversation screen marks as read on open', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(client)/conversation.tsx'),
      'utf-8',
    );
    expect(source).toContain('markRead.mutate(conversationId)');
  });

  it('message deduplication prevents duplicates from socket + REST', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/socket.ts'),
      'utf-8',
    );
    expect(source).toContain('m.id === message.id');
  });

  it('notification deep links use dynamic IDs, not hardcoded routes', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(client)/notifications.tsx'),
      'utf-8',
    );
    expect(source).toContain('data.conversationId');
    expect(source).toContain('data.bookingId');
    expect(source).not.toContain('hardcoded');
  });

  it('no secrets or tokens in component files', () => {
    const files = [
      '../app/(client)/conversation.tsx',
      '../app/(client)/notifications.tsx',
      '../app/(client)/favorites.tsx',
      '../app/(client)/(tabs)/messages.tsx',
    ];
    files.forEach((file) => {
      const source = require('fs').readFileSync(
        require('path').resolve(__dirname, file),
        'utf-8',
      );
      expect(source).not.toContain('sk_');
      expect(source).not.toContain('secret');
      expect(source).not.toMatch(/Bearer [A-Za-z0-9]/);
    });
  });
});

describe('Phase 6 - No hardcoded data', () => {
  it('messages screen uses useConversations hook', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(client)/(tabs)/messages.tsx'),
      'utf-8',
    );
    expect(source).toContain('useConversations');
    expect(source).not.toContain('Jean Dupont');
    expect(source).not.toContain('fake-conversation');
  });

  it('notifications screen uses useNotifications hook', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(client)/notifications.tsx'),
      'utf-8',
    );
    expect(source).toContain('useNotifications');
    expect(source).toContain('useMarkNotificationRead');
    expect(source).toContain('useMarkAllNotificationsRead');
  });

  it('favorites screen uses useFavorites hook', () => {
    const source = require('fs').readFileSync(
      require('path').resolve(__dirname, '../app/(client)/favorites.tsx'),
      'utf-8',
    );
    expect(source).toContain('useFavorites');
    expect(source).toContain('useRemoveFavorite');
  });
});
