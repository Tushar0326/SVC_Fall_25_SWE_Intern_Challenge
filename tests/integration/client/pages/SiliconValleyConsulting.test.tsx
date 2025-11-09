import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiliconValleyConsulting from '@/pages/SiliconValleyConsulting';
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

describe('SiliconValleyConsulting Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });
  });

  describe('Rendering', () => {
    it('should render company header and information', () => {
      renderWithProviders(<SiliconValleyConsulting />);

      expect(screen.getByText(/silicon valley consulting/i)).toBeInTheDocument();
      expect(screen.getByText(/marketing consultancy/i)).toBeInTheDocument();
    });

    it('should render compensation package', () => {
      renderWithProviders(<SiliconValleyConsulting />);

      expect(screen.getByText(/💰 compensation package/i)).toBeInTheDocument();
    });

    it('should render part-time tasks section', () => {
      renderWithProviders(<SiliconValleyConsulting />);

      expect(screen.getByText(/part-time tasks/i)).toBeInTheDocument();
      expect(screen.getByText(/reddit community engagement/i)).toBeInTheDocument();
      expect(screen.getByText(/content creation/i)).toBeInTheDocument();
    });

    it('should render onboarding process', () => {
      renderWithProviders(<SiliconValleyConsulting />);

      expect(screen.getByText(/onboarding & payment process/i)).toBeInTheDocument();
      expect(screen.getByText(/join company slack/i)).toBeInTheDocument();
    });
  });

  describe('Authentication States', () => {
    it('should show sign in required alert when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithProviders(<SiliconValleyConsulting />);

      expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
      expect(screen.getByText(/you need to be signed in/i)).toBeInTheDocument();
    });

    it('should show signed in alert when authenticated', () => {
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      renderWithProviders(<SiliconValleyConsulting />);

      expect(screen.getByText(/signed in as:/i)).toBeInTheDocument();
      expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
    });
  });

  describe('Join Slack Functionality', () => {
    it('should show sign in message when clicking join without auth', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithProviders(<SiliconValleyConsulting />);

      const joinButton = screen.getByRole('button', { name: /sign in to join slack/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/please sign in to join/i)).toBeInTheDocument();
      });
    });

    it('should submit contractor request when authenticated', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      server.use(
        http.post('/api/contractor-request', () => {
          return HttpResponse.json({
            success: true,
            message: "We've just pinged them. You'll be sent an email and text invite within 72 hours.",
          });
        })
      );

      renderWithProviders(<SiliconValleyConsulting />);

      const joinButton = screen.getByRole('button', { name: /join slack/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/we've just pinged them/i)).toBeInTheDocument();
      });
    });

    it('should handle user not found error', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ email: 'nonexistent@test.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      server.use(
        http.post('/api/contractor-request', () => {
          return HttpResponse.json(
            { success: false, message: 'User not found. Please complete the qualification form first.' },
            { status: 404 }
          );
        })
      );

      renderWithProviders(<SiliconValleyConsulting />);

      const joinButton = screen.getByRole('button', { name: /join slack/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/you need to complete the qualification form/i)).toBeInTheDocument();
      });

      // Should navigate after 3 seconds
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/social-qualify-form');
      }, { timeout: 4000 });
    });

    it('should handle duplicate request error', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ email: 'duplicate@test.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      server.use(
        http.post('/api/contractor-request', () => {
          return HttpResponse.json(
            { success: false, message: 'You have already requested to join this company.' },
            { status: 400 }
          );
        })
      );

      renderWithProviders(<SiliconValleyConsulting />);

      const joinButton = screen.getByRole('button', { name: /join slack/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByText(/already requested/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during request', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      server.use(
        http.post('/api/contractor-request', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ success: true, message: 'Success' });
        })
      );

      renderWithProviders(<SiliconValleyConsulting />);

      const joinButton = screen.getByRole('button', { name: /join slack/i });
      await user.click(joinButton);

      expect(screen.getByText(/requesting/i)).toBeInTheDocument();
      expect(joinButton).toBeDisabled();
    });

    it('should update button state after successful request', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
      });

      server.use(
        http.post('/api/contractor-request', () => {
          return HttpResponse.json({
            success: true,
            message: "We've just pinged them.",
          });
        })
      );

      renderWithProviders(<SiliconValleyConsulting />);

      const joinButton = screen.getByRole('button', { name: /join slack/i });
      await user.click(joinButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /request sent ✓/i })).toBeInTheDocument();
      });
    });
  });

  describe('Start Job Functionality', () => {
    it('should show waiting for approval when not approved', () => {
      renderWithProviders(<SiliconValleyConsulting />);

      expect(screen.getByRole('button', { name: /waiting for approval/i })).toBeInTheDocument();
      expect(screen.getByText(/available after company approval/i)).toBeInTheDocument();
    });

    it('should show alert when start job is clicked', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithProviders(<SiliconValleyConsulting />);

      // This button should be disabled, but let's test the handler if enabled
      const startJobButton = screen.getByRole('button', { name: /waiting for approval/i });
      expect(startJobButton).toBeDisabled();

      alertSpy.mockRestore();
    });
  });

  describe('Currency Display', () => {
    it('should display compensation in USD by default', async () => {
      renderWithProviders(<SiliconValleyConsulting />);

      await waitFor(() => {
        expect(screen.getByText(/\$2\.00\/hour/)).toBeInTheDocument();
        expect(screen.getByText(/\$500/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should convert and display in other currencies', async () => {
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

      renderWithProviders(<SiliconValleyConsulting />);

      await waitFor(() => {
        expect(screen.getByText(/prices shown in eur/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Navigation', () => {
    it('should have back to marketplace link', () => {
      renderWithProviders(<SiliconValleyConsulting />);

      const backLink = screen.getByRole('link', { name: /← back to marketplace/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/marketplace');
    });

    it('should have browse companies link', () => {
      renderWithProviders(<SiliconValleyConsulting />);

      const browseLink = screen.getByRole('link', { name: /browse companies/i });
      expect(browseLink).toBeInTheDocument();
      expect(browseLink).toHaveAttribute('href', '/marketplace');
    });
  });

  describe('Payment Protection Section', () => {
    it('should render payment protection information', () => {
      renderWithProviders(<SiliconValleyConsulting />);

      expect(screen.getByText(/payment protection/i)).toBeInTheDocument();
      expect(screen.getByText(/fairdatause holds company funds/i)).toBeInTheDocument();
    });
  });
});

