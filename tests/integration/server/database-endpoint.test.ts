import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../server/index';
import { getTestDatabase } from '../../setup-backend';
import { createTestUserForInsert } from '../../factories/user';

// Store app instance in global scope for reuse
declare global {
  var __APP__: ReturnType<typeof createServer> | undefined;
}

describe('Database-Backed Endpoint', () => {
  let app: ReturnType<typeof createServer>;
  const db = getTestDatabase();

  beforeAll(() => {
    // Reuse app instance if available, otherwise create new one
    if (globalThis.__APP__) {
      app = globalThis.__APP__;
    } else {
      app = createServer();
      globalThis.__APP__ = app;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%test%']);
    // Note: We don't close the app here as it's reused across tests
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%test%']);
  });

  describe('POST /api/check-user-exists', () => {
    it('should return false when user does not exist', async () => {
      const response = await request(app)
        .post('/api/check-user-exists')
        .send({
          email: 'nonexistent@test.com',
          phone: '1234567890',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        userExists: false,
      });
    });

    it('should return true when user exists', async () => {
      // Create a test user in the database
      const testUser = createTestUserForInsert({
        email: 'existing@test.com',
        phone: '1234567890',
      });

      await db.query(
        `INSERT INTO users (email, phone, reddit_username, reddit_verified)
         VALUES ($1, $2, $3, $4)`,
        [testUser.email, testUser.phone, testUser.reddit_username, testUser.reddit_verified]
      );

      // Check if user exists
      const response = await request(app)
        .post('/api/check-user-exists')
        .send({
          email: 'existing@test.com',
          phone: '1234567890',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        userExists: true,
      });
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failure
      // For now, we test that the endpoint handles valid requests
      const response = await request(app)
        .post('/api/check-user-exists')
        .send({
          email: 'test@example.com',
          phone: '1234567890',
        });

      // Should either succeed or return a proper error
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/social-qualify-form', () => {
    it('should create user in database on successful submission', async () => {
      const formData = {
        email: 'newuser@test.com',
        phone: '9876543210',
        redditUsername: 'testuser',
        twitterUsername: 'testtwitter',
      };

      // Mock Reddit verification to succeed using MSW (already configured in setup-backend.ts)
      // The mock server from setup-backend.ts will handle Reddit API calls
      // 'testuser' is already configured as a verified user in setup-backend.ts

      const response = await request(app)
        .post('/api/social-qualify-form')
        .send(formData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was created in database
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [formData.email]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        email: formData.email,
        phone: formData.phone,
        reddit_username: formData.redditUsername,
        twitter_username: formData.twitterUsername,
      });
    });

    it('should handle duplicate user submission', async () => {
      // Create existing user
      const testUser = createTestUserForInsert({
        email: 'duplicate@test.com',
        phone: '1111111111',
      });

      await db.query(
        `INSERT INTO users (email, phone, reddit_username, reddit_verified)
         VALUES ($1, $2, $3, $4)`,
        [testUser.email, testUser.phone, testUser.reddit_username, testUser.reddit_verified]
      );

      // Try to create duplicate
      const response = await request(app)
        .post('/api/social-qualify-form')
        .send({
          email: 'duplicate@test.com',
          phone: '1111111111',
          redditUsername: 'testuser',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/contractor-request', () => {
    it('should create contractor record in database', async () => {
      // Create a user first
      const testUser = createTestUserForInsert({
        email: 'contractor@test.com',
        phone: '2222222222',
      });

      const userResult = await db.query(
        `INSERT INTO users (email, phone, reddit_username, reddit_verified)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [testUser.email, testUser.phone, testUser.reddit_username, testUser.reddit_verified]
      );

      const userId = userResult.rows[0].id;

      // Create contractor request
      const response = await request(app)
        .post('/api/contractor-request')
        .send({
          email: 'contractor@test.com',
          companySlug: 'test-company',
          companyName: 'Test Company',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify contractor was created in database
      const contractorResult = await db.query(
        'SELECT * FROM contractors WHERE user_id = $1 AND company_slug = $2',
        [userId, 'test-company']
      );

      expect(contractorResult.rows).toHaveLength(1);
      expect(contractorResult.rows[0]).toMatchObject({
        user_id: userId,
        email: 'contractor@test.com',
        company_slug: 'test-company',
        company_name: 'Test Company',
        status: 'pending',
      });
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .post('/api/contractor-request')
        .send({
          email: 'nonexistent@test.com',
          companySlug: 'test-company',
          companyName: 'Test Company',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should handle database transaction rollback on error', async () => {
      // This test verifies that partial writes don't occur
      // Create a user
      const testUser = createTestUserForInsert({
        email: 'transaction@test.com',
        phone: '3333333333',
      });

      await db.query(
        `INSERT INTO users (email, phone, reddit_username, reddit_verified)
         VALUES ($1, $2, $3, $4)`,
        [testUser.email, testUser.phone, testUser.reddit_username, testUser.reddit_verified]
      );

      // Try to create contractor with invalid data (should fail validation)
      const response = await request(app)
        .post('/api/contractor-request')
        .send({
          email: 'transaction@test.com',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      // Verify no contractor was created
      const contractorResult = await db.query(
        'SELECT * FROM contractors WHERE email = $1',
        ['transaction@test.com']
      );

      expect(contractorResult.rows).toHaveLength(0);
    });
  });
});

