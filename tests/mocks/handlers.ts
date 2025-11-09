import { http, HttpResponse } from 'msw';
import { redditHandlers } from './reddit';
import { ipapiHandlers } from './ipapi';
import { exchangeRateHandlers } from './exchange-rate';
import { supabaseHandlers } from './supabase';

// Combine all API handlers
export const handlers = [
  ...redditHandlers,
  ...ipapiHandlers,
  ...exchangeRateHandlers,
  ...supabaseHandlers,
  
  // Internal API handlers (for frontend tests)
  http.post('/api/check-user-exists', async ({ request }) => {
    const body = await request.json() as { email: string; phone: string };
    
    // Mock logic: return false for test emails, true for existing@test.com
    if (body.email === 'existing@test.com' && body.phone === '1234567890') {
      return HttpResponse.json({ success: true, userExists: true });
    }
    
    return HttpResponse.json({ success: true, userExists: false });
  }),
  
  http.post('/api/social-qualify-form', async ({ request }) => {
    const body = await request.json() as any;
    
    // Mock successful submission
    if (body.redditUsername === 'testuser' || body.redditUsername === 'validuser') {
      return HttpResponse.json({
        success: true,
        message: 'Application processed successfully',
        data: {
          matchedCompany: {
            name: 'Silicon Valley Consulting',
            slug: 'silicon-valley-consulting',
            payRate: '$2.00 per hour',
            bonus: '$500',
          },
        },
      });
    }
    
    // Mock validation error
    if (!body.email || !body.phone) {
      return HttpResponse.json(
        { success: false, message: 'Email and phone are required' },
        { status: 400 }
      );
    }
    
    // Mock Reddit user not found
    return HttpResponse.json(
      { success: false, message: `Reddit user '${body.redditUsername}' does not exist.` },
      { status: 400 }
    );
  }),
  
  http.post('/api/contractor-request', async ({ request }) => {
    const body = await request.json() as any;
    
    // Mock user not found
    if (body.email === 'nonexistent@test.com') {
      return HttpResponse.json(
        { success: false, message: 'User not found. Please complete the qualification form first.' },
        { status: 404 }
      );
    }
    
    // Mock duplicate request
    if (body.email === 'duplicate@test.com') {
      return HttpResponse.json(
        { success: false, message: 'You have already requested to join this company.' },
        { status: 400 }
      );
    }
    
    // Mock successful request
    return HttpResponse.json({
      success: true,
      message: "We've just pinged them. You'll be sent an email and text invite within 72 hours.",
    });
  }),
  
  http.get('/api/ping', () => {
    return HttpResponse.json({ message: 'test ping' });
  }),
  
  http.get('/api/demo', () => {
    return HttpResponse.json({ message: 'Hello from Express server' });
  }),
  
  // Posts API endpoint
  http.get('/api/posts', () => {
    return HttpResponse.json({
      success: true,
      posts: [
        {
          id: 1,
          title: 'Default Post',
          content: 'Default content',
          author: 'Default Author',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    });
  }),
];

