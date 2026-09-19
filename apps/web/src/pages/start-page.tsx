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
import { useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { ServiceAtCapacityError, useMintRoomMutation } from '../features/enter-room/api/mint-room';
import { enterCreatedRoom } from '../features/enter-room/model/enter-room';
import { validateDisplayName } from '../features/enter-room/model/display-name-rules';
import { useDisplayName } from '../features/enter-room/model/display-name.store';
import { ConnectingIndicator } from '../features/enter-room/ui/connecting-indicator';
import { DisplayNameField } from '../features/enter-room/ui/display-name-field';
import {
  setMeetingConnection,
  useMeetingSession,
} from '../features/meeting-session/model/meeting-session.store';

export function StartPage() {
  const displayName = useDisplayName();
  const session = useMeetingSession();
  const navigate = useNavigate();
  const mintRoom = useMintRoomMutation();
  const validation = validateDisplayName(displayName);
  const isConnecting =
    mintRoom.isPending || session.connection.status === 'connecting';

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!validation.ok || isConnecting) {
      return;
    }
    setMeetingConnection({ status: 'connecting', roomId: '' });
    try {
      const roomId = await mintRoom.mutateAsync();
      await enterCreatedRoom({
        roomId,
        displayName: validation.value,
        navigateToRoom: (id) =>
          navigate({ to: '/room/$roomId', params: { roomId: id } }),
      });
    } catch (error) {
      if (error instanceof ServiceAtCapacityError) {
        setMeetingConnection({ status: 'service-full' });
        return;
      }
      setMeetingConnection({ status: 'server-error' });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Fedora Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {isConnecting ? (
            <ConnectingIndicator />
          ) : (
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
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
                Создать комнату
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
