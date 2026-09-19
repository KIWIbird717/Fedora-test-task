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
import { isWebRtcSupported } from '../features/enter-room/model/webrtc-support';
import { ConnectingIndicator } from '../features/enter-room/ui/connecting-indicator';
import { DisplayNameField } from '../features/enter-room/ui/display-name-field';
import { RoomFullState } from '../features/enter-room/ui/room-full-state';
import { ServerError } from '../features/enter-room/ui/server-error';
import { WebrtcUnsupported } from '../features/enter-room/ui/webrtc-unsupported';
import { ChatPanel } from '../widgets/chat-panel';
import { ControlBar } from '../widgets/control-bar';
import { ParticipantList } from '../widgets/participant-list';
import { VideoGrid } from '../widgets/video-grid';
import { EnableSoundButton } from '../features/meeting-session/ui/enable-sound-button';
import { MediaPermissionAlert } from '../features/meeting-session/ui/media-permission-alert';
import { captureEntryGesture } from '../features/meeting-session/model/autoplay';
import { joinMeeting } from '../features/meeting-session/model/join-meeting';
import {
  setMeetingConnection,
  useMeetingSession,
} from '../features/meeting-session/model/meeting-session.store';
import { useSocketLifecycle } from '../features/meeting-session/model/socket-lifecycle';
import { useSessionTeardown } from '../features/meeting-session/model/teardown-session';
import { useMeshCall } from '../features/meeting-session/model/use-mesh-call';

export function RoomPage() {
  const { roomId } = useParams({ from: '/room/$roomId' });
  const displayName = useDisplayName();
  const session = useMeetingSession();
  const validation = validateDisplayName(displayName);
  const webrtcSupported = isWebRtcSupported();

  async function onJoin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!validation.ok || !webrtcSupported) {
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
          {!webrtcSupported ||
          session.connection.status === 'webrtc-unsupported' ? (
            <WebrtcUnsupported />
          ) : (
            <form className="flex flex-col gap-4" onSubmit={onJoin}>
              {session.connection.status === 'service-full' ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {russianMessages.SERVICE_AT_CAPACITY}
                  </AlertDescription>
                </Alert>
              ) : null}
              {session.connection.status === 'server-error' ? (
                <ServerError />
              ) : null}
              <DisplayNameField
                serverMessage={
                  session.connection.status === 'idle'
                    ? session.connection.nameError
                    : undefined
                }
                onClearServerMessage={() => {
                  setMeetingConnection({ status: 'idle' });
                }}
              />
              <Button type="submit" disabled={!validation.ok}>
                Войти
              </Button>
            </form>
          )}
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
  useSessionTeardown();
  useSocketLifecycle();

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
      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col max-h-screen">
        {session.mediaPermissionDenied ? <MediaPermissionAlert /> : null}
        <VideoGrid
          self={self}
          remotes={remotes}
          localStream={session.localStream}
          localCameraEnabled={session.localCameraEnabled}
          localMicrophoneEnabled={session.localMicrophoneEnabled}
          remoteStreams={session.remoteStreams}
          peerStates={session.peerStates}
        />
        <EnableSoundButton />
        <ControlBar />
      </div>
      <aside className="hidden h-screen w-80 shrink-0 flex-col border-l border-border bg-card lg:flex">
        <ParticipantList />
        <ChatPanel />
      </aside>
    </main>
  );
}
