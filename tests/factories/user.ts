import type { User } from '@shared/schemas';

/**
 * Factory function to create test user data
 */
export function createTestUser(overrides?: Partial<User>): User {
  const timestamp = Date.now();
  return {
    id: Math.floor(Math.random() * 1000000),
    email: `test-${timestamp}@example.com`,
    phone: '1234567890',
    reddit_username: `testuser${timestamp}`,
    twitter_username: undefined,
    youtube_username: undefined,
    facebook_username: undefined,
    reddit_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Factory function to create test user for database insertion
 * (excludes auto-generated fields)
 */
export function createTestUserForInsert(overrides?: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>) {
  return {
    email: `test-${Date.now()}@example.com`,
    phone: '1234567890',
    reddit_username: 'testuser',
    twitter_username: null,
    youtube_username: null,
    facebook_username: null,
    reddit_verified: true,
    ...overrides,
  };
}

/**
 * Factory function to create multiple test users
 */
export function createTestUsers(count: number, overrides?: Partial<User>): User[] {
  return Array.from({ length: count }, (_, i) =>
    createTestUser({
      ...overrides,
      email: `test-${i}-${Date.now()}@example.com`,
    })
  );
}

