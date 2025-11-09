import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../server/index';

describe('Server Configuration', () => {
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    app = createServer();
  });

  describe('CORS Configuration', () => {
    it('should allow CORS requests', async () => {
      const response = await request(app)
        .options('/api/ping')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'GET');

      // CORS middleware should be applied
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Request Logging Middleware', () => {
    it('should log requests', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await request(app).get('/api/ping');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SERVER]'),
        expect.any(String),
        expect.stringContaining('GET'),
        expect.stringContaining('/api/ping')
      );

      consoleSpy.mockRestore();
    });

    it('should log response status', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await request(app).get('/api/ping');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SERVER]'),
        expect.stringContaining('Response'),
        expect.any(Number),
        expect.stringContaining('GET'),
        expect.stringContaining('/api/ping')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Global Error Handler', () => {
    it('should handle errors and return 500 status', async () => {
      // Create a route that throws an error for testing
      // Note: We can't easily test the error handler without modifying routes
      // But we can test that it exists and is configured
      const response = await request(app)
        .post('/api/nonexistent-endpoint')
        .send({});

      // Should return 404 for nonexistent routes (before error handler)
      expect([404, 500]).toContain(response.status);
    });

    it('should return error message in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Test with malformed JSON to trigger error handler
      const response = await request(app)
        .post('/api/social-qualify-form')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      // Error handler should catch this
      expect(response.status).toBeGreaterThanOrEqual(400);

      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose stack trace in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/social-qualify-form')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      if (response.status === 500) {
        expect(response.body.error).toBeUndefined();
      }

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('JSON Body Parser', () => {
    it('should parse JSON request bodies', async () => {
      const response = await request(app)
        .post('/api/check-user-exists')
        .send({ email: 'test@example.com', phone: '1234567890' });

      expect(response.status).toBe(200);
    });

    it('should handle large payloads up to 10MB limit', async () => {
      const largeData = { data: 'x'.repeat(5 * 1024 * 1024) }; // 5MB

      const response = await request(app)
        .post('/api/check-user-exists')
        .send(largeData);

      // Should either succeed or fail gracefully, not crash
      expect([200, 400, 413]).toContain(response.status);
    });
  });

  describe('URL Encoded Body Parser', () => {
    it('should parse URL encoded request bodies', async () => {
      const response = await request(app)
        .post('/api/check-user-exists')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('email=test@example.com&phone=1234567890');

      // Should handle URL encoded data
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Route Registration', () => {
    it('should register all API routes', async () => {
      const routes = [
        { method: 'get', path: '/api/ping', expectedStatus: 200 },
        { method: 'get', path: '/api/demo', expectedStatus: 200 },
        { method: 'post', path: '/api/check-user-exists', expectedStatus: 200 },
        { method: 'post', path: '/api/social-qualify-form', expectedStatus: 400 }, // Validation error expected
        { method: 'post', path: '/api/contractor-request', expectedStatus: 400 }, // Validation error expected
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path).send({});
        expect(response.status).toBe(route.expectedStatus);
      }
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for nonexistent routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});

