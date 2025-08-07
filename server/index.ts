import { WebSocketHandler } from './websocket';

const handler = new WebSocketHandler();

const server = Bun.serve({
  port: 3001,
  fetch(req, server) {
    const url = new URL(req.url);
    
    if (url.pathname === '/health') {
      return new Response('OK', { 
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

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
      console.log('New WebSocket connection established');
      handler.handleConnection(ws);
    },
    close(ws) {
      console.log('WebSocket connection closed');
      handler.handleDisconnection(ws);
    },
    error(ws, error) {
      console.error('WebSocket error:', error);
    },
  },
});

console.log(`WebSocket server listening on port ${server.port}`);
console.log(`Health check available at http://localhost:${server.port}/health`);