import { NextResponse } from 'next/server';

// WebSocket connections store
const clients = new Map();

function handleWebSocket(socket: WebSocket) {
  socket.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        // Store the connection with userId
        clients.set(data.userId, socket);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  socket.addEventListener('close', () => {
    // Remove the connection when closed
    for (const [userId, sock] of clients.entries()) {
      if (sock === socket) {
        clients.delete(userId);
        break;
      }
    }
  });
}

// Export WebSocket handler
export function GET(request: Request) {
  try {
    // Check if it's a WebSocket request
    if (request.headers.get('upgrade') !== 'websocket') {
      return new NextResponse('Expected WebSocket request', { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(request);
    handleWebSocket(socket);
    return response;
  } catch (err) {
    console.error('WebSocket upgrade error:', err);
    return new NextResponse('WebSocket upgrade error', { status: 500 });
  }
}

// Helper function to send updates to a specific client
export function sendUpdate(userId: string, data: any) {
  const socket = clients.get(userId);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
} 