import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Connected to MES WebSocket');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from MES WebSocket');
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinStation(stationId: string) {
    if (this.socket) {
      this.socket.emit('join-station', stationId);
    }
  }

  leaveStation(stationId: string) {
    if (this.socket) {
      this.socket.emit('leave-station', stationId);
    }
  }

  onOperationStarted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('operation.started', callback);
    }
  }

  onOperationCompleted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('operation.completed', callback);
    }
  }

  onOperationPaused(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('operation.paused', callback);
    }
  }

  onOperationResumed(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('operation.resumed', callback);
    }
  }

  onQueueUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('queue.updated', callback);
    }
  }

  onBarrelUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('barrel.updated', callback);
    }
  }
}

export const socketService = new SocketService();
