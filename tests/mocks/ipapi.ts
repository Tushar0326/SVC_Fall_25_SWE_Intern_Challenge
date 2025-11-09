import { http, HttpResponse } from 'msw';

export const ipapiHandlers = [
  http.get('https://ipapi.co/json/', async ({ request }) => {
    const url = new URL(request.url);
    
    // Mock timeout scenario
    if (url.searchParams.get('timeout') === 'true') {
      return new Promise(() => {}); // Never resolves
    }
    
    // Mock network error
    if (url.searchParams.get('error') === 'network') {
      return HttpResponse.error();
    }
    
    // Mock invalid response
    if (url.searchParams.get('error') === 'invalid') {
      return HttpResponse.text('invalid json', {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Mock rate limiting
    if (url.searchParams.get('error') === 'rate_limit') {
      return HttpResponse.json(
        { error: 'rate_limit_exceeded' },
        { status: 429 }
      );
    }
    
    // Mock different currency scenarios
    const currency = url.searchParams.get('currency') || 'USD';
    
    const responses: Record<string, any> = {
      USD: { currency: 'USD', country_code: 'US' },
      EUR: { currency: 'EUR', country_code: 'DE' },
      GBP: { currency: 'GBP', country_code: 'GB' },
      JPY: { currency: 'JPY', country_code: 'JP' },
      CAD: { currency: 'CAD', country_code: 'CA' },
      AUD: { currency: 'AUD', country_code: 'AU' },
    };
    
    return HttpResponse.json(responses[currency] || responses.USD);
  }),
];

