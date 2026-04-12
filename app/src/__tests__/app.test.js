const http = require('http');

// Simple HTTP helper — no supertest dependency needed
function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

let server;

beforeAll((done) => {
  // Start the app on port 3000
  process.env.PORT = '3000';
  // Require after setting env
  server = require('../index');
  // Give express a moment to bind
  setTimeout(done, 500);
});

afterAll((done) => {
  if (server && server.close) {
    server.close(done);
  } else {
    done();
  }
});

describe('Health & readiness endpoints', () => {
  test('GET /healthz returns 200 with status ok', async () => {
    const res = await get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  test('GET /ready returns 200 with ready true', async () => {
    const res = await get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('Status endpoint', () => {
  test('GET /status returns memory and uptime info', async () => {
    const res = await get('/status');
    expect(res.status).toBe(200);
    expect(res.body.memory).toBeDefined();
    expect(res.body.memory.rss_mb).toBeGreaterThan(0);
    expect(typeof res.body.uptime_seconds).toBe('number');
    expect(res.body.pid).toBeDefined();
  });
});

describe('Metrics endpoint', () => {
  test('GET /metrics returns Prometheus format', async () => {
    const res = await get('/metrics');
    expect(res.status).toBe(200);
    // Prometheus text format always contains these
    expect(typeof res.body).toBe('string');
    expect(res.body).toContain('# HELP');
    expect(res.body).toContain('# TYPE');
  });
});

describe('API info endpoint', () => {
  test('GET /api/info returns service info', async () => {
    const res = await get('/api/info');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('Smart Auto-Scaling Incident Response System');
    expect(res.body.uptime_seconds).toBeGreaterThanOrEqual(0);
  });
});

describe('404 handling', () => {
  test('GET /nonexistent returns 404', async () => {
    const res = await get('/nonexistent-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
