import { apiClient } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PriceEstimate {
  min: number;
  max: number;
  median: number;
  confidence: number;
  breakdown: { main_doeuvre: number; materiaux: number; transport: number } | null;
}

export interface DiagnosisResult {
  issue: string;
  category: string;
  serviceSuggested: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  confidence: number;
}

export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  confidence: number;
}

export interface AvailabilityPrediction {
  slots: AvailabilitySlot[];
  recommendation: string;
}

export const aiApi = {
  chat(message: string, conversationHistory?: ChatMessage[]) {
    return apiClient.post<{ success: boolean; data: { reply: string } }>('/ai/chat', {
      message,
      conversationHistory,
    });
  },

  estimatePrice(serviceId: string, description: string, latitude?: number, longitude?: number) {
    return apiClient.post<{ success: boolean; data: PriceEstimate }>('/ai/estimate-price', {
      serviceId,
      description,
      latitude,
      longitude,
    });
  },

  diagnose(imageBase64: string) {
    return apiClient.post<{ success: boolean; data: DiagnosisResult }>('/ai/diagnose', {
      imageBase64,
    });
  },

  getSummary(conversationId: string) {
    return apiClient.get<{ success: boolean; data: { summary: string } }>(`/ai/summary/${conversationId}`);
  },

  getAvailability(professionalId: string, preferredDate?: string) {
    return apiClient.get<{ success: boolean; data: AvailabilityPrediction }>(
      `/ai/availability/${professionalId}`,
      { params: preferredDate ? { preferredDate } : undefined },
    );
  },
};
