import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../server/index';

// Store app instance in global scope for reuse
declare global {
  var __APP__: ReturnType<typeof createServer> | undefined;
}

describe('GET /health', () => {
  let app: ReturnType<typeof createServer>;

  beforeAll(() => {
    // Reuse app instance if available, otherwise create new one
    if (globalThis.__APP__) {
      app = globalThis.__APP__;
    } else {
      app = createServer();
      globalThis.__APP__ = app;
    }
  });

  afterAll(() => {
    // Cleanup: app will be reused across tests, so we don't close it here
    // The server will be cleaned up in the global afterAll hook
  });

  it('should return 200 status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
  });

  it('should return healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.body).toMatchObject({
      status: 'healthy',
    });
  });

  it('should include timestamp', async () => {
    const response = await request(app).get('/health');

    expect(response.body).toHaveProperty('timestamp');
    expect(typeof response.body.timestamp).toBe('string');
    expect(new Date(response.body.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should include uptime', async () => {
    const response = await request(app).get('/health');

    expect(response.body).toHaveProperty('uptime');
    expect(typeof response.body.uptime).toBe('number');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should return JSON content type', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['content-type']).toMatch(/json/);
  });

  it('should respond quickly', async () => {
    const startTime = Date.now();
    await request(app).get('/health');
    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(100); // Should respond within 100ms
  });
});

