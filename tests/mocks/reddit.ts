import { http, HttpResponse } from 'msw';

export const redditHandlers = [
  // OAuth Token Endpoint
  http.post('https://www.reddit.com/api/v1/access_token', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    // Mock OAuth failure
    if (!authHeader || !authHeader.includes('Basic')) {
      return HttpResponse.json(
        { error: 'invalid_client' },
        { status: 401 }
      );
    }
    
    // Mock network error scenario
    if (authHeader.includes('network-error')) {
      return HttpResponse.error();
    }
    
    // Mock successful token
    return HttpResponse.json({
      access_token: 'mock_access_token_12345',
      token_type: 'bearer',
      expires_in: 3600,
      scope: '*',
    });
  }),
  
  // User Verification Endpoint
  http.get('https://oauth.reddit.com/user/:username/about', async ({ params, request }) => {
    const username = params.username as string;
    const authHeader = request.headers.get('Authorization');
    
    // Mock missing/invalid token
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }
    
    // Mock verified users
    const verifiedUsers = ['testuser', 'validuser', 'reddituser', 'testcontractor'];
    if (verifiedUsers.includes(username.toLowerCase())) {
      return HttpResponse.json({
        id: `t2_${username}`,
        name: username,
        created_utc: Date.now() / 1000,
        comment_karma: 100,
        link_karma: 50,
      });
    }
    
    // Mock rate limiting
    if (username === 'ratelimited') {
      return HttpResponse.json(
        { error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    
    // Mock timeout scenario
    if (username === 'timeout') {
      return new Promise(() => {}); // Never resolves
    }
    
    // Mock malformed response
    if (username === 'malformed') {
      return HttpResponse.text('invalid json response', {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Mock user not found
    return HttpResponse.json(
      { error: 'not_found' },
      { status: 404 }
    );
  }),
];

