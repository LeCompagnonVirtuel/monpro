import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '@/lib/storage';
import { queryClient } from '@/lib/query-client';
import { Message, Conversation } from '@/api/messaging';
import { API_BASE_URL } from '@/lib/config';

const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');

let socket: Socket | null = null;
let isConnecting = false;

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
type StatusListener = (status: ConnectionStatus) => void;
type MessageListener = (message: Message) => void;
type TypingListener = (data: { userId: string }) => void;

const statusListeners = new Set<StatusListener>();
const messageListeners = new Set<MessageListener>();
const typingListeners = new Set<TypingListener>();

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

    socket.on('connect_error', async () => {
      isConnecting = false;
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

  isConnected() {
    return socket?.connected ?? false;
  },
};

function updateQueryCache(message: Message) {
  queryClient.setQueryData<Message[]>(
    ['messages', message.conversationId],
    (old: Message[] | undefined) => {
      if (!old) return [message];
      if (old.some((m: Message) => m.id === message.id)) return old;
      return [...old, message];
    },
  );

  queryClient.setQueryData<Conversation[]>(['conversations'], (old: Conversation[] | undefined) => {
    if (!old) return old;
    return old.map((conv: Conversation) =>
      conv.id === message.conversationId
        ? { ...conv, lastMessage: { content: message.content, createdAt: message.createdAt }, unreadCount: conv.unreadCount + 1 }
        : conv,
    );
  });
}
