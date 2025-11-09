import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCurrency } from '@/hooks/useCurrency';
import { server } from '../../../setup-frontend';
import { http, HttpResponse } from 'msw';

describe('useCurrency', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should default to USD', () => {
    const { result } = renderHook(() => useCurrency());
    
    expect(result.current.currency.code).toBe('USD');
    expect(result.current.currency.symbol).toBe('$');
    expect(result.current.currency.rate).toBe(1);
    expect(result.current.currencyLoading).toBe(true);
  });

  it('should detect EUR currency and fetch exchange rate', async () => {
    // Mock IP API to return EUR
    server.use(
      http.get('https://ipapi.co/json/', () => {
        return HttpResponse.json({
          currency: 'EUR',
          country_code: 'DE',
        });
      }),
      http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
        return HttpResponse.json({
          base: 'USD',
          rates: { EUR: 0.85 },
        });
      })
    );

    const { result } = renderHook(() => useCurrency());

    await waitFor(() => {
      expect(result.current.currencyLoading).toBe(false);
    });

    expect(result.current.currency.code).toBe('EUR');
    expect(result.current.currency.symbol).toBe('€');
    expect(result.current.currency.rate).toBe(0.85);
  });

  it('should handle IP API timeout and fallback to USD', async () => {
    server.use(
      http.get('https://ipapi.co/json/', () => {
        return new Promise(() => {}); // Never resolves (timeout)
      })
    );

    const { result } = renderHook(() => useCurrency());

    // Fast-forward past timeout
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(result.current.currencyLoading).toBe(false);
    });

    expect(result.current.currency.code).toBe('USD');
    expect(result.current.currency.rate).toBe(1);
  });

  it('should handle network error and fallback to USD', async () => {
    server.use(
      http.get('https://ipapi.co/json/', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useCurrency());

    await waitFor(() => {
      expect(result.current.currencyLoading).toBe(false);
    });

    expect(result.current.currency.code).toBe('USD');
  });

  it('should handle exchange rate API failure and fallback to USD', async () => {
    server.use(
      http.get('https://ipapi.co/json/', () => {
        return HttpResponse.json({ currency: 'EUR' });
      }),
      http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useCurrency());

    await waitFor(() => {
      expect(result.current.currencyLoading).toBe(false);
    });

    expect(result.current.currency.code).toBe('USD');
  });

  it('should format currency correctly', async () => {
    server.use(
      http.get('https://ipapi.co/json/', () => {
        return HttpResponse.json({ currency: 'EUR' });
      }),
      http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
        return HttpResponse.json({
          base: 'USD',
          rates: { EUR: 0.85 },
        });
      })
    );

    const { result } = renderHook(() => useCurrency());

    await waitFor(() => {
      expect(result.current.currencyLoading).toBe(false);
    });

    const formatted = result.current.formatCurrency(100);
    expect(formatted).toBe('€85.00');
  });

  it('should handle missing currency in exchange rates', async () => {
    server.use(
      http.get('https://ipapi.co/json/', () => {
        return HttpResponse.json({ currency: 'XYZ' });
      }),
      http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
        return HttpResponse.json({
          base: 'USD',
          rates: { EUR: 0.85 }, // Missing XYZ
        });
      })
    );

    const { result } = renderHook(() => useCurrency());

    await waitFor(() => {
      expect(result.current.currencyLoading).toBe(false);
    });

    expect(result.current.currency.code).toBe('USD');
  });

  it('should handle invalid JSON response from IP API', async () => {
    server.use(
      http.get('https://ipapi.co/json/', () => {
        return HttpResponse.text('invalid json', {
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );

    const { result } = renderHook(() => useCurrency());

    await waitFor(() => {
      expect(result.current.currencyLoading).toBe(false);
    });

    expect(result.current.currency.code).toBe('USD');
  });
});

