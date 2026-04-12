const express = require('express');
const client = require('prom-client');
const winston = require('winston');
const path = require('path');

// ─── Logger ───────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// ─── Prometheus Metrics ────────────────────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);

// ─── App ───────────────────────────────────────────────────────────────────────
const app = express();

// Serve the UI from public/
app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware: request tracking
app.use((req, res, next) => {
  const start = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    };
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
    activeConnections.dec();

    logger.info('request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Math.round(duration * 1000),
    });
  });

  next();
});

// ─── Routes ────────────────────────────────────────────────────────────────────

// Health check - used by K8s liveness probe
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness check - used by K8s readiness probe
app.get('/ready', (req, res) => {
  res.status(200).json({ ready: true, uptime: process.uptime() });
});

// Home route — serves the UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API info endpoint (JSON)
app.get('/api/info', (req, res) => {
  res.json({
    service: 'Smart Auto-Scaling Incident Response System',
    version: process.env.APP_VERSION || '1.0.0',
    pod: process.env.HOSTNAME || 'local',
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// CPU load simulation - triggers HPA scaling
app.get('/load', (req, res) => {
  const durationMs = parseInt(req.query.duration) || 5000;
  const intensity = Math.min(parseInt(req.query.intensity) || 100, 100);

  logger.warn('CPU load simulation started', { durationMs, intensity });

  const end = Date.now() + durationMs;
  let result = 0;

  // Busy-wait loop to generate real CPU load
  while (Date.now() < end) {
    for (let i = 0; i < intensity * 1000; i++) {
      result += Math.sqrt(i) * Math.random();
    }
  }

  logger.warn('CPU load simulation completed', { result: result.toFixed(2) });

  res.json({
    message: 'Load simulation complete',
    duration_ms: durationMs,
    intensity_percent: intensity,
    pod: process.env.HOSTNAME || 'local',
  });
});

// App info/status
app.get('/status', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    pid: process.pid,
    pod: process.env.HOSTNAME || 'local',
    node_version: process.version,
    uptime_seconds: Math.round(process.uptime()),
    memory: {
      rss_mb: Math.round(memUsage.rss / 1024 / 1024),
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
    env: process.env.NODE_ENV || 'development',
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error('metrics scrape failed', { error: err.message });
    res.status(500).end(err);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  logger.info(`Server started`, { port: PORT, host: HOST, env: process.env.NODE_ENV });
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
