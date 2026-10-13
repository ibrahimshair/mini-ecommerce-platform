const zlib = require("zlib");
const crypto = require("crypto");

/**
 * Performance Metrics In-Memory Store
 */
const metrics = {
  startedAt: Date.now(),
  totalRequests: 0,
  cached304Responses: 0,
  compressedResponses: 0,
  totalBytesSaved: 0,
  routeResponseTimes: {},
};

/**
 * Computes a fast, reliable ETag hash for a response payload.
 */
function generateETag(body) {
  const content = typeof body === "string" ? body : JSON.stringify(body);
  return `W/"${crypto.createHash("md5").update(content).digest("hex").slice(0, 16)}"`;
}

/**
 * HTTP Cache-Control & ETag Middleware
 * Adds conditional 304 support and Cache-Control headers based on route type.
 */
function httpCacheMiddleware(req, res, next) {
  // Only GET/HEAD requests are cacheable
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return next();
  }

  const path = req.path || req.originalUrl || "";
  const isPublicCatalog =
    path.startsWith("/api/products") ||
    path.startsWith("/api/categories") ||
    path.startsWith("/api/health");

  if (isPublicCatalog) {
    // 60 seconds browser cache, 5 minutes stale-while-revalidate
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  } else {
    // Private user data (cart, profile, orders, admin) must not be shared-cached
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  }

  // Intercept res.json to compute ETag and check If-None-Match
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    metrics.totalRequests++;

    if (body !== null && body !== undefined) {
      const etag = generateETag(body);
      res.setHeader("ETag", etag);

      const clientETag = req.headers["if-none-match"];
      if (clientETag && clientETag === etag) {
        metrics.cached304Responses++;
        res.status(304);
        return res.end();
      }
    }

    return originalJson(body);
  };

  next();
}

/**
 * Native Node.js Response Compression Middleware
 * Gzips responses exceeding 1KB if the client supports gzip encoding.
 */
function compressionMiddleware(req, res, next) {
  const acceptEncoding = req.headers["accept-encoding"] || "";

  if (!acceptEncoding.includes("gzip")) {
    return next();
  }

  const originalSend = res.send.bind(res);

  res.send = function (body) {
    // Only compress text / json buffers or strings > 1024 bytes
    const isCompressible =
      typeof body === "string" || Buffer.isBuffer(body);

    if (!isCompressible || Buffer.byteLength(body) < 1024) {
      return originalSend(body);
    }

    try {
      const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
      const originalLength = buffer.length;
      const gzipped = zlib.gzipSync(buffer);

      metrics.compressedResponses++;
      metrics.totalBytesSaved += Math.max(0, originalLength - gzipped.length);

      res.setHeader("Content-Encoding", "gzip");
      res.removeHeader("Content-Length");
      return originalSend(gzipped);
    } catch (err) {
      return originalSend(body);
    }
  };

  next();
}

/**
 * Generates an aggregated system performance and optimization audit report.
 */
function getPerformanceReport() {
  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  return {
    service: "Mini E-Commerce Performance & Sync Engine",
    status: "OPTIMIZED",
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    optimizations: {
      etagEnabled: true,
      http304Support: true,
      cacheControl: "public, max-age=60, stale-while-revalidate=300 (Catalog)",
      gzipCompression: true,
      routeCodeSplitting: true,
      clientQueryCache: true,
      debouncedSearch: true,
      tabSyncOnFocus: true,
    },
    metrics: {
      totalRequestsTracked: metrics.totalRequests,
      cached304Saves: metrics.cached304Responses,
      compressedResponsesCount: metrics.compressedResponses,
      estimatedKBSaved: Math.round(metrics.totalBytesSaved / 1024),
    },
    systemHealth: {
      rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memory.external / 1024 / 1024)} MB`,
    },
  };
}

module.exports = {
  httpCacheMiddleware,
  compressionMiddleware,
  generateETag,
  getPerformanceReport,
  metrics,
};
