export function isWebRtcSupported(): boolean {
  return typeof RTCPeerConnection === 'function';
}
