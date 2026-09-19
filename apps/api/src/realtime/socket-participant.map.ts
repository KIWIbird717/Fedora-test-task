import { Injectable } from '@nestjs/common';
import type { ParticipantId } from '@fedora-meetings/api-domain';
import type { RoomId } from '@fedora-meetings/api-domain';

export type SocketMembership = {
  participantId: ParticipantId;
  roomId: RoomId;
};

@Injectable()
export class SocketParticipantMap {
  private readonly bySocket = new Map<string, SocketMembership>();
  private readonly socketByParticipant = new Map<string, string>();

  bind(
    socketId: string,
    participantId: ParticipantId,
    roomId: RoomId,
  ): SocketMembership | undefined {
    const previous = this.unbindBySocket(socketId);
    this.bySocket.set(socketId, { participantId, roomId });
    this.socketByParticipant.set(participantId, socketId);
    return previous;
  }

  unbindBySocket(socketId: string): SocketMembership | undefined {
    const membership = this.bySocket.get(socketId);
    if (!membership) {
      return undefined;
    }
    this.bySocket.delete(socketId);
    this.socketByParticipant.delete(membership.participantId);
    return membership;
  }

  getBySocket(socketId: string): SocketMembership | undefined {
    return this.bySocket.get(socketId);
  }

  getSocketId(participantId: ParticipantId): string | undefined {
    return this.socketByParticipant.get(participantId);
  }
}
