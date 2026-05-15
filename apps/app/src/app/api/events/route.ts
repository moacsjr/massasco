/**
 * SSE Endpoint — /api/events
 *
 * Clients connect via EventSource('/api/events').
 * The stream stays open and broadcasts all published SSEBus events.
 *
 * Format: SSE text/event-stream
 *   event: <type>\n
 *   data: <json-payload>\n\n
 */

import { NextRequest } from 'next/server';
import { sseBus, SSEEvent } from '../../../lib/sse-bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      console.log('[SSE] Client connected. Listeners before:', sseBus.listenerCount());

      const listener = (event: SSEEvent) => {
        const data = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(new TextEncoder().encode(data));
        } catch {
          // client disconnected
        }
      };

      sseBus.subscribe(listener);

      console.log('[SSE] Listeners after subscribe:', sseBus.listenerCount());

      // Send a heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          sseBus.unsubscribe(listener);
        }
      }, 30000);

      // Cleanup on client disconnect — we can't detect it directly,
      // but the stream will error when the connection closes.
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        sseBus.unsubscribe(listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
