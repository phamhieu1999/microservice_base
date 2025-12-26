export interface UserCreatedEvent {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export const USER_CREATED_TOPIC = 'user.created';


