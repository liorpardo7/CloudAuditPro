const ipRequests = new Map<string, { count: number; firstRequest: number }>();

export function rateLimit(request: Request, { limit = 5, windowMs = 60_000 } = {}): Response | null {
  // Get IP address from headers or fallback
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const now = Date.now();
  let entry = ipRequests.get(ip);
  if (!entry || now - entry.firstRequest > windowMs) {
    entry = { count: 1, firstRequest: now };
    ipRequests.set(ip, entry);
  } else {
    entry.count++;
    if (entry.count > limit) {
      return new Response(JSON.stringify({ error: 'Too many requests, please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return null;
} 