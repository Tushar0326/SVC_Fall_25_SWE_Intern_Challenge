import { http, HttpResponse } from 'msw';

// Mock Supabase Auth API endpoints
export const supabaseHandlers = [
  // Magic Link Sign In
  http.post('https://*.supabase.co/auth/v1/otp', async ({ request }) => {
    const body = await request.json() as { email: string };
    
    // Mock invalid email
    if (!body.email || !body.email.includes('@')) {
      return HttpResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    // Mock network error
    if (body.email.includes('network-error')) {
      return HttpResponse.error();
    }
    
    // Mock successful magic link send
    return HttpResponse.json({
      message: 'Magic link sent successfully',
    });
  }),
  
  // Get Session
  http.get('https://*.supabase.co/auth/v1/user', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    // Mock unauthenticated
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Mock expired token
    if (authHeader.includes('expired')) {
      return HttpResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }
    
    // Mock valid session
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
    });
  }),
  
  // Sign Out
  http.post('https://*.supabase.co/auth/v1/logout', async () => {
    return HttpResponse.json({ message: 'Signed out successfully' });
  }),
];

