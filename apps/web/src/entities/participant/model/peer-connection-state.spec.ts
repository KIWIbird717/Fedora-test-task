import {
  isFailedPeerMedia,
  resolvePeerConnectionState,
} from './peer-connection-state';

describe('peer connection state', () => {
  it('treats a missing or closed state as connecting, not failed', () => {
    expect(resolvePeerConnectionState(undefined)).toBe('connecting');
    expect(resolvePeerConnectionState('closed')).toBe('connecting');
    expect(resolvePeerConnectionState('connecting')).toBe('connecting');
    expect(isFailedPeerMedia(undefined)).toBe(false);
    expect(isFailedPeerMedia('connecting')).toBe(false);
  });

  it('keeps connected and failed distinct from connecting', () => {
    expect(resolvePeerConnectionState('connected')).toBe('connected');
    expect(resolvePeerConnectionState('failed')).toBe('failed');
    expect(isFailedPeerMedia('failed')).toBe(true);
    expect(isFailedPeerMedia('connected')).toBe(false);
  });
});
