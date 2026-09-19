import { io, type Socket } from 'socket.io-client';

export function createSocket(url?: string): Socket {
  return io(url ?? '/', {
    path: '/socket.io',
    reconnection: false,
    autoConnect: false,
  });
}
