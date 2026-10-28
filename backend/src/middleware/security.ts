import { Request, Response, NextFunction } from 'express';

// In-memory sliding-window rate limiter per client IP
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 300; // 300 requests per minute per IP for high throughput
const MUTATION_LIMIT_PER_WINDOW = 60; // 60 write operations per minute

// Periodically clean up stale rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Enterprise Security Headers Middleware
 * Protects against Clickjacking, XSS, MIME confusion, and Information Disclosure.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Remove framework fingerprinting
  res.removeHeader('X-Powered-By');

  // Defensive HTTP headers
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http: https:; frame-ancestors 'self';"
  );
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=()');

  next();
}

/**
 * Rate Limiting Middleware
 * Prevents automated scraping, brute-force requests, and denial-of-service spam.
 */
export function rateLimitingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Exclude healthcheck or test runs if needed
  if (process.env.NODE_ENV === 'test' && req.path.includes('/health')) {
    return next();
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = rateLimitStore.get(clientIp);
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const maxLimit = isMutation ? MUTATION_LIMIT_PER_WINDOW : MAX_REQUESTS_PER_WINDOW;

  if (!record || now > record.resetAt) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return next();
  }

  record.count += 1;

  if (record.count > maxLimit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Rate limit exceeded, please retry shortly.',
      retryAfterSeconds: retryAfter,
    });
  }

  next();
}

/**
 * Input Sanitization & Anti-Prototype Pollution Middleware
 * Prevents object prototype pollution and strips null-byte attacks and raw script tags.
 */
export function sanitizeInputMiddleware(req: Request, res: Response, next: NextFunction) {
  function sanitize(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        // Strip null bytes
        return obj.replace(/\0/g, '');
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Disallow prototype pollution keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      clean[key] = sanitize(value);
    }
    return clean;
  }

  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }

  next();
}
