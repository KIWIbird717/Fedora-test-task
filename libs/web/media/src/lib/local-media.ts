export type LocalMediaState = {
  stream: MediaStream;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
};

export type LocalMediaDeviceLostHandler = (
  kind: 'audio' | 'video',
  state: LocalMediaState,
) => void;

export class LocalMedia {
  private current: LocalMediaState | undefined;
  private readonly deviceLostHandlers = new Set<LocalMediaDeviceLostHandler>();

  onDeviceLost(handler: LocalMediaDeviceLostHandler): () => void {
    this.deviceLostHandlers.add(handler);
    return () => {
      this.deviceLostHandlers.delete(handler);
    };
  }

  async acquire(): Promise<LocalMediaState> {
    if (this.current) {
      return this.current;
    }
    const stream = await acquireUserMedia();
    this.current = snapshotFromStream(stream);
    this.bindTracks(stream);
    return this.current;
  }

  async setMicrophoneEnabled(enabled: boolean): Promise<LocalMediaState> {
    const state = await this.ensureAcquired();
    const audio = liveTrack(state.stream, 'audio');
    if (audio) {
      audio.enabled = enabled;
      this.current = { ...state, microphoneEnabled: enabled };
      return this.current;
    }
    if (!enabled) {
      this.current = { ...state, microphoneEnabled: false };
      return this.current;
    }
    const extra = await tryGetUserMedia({ audio: true, video: false });
    const acquired = extra?.getAudioTracks()[0];
    if (!acquired) {
      this.current = { ...state, microphoneEnabled: false };
      return this.current;
    }
    state.stream.addTrack(acquired);
    this.bindTrack(acquired);
    this.current = { ...state, microphoneEnabled: true };
    return this.current;
  }

  async setCameraEnabled(enabled: boolean): Promise<LocalMediaState> {
    const state = await this.ensureAcquired();
    if (!enabled) {
      this.stopKind(state.stream, 'video');
      this.current = { ...state, cameraEnabled: false };
      return this.current;
    }
    if (hasLiveTrack(state.stream, 'video')) {
      this.current = { ...state, cameraEnabled: true };
      return this.current;
    }
    const extra = await tryGetUserMedia({ audio: false, video: true });
    const acquired = extra?.getVideoTracks()[0];
    if (!acquired) {
      this.current = { ...state, cameraEnabled: false };
      return this.current;
    }
    state.stream.addTrack(acquired);
    this.bindTrack(acquired);
    this.current = { ...state, cameraEnabled: true };
    return this.current;
  }

  release(): void {
    if (!this.current) {
      return;
    }
    for (const track of [...this.current.stream.getTracks()]) {
      this.current.stream.removeTrack(track);
      track.stop();
    }
    this.current = undefined;
  }

  private async ensureAcquired(): Promise<LocalMediaState> {
    return this.current ?? this.acquire();
  }

  private stopKind(stream: MediaStream, kind: 'audio' | 'video'): void {
    for (const track of stream.getTracks()) {
      if (track.kind !== kind) {
        continue;
      }
      stream.removeTrack(track);
      track.stop();
    }
  }

  private bindTracks(stream: MediaStream): void {
    for (const track of stream.getTracks()) {
      this.bindTrack(track);
    }
  }

  private bindTrack(track: MediaStreamTrack): void {
    track.addEventListener('ended', () => {
      this.handleEnded(track);
    });
  }

  private handleEnded(track: MediaStreamTrack): void {
    if (!this.current) {
      return;
    }
    const stream = this.current.stream;
    if (!stream.getTracks().includes(track)) {
      return;
    }
    stream.removeTrack(track);
    this.current = snapshotFromStream(stream);
    const kind = track.kind === 'audio' ? 'audio' : 'video';
    for (const handler of this.deviceLostHandlers) {
      handler(kind, this.current);
    }
  }
}

export const localMedia = new LocalMedia();

async function acquireUserMedia(): Promise<MediaStream> {
  const both = await tryGetUserMedia({ audio: true, video: true });
  if (both) {
    return both;
  }
  const audioOnly = await tryGetUserMedia({ audio: true, video: false });
  if (audioOnly) {
    return audioOnly;
  }
  const videoOnly = await tryGetUserMedia({ audio: false, video: true });
  if (videoOnly) {
    return videoOnly;
  }
  return new MediaStream();
}

async function tryGetUserMedia(
  constraints: MediaStreamConstraints,
): Promise<MediaStream | undefined> {
  const mediaDevices =
    typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
  if (!mediaDevices?.getUserMedia) {
    return undefined;
  }
  try {
    return await mediaDevices.getUserMedia(constraints);
  } catch {
    return undefined;
  }
}

function snapshotFromStream(stream: MediaStream): LocalMediaState {
  return {
    stream,
    microphoneEnabled: isTransmitting(stream, 'audio'),
    cameraEnabled: isTransmitting(stream, 'video'),
  };
}

function liveTrack(
  stream: MediaStream,
  kind: 'audio' | 'video',
): MediaStreamTrack | undefined {
  return stream
    .getTracks()
    .find((track) => track.kind === kind && track.readyState === 'live');
}

function hasLiveTrack(stream: MediaStream, kind: 'audio' | 'video'): boolean {
  return liveTrack(stream, kind) !== undefined;
}

function isTransmitting(stream: MediaStream, kind: 'audio' | 'video'): boolean {
  return stream
    .getTracks()
    .some(
      (track) =>
        track.kind === kind && track.readyState === 'live' && track.enabled,
    );
}
