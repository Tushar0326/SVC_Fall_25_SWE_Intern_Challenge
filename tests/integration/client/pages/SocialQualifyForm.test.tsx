import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../utils/test-helpers';
import SocialQualifyForm from '@/pages/SocialQualifyForm';
import { server } from '../../../setup-frontend';
import { http, HttpResponse } from 'msw';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithMagicLink: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

// Mock useCurrency hook
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    currency: { code: 'USD', symbol: '$', rate: 1 },
    currencyLoading: false,
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  }),
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

describe('SocialQualifyForm Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with all fields', () => {
    renderWithProviders(<SocialQualifyForm />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reddit username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/youtube/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/facebook/i)).toBeInTheDocument();
  });

  it('should validate required fields on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SocialQualifyForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit application/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email/i)).toBeInTheDocument();
    });
  });

  it('should check user existence before submission', async () => {
    const user = userEvent.setup();
    
    // Mock user exists
    server.use(
      http.post('/api/check-user-exists', () => {
        return HttpResponse.json({ success: true, userExists: true });
      })
    );
    
    renderWithProviders(<SocialQualifyForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const redditInput = screen.getByLabelText(/reddit username/i);
    const submitButton = screen.getByRole('button', { name: /submit application/i });
    
    await user.type(emailInput, 'existing@test.com');
    await user.type(phoneInput, '1234567890');
    await user.type(redditInput, 'testuser');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/already signed up/i)).toBeInTheDocument();
    });
  });

  it('should submit form successfully and show success message', async () => {
    const user = userEvent.setup();
    
    // Mock user doesn't exist
    server.use(
      http.post('/api/check-user-exists', () => {
        return HttpResponse.json({ success: true, userExists: false });
      }),
      http.post('/api/social-qualify-form', () => {
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
      })
    );
    
    renderWithProviders(<SocialQualifyForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const redditInput = screen.getByLabelText(/reddit username/i);
    const submitButton = screen.getByRole('button', { name: /submit application/i });
    
    await user.type(emailInput, 'newuser@test.com');
    await user.type(phoneInput, '1234567890');
    await user.type(redditInput, 'testuser');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/application status update/i)).toBeInTheDocument();
      expect(screen.getByText(/silicon valley consulting/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('/api/check-user-exists', () => {
        return HttpResponse.json({ success: true, userExists: false });
      }),
      http.post('/api/social-qualify-form', () => {
        return HttpResponse.json(
          { success: false, message: 'Reddit user does not exist' },
          { status: 400 }
        );
      })
    );
    
    renderWithProviders(<SocialQualifyForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const redditInput = screen.getByLabelText(/reddit username/i);
    const submitButton = screen.getByRole('button', { name: /submit application/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(phoneInput, '1234567890');
    await user.type(redditInput, 'nonexistent');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/reddit user does not exist/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('/api/check-user-exists', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ success: true, userExists: false });
      }),
      http.post('/api/social-qualify-form', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          success: true,
          message: 'Application processed successfully',
          data: { matchedCompany: {} },
        });
      })
    );
    
    renderWithProviders(<SocialQualifyForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const redditInput = screen.getByLabelText(/reddit username/i);
    const submitButton = screen.getByRole('button', { name: /submit application/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(phoneInput, '1234567890');
    await user.type(redditInput, 'testuser');
    await user.click(submitButton);
    
    expect(screen.getByText(/checking your accounts/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should navigate to company page on success', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('/api/check-user-exists', () => {
        return HttpResponse.json({ success: true, userExists: false });
      }),
      http.post('/api/social-qualify-form', () => {
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
      })
    );
    
    renderWithProviders(<SocialQualifyForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const redditInput = screen.getByLabelText(/reddit username/i);
    const submitButton = screen.getByRole('button', { name: /submit application/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(phoneInput, '1234567890');
    await user.type(redditInput, 'testuser');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/application status update/i)).toBeInTheDocument();
    });
    
    const learnMoreButton = screen.getByRole('button', { name: /click here to learn more/i });
    await user.click(learnMoreButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/companies/silicon-valley-consulting');
  });
});

