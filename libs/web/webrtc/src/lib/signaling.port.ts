export interface SignalingPort {
  sendOffer(input: { toParticipantId: string; sdp: string }): Promise<void>;
  sendAnswer(input: { toParticipantId: string; sdp: string }): Promise<void>;
  sendIceCandidate(input: {
    toParticipantId: string;
    candidate: string;
  }): Promise<void>;
  onOffer(
    handler: (input: { fromParticipantId: string; sdp: string }) => void,
  ): () => void;
  onAnswer(
    handler: (input: { fromParticipantId: string; sdp: string }) => void,
  ): () => void;
  onIceCandidate(
    handler: (input: { fromParticipantId: string; candidate: string }) => void,
  ): () => void;
}
