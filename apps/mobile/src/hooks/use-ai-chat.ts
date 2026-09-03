import { useState, useCallback } from 'react';
import { aiApi, ChatMessage } from '@/api/ai';

const AI_CONTACT = {
  id: '__ai_assistant__',
  fullName: 'Assistant MONPRO',
  avatarUrl: null,
  isAi: true,
};

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setIsLoading(true);
    setError(null);

    try {
      const { data: res } = await aiApi.chat(text, messages.slice(-10));
      const reply = res.data.reply;
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch {
      setError('Erreur de connexion. Réessayez.');
      setMessages(history);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat, aiContact: AI_CONTACT };
}
