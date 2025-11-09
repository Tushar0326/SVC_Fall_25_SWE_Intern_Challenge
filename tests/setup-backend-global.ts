import { beforeAll, afterAll } from 'vitest';
import { createServer } from '../server/index';

/**
 * Global test setup for backend tests
 * Manages app instance lifecycle using globalThis.__APP__
 */

declare global {
  var __APP__: ReturnType<typeof createServer> | undefined;
}

beforeAll(() => {
  // Create app instance once and store in global scope
  if (!globalThis.__APP__) {
    globalThis.__APP__ = createServer();
    console.log('✅ Global app instance created');
  }
});

afterAll(async () => {
  // Cleanup: Close app instance if needed
  // Note: Express apps don't need explicit closing in test environment
  // but we can clean up any resources here if needed
  if (globalThis.__APP__) {
    // App cleanup if needed
    globalThis.__APP__ = undefined;
    console.log('🧹 Global app instance cleaned up');
  }
});

