import { LocalMedia } from './local-media.js';

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
  readonly readyState = 'live';

  constructor(readonly kind: 'audio' | 'video') {}

  stop(): void {
    return;
  }
}

describe('LocalMedia', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns both devices off when getUserMedia is unavailable', async () => {
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('navigator', { mediaDevices: undefined });

    const media = new LocalMedia();
    const snapshot = await media.acquire();

    expect(snapshot.microphoneEnabled).toBe(false);
    expect(snapshot.cameraEnabled).toBe(false);
    media.release();
  });

  it('keeps the available track when only audio can be acquired', async () => {
    vi.stubGlobal('MediaStream', FakeMediaStream);
    const audioStream = new FakeMediaStream([new FakeTrack('audio')]);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async (constraints: { audio?: boolean; video?: boolean }) => {
          if (constraints.video) {
            throw new Error('no camera');
          }
          if (constraints.audio) {
            return audioStream;
          }
          throw new Error('no devices');
        }),
      },
    });

    const media = new LocalMedia();
    const snapshot = await media.acquire();

    expect(snapshot.microphoneEnabled).toBe(true);
    expect(snapshot.cameraEnabled).toBe(false);
    media.release();
  });
});
