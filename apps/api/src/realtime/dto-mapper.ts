import type { ChatMessage } from '@fedora-meetings/api-domain';
import type { Participant } from '@fedora-meetings/api-domain';
import type {
  ChatMessageDto,
  ParticipantDto,
} from '@fedora-meetings/contracts-realtime';

export function toParticipantDto(participant: Participant): ParticipantDto {
  return {
    id: participant.id,
    displayName: participant.displayName.value,
    microphoneEnabled: participant.media.microphoneEnabled,
    cameraEnabled: participant.media.cameraEnabled,
  };
}

export function toChatMessageDto(message: ChatMessage): ChatMessageDto {
  return {
    id: message.id,
    authorId: message.authorId,
    authorName: message.authorName,
    text: message.text.value,
    sentAt: message.sentAt.toISOString(),
  };
}
