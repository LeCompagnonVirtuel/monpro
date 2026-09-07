import { useState, useCallback } from 'react';
import { aiApi, ChatMessage, DiagnosisResult } from '@/api/ai';

export interface AiChatMessage extends ChatMessage {
  imageUri?: string;
  diagnosis?: DiagnosisResult;
}

export function useAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: AiChatMessage = { role: 'user', content: text };
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

  const sendImage = useCallback(async (imageUri: string, base64: string) => {
    const userMsg: AiChatMessage = { role: 'user', content: 'Analyse de photo', imageUri };
    const history = [...messages, userMsg];
    setMessages(history);
    setIsLoading(true);
    setError(null);

    try {
      const { data: res } = await aiApi.diagnose(base64);
      const diagnosis = res.data;
      const urgencyLabel = diagnosis.urgency === 'URGENT' ? 'Urgent' : diagnosis.urgency === 'HIGH' ? 'Prioritaire' : 'Normal';
      const reply = `**Diagnostic :** ${diagnosis.issue}\n\n**Service recommandé :** ${diagnosis.serviceSuggested}\n**Catégorie :** ${diagnosis.category}\n**Urgence :** ${urgencyLabel}\n**Confiance :** ${Math.round(diagnosis.confidence * 100)}%`;
      setMessages([...history, { role: 'assistant', content: reply, diagnosis }]);
    } catch {
      setError("Impossible d'analyser l'image. Réessayez.");
      setMessages(history);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, sendImage, clearChat };
}
