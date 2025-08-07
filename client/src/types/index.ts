export interface User {
  id: string;
  name: string;
  x: number;
  y: number;
  zone?: string;
}

export interface AppState {
  currentUser: User | null;
  users: Map<string, User>;
  isConnected: boolean;
  connectionError: string | null;
}

export interface WebSocketMessage {
  type: 'connection' | 'joined' | 'user-joined' | 'user-left' | 'position-update' | 'zone-enter' | 'zone-exit' | 'error';
  data: any;
}

export interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
}