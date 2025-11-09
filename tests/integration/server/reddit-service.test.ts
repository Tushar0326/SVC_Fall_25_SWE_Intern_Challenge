import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { getTop, verifyRedditUser } from '../../../server/services/reddit';

describe('Reddit Service', () => {
  // Set test environment variables
  beforeEach(() => {
    process.env.REDDIT_CLIENT_ID = 'test_client_id';
    process.env.REDDIT_CLIENT_SECRET = 'test_client_secret';
    
    // Clean all nock interceptors before each test
    nock.cleanAll();
    // Disable real HTTP connections (only allow mocked ones)
    nock.disableNetConnect();
  });

  afterEach(() => {
    // Clean up nock interceptors after each test
    nock.cleanAll();
    // Re-enable real HTTP connections for cleanup
    nock.enableNetConnect();
  });

  describe('getTop', () => {
    it('should successfully fetch top posts from subreddit', async () => {
      // Mock OAuth token endpoint
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(200, {
          access_token: 'mock_access_token_12345',
          token_type: 'bearer',
          expires_in: 3600,
        });

      // Mock Reddit top posts endpoint
      nock('https://oauth.reddit.com')
        .get('/r/programming/top.json?limit=10')
        .reply(200, {
          data: {
            children: [
              {
                data: {
                  id: 'post1',
                  title: 'Test Post 1',
                  author: 'testuser1',
                  score: 100,
                  subreddit: 'programming',
                  url: 'https://example.com/post1',
                  created_utc: Date.now() / 1000,
                },
              },
              {
                data: {
                  id: 'post2',
                  title: 'Test Post 2',
                  author: 'testuser2',
                  score: 50,
                  subreddit: 'programming',
                  url: 'https://example.com/post2',
                  created_utc: Date.now() / 1000,
                },
              },
            ],
          },
        });

      const posts = await getTop('programming', 10);

      expect(posts).toHaveLength(2);
      expect(posts[0]).toMatchObject({
        id: 'post1',
        title: 'Test Post 1',
        author: 'testuser1',
        score: 100,
        subreddit: 'programming',
      });
    });

    it('should handle 429 rate limit error', async () => {
      // Mock OAuth token endpoint
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(200, {
          access_token: 'mock_access_token_12345',
          token_type: 'bearer',
          expires_in: 3600,
        });

      // Mock Reddit API returning 429 rate limit
      nock('https://oauth.reddit.com')
        .get('/r/all/top.json?limit=10')
        .reply(429, {
          message: 'Too Many Requests',
        });

      await expect(getTop('all', 10)).rejects.toThrow('Reddit API rate limit exceeded');
    });

    it('should handle 500 server error', async () => {
      // Mock OAuth token endpoint
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(200, {
          access_token: 'mock_access_token_12345',
          token_type: 'bearer',
          expires_in: 3600,
        });

      // Mock Reddit API returning 500 server error
      nock('https://oauth.reddit.com')
        .get('/r/all/top.json?limit=10')
        .reply(500, {
          error: 'Internal Server Error',
        });

      await expect(getTop('all', 10)).rejects.toThrow('Reddit API error: 500');
    });

    it('should handle OAuth token failure', async () => {
      // Mock OAuth token endpoint failure
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(401, {
          error: 'invalid_client',
        });

      await expect(getTop('all', 10)).rejects.toThrow('Failed to get Reddit OAuth token');
    });

    it('should handle network errors', async () => {
      // Mock OAuth token endpoint
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(200, {
          access_token: 'mock_access_token_12345',
          token_type: 'bearer',
          expires_in: 3600,
        });

      // Mock network error
      nock('https://oauth.reddit.com')
        .get('/r/all/top.json?limit=10')
        .replyWithError('Network error');

      await expect(getTop('all', 10)).rejects.toThrow('Failed to fetch Reddit top posts');
    });

    it('should use default subreddit "all" when not specified', async () => {
      // Mock OAuth token endpoint
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(200, {
          access_token: 'mock_access_token_12345',
          token_type: 'bearer',
          expires_in: 3600,
        });

      // Mock Reddit top posts endpoint for "all" subreddit
      nock('https://oauth.reddit.com')
        .get('/r/all/top.json?limit=10')
        .reply(200, {
          data: {
            children: [],
          },
        });

      const posts = await getTop();

      expect(Array.isArray(posts)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      // Mock OAuth token endpoint
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(200, {
          access_token: 'mock_access_token_12345',
          token_type: 'bearer',
          expires_in: 3600,
        });

      // Mock Reddit top posts endpoint with limit=5
      nock('https://oauth.reddit.com')
        .get('/r/programming/top.json?limit=5')
        .reply(200, {
          data: {
            children: Array.from({ length: 5 }, (_, i) => ({
              data: {
                id: `post${i}`,
                title: `Post ${i}`,
                author: `user${i}`,
                score: i * 10,
                subreddit: 'programming',
                url: `https://example.com/post${i}`,
                created_utc: Date.now() / 1000,
              },
            })),
          },
        });

      const posts = await getTop('programming', 5);

      expect(posts).toHaveLength(5);
    });

    it('should throw error when credentials are missing', async () => {
      delete process.env.REDDIT_CLIENT_ID;
      delete process.env.REDDIT_CLIENT_SECRET;

      await expect(getTop('all', 10)).rejects.toThrow('Reddit API credentials not configured');

      // Restore for other tests
      process.env.REDDIT_CLIENT_ID = 'test_client_id';
      process.env.REDDIT_CLIENT_SECRET = 'test_client_secret';
    });
  });

  describe('verifyRedditUser', () => {
    it('should return true for existing user', async () => {
      // Mock OAuth token endpoint
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(200, {
          access_token: 'mock_access_token_12345',
          token_type: 'bearer',
          expires_in: 3600,
        });

      // Mock user exists
      nock('https://oauth.reddit.com')
        .get('/user/testuser/about')
        .reply(200, {
          kind: 't2',
          data: {
            name: 'testuser',
            id: '2_test123',
          },
        });

      const exists = await verifyRedditUser('testuser');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      // Mock OAuth token endpoint
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(200, {
          access_token: 'mock_access_token_12345',
          token_type: 'bearer',
          expires_in: 3600,
        });

      // Mock user not found
      nock('https://oauth.reddit.com')
        .get('/user/nonexistent/about')
        .reply(404);

      const exists = await verifyRedditUser('nonexistent');

      expect(exists).toBe(false);
    });

    it('should return false on network error', async () => {
      // Mock OAuth token endpoint
      nock('https://www.reddit.com')
        .post('/api/v1/access_token')
        .reply(200, {
          access_token: 'mock_access_token_12345',
          token_type: 'bearer',
          expires_in: 3600,
        });

      // Mock network error
      nock('https://oauth.reddit.com')
        .get('/user/testuser/about')
        .replyWithError('Network error');

      const exists = await verifyRedditUser('testuser');

      expect(exists).toBe(false);
    });
  });
});

