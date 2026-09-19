import { russianMessages } from '@fedora-meetings/contracts-realtime';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@fedora-meetings/web-ui';

export function RoomFullState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{russianMessages.ROOM_FULL}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={onRetry}>
          Повторить вход
        </Button>
      </CardContent>
    </Card>
  );
}
