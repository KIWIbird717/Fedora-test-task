import { LocalMedia } from './local-media.js';

class FakeMediaStream {
  constructor(private readonly tracks: FakeTrack[] = []) {}

  getTracks(): FakeTrack[] {
    return [...this.tracks];
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

  removeTrack(track: FakeTrack): void {
    const index = this.tracks.indexOf(track);
    if (index !== -1) {
      this.tracks.splice(index, 1);
    }
  }
}

class FakeTrack {
  readyState: MediaStreamTrackState = 'live';
  enabled = true;
  private readonly endedListeners = new Set<() => void>();

  constructor(readonly kind: 'audio' | 'video') {}

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type === 'ended' && typeof listener === 'function') {
      this.endedListeners.add(listener as () => void);
    }
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void {
    if (type === 'ended' && typeof listener === 'function') {
      this.endedListeners.delete(listener as () => void);
    }
  }

  stop(): void {
    this.readyState = 'ended';
    this.emitEnded();
  }

  end(): void {
    this.readyState = 'ended';
    this.emitEnded();
  }

  private emitEnded(): void {
    for (const listener of this.endedListeners) {
      listener();
    }
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
    expect(snapshot.permissionDenied).toBe(false);
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

  it('stops the video track when the camera is switched off', async () => {
    const video = new FakeTrack('video');
    const audio = new FakeTrack('audio');
    const stream = new FakeMediaStream([audio, video]);
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => stream),
      },
    });

    const media = new LocalMedia();
    await media.acquire();
    const snapshot = await media.setCameraEnabled(false);

    expect(video.readyState).toBe('ended');
    expect(snapshot.cameraEnabled).toBe(false);
    expect(snapshot.stream.getVideoTracks()).toHaveLength(0);
    expect(snapshot.microphoneEnabled).toBe(true);
    media.release();
  });

  it('re-acquires a video track when the camera is switched on', async () => {
    const firstVideo = new FakeTrack('video');
    const audio = new FakeTrack('audio');
    const initial = new FakeMediaStream([audio, firstVideo]);
    const nextVideo = new FakeTrack('video');
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(
          async (constraints: { audio?: boolean; video?: boolean }) => {
            if (constraints.audio && constraints.video) {
              return initial;
            }
            if (constraints.video) {
              return new FakeMediaStream([nextVideo]);
            }
            throw new Error('unexpected');
          },
        ),
      },
    });

    const media = new LocalMedia();
    await media.acquire();
    await media.setCameraEnabled(false);
    const snapshot = await media.setCameraEnabled(true);

    expect(snapshot.cameraEnabled).toBe(true);
    expect(snapshot.stream.getVideoTracks()).toEqual([nextVideo]);
    media.release();
  });

  it('turns a lost device off without offering recovery UI', async () => {
    const video = new FakeTrack('video');
    const audio = new FakeTrack('audio');
    const stream = new FakeMediaStream([audio, video]);
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => stream),
      },
    });

    const media = new LocalMedia();
    const lost = vi.fn();
    media.onDeviceLost(lost);
    await media.acquire();
    video.end();

    expect(lost).toHaveBeenCalledTimes(1);
    expect(lost.mock.calls[0]?.[0]).toBe('video');
    expect(lost.mock.calls[0]?.[1].cameraEnabled).toBe(false);
    expect(lost.mock.calls[0]?.[1].microphoneEnabled).toBe(true);
    media.release();
  });

  it('joins with devices off and flags permission denial on NotAllowedError', async () => {
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => {
          const error = new Error('Permission denied');
          error.name = 'NotAllowedError';
          throw error;
        }),
      },
    });

    const media = new LocalMedia();
    const snapshot = await media.acquire();

    expect(snapshot.microphoneEnabled).toBe(false);
    expect(snapshot.cameraEnabled).toBe(false);
    expect(snapshot.permissionDenied).toBe(true);
    expect(snapshot.stream.getTracks()).toHaveLength(0);
    media.stopAll();
  });

  it('does not treat missing devices as permission denial', async () => {
    vi.stubGlobal('MediaStream', FakeMediaStream);
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => {
          const error = new Error('Requested device not found');
          error.name = 'NotFoundError';
          throw error;
        }),
      },
    });

    const media = new LocalMedia();
    const snapshot = await media.acquire();

    expect(snapshot.microphoneEnabled).toBe(false);
    expect(snapshot.cameraEnabled).toBe(false);
    expect(snapshot.permissionDenied).toBe(false);
    media.release();
  });
});
