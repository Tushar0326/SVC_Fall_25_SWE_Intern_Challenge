import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCurrency } from '@/hooks/useCurrency';
import { server } from '../../../setup-frontend';
import { http, HttpResponse } from 'msw';

// Import whatwg-fetch for fetch API support
import 'whatwg-fetch';

describe('useCurrency Hook - Branching Logic', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Currency Detection Branching', () => {
    it('should use USD when currency is USD', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.json({
            currency: 'USD',
            country_code: 'US',
          });
        })
      );

      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      expect(result.current.currency.code).toBe('USD');
      expect(result.current.currency.rate).toBe(1);
    });

    it('should fetch exchange rate when currency is not USD', async () => {
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

    it('should fallback to USD when exchange rate not available', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.json({
            currency: 'XYZ',
            country_code: 'XX',
          });
        }),
        http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
          return HttpResponse.json({
            base: 'USD',
            rates: {
              EUR: 0.85,
              // Missing XYZ
            },
          });
        })
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      expect(result.current.currency.code).toBe('USD');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Exchange rate not available')
      );

      consoleSpy.mockRestore();
    });

    it('should fallback to USD when exchange rates object is missing', async () => {
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
            // Missing rates property
          });
        })
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      expect(result.current.currency.code).toBe('USD');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Exchange rate not available')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling Branching', () => {
    it('should handle AbortError (timeout) and fallback to USD', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return new Promise(() => {}); // Never resolves (simulates timeout)
        })
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useCurrency());

      // Fast-forward timeout
      vi.useFakeTimers();
      vi.advanceTimersByTime(3000);
      vi.useRealTimers();

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      }, { timeout: 5000 });

      expect(result.current.currency.code).toBe('USD');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Currency detection timed out')
      );

      consoleSpy.mockRestore();
    });

    it('should handle NetworkError and fallback to USD', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.error();
        })
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      expect(result.current.currency.code).toBe('USD');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );

      consoleSpy.mockRestore();
    });

    it('should handle generic errors and fallback to USD', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
          );
        })
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      expect(result.current.currency.code).toBe('USD');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Currency detection failed')
      );

      consoleSpy.mockRestore();
    });

    it('should handle exchange rate API error and fallback to USD', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.json({
            currency: 'EUR',
            country_code: 'DE',
          });
        }),
        http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
          return HttpResponse.error();
        })
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      expect(result.current.currency.code).toBe('USD');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Currency detection failed')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Currency Symbol Branching', () => {
    it('should use custom symbol when available', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.json({
            currency: 'GBP',
            country_code: 'GB',
          });
        }),
        http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
          return HttpResponse.json({
            base: 'USD',
            rates: { GBP: 0.73 },
          });
        })
      );

      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      expect(result.current.currency.symbol).toBe('£');
    });

    it('should use currency code as symbol when custom symbol not available', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.json({
            currency: 'UNKNOWN',
            country_code: 'XX',
          });
        }),
        http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
          return HttpResponse.json({
            base: 'USD',
            rates: { UNKNOWN: 1.5 },
          });
        })
      );

      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      expect(result.current.currency.symbol).toBe('UNKNOWN');
    });
  });

  describe('formatCurrency Branching', () => {
    it('should format currency correctly with different rates', async () => {
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

      const formatted = result.current.formatCurrency(100);
      expect(formatted).toBe('€85.00');
    });

    it('should format USD correctly', async () => {
      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      const formatted = result.current.formatCurrency(100);
      expect(formatted).toBe('$100.00');
    });

    it('should handle decimal amounts correctly', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.json({
            currency: 'JPY',
            country_code: 'JP',
          });
        }),
        http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
          return HttpResponse.json({
            base: 'USD',
            rates: { JPY: 110.0 },
          });
        })
      );

      const { result } = renderHook(() => useCurrency());

      await waitFor(() => {
        expect(result.current.currencyLoading).toBe(false);
      });

      const formatted = result.current.formatCurrency(10.50);
      expect(formatted).toBe('¥1155.00');
    });
  });
});

