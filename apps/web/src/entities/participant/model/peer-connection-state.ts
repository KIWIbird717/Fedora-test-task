export type PeerConnectionState =
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'closed';

export function resolvePeerConnectionState(
  state: PeerConnectionState | undefined,
): Exclude<PeerConnectionState, 'closed'> {
  if (state === 'connected' || state === 'failed') {
    return state;
  }
  return 'connecting';
}

export function isFailedPeerMedia(
  state: PeerConnectionState | undefined,
): boolean {
  return state === 'failed';
}
