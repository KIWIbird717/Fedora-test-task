import type { ChatMessage } from '@fedora-meetings/api-domain';
import type { MediaState } from '@fedora-meetings/api-domain';
import type { Participant } from '@fedora-meetings/api-domain';
import type { ParticipantId } from '@fedora-meetings/api-domain';
import type { RoomId } from '@fedora-meetings/api-domain';

export type SignalKind = 'offer' | 'answer' | 'ice-candidate';

export interface RoomEventPublisher {
  participantJoined(input: { roomId: RoomId; participant: Participant }): void;
  participantLeft(input: { roomId: RoomId; participantId: ParticipantId }): void;
  chatMessage(input: { roomId: RoomId; message: ChatMessage }): void;
  systemEvent(input: {
    roomId: RoomId;
    kind: 'joined' | 'left';
    participantId: ParticipantId;
    displayName: string;
    occurredAt: Date;
  }): void;
  mediaStateChanged(input: {
    roomId: RoomId;
    participantId: ParticipantId;
    media: MediaState;
  }): void;
  relaySignal(input: {
    kind: SignalKind;
    toParticipantId: ParticipantId;
    fromParticipantId: ParticipantId;
    payload: string;
  }): void;
}
