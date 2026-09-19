import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@fedora-meetings/web-ui';
import { russianMessages } from '@fedora-meetings/contracts-realtime';
import { useParams } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { validateDisplayName } from '../features/enter-room/model/display-name-rules';
import { useDisplayName } from '../features/enter-room/model/display-name.store';
import { ConnectingIndicator } from '../features/enter-room/ui/connecting-indicator';
import { DisplayNameField } from '../features/enter-room/ui/display-name-field';
import { RoomFullState } from '../features/enter-room/ui/room-full-state';
import { ChatPanel } from '../widgets/chat-panel';
import { ControlBar } from '../widgets/control-bar';
import { VideoGrid } from '../widgets/video-grid';
import { EnableSoundButton } from '../features/meeting-session/ui/enable-sound-button';
import { captureEntryGesture } from '../features/meeting-session/model/autoplay';
import { joinMeeting } from '../features/meeting-session/model/join-meeting';
import {
  setMeetingConnection,
  useMeetingSession,
} from '../features/meeting-session/model/meeting-session.store';
import { useMeshCall } from '../features/meeting-session/model/use-mesh-call';

export function RoomPage() {
  const { roomId } = useParams({ from: '/room/$roomId' });
  const displayName = useDisplayName();
  const session = useMeetingSession();
  const validation = validateDisplayName(displayName);

  async function onJoin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!validation.ok) {
      return;
    }
    captureEntryGesture();
    await joinMeeting(roomId, validation.value);
  }

  if (session.connection.status === 'connecting') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <ConnectingIndicator />
      </main>
    );
  }

  if (session.connection.status === 'in-room') {
    return <InRoomLayout />;
  }

  if (session.connection.status === 'room-full') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <RoomFullState
          onRetry={() => {
            void retryJoin(roomId, displayName);
          }}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Войти в комнату</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onJoin}>
            {session.connection.status === 'service-full' ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {russianMessages.SERVICE_AT_CAPACITY}
                </AlertDescription>
              </Alert>
            ) : null}
            {session.connection.status === 'server-error' ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {russianMessages.SERVER_UNREACHABLE}
                </AlertDescription>
              </Alert>
            ) : null}
            <DisplayNameField />
            <Button type="submit" disabled={!validation.ok}>
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

async function retryJoin(roomId: string, displayName: string): Promise<void> {
  const validation = validateDisplayName(displayName);
  if (!validation.ok) {
    setMeetingConnection({ status: 'idle' });
    return;
  }
  captureEntryGesture();
  await joinMeeting(roomId, validation.value);
}

function InRoomLayout() {
  const session = useMeetingSession();
  useMeshCall();

  if (session.connection.status !== 'in-room') {
    return null;
  }

  const selfId = session.connection.participantId;
  const self = session.participants.find(
    (participant) => participant.id === selfId,
  );
  const remotes = session.participants.filter(
    (participant) => participant.id !== selfId,
  );

  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        <VideoGrid
          self={self}
          remotes={remotes}
          localStream={session.localStream}
          localCameraEnabled={session.localCameraEnabled}
          localMicrophoneEnabled={session.localMicrophoneEnabled}
          remoteStreams={session.remoteStreams}
        />
        <EnableSoundButton />
        <ControlBar />
      </div>
      <ChatPanel />
    </main>
  );
}
