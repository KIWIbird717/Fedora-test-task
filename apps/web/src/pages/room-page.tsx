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
import { joinMeeting } from '../features/meeting-session/model/join-meeting';
import { useMeetingSession } from '../features/meeting-session/model/meeting-session.store';
import { VideoGrid } from '../widgets/video-grid';

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
    const selfId = session.connection.participantId;
    const self = session.participants.find(
      (participant) => participant.id === selfId,
    );
    const remotes = session.participants.filter(
      (participant) => participant.id !== selfId,
    );
    return (
      <main className="flex min-h-screen flex-col bg-background text-foreground">
        <VideoGrid self={self} remotes={remotes} />
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
            {session.connection.status === 'room-full' ? (
              <Alert variant="destructive">
                <AlertDescription>{russianMessages.ROOM_FULL}</AlertDescription>
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
