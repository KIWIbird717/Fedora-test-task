import {
  PeerLink,
  type IceServer,
  type PeerConnectionState,
  type PeerLinkRole,
} from './peer-link.js';
import type { SignalingPort } from './signaling.port.js';

export type { IceServer, PeerConnectionState, PeerLinkRole };

const MAX_PEER_CONNECTIONS = 3;

export type MeshCallSessionOptions = {
  signaling: SignalingPort;
  iceServers: IceServer[];
  onRemoteStream: (participantId: string, stream: MediaStream) => void;
  onPeerState: (participantId: string, state: PeerConnectionState) => void;
};

export class MeshCallSession {
  private readonly peers = new Map<string, PeerLink>();
  private readonly queuedOffers = new Map<string, string>();
  private readonly queuedAnswers = new Map<string, string>();
  private readonly queuedIce = new Map<string, string[]>();
  private readonly unsubscribers: Array<() => void> = [];
  private localStream: MediaStream | undefined;
  private disposed = false;

  constructor(private readonly options: MeshCallSessionOptions) {
    this.unsubscribers.push(
      options.signaling.onOffer((input) => {
        void this.receiveOffer(input.fromParticipantId, input.sdp);
      }),
      options.signaling.onAnswer((input) => {
        void this.receiveAnswer(input.fromParticipantId, input.sdp);
      }),
      options.signaling.onIceCandidate((input) => {
        void this.receiveIce(input.fromParticipantId, input.candidate);
      }),
    );
  }

  get peerCount(): number {
    return this.peers.size;
  }

  attachLocal(stream: MediaStream): void {
    this.localStream = stream;
  }

  addPeer(participantId: string, role: PeerLinkRole): void {
    if (this.disposed || this.peers.has(participantId)) {
      return;
    }
    if (this.peers.size >= MAX_PEER_CONNECTIONS) {
      return;
    }
    const resolvedRole = this.queuedOffers.has(participantId)
      ? 'answerer'
      : role;
    const link = new PeerLink({
      remoteParticipantId: participantId,
      iceServers: this.options.iceServers,
      signaling: this.options.signaling,
      role: resolvedRole,
      localStream: this.localStream,
      onRemoteStream: (stream) => {
        this.options.onRemoteStream(participantId, stream);
      },
      onState: (state) => {
        this.options.onPeerState(participantId, state);
      },
    });
    this.peers.set(participantId, link);
    const offer = this.queuedOffers.get(participantId);
    if (offer) {
      this.queuedOffers.delete(participantId);
      void link.handleRemoteOffer(offer);
    }
    const answer = this.queuedAnswers.get(participantId);
    if (answer) {
      this.queuedAnswers.delete(participantId);
      void link.handleRemoteAnswer(answer);
    }
    const ice = this.queuedIce.get(participantId);
    if (ice) {
      this.queuedIce.delete(participantId);
      for (const candidate of ice) {
        void link.handleRemoteIce(candidate);
      }
    }
  }

  removePeer(participantId: string): void {
    const link = this.peers.get(participantId);
    if (!link) {
      this.queuedOffers.delete(participantId);
      this.queuedAnswers.delete(participantId);
      this.queuedIce.delete(participantId);
      return;
    }
    link.close();
    this.peers.delete(participantId);
    this.queuedOffers.delete(participantId);
    this.queuedAnswers.delete(participantId);
    this.queuedIce.delete(participantId);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers.length = 0;
    for (const participantId of [...this.peers.keys()]) {
      this.removePeer(participantId);
    }
    this.queuedOffers.clear();
    this.queuedAnswers.clear();
    this.queuedIce.clear();
    this.localStream = undefined;
  }

  private async receiveOffer(
    participantId: string,
    sdp: string,
  ): Promise<void> {
    const link = this.peers.get(participantId);
    if (!link) {
      this.queuedOffers.set(participantId, sdp);
      return;
    }
    await link.handleRemoteOffer(sdp);
  }

  private async receiveAnswer(
    participantId: string,
    sdp: string,
  ): Promise<void> {
    const link = this.peers.get(participantId);
    if (!link) {
      this.queuedAnswers.set(participantId, sdp);
      return;
    }
    await link.handleRemoteAnswer(sdp);
  }

  private async receiveIce(
    participantId: string,
    candidate: string,
  ): Promise<void> {
    const link = this.peers.get(participantId);
    if (!link) {
      const queued = this.queuedIce.get(participantId) ?? [];
      queued.push(candidate);
      this.queuedIce.set(participantId, queued);
      return;
    }
    await link.handleRemoteIce(candidate);
  }
}
