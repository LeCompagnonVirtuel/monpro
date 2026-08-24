import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { MessagingGateway } from '../messaging.gateway';
import { MessagingService } from '../messaging.service';

describe('MessagingGateway — WebSocket Security', () => {
  let gateway: MessagingGateway;
  let jwtService: JwtService;

  const mockMessagingService = {
    sendMessage: jest.fn(),
    findConversation: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessagingGateway,
        { provide: MessagingService, useValue: mockMessagingService },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get(MessagingGateway);
    jwtService = module.get(JwtService);
    (gateway as any).server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
    jest.clearAllMocks();
  });

  function createMockSocket(auth?: any, headers?: any): any {
    return {
      id: 'socket-1',
      handshake: { auth: auth || {}, headers: headers || {}, query: {} },
      disconnect: jest.fn(),
      join: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };
  }

  describe('handleConnection — JWT Verification', () => {
    it('should DISCONNECT client with no token', () => {
      const socket = createMockSocket();
      gateway.handleConnection(socket);
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should DISCONNECT client with invalid token', () => {
      const socket = createMockSocket({ token: 'invalid-jwt' });
      (jwtService.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });
      gateway.handleConnection(socket);
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should DISCONNECT client with expired token', () => {
      const socket = createMockSocket({ token: 'expired-jwt' });
      (jwtService.verify as jest.Mock).mockImplementation(() => { throw new Error('jwt expired'); });
      gateway.handleConnection(socket);
      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should ACCEPT client with valid token and extract userId from payload.sub', () => {
      const socket = createMockSocket({ token: 'valid-jwt' });
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-123', role: 'CLIENT' });

      gateway.handleConnection(socket);
      expect(socket.disconnect).not.toHaveBeenCalled();
      expect(socket.join).toHaveBeenCalledWith('user_user-123');
    });

    it('should NEVER trust userId from query string', () => {
      const socket = {
        id: 'socket-1',
        handshake: {
          auth: { token: 'valid-jwt' },
          headers: {},
          query: { userId: 'attacker-injected-id' },
        },
        disconnect: jest.fn(),
        join: jest.fn(),
      };
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'real-user-id', role: 'CLIENT' });

      gateway.handleConnection(socket as any);

      // The userId should come from JWT, not from query
      expect(socket.join).toHaveBeenCalledWith('user_real-user-id');
      expect(socket.join).not.toHaveBeenCalledWith('user_attacker-injected-id');
    });

    it('should accept token from Authorization header', () => {
      const socket = createMockSocket({}, { authorization: 'Bearer valid-header-jwt' });
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-456' });

      gateway.handleConnection(socket);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-header-jwt');
      expect(socket.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('joinConversation — Authorization', () => {
    it('should REJECT join if user is not a participant', async () => {
      // First, connect a valid user
      const socket = createMockSocket({ token: 'valid' });
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-A' });
      gateway.handleConnection(socket);

      mockMessagingService.findConversation.mockResolvedValue({
        id: 'conv-1',
        participants: [{ userId: 'user-B' }, { userId: 'user-C' }],
      });

      await gateway.handleJoinConversation(socket, 'conv-1');
      // Should NOT join the room
      expect(socket.join).not.toHaveBeenCalledWith('conversation_conv-1');
    });

    it('should ALLOW join if user is a participant', async () => {
      const socket = createMockSocket({ token: 'valid' });
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-A' });
      gateway.handleConnection(socket);

      // Reset join mock after handleConnection
      socket.join.mockClear();

      mockMessagingService.findConversation.mockResolvedValue({
        id: 'conv-1',
        participants: [{ userId: 'user-A' }, { userId: 'user-B' }],
      });

      await gateway.handleJoinConversation(socket, 'conv-1');
      expect(socket.join).toHaveBeenCalledWith('conversation_conv-1');
    });
  });

  describe('sendMessage — must use authenticated userId', () => {
    it('should REJECT message from unauthenticated socket', async () => {
      const socket = createMockSocket();
      // Not connected (no handleConnection call with valid token)

      await gateway.handleMessage(socket, { conversationId: 'conv-1', content: 'hi' });
      expect(mockMessagingService.sendMessage).not.toHaveBeenCalled();
    });

    it('should use JWT-derived userId, not any client-provided value', async () => {
      const socket = createMockSocket({ token: 'valid' });
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'real-user' });
      gateway.handleConnection(socket);

      mockMessagingService.sendMessage.mockResolvedValue({ id: 'msg-1' });

      await gateway.handleMessage(socket, { conversationId: 'conv-1', content: 'hello' });
      expect(mockMessagingService.sendMessage).toHaveBeenCalledWith(
        'conv-1', 'real-user', 'hello', undefined,
      );
    });
  });
});
