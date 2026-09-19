import type { SignalingPort } from './signaling.port.js';

export type PeerLinkRole = 'offerer' | 'answerer';

export type PeerConnectionState =
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'closed';

export type IceServer = {
  urls: string;
};

const DISCONNECT_FAILURE_MS = 3_000;

export type PeerLinkOptions = {
  remoteParticipantId: string;
  iceServers: IceServer[];
  signaling: SignalingPort;
  role: PeerLinkRole;
  localStream: MediaStream | undefined;
  onRemoteStream: (stream: MediaStream) => void;
  onState: (state: PeerConnectionState) => void;
};

export class PeerLink {
  private readonly pc: RTCPeerConnection;
  private readonly remoteStream = new MediaStream();
  private readonly pendingIce: RTCIceCandidateInit[] = [];
  private readonly audioSender: RTCRtpSender;
  private readonly videoSender: RTCRtpSender;
  private remoteDescriptionSet = false;
  private closed = false;
  private disconnectTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly options: PeerLinkOptions) {
    this.pc = new RTCPeerConnection({ iceServers: options.iceServers });
    this.pc.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      void options.signaling.sendIceCandidate({
        toParticipantId: options.remoteParticipantId,
        candidate: JSON.stringify(event.candidate.toJSON()),
      });
    };
    this.pc.ontrack = (event) => {
      if (this.remoteStream.getTracks().some((track) => track.id === event.track.id)) {
        options.onRemoteStream(this.remoteStream);
        return;
      }
      this.remoteStream.addTrack(event.track);
      options.onRemoteStream(this.remoteStream);
    };
    this.pc.oniceconnectionstatechange = () => {
      this.emitFromIceState();
    };
    const senders = this.attachLocalTracks();
    this.audioSender = senders.audio;
    this.videoSender = senders.video;
    options.onState('connecting');
    if (options.role === 'offerer') {
      void this.createAndSendOffer();
    }
  }

  async replaceTrack(
    kind: 'audio' | 'video',
    track: MediaStreamTrack | null,
  ): Promise<void> {
    if (this.closed) {
      return;
    }
    const sender = kind === 'audio' ? this.audioSender : this.videoSender;
    await sender.replaceTrack(track);
  }

  async handleRemoteOffer(sdp: string): Promise<void> {
    if (this.closed) {
      return;
    }
    await this.pc.setRemoteDescription({ type: 'offer', sdp });
    this.remoteDescriptionSet = true;
    await this.flushIce();
    if (this.closed) {
      return;
    }
    const answer = await this.pc.createAnswer();
    if (this.closed) {
      return;
    }
    await this.pc.setLocalDescription(answer);
    if (this.closed || !answer.sdp) {
      return;
    }
    await this.options.signaling.sendAnswer({
      toParticipantId: this.options.remoteParticipantId,
      sdp: answer.sdp,
    });
  }

  async handleRemoteAnswer(sdp: string): Promise<void> {
    if (this.closed) {
      return;
    }
    await this.pc.setRemoteDescription({ type: 'answer', sdp });
    this.remoteDescriptionSet = true;
    await this.flushIce();
  }

  async handleRemoteIce(candidate: string): Promise<void> {
    const parsed = parseIceCandidate(candidate);
    if (!parsed || this.closed) {
      return;
    }
    if (!this.remoteDescriptionSet) {
      this.pendingIce.push(parsed);
      return;
    }
    await this.pc.addIceCandidate(parsed);
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.clearDisconnectTimer();
    this.pc.onicecandidate = null;
    this.pc.ontrack = null;
    this.pc.oniceconnectionstatechange = null;
    this.pc.close();
    this.options.onState('closed');
  }

  private attachLocalTracks(): { audio: RTCRtpSender; video: RTCRtpSender } {
    const stream = this.options.localStream ?? new MediaStream();
    const audio = stream.getAudioTracks()[0];
    const video = stream.getVideoTracks()[0];
    return {
      audio: audio
        ? this.pc.addTrack(audio, stream)
        : this.pc.addTransceiver('audio', { direction: 'sendrecv' }).sender,
      video: video
        ? this.pc.addTrack(video, stream)
        : this.pc.addTransceiver('video', { direction: 'sendrecv' }).sender,
    };
  }

  private async createAndSendOffer(): Promise<void> {
    if (this.closed) {
      return;
    }
    const offer = await this.pc.createOffer();
    if (this.closed) {
      return;
    }
    await this.pc.setLocalDescription(offer);
    if (this.closed || !offer.sdp) {
      return;
    }
    await this.options.signaling.sendOffer({
      toParticipantId: this.options.remoteParticipantId,
      sdp: offer.sdp,
    });
  }

  private async flushIce(): Promise<void> {
    const queued = this.pendingIce.splice(0, this.pendingIce.length);
    for (const candidate of queued) {
      if (this.closed) {
        return;
      }
      await this.pc.addIceCandidate(candidate);
    }
  }

  private emitFromIceState(): void {
    if (this.closed) {
      return;
    }
    const ice = this.pc.iceConnectionState;
    if (ice === 'connected' || ice === 'completed') {
      this.clearDisconnectTimer();
      this.options.onState('connected');
      return;
    }
    if (ice === 'failed') {
      this.clearDisconnectTimer();
      this.options.onState('failed');
      return;
    }
    if (ice === 'disconnected') {
      this.disconnectTimer ??= setTimeout(() => {
        if (this.closed) {
          return;
        }
        if (
          this.pc.iceConnectionState === 'disconnected' ||
          this.pc.iceConnectionState === 'failed'
        ) {
          this.options.onState('failed');
        }
      }, DISCONNECT_FAILURE_MS);
      return;
    }
    if (ice === 'closed') {
      this.options.onState('closed');
    }
  }

  private clearDisconnectTimer(): void {
    if (!this.disconnectTimer) {
      return;
    }
    clearTimeout(this.disconnectTimer);
    this.disconnectTimer = undefined;
  }
}

function parseIceCandidate(candidate: string): RTCIceCandidateInit | undefined {
  try {
    const parsed: unknown = JSON.parse(candidate);
    if (typeof parsed !== 'object' || parsed === null) {
      return undefined;
    }
    // Signaling carries RTCIceCandidateInit JSON; the WebRTC constructor validates fields.
    return parsed as RTCIceCandidateInit;
  } catch {
    return undefined;
  }
}
