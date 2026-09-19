export type IceServerDto = {
  urls: string;
};

export type MediaStateDto = {
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
};

export type ParticipantDto = {
  id: string;
  displayName: string;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
};

export type ChatMessageDto = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  sentAt: string;
};

export type SystemEventDto = {
  kind: 'joined' | 'left';
  participantId: string;
  displayName: string;
  occurredAt: string;
};

export type RoomJoinPayload = {
  roomId: string;
  displayName: string;
};

export type RoomJoinResult = {
  roomId: string;
  participantId: string;
  participants: ParticipantDto[];
  messages: ChatMessageDto[];
  iceServers: IceServerDto[];
};

export type RoomLeavePayload = Record<string, never>;

export type RoomLeaveResult = {
  roomId: string;
};

export type ChatSendPayload = {
  text: string;
};

export type ChatSendResult = {
  message: ChatMessageDto;
};

export type MediaStatePayload = MediaStateDto;

export type MediaStateResult = {
  media: MediaStatePayload;
};

export type SignalOfferPayload = {
  toParticipantId: string;
  sdp: string;
};

export type SignalAnswerPayload = {
  toParticipantId: string;
  sdp: string;
};

export type SignalIcePayload = {
  toParticipantId: string;
  candidate: string;
};

export type SignalRelayResult = {
  toParticipantId: string;
};

export type ParticipantLeftDto = {
  participantId: string;
};

export type MediaStateChangedDto = {
  participantId: string;
} & MediaStateDto;

export type SignalOfferPush = {
  fromParticipantId: string;
  sdp: string;
};

export type SignalAnswerPush = {
  fromParticipantId: string;
  sdp: string;
};

export type SignalIcePush = {
  fromParticipantId: string;
  candidate: string;
};
