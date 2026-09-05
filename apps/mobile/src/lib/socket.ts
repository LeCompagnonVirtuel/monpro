import { io, Socket } from 'socket.io-client';
import { InfiniteData } from '@tanstack/react-query';
import { tokenStorage } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';
import { Message, Conversation } from '@/api/messaging';
import { API_BASE_URL } from '@/lib/config';
import { RealtimeEvent } from '@/types/realtime';
import { logger } from '@/lib/logger';

const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');

let socket: Socket | null = null;
let isConnecting = false;
let activeConversationId: string | null = null;

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
type StatusListener = (status: ConnectionStatus) => void;
type MessageListener = (message: Message) => void;
type TypingListener = (data: { userId: string }) => void;
type RealtimeListener = (event: RealtimeEvent) => void;

const statusListeners = new Set<StatusListener>();
const messageListeners = new Set<MessageListener>();
const typingListeners = new Set<TypingListener>();
const realtimeListeners = new Set<RealtimeListener>();

function notifyStatus(status: ConnectionStatus) {
  statusListeners.forEach((fn) => fn(status));
}

export const socketService = {
  async connect() {
    if (socket?.connected || isConnecting) return;
    isConnecting = true;
    notifyStatus('connecting');

    const token = await tokenStorage.getAccessToken();
    if (!token) {
      isConnecting = false;
      notifyStatus('disconnected');
      return;
    }

    socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      isConnecting = false;
      notifyStatus('connected');
    });

    socket.on('disconnect', () => {
      notifyStatus('disconnected');
    });

    socket.on('connect_error', async (err) => {
      isConnecting = false;
      logger.warn('Socket connection error', { message: err.message });
      const freshToken = await tokenStorage.getAccessToken();
      if (freshToken && socket) {
        socket.auth = { token: freshToken };
      }
      notifyStatus('error');
    });

    socket.on('newMessage', (message: Message) => {
      messageListeners.forEach((fn) => fn(message));
      updateQueryCache(message);
    });

    socket.on('userTyping', (data: { userId: string }) => {
      typingListeners.forEach((fn) => fn(data));
    });

    const domainEvents: RealtimeEvent['type'][] = [
      'notification.created',
      'quote.created',
      'quote.accepted',
      'quote.rejected',
      'booking.created',
      'booking.status_changed',
      'intervention.updated',
      'intervention.confirmed',
      'payment.updated',
    ];

    for (const eventType of domainEvents) {
      socket.on(eventType, (event: RealtimeEvent) => {
        realtimeListeners.forEach((fn) => fn({ ...event, type: eventType }));
      });
    }
  },

  disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    isConnecting = false;
    notifyStatus('disconnected');
  },

  joinConversation(conversationId: string) {
    socket?.emit('joinConversation', conversationId);
  },

  sendMessage(conversationId: string, content: string, imageUrl?: string) {
    socket?.emit('sendMessage', { conversationId, content, imageUrl });
  },

  emitTyping(conversationId: string) {
    socket?.emit('typing', { conversationId });
  },

  onStatus(fn: StatusListener) {
    statusListeners.add(fn);
    return () => { statusListeners.delete(fn); };
  },

  onMessage(fn: MessageListener) {
    messageListeners.add(fn);
    return () => { messageListeners.delete(fn); };
  },

  onTyping(fn: TypingListener) {
    typingListeners.add(fn);
    return () => { typingListeners.delete(fn); };
  },

  onRealtimeEvent(fn: RealtimeListener) {
    realtimeListeners.add(fn);
    return () => { realtimeListeners.delete(fn); };
  },

  setActiveConversation(conversationId: string | null) {
    activeConversationId = conversationId;
  },

  isConnected() {
    return socket?.connected ?? false;
  },
};

type MessagesPage = { messages: Message[]; total: number };

function updateQueryCache(message: Message) {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(
    ['messages', message.conversationId],
    (old: InfiniteData<MessagesPage> | undefined) => {
      if (!old || old.pages.length === 0) return old;
      const allMessages = old.pages.flatMap((p: MessagesPage) => p.messages);
      if (allMessages.some((m: Message) => m.id === message.id)) return old;
      const pages = [...old.pages];
      const last = pages.length - 1;
      pages[last] = {
        ...pages[last],
        messages: [...pages[last].messages, message],
        total: pages[last].total + 1,
      };
      return { ...old, pages };
    },
  );

  const isViewing = message.conversationId === activeConversationId;

  queryClient.setQueryData<Conversation[]>(['conversations'], (old: Conversation[] | undefined) => {
    if (!old) return old;
    return old.map((conv: Conversation) =>
      conv.id === message.conversationId
        ? {
            ...conv,
            lastMessage: { content: message.content, createdAt: message.createdAt },
            unreadCount: isViewing ? conv.unreadCount : conv.unreadCount + 1,
          }
        : conv,
    );
  });
}
