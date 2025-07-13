import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-station')
  handleJoinStation(client: Socket, stationId: string) {
    client.join(`station-${stationId}`);
    console.log(`Client ${client.id} joined station ${stationId}`);
  }

  @SubscribeMessage('leave-station')
  handleLeaveStation(client: Socket, stationId: string) {
    client.leave(`station-${stationId}`);
    console.log(`Client ${client.id} left station ${stationId}`);
  }

  // Emit operation events
  emitOperationStarted(stationId: string, barrelId: string, data: any) {
    this.server.to(`station-${stationId}`).emit('operation.started', {
      barrelId,
      stationId,
      ...data,
    });
    
    this.server.emit('barrel.updated', {
      barrelId,
      event: 'operation.started',
      data,
    });
  }

  emitOperationCompleted(stationId: string, barrelId: string, data: any) {
    this.server.to(`station-${stationId}`).emit('operation.completed', {
      barrelId,
      stationId,
      ...data,
    });
    
    this.server.emit('barrel.updated', {
      barrelId,
      event: 'operation.completed',
      data,
    });
  }

  emitOperationPaused(stationId: string, barrelId: string, data: any) {
    this.server.to(`station-${stationId}`).emit('operation.paused', {
      barrelId,
      stationId,
      ...data,
    });
  }

  emitOperationResumed(stationId: string, barrelId: string, data: any) {
    this.server.to(`station-${stationId}`).emit('operation.resumed', {
      barrelId,
      stationId,
      ...data,
    });
  }

  emitQueueUpdated(stationId: string, queue: any[]) {
    this.server.to(`station-${stationId}`).emit('queue.updated', queue);
  }
}
