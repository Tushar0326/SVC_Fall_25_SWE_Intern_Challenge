import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Index from '@/pages/Index';
import { renderWithProviders } from '../../../utils/test-helpers';
import { server } from '../../../setup-frontend';
import { http, HttpResponse } from 'msw';
import { createMockUser } from '../../../utils/test-helpers';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });
  });

  describe('Rendering', () => {
    it('should render page title and hero section', () => {
      renderWithProviders(<Index />);

      expect(screen.getByText(/get paid when ai companies/i)).toBeInTheDocument();
      expect(screen.getByText(/train on your data/i)).toBeInTheDocument();
    });

    it('should render CTA buttons', () => {
      renderWithProviders(<Index />);

      expect(screen.getByRole('button', { name: /see if your accounts qualify/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
    });

    it('should render platform payment rates section', () => {
      renderWithProviders(<Index />);

      expect(screen.getByText(/platform payment rates/i)).toBeInTheDocument();
      expect(screen.getByText(/twitter/i)).toBeInTheDocument();
      expect(screen.getByText(/youtube/i)).toBeInTheDocument();
      expect(screen.getByText(/facebook/i)).toBeInTheDocument();
      expect(screen.getByText(/reddit/i)).toBeInTheDocument();
    });

    it('should render how it works section', () => {
      renderWithProviders(<Index />);

      expect(screen.getByText(/how fairdatause works/i)).toBeInTheDocument();
      expect(screen.getByText(/connect accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/monitor usage/i)).toBeInTheDocument();
      expect(screen.getByText(/get paid/i)).toBeInTheDocument();
    });
  });

  describe('Currency Detection', () => {
    it('should default to USD while loading', () => {
      renderWithProviders(<Index />);

      // Should show loading placeholder
      const priceElements = screen.getAllByText(/\$--/);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it('should detect EUR currency and convert prices', async () => {
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

      renderWithProviders(<Index />);

      await waitFor(() => {
        expect(screen.getByText(/prices shown in eur/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle currency API timeout and fallback to USD', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return new Promise(() => {}); // Never resolves (timeout)
        })
      );

      renderWithProviders(<Index />);

      // Should eventually show USD prices after timeout
      await waitFor(() => {
        const usdPrices = screen.getAllByText(/\$1\.00|\$2\.00|\$1\.50|\$5\.00/);
        expect(usdPrices.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('should handle currency API network error', async () => {
      server.use(
        http.get('https://ipapi.co/json/', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<Index />);

      // Should fallback to USD
      await waitFor(() => {
        const usdPrices = screen.getAllByText(/\$1\.00|\$2\.00|\$1\.50|\$5\.00/);
        expect(usdPrices.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe('Navigation', () => {
    it('should navigate to qualification form on CTA click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Index />);

      const ctaButton = screen.getAllByRole('button', { name: /see if your accounts qualify/i })[0];
      await user.click(ctaButton);

      expect(mockNavigate).toHaveBeenCalledWith('/social-qualify-form');
    });

    it('should scroll to platforms section on learn more click', async () => {
      const user = userEvent.setup();
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      renderWithProviders(<Index />);

      const learnMoreButton = screen.getByRole('button', { name: /learn more/i });
      await user.click(learnMoreButton);

      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });

  describe('User Authentication State', () => {
    it('should show marketplace link when user is authenticated', () => {
      const mockUser = createMockUser();
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      renderWithProviders(<Index />);

      expect(screen.getByRole('link', { name: /companies/i })).toBeInTheDocument();
    });

    it('should not show marketplace link when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithProviders(<Index />);

      expect(screen.queryByRole('link', { name: /companies/i })).not.toBeInTheDocument();
    });
  });

  describe('Platform Display', () => {
    it('should show Reddit as hottest option', () => {
      renderWithProviders(<Index />);

      expect(screen.getByText(/🔥 hottest option/i)).toBeInTheDocument();
    });

    it('should display correct payment rates', async () => {
      renderWithProviders(<Index />);

      await waitFor(() => {
        // Check for Reddit's $5.00 rate
        expect(screen.getByText(/\$5\.00/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Footer', () => {
    it('should render footer with links', () => {
      renderWithProviders(<Index />);

      expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /terms of service/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
    });
  });
});

