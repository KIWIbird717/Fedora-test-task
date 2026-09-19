import { PeerLink } from './peer-link.js';
import type { SignalingPort } from './signaling.port.js';

class FakeMediaStream {
  constructor(private readonly tracks: FakeTrack[] = []) {}

  getTracks(): FakeTrack[] {
    return this.tracks;
  }

  getAudioTracks(): FakeTrack[] {
    return this.tracks.filter((track) => track.kind === 'audio');
  }

  getVideoTracks(): FakeTrack[] {
    return this.tracks.filter((track) => track.kind === 'video');
  }
}

class FakeTrack {
  private static nextId = 1;
  readonly id = `track-${FakeTrack.nextId++}`;
  readonly readyState = 'live';

  constructor(readonly kind: 'audio' | 'video') {}

  stop(): void {
    return;
  }
}

class FakeSender {
  constructor(public track: FakeTrack | null) {}

  readonly replaceTrack = vi.fn(async (track: FakeTrack | null) => {
    this.track = track;
  });
}

class FakePeerConnection {
  static instances: FakePeerConnection[] = [];

  onicecandidate: ((event: { candidate: { toJSON: () => object } | null }) => void)
    | null = null;
  ontrack: ((event: { track: FakeTrack }) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  iceConnectionState = 'new';
  readonly senders: FakeSender[] = [];
  readonly addTrack = vi.fn((track: FakeTrack) => {
    const sender = new FakeSender(track);
    this.senders.push(sender);
    return sender;
  });
  readonly addTransceiver = vi.fn(() => {
    const sender = new FakeSender(null);
    this.senders.push(sender);
    return { sender };
  });
  readonly addIceCandidate = vi.fn(async () => undefined);
  readonly createOffer = vi.fn(async () => ({
    type: 'offer' as const,
    sdp: 'offer-sdp',
  }));
  readonly createAnswer = vi.fn(async () => ({
    type: 'answer' as const,
    sdp: 'answer-sdp',
  }));
  readonly setLocalDescription = vi.fn(async () => undefined);
  readonly setRemoteDescription = vi.fn(async () => undefined);
  readonly close = vi.fn(() => {
    this.iceConnectionState = 'closed';
  });

  constructor() {
    FakePeerConnection.instances.push(this);
  }

  emitIce(state: string): void {
    this.iceConnectionState = state;
    this.oniceconnectionstatechange?.();
  }
}

function createFakeSignaling(): SignalingPort {
  return {
    sendOffer: vi.fn(async () => undefined),
    sendAnswer: vi.fn(async () => undefined),
    sendIceCandidate: vi.fn(async () => undefined),
    onOffer: () => () => undefined,
    onAnswer: () => () => undefined,
    onIceCandidate: () => () => undefined,
  };
}

describe('PeerLink', () => {
  beforeEach(() => {
    FakePeerConnection.instances = [];
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('RTCPeerConnection', FakePeerConnection);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reports failed when ICE fails', () => {
    const onState = vi.fn();
    const link = new PeerLink({
      remoteParticipantId: 'peer-1',
      iceServers: [],
      signaling: createFakeSignaling(),
      role: 'answerer',
      localStream: undefined,
      onRemoteStream: vi.fn(),
      onState,
    });
    const pc = FakePeerConnection.instances[0];

    pc?.emitIce('failed');

    expect(onState).toHaveBeenCalledWith('failed');
    link.close();
  });

  it('reports failed after a disconnected ICE timeout', () => {
    vi.useFakeTimers();
    const onState = vi.fn();
    const link = new PeerLink({
      remoteParticipantId: 'peer-1',
      iceServers: [],
      signaling: createFakeSignaling(),
      role: 'answerer',
      localStream: undefined,
      onRemoteStream: vi.fn(),
      onState,
    });
    const pc = FakePeerConnection.instances[0];

    pc?.emitIce('disconnected');
    expect(onState).not.toHaveBeenCalledWith('failed');

    vi.advanceTimersByTime(3_000);
    expect(onState).toHaveBeenCalledWith('failed');
    link.close();
  });

  it('does not fail if ICE reconnects before the disconnect timeout', () => {
    vi.useFakeTimers();
    const onState = vi.fn();
    const link = new PeerLink({
      remoteParticipantId: 'peer-1',
      iceServers: [],
      signaling: createFakeSignaling(),
      role: 'answerer',
      localStream: undefined,
      onRemoteStream: vi.fn(),
      onState,
    });
    const pc = FakePeerConnection.instances[0];

    pc?.emitIce('disconnected');
    pc?.emitIce('connected');
    vi.advanceTimersByTime(3_000);

    expect(onState).toHaveBeenCalledWith('connected');
    expect(onState).not.toHaveBeenCalledWith('failed');
    link.close();
  });
});
