import { joinMeeting } from '../../meeting-session/model/join-meeting';
import { setMeetingConnection } from '../../meeting-session/model/meeting-session.store';
import { isWebRtcSupported } from './webrtc-support';

/**
 * Opening the same room URL in a second tab is a second join, not a resume.
 * Tabs are never merged: each occupies its own participant slot (US11).
 */
export async function enterCreatedRoom(input: {
  roomId: string;
  displayName: string;
  navigateToRoom: (roomId: string) => Promise<void>;
}): Promise<void> {
  if (!isWebRtcSupported()) {
    setMeetingConnection({ status: 'webrtc-unsupported' });
    return;
  }
  setMeetingConnection({ status: 'connecting', roomId: input.roomId });
  await input.navigateToRoom(input.roomId);
  await joinMeeting(input.roomId, input.displayName);
}
