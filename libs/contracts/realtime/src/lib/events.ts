export const realtimeEvents = {
  roomJoin: 'room:join',
  roomLeave: 'room:leave',
  roomParticipantJoined: 'room:participant-joined',
  roomParticipantLeft: 'room:participant-left',
  chatSend: 'chat:send',
  chatMessage: 'chat:message',
  chatSystem: 'chat:system',
  mediaState: 'media:state',
  mediaStateChanged: 'media:state-changed',
  signalOffer: 'signal:offer',
  signalAnswer: 'signal:answer',
  signalIceCandidate: 'signal:ice-candidate',
} as const;

export type RealtimeEventName =
  (typeof realtimeEvents)[keyof typeof realtimeEvents];
