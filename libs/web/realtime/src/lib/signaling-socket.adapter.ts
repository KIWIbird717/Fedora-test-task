import type { SignalingPort } from '@fedora-meetings/web-webrtc';
import type { RoomClient } from './room-client.js';

export function createSignalingSocketAdapter(
  roomClient: RoomClient,
): SignalingPort {
  return {
    sendOffer: async (input) => {
      const ack = await roomClient.sendOffer(input);
      if (!ack.ok) {
        throw new Error(ack.error.message);
      }
    },
    sendAnswer: async (input) => {
      const ack = await roomClient.sendAnswer(input);
      if (!ack.ok) {
        throw new Error(ack.error.message);
      }
    },
    sendIceCandidate: async (input) => {
      const ack = await roomClient.sendIceCandidate(input);
      if (!ack.ok) {
        throw new Error(ack.error.message);
      }
    },
    onOffer: (handler) => roomClient.onOffer(handler),
    onAnswer: (handler) => roomClient.onAnswer(handler),
    onIceCandidate: (handler) => roomClient.onIceCandidate(handler),
  };
}
