import { joinMeeting } from '../../meeting-session/model/join-meeting';
import { setMeetingConnection } from '../../meeting-session/model/meeting-session.store';

export async function enterCreatedRoom(input: {
  roomId: string;
  displayName: string;
  navigateToRoom: (roomId: string) => Promise<void>;
}): Promise<void> {
  setMeetingConnection({ status: 'connecting', roomId: input.roomId });
  await input.navigateToRoom(input.roomId);
  await joinMeeting(input.roomId, input.displayName);
}
