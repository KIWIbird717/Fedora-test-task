import { getActiveRoomClient } from '../../meeting-session/model/active-room-client';
import { teardownSession } from '../../meeting-session/model/teardown-session';

export async function leaveRoom(
  navigateHome: () => void | Promise<void>,
): Promise<void> {
  const client = getActiveRoomClient();
  try {
    await client?.leave();
  } catch {
    // Socket disconnect in teardown still maps to LeaveRoom on the server.
  }
  await navigateHome();
  teardownSession();
}
