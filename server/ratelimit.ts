import * as http from 'node:http';

// Simple in-memory rate limiter (per IP, sliding minute window).
const WINDOW_MS = 60_000;
const MAX_TRACKED_IPS = 10_000;

const attempts = new Map<string, number[]>();

export function rateLimited(req: http.IncomingMessage, maxPerMinute = 20): boolean {
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown')
    .split(',')[0]
    .trim();
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const list = (attempts.get(ip) ?? []).filter((t) => t > windowStart);
  const updated = [...list, now];
  attempts.set(ip, updated);
  if (attempts.size > MAX_TRACKED_IPS) attempts.clear(); // memory backstop
  return updated.length > maxPerMinute;
}
