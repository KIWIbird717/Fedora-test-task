import { Button } from '@fedora-meetings/web-ui';
import { unlockRemoteAudio } from '../model/autoplay';
import { useMeetingSession } from '../model/meeting-session.store';

export function EnableSoundButton() {
  const { remoteAudioBlocked } = useMeetingSession();
  if (!remoteAudioBlocked) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
      <Button
        type="button"
        className="pointer-events-auto"
        onClick={() => {
          void unlockRemoteAudio();
        }}
      >
        Включить звук
      </Button>
    </div>
  );
}
