import { MeshCallSession } from './mesh-call-session.js';
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

  addTrack(track: FakeTrack): void {
    this.tracks.push(track);
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

class FakePeerConnection {
  static instances: FakePeerConnection[] = [];

  onicecandidate: ((event: { candidate: { toJSON: () => object } | null }) => void)
    | null = null;
  ontrack: ((event: { track: FakeTrack }) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  iceConnectionState = 'new';
  localDescription: { type: string; sdp: string } | null = null;
  remoteDescription: { type: string; sdp: string } | null = null;
  readonly addTrack = vi.fn();
  readonly addTransceiver = vi.fn();
  readonly addIceCandidate = vi.fn(async () => undefined);
  readonly createOffer = vi.fn(async () => ({
    type: 'offer' as const,
    sdp: 'offer-sdp',
  }));
  readonly createAnswer = vi.fn(async () => ({
    type: 'answer' as const,
    sdp: 'answer-sdp',
  }));
  readonly setLocalDescription = vi.fn(
    async (description: { type: string; sdp: string }) => {
      this.localDescription = description;
    },
  );
  readonly setRemoteDescription = vi.fn(
    async (description: { type: string; sdp: string }) => {
      this.remoteDescription = description;
    },
  );
  readonly close = vi.fn(() => {
    this.iceConnectionState = 'closed';
  });

  constructor() {
    FakePeerConnection.instances.push(this);
  }
}

function createFakeSignaling(): SignalingPort & {
  emitOffer: (fromParticipantId: string, sdp: string) => void;
} {
  const offerHandlers = new Set<
    (input: { fromParticipantId: string; sdp: string }) => void
  >();
  const answerHandlers = new Set<
    (input: { fromParticipantId: string; sdp: string }) => void
  >();
  const iceHandlers = new Set<
    (input: { fromParticipantId: string; candidate: string }) => void
  >();

  return {
    sendOffer: vi.fn(async () => undefined),
    sendAnswer: vi.fn(async () => undefined),
    sendIceCandidate: vi.fn(async () => undefined),
    onOffer: (handler) => {
      offerHandlers.add(handler);
      return () => {
        offerHandlers.delete(handler);
      };
    },
    onAnswer: (handler) => {
      answerHandlers.add(handler);
      return () => {
        answerHandlers.delete(handler);
      };
    },
    onIceCandidate: (handler) => {
      iceHandlers.add(handler);
      return () => {
        iceHandlers.delete(handler);
      };
    },
    emitOffer: (fromParticipantId, sdp) => {
      for (const handler of offerHandlers) {
        handler({ fromParticipantId, sdp });
      }
    },
  };
}

describe('MeshCallSession', () => {
  beforeEach(() => {
    FakePeerConnection.instances = [];
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('RTCPeerConnection', FakePeerConnection);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('adds a peer as offerer and sends an offer', async () => {
    const signaling = createFakeSignaling();
    const session = new MeshCallSession({
      signaling,
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      onRemoteStream: vi.fn(),
      onPeerState: vi.fn(),
    });

    session.addPeer('peer-1', 'offerer');

    expect(session.peerCount).toBe(1);
    expect(FakePeerConnection.instances).toHaveLength(1);
    await vi.waitFor(() => {
      expect(signaling.sendOffer).toHaveBeenCalledWith({
        toParticipantId: 'peer-1',
        sdp: 'offer-sdp',
      });
    });

    session.dispose();
  });

  it('ignores a fourth peer so the mesh stays at 3 connections', () => {
    const session = new MeshCallSession({
      signaling: createFakeSignaling(),
      iceServers: [],
      onRemoteStream: vi.fn(),
      onPeerState: vi.fn(),
    });

    session.addPeer('peer-1', 'offerer');
    session.addPeer('peer-2', 'offerer');
    session.addPeer('peer-3', 'offerer');
    session.addPeer('peer-4', 'offerer');

    expect(session.peerCount).toBe(3);
    expect(FakePeerConnection.instances).toHaveLength(3);
    session.dispose();
  });

  it('closes the peer connection on removePeer', () => {
    const session = new MeshCallSession({
      signaling: createFakeSignaling(),
      iceServers: [],
      onRemoteStream: vi.fn(),
      onPeerState: vi.fn(),
    });

    session.addPeer('peer-1', 'answerer');
    const pc = FakePeerConnection.instances[0];
    session.removePeer('peer-1');

    expect(session.peerCount).toBe(0);
    expect(pc?.close).toHaveBeenCalledTimes(1);
    session.dispose();
  });

  it('disposes every peer and ignores later signaling', () => {
    const signaling = createFakeSignaling();
    const session = new MeshCallSession({
      signaling,
      iceServers: [],
      onRemoteStream: vi.fn(),
      onPeerState: vi.fn(),
    });

    session.addPeer('peer-1', 'offerer');
    session.addPeer('peer-2', 'offerer');
    const connections = [...FakePeerConnection.instances];
    session.dispose();

    expect(session.peerCount).toBe(0);
    for (const connection of connections) {
      expect(connection.close).toHaveBeenCalledTimes(1);
    }

    signaling.emitOffer('peer-3', 'late-offer');
    expect(FakePeerConnection.instances).toHaveLength(2);
  });
});
