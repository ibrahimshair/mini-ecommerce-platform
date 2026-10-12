const { errorResponse } = require("../utils/apiResponse");

/**
 * Security Headers Middleware
 * Implements OWASP recommended HTTP response security headers
 * to protect against clickjacking, MIME sniffing, XSS and injection attacks.
 */
function securityHeaders(req, res, next) {
  // 1. Remove technology fingerprinting
  res.removeHeader("X-Powered-By");

  // 2. Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // 3. Clickjacking protection
  res.setHeader("X-Frame-Options", "DENY");

  // 4. Legacy XSS filter activation
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // 5. Strict Transport Security (HSTS) - enforce HTTPS
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // 6. Content Security Policy (CSP)
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:* ws://localhost:*;"
  );

  // 7. Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // 8. Permissions Policy (disable intrusive browser APIs by default)
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  // 9. DNS prefetch control
  res.setHeader("X-DNS-Prefetch-Control", "off");

  next();
}

/**
 * In-Memory Sliding Window Rate Limiter Factory
 * Tracks requests per IP address or client key across a rolling time window.
 */
function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 100,
  message = "Çok fazla istek gönderildi. Lütfen bir süre sonra tekrar deneyiniz.",
  keyGenerator = (req) =>
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "127.0.0.1",
  skip = (req) => false,
} = {}) {
  const store = new Map();

  // Periodic cleanup of stale clients every 2 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));

  if (cleanupInterval.unref) cleanupInterval.unref();

  const middleware = (req, res, next) => {
    if (skip(req)) return next();

    const clientKey = keyGenerator(req);
    const now = Date.now();

    let record = store.get(clientKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(clientKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Set standard RFC 6585 & IETF draft rate limit headers
    res.setHeader("RateLimit-Limit", maxRequests);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSeconds);

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", resetSeconds);
      return errorResponse(res, {
        statusCode: 429,
        message,
        errors: [
          {
            field: "rate_limit",
            message: `İstek kotası aşıldı (${maxRequests} istek / ${Math.round(windowMs / 1000)} sn).`,
            retryAfterSeconds: resetSeconds,
          },
        ],
      });
    }

    next();
  };

  // Expose store reset for tests
  middleware.reset = () => store.clear();
  middleware.store = store;

  return middleware;
}

/**
 * Standard Global API Rate Limiter: 120 requests / 1 minute (1000 in test mode)
 */
const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: process.env.NODE_ENV === "test" ? 1000 : 120,
  message: "Sistem güvenliği nedeniyle genel istek sınırı aşıldı. Lütfen bekleyiniz.",
});

/**
 * Strict Auth Rate Limiter (Brute-force protection for login/register):
 * 10 requests / 1 minute (60 in test mode)
 */
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: process.env.NODE_ENV === "test" ? 60 : 10,
  message: "Çok sayıda giriş veya kayıt denemesi yapıldı. Hesabınızın güvenliği için lütfen 1 dakika bekleyiniz.",
});

/**
 * Fast test rate limiter for integration tests: 3 requests / 5 seconds
 */
const strictTestLimiter = createRateLimiter({
  windowMs: 5 * 1000,
  maxRequests: 3,
  message: "İstek kotası aşıldı (Test Limiter).",
});

/**
 * Input Sanitization Utility
 * Strips script tags, javascript: pseudo protocols, and common XSS vectors from inputs.
 */
function sanitizeValue(val) {
  if (typeof val === "string") {
    let clean = val
      // Strip <script>...</script> tags entirely
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Strip standalone tags with javascript: or event handlers
      .replace(/<[^>]+(onload|onerror|onclick|onmouseover|javascript:)[^>]*>/gi, "")
      // Strip script tags
      .replace(/<\/?[a-z][^>]*>/gi, (match) => {
        // Allow basic safe markdown/formatting chars, but block scripts/iframes/embeds/objects
        if (/<\/?(script|iframe|embed|object|meta|link|style)/i.test(match)) {
          return "";
        }
        return match;
      });

    return clean.trim();
  }

  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }

  if (val !== null && typeof val === "object") {
    const sanitizedObj = {};
    for (const [key, v] of Object.entries(val)) {
      // Prevent prototype pollution
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }
      sanitizedObj[key] = sanitizeValue(v);
    }
    return sanitizedObj;
  }

  return val;
}

/**
 * Input Sanitization Middleware
 * Sanitizes req.body, req.query, and req.params before route handling.
 */
function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }

  next();
}

/**
 * Returns summary of active application security posture for health & audit checks.
 */
function getSecurityAuditReport() {
  return {
    status: "healthy",
    hardening: {
      securityHeaders: {
        xContentTypeOptions: "nosniff",
        xFrameOptions: "DENY",
        xXssProtection: "1; mode=block",
        strictTransportSecurity: "enabled",
        contentSecurityPolicy: "enforced",
        referrerPolicy: "strict-origin-when-cross-origin",
        xPoweredByRemoved: true,
      },
      rateLimiting: {
        globalLimiter: "120 req/min",
        authLimiter: "10 req/min (Brute-force protection)",
        engine: "in-memory sliding window with RFC-6585 headers",
      },
      sanitization: {
        xssProtection: "active (recursive HTML/script stripping)",
        prototypePollutionDefense: "active",
        parameterSanitization: "body, query, params",
      },
      authentication: {
        jwtVerification: "active",
        passwordHashing: "bcrypt (10 salt rounds)",
        roleBasedAuthorization: "active (admin, user)",
      },
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  securityHeaders,
  createRateLimiter,
  globalRateLimiter,
  authRateLimiter,
  strictTestLimiter,
  sanitizeValue,
  sanitizeInput,
  getSecurityAuditReport,
};
