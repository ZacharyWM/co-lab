import { serve } from "bun";
import { WebSocketServer } from 'ws';

const port = process.env.PORT || 3001;

const server = serve({
  port,
  fetch(request, server) {
    if (server.upgrade(request)) {
      return; // do not return a Response
    }
    return new Response("Hello World");
  },
  websocket: {
    message(ws, message) {
      console.log('Received message:', message);
      ws.send(`Echo: ${message}`);
    },
    open(ws) {
      console.log('WebSocket connection opened');
    },
    close(ws, code, message) {
      console.log('WebSocket connection closed');
    },
  },
});

console.log(`WebSocket server listening on port ${port}`);