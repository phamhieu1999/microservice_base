export interface UserCreatedEvent {
  id: string;
  email: string;
  role: string;
}

export const USER_CREATED_TOPIC = 'user.created';
