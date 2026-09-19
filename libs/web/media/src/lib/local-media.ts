export type LocalMediaState = {
  stream: MediaStream;
  microphoneEnabled: boolean;
  cameraEnabled: boolean;
};

export class LocalMedia {
  private current: LocalMediaState | undefined;

  async acquire(): Promise<LocalMediaState> {
    if (this.current) {
      return this.current;
    }
    const stream = await acquireUserMedia();
    this.current = {
      stream,
      microphoneEnabled: hasLiveTrack(stream, 'audio'),
      cameraEnabled: hasLiveTrack(stream, 'video'),
    };
    return this.current;
  }

  release(): void {
    if (!this.current) {
      return;
    }
    for (const track of this.current.stream.getTracks()) {
      track.stop();
    }
    this.current = undefined;
  }
}

export const localMedia = new LocalMedia();

async function acquireUserMedia(): Promise<MediaStream> {
  const mediaDevices =
    typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
  if (!mediaDevices?.getUserMedia) {
    return new MediaStream();
  }
  try {
    return await mediaDevices.getUserMedia({ audio: true, video: true });
  } catch {
    try {
      return await mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      try {
        return await mediaDevices.getUserMedia({ audio: false, video: true });
      } catch {
        return new MediaStream();
      }
    }
  }
}

function hasLiveTrack(stream: MediaStream, kind: 'audio' | 'video'): boolean {
  return stream
    .getTracks()
    .some((track) => track.kind === kind && track.readyState === 'live');
}
