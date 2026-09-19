import { setRemoteAudioBlocked } from './meeting-session.store';

export function captureEntryGesture(): void {
  void resumeAudioContext();
}

export async function unlockRemoteAudio(): Promise<boolean> {
  await resumeAudioContext();
  const videos = document.querySelectorAll<HTMLVideoElement>(
    'video[data-remote="true"]',
  );
  try {
    await Promise.all([...videos].map((video) => video.play()));
    setRemoteAudioBlocked(false);
    return true;
  } catch {
    setRemoteAudioBlocked(true);
    return false;
  }
}

export function markRemoteAudioBlocked(): void {
  setRemoteAudioBlocked(true);
}

async function resumeAudioContext(): Promise<void> {
  const AudioContextCtor = window.AudioContext;
  if (!AudioContextCtor) {
    return;
  }
  const context = new AudioContextCtor();
  if (context.state === 'suspended') {
    await context.resume();
  }
  await context.close();
}
