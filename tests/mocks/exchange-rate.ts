import { http, HttpResponse } from 'msw';

export const exchangeRateHandlers = [
  http.get('https://api.exchangerate-api.com/v4/latest/USD', async ({ request }) => {
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
    
    // Mock missing currency
    if (url.searchParams.get('error') === 'missing_currency') {
      return HttpResponse.json({
        base: 'USD',
        date: '2024-01-01',
        rates: {
          EUR: 0.85,
          GBP: 0.73,
          // Missing requested currency
        },
      });
    }
    
    // Mock successful response with various rates
    return HttpResponse.json({
      base: 'USD',
      date: '2024-01-01',
      rates: {
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
        INR: 75.0,
      },
    });
  }),
];

