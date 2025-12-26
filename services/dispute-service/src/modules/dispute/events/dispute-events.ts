export interface DisputeOpenedEvent {
  id: string;
  orderId: string;
  userId: string;
  sellerId: string;
  reasonCode: string;
}

export interface DisputeEscalatedEvent {
  id: string;
  orderId: string;
  userId: string;
  sellerId: string;
}

export interface DisputeResolvedEvent {
  id: string;
  orderId: string;
  userId: string;
  sellerId: string;
  decision: 'RESOLVED' | 'REJECTED';
}

export const DISPUTE_OPENED_TOPIC = 'dispute.opened';
export const DISPUTE_ESCALATED_TOPIC = 'dispute.escalated';
export const DISPUTE_RESOLVED_TOPIC = 'dispute.resolved';
