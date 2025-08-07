export interface User {
  id: string;
  name: string;
  x: number;
  y: number;
  zone?: string;
}

export interface Room {
  id: string;
  users: Map<string, User>;
  maxUsers: number;
}

export interface WebSocketMessage {
  type: 'join' | 'leave' | 'position' | 'offer' | 'answer' | 'ice-candidate' | 'zone-enter' | 'zone-exit';
  data: any;
  userId?: string;
  targetUserId?: string;
}

export interface JoinMessage {
  name: string;
}

export interface PositionMessage {
  x: number;
  y: number;
}

export interface WebRTCMessage {
  targetUserId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface ZoneMessage {
  zoneName: string;
}