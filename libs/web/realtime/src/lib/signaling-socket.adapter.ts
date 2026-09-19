import type { SignalingPort } from '@fedora-meetings/web-webrtc';
import type { RoomClient } from './room-client.js';

export function createSignalingSocketAdapter(
  roomClient: RoomClient,
): SignalingPort {
  return {
    sendOffer: async (input) => {
      await roomClient.sendOffer(input);
    },
    sendAnswer: async (input) => {
      await roomClient.sendAnswer(input);
    },
    sendIceCandidate: async (input) => {
      await roomClient.sendIceCandidate(input);
    },
    onOffer: (handler) => roomClient.onOffer(handler),
    onAnswer: (handler) => roomClient.onAnswer(handler),
    onIceCandidate: (handler) => roomClient.onIceCandidate(handler),
  };
}
