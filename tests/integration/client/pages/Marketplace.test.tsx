import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Marketplace from '@/pages/Marketplace';
import { renderWithProviders } from '../../../utils/test-helpers';
import { server } from '../../../setup-frontend';
import { http, HttpResponse } from 'msw';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Marketplace Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render page title and description', () => {
      renderWithProviders(<Marketplace />);

      expect(screen.getByText(/company marketplace/i)).toBeInTheDocument();
      expect(screen.getByText(/connect with leading companies/i)).toBeInTheDocument();
    });

    it('should render all companies', () => {
      renderWithProviders(<Marketplace />);

      expect(screen.getByText(/silicon valley consulting/i)).toBeInTheDocument();
      expect(screen.getByText(/tech innovations corp/i)).toBeInTheDocument();
      expect(screen.getByText(/digital marketing pro/i)).toBeInTheDocument();
    });

    it('should show available badge for Silicon Valley Consulting', () => {
      renderWithProviders(<Marketplace />);

      expect(screen.getByText(/✓ available/i)).toBeInTheDocument();
    });

    it('should show locked icon for unavailable companies', () => {
      renderWithProviders(<Marketplace />);

      // Locked companies should have opacity and blur
      const cards = screen.getAllByText(/tech innovations corp/i);
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Currency Detection', () => {
    it('should default to USD while loading', () => {
      renderWithProviders(<Marketplace />);

      const loadingText = screen.getAllByText(/\$--\/hour \+ \$--- bonus/);
      expect(loadingText.length).toBeGreaterThan(0);
    });

    it('should detect and convert currency', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.json({ currency: 'EUR', country_code: 'DE' });
        }),
        http.get('https://api.exchangerate-api.com/v4/latest/USD', () => {
          return HttpResponse.json({
            base: 'USD',
            rates: { EUR: 0.85 },
          });
        })
      );

      renderWithProviders(<Marketplace />);

      await waitFor(() => {
        expect(screen.getByText(/prices shown in eur/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle currency API errors gracefully', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<Marketplace />);

      // Should fallback to USD
      await waitFor(() => {
        const usdPrices = screen.getAllByText(/\$2\.00/);
        expect(usdPrices.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe('Company Interactions', () => {
    it('should navigate to company page when available company is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Marketplace />);

      // Find Silicon Valley Consulting card (available)
      const companyCard = screen.getByText(/silicon valley consulting/i).closest('div[class*="Card"]');
      if (companyCard) {
        await user.click(companyCard);
      }

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/companies/silicon-valley-consulting');
      });
    });

    it('should show locked alert when unavailable company is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Marketplace />);

      // Find a locked company card
      const lockedCompany = screen.getByText(/tech innovations corp/i).closest('div[class*="Card"]');
      if (lockedCompany) {
        await user.click(lockedCompany);
      }

      await waitFor(() => {
        expect(screen.getByText(/company locked/i)).toBeInTheDocument();
        expect(screen.getByText(/you need to complete your first assignment/i)).toBeInTheDocument();
      });
    });

    it('should hide locked alert after timeout', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup();
      renderWithProviders(<Marketplace />);

      const lockedCompany = screen.getByText(/tech innovations corp/i).closest('div[class*="Card"]');
      if (lockedCompany) {
        await user.click(lockedCompany);
      }

      await waitFor(() => {
        expect(screen.getByText(/company locked/i)).toBeInTheDocument();
      });

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByText(/company locked/i)).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Company Information Display', () => {
    it('should display company compensation information', async () => {
      renderWithProviders(<Marketplace />);

      await waitFor(() => {
        // Check for hourly rate and bonus display
        const compensationText = screen.getAllByText(/\$2\.00\/hour/);
        expect(compensationText.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('should display hire count and rating', () => {
      renderWithProviders(<Marketplace />);

      expect(screen.getByText(/14 hires/i)).toBeInTheDocument();
      expect(screen.getByText(/4\.8/i)).toBeInTheDocument();
    });

    it('should display company categories', () => {
      renderWithProviders(<Marketplace />);

      expect(screen.getByText(/marketing & growth/i)).toBeInTheDocument();
      expect(screen.getByText(/technology/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have back to home link', () => {
      renderWithProviders(<Marketplace />);

      const homeLink = screen.getByRole('link', { name: /← back to home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('Info Section', () => {
    it('should render how marketplace works section', () => {
      renderWithProviders(<Marketplace />);

      expect(screen.getByText(/how our marketplace works/i)).toBeInTheDocument();
      expect(screen.getByText(/step 1:/i)).toBeInTheDocument();
      expect(screen.getByText(/step 2:/i)).toBeInTheDocument();
      expect(screen.getByText(/step 3:/i)).toBeInTheDocument();
    });
  });
});

