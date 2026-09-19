import { isWebRtcSupported } from './webrtc-support';

describe('isWebRtcSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is true when RTCPeerConnection exists', () => {
    vi.stubGlobal('RTCPeerConnection', class FakeRtcPeerConnection {});
    expect(isWebRtcSupported()).toBe(true);
  });

  it('is false when RTCPeerConnection is missing', () => {
    vi.stubGlobal('RTCPeerConnection', undefined);
    expect(isWebRtcSupported()).toBe(false);
  });
});
