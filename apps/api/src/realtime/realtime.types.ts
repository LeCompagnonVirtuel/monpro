export type RealtimeEventType =
  | 'notification.created'
  | 'quote.created'
  | 'quote.accepted'
  | 'quote.rejected'
  | 'booking.created'
  | 'booking.status_changed'
  | 'intervention.updated'
  | 'intervention.confirmed'
  | 'payment.updated';

export interface RealtimeEvent {
  type: RealtimeEventType;
  entityId: string;
  metadata?: Record<string, string>;
}
