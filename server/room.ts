import { User, Room } from './types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map();

  createRoom(roomId: string, maxUsers: number = 20): Room {
    const room: Room = {
      id: roomId,
      users: new Map(),
      maxUsers
    };
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getOrCreateRoom(roomId: string): Room {
    return this.getRoom(roomId) || this.createRoom(roomId);
  }

  addUserToRoom(roomId: string, user: User): boolean {
    const room = this.getOrCreateRoom(roomId);
    
    if (room.users.size >= room.maxUsers) {
      return false;
    }

    room.users.set(user.id, user);
    this.userToRoom.set(user.id, roomId);
    return true;
  }

  removeUserFromRoom(userId: string): User | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = room.users.get(userId);
    if (!user) return null;

    room.users.delete(userId);
    this.userToRoom.delete(userId);

    if (room.users.size === 0) {
      this.rooms.delete(roomId);
    }

    return user;
  }

  updateUserPosition(userId: string, x: number, y: number): User | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = room.users.get(userId);
    if (!user) return null;

    user.x = x;
    user.y = y;
    return user;
  }

  updateUserZone(userId: string, zone: string): User | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = room.users.get(userId);
    if (!user) return null;

    user.zone = zone;
    return user;
  }

  getRoomUsers(roomId: string): User[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  getUserRoom(userId: string): string | undefined {
    return this.userToRoom.get(userId);
  }

  getUsersInZone(roomId: string, zoneName: string): User[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.users.values()).filter(user => user.zone === zoneName);
  }
}