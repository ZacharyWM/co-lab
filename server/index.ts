import { WebSocketHandler } from './websocket';

const handler = new WebSocketHandler();

const server = Bun.serve({
  port: 3001,
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      return undefined;
    }

    return new Response("WebSocket upgrade failed", { status: 400 });
  },
  websocket: {
    message(ws, message) {
      handler.handleMessage(ws, message.toString());
    },
    open(ws) {
      handler.handleConnection(ws);
    },
    close(ws) {
      handler.handleDisconnection(ws);
    },
  },
});

console.log(`WebSocket server listening on port ${server.port}`);