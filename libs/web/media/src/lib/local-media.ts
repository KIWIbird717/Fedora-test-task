export type LocalMediaState = {
  stream: MediaStream;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
  permissionDenied: boolean;
};

export type LocalMediaDeviceLostHandler = (
  kind: 'audio' | 'video',
  state: LocalMediaState,
) => void;

export class LocalMedia {
  private current: LocalMediaState | undefined;
  private permissionDenied = false;
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
    const acquired = await acquireUserMedia();
    this.permissionDenied = acquired.permissionDenied;
    this.current = snapshotFromStream(acquired.stream, this.permissionDenied);
    this.bindTracks(acquired.stream);
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
    this.permissionDenied = this.permissionDenied || extra.permissionDenied;
    const acquired = extra.stream?.getAudioTracks()[0];
    if (!acquired) {
      this.current = {
        ...state,
        microphoneEnabled: false,
        permissionDenied: this.permissionDenied,
      };
      return this.current;
    }
    state.stream.addTrack(acquired);
    this.bindTrack(acquired);
    this.current = {
      ...state,
      microphoneEnabled: true,
      permissionDenied: this.permissionDenied,
    };
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
    this.permissionDenied = this.permissionDenied || extra.permissionDenied;
    const acquired = extra.stream?.getVideoTracks()[0];
    if (!acquired) {
      this.current = {
        ...state,
        cameraEnabled: false,
        permissionDenied: this.permissionDenied,
      };
      return this.current;
    }
    state.stream.addTrack(acquired);
    this.bindTrack(acquired);
    this.current = {
      ...state,
      cameraEnabled: true,
      permissionDenied: this.permissionDenied,
    };
    return this.current;
  }

  stopAll(): void {
    this.release();
  }

  release(): void {
    if (!this.current) {
      this.permissionDenied = false;
      return;
    }
    for (const track of [...this.current.stream.getTracks()]) {
      this.current.stream.removeTrack(track);
      track.stop();
    }
    this.current = undefined;
    this.permissionDenied = false;
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
    this.current = snapshotFromStream(stream, this.permissionDenied);
    const kind = track.kind === 'audio' ? 'audio' : 'video';
    for (const handler of this.deviceLostHandlers) {
      handler(kind, this.current);
    }
  }
}

export const localMedia = new LocalMedia();

type UserMediaAttempt = {
  stream: MediaStream | undefined;
  permissionDenied: boolean;
};

async function acquireUserMedia(): Promise<{
  stream: MediaStream;
  permissionDenied: boolean;
}> {
  const both = await tryGetUserMedia({ audio: true, video: true });
  if (both.stream) {
    return { stream: both.stream, permissionDenied: false };
  }
  const audioOnly = await tryGetUserMedia({ audio: true, video: false });
  if (audioOnly.stream) {
    return {
      stream: audioOnly.stream,
      permissionDenied: both.permissionDenied || audioOnly.permissionDenied,
    };
  }
  const videoOnly = await tryGetUserMedia({ audio: false, video: true });
  if (videoOnly.stream) {
    return {
      stream: videoOnly.stream,
      permissionDenied:
        both.permissionDenied ||
        audioOnly.permissionDenied ||
        videoOnly.permissionDenied,
    };
  }
  return {
    stream: new MediaStream(),
    permissionDenied:
      both.permissionDenied ||
      audioOnly.permissionDenied ||
      videoOnly.permissionDenied,
  };
}

async function tryGetUserMedia(
  constraints: MediaStreamConstraints,
): Promise<UserMediaAttempt> {
  const mediaDevices =
    typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
  if (!mediaDevices?.getUserMedia) {
    return { stream: undefined, permissionDenied: false };
  }
  try {
    return {
      stream: await mediaDevices.getUserMedia(constraints),
      permissionDenied: false,
    };
  } catch (error) {
    return {
      stream: undefined,
      permissionDenied: isNotAllowedError(error),
    };
  }
}

function isNotAllowedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'NotAllowedError'
  );
}

function snapshotFromStream(
  stream: MediaStream,
  permissionDenied: boolean,
): LocalMediaState {
  return {
    stream,
    microphoneEnabled: isTransmitting(stream, 'audio'),
    cameraEnabled: isTransmitting(stream, 'video'),
    permissionDenied,
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
