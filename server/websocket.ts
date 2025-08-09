import { ServerWebSocket } from 'bun';

import { RoomManager } from './room';
import {
  WebSocketMessage,
  JoinMessage,
  PositionMessage,
  WebRTCMessage,
  ZoneMessage,
} from './types';

export class WebSocketHandler {
  private roomManager: RoomManager;
  private connections: Map<string, ServerWebSocket<any>> = new Map();

  constructor() {
    this.roomManager = new RoomManager();
  }

  handleConnection(ws: ServerWebSocket<any>) {
    const userId = this.generateUserId();
    ws.data = { userId };
    this.connections.set(userId, ws);

    ws.send(
      JSON.stringify({
        type: 'connection',
        data: { userId },
      })
    );
  }

  handleMessage(ws: ServerWebSocket<any>, message: string) {
    try {
      const parsedMessage: WebSocketMessage = JSON.parse(message);
      const userId = ws.data.userId;

      if (!this.isValidMessage(parsedMessage)) {
        this.sendError(ws, 'Invalid message format');
        return;
      }

      switch (parsedMessage.type) {
        case 'join':
          this.handleJoin(ws, userId, parsedMessage.data as JoinMessage);
          break;
        case 'leave':
          this.handleLeave(userId);
          break;
        case 'position':
          this.handlePosition(userId, parsedMessage.data as PositionMessage);
          break;
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          this.handleWebRTC(userId, parsedMessage);
          break;
        case 'zone-enter':
        case 'zone-exit':
          this.handleZoneChange(userId, parsedMessage);
          break;
        default:
          this.sendError(ws, 'Unknown message type');
      }
    } catch (error) {
      console.log('Error parsing message:', error);
      this.sendError(ws, 'Failed to parse message');
    }
  }

  handleDisconnection(ws: ServerWebSocket<any>) {
    const userId = ws.data?.userId;
    if (userId) {
      this.handleLeave(userId);
      this.connections.delete(userId);
    }
  }

  private handleJoin(
    ws: ServerWebSocket<any>,
    userId: string,
    data: JoinMessage
  ) {
    if (
      !data.name ||
      typeof data.name !== 'string' ||
      !this.isValidName(data.name)
    ) {
      this.sendError(ws, 'Invalid name');
      return;
    }

    const roomId = 'main'; // For now, everyone joins the main room
    const user = {
      id: userId,
      name: data.name.trim(),
      x: 100,
      y: 100,
    };

    const success = this.roomManager.addUserToRoom(roomId, user);
    if (!success) {
      this.sendError(ws, 'Room is full');
      return;
    }

    // Send success response to joining user
    ws.send(
      JSON.stringify({
        type: 'joined',
        data: {
          userId,
          room: roomId,
          users: this.roomManager.getRoomUsers(roomId),
        },
      })
    );

    // Broadcast to other users in room
    this.broadcastToRoom(
      roomId,
      {
        type: 'user-joined',
        data: user,
      },
      userId
    );
  }

  private handleLeave(userId: string) {
    const user = this.roomManager.removeUserFromRoom(userId);
    if (user) {
      const roomId = 'main';
      this.broadcastToRoom(roomId, {
        type: 'user-left',
        data: { userId },
      });
    }
  }

  private handlePosition(userId: string, data: PositionMessage) {
    if (typeof data.x !== 'number' || typeof data.y !== 'number') {
      return;
    }

    const user = this.roomManager.updateUserPosition(userId, data.x, data.y);
    if (user) {
      const roomId = this.roomManager.getUserRoom(userId);
      if (roomId) {
        this.broadcastToRoom(
          roomId,
          {
            type: 'position-update',
            data: {
              userId,
              x: data.x,
              y: data.y,
            },
          },
          userId
        );
      }
    }
  }

  private handleWebRTC(userId: string, message: WebSocketMessage) {
    const data = message.data as WebRTCMessage;
    if (!data.targetUserId) {
      return;
    }

    const targetWs = this.connections.get(data.targetUserId);
    if (targetWs) {
      targetWs.send(
        JSON.stringify({
          type: message.type,
          data: {
            ...data,
            fromUserId: userId,
          },
        })
      );
    }
  }

  private handleZoneChange(userId: string, message: WebSocketMessage) {
    const data = message.data as ZoneMessage;
    if (!data.zoneName || typeof data.zoneName !== 'string') {
      return;
    }

    const user = this.roomManager.updateUserZone(userId, data.zoneName);
    if (user) {
      const roomId = this.roomManager.getUserRoom(userId);
      if (roomId) {
        this.broadcastToRoom(
          roomId,
          {
            type: message.type,
            data: {
              userId,
              zoneName: data.zoneName,
            },
          },
          userId
        );
      }
    }
  }

  private broadcastToRoom(
    roomId: string,
    message: any,
    excludeUserId?: string
  ) {
    const users = this.roomManager.getRoomUsers(roomId);
    users.forEach((user) => {
      if (user.id !== excludeUserId) {
        const ws = this.connections.get(user.id);
        if (ws) {
          ws.send(JSON.stringify(message));
        }
      }
    });
  }

  private sendError(ws: ServerWebSocket<any>, error: string) {
    ws.send(
      JSON.stringify({
        type: 'error',
        data: { message: error },
      })
    );
  }

  private generateUserId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private isValidMessage(message: any): message is WebSocketMessage {
    return (
      message && typeof message.type === 'string' && message.data !== undefined
    );
  }

  private isValidName(name: string): boolean {
    return /^[a-zA-Z0-9\s]{1,20}$/.test(name.trim());
  }
}
