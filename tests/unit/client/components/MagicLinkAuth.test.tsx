import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MagicLinkAuth } from '@/components/MagicLinkAuth';
import { renderWithProviders } from '../../../utils/test-helpers';
import { server } from '../../../setup-frontend';
import { http, HttpResponse } from 'msw';

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithMagicLink: vi.fn(async (email: string) => {
      if (email === 'error@test.com') {
        return { error: { message: 'Invalid email' } };
      }
      if (email === 'network-error@test.com') {
        throw new Error('Network error');
      }
      return { error: null };
    }),
  }),
}));

describe('MagicLinkAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sign in form', () => {
    renderWithProviders(<MagicLinkAuth />);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('should show validation error for empty email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MagicLinkAuth />);
    
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter your email address/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid email', async () => {
    const user = userEvent.setup();
    const { useAuth } = await import('@/hooks/useAuth');
    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    
    vi.mocked(useAuth).mockReturnValue({
      signInWithMagicLink: mockSignIn,
    } as any);
    
    renderWithProviders(<MagicLinkAuth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should show success message after sending magic link', async () => {
    const user = userEvent.setup();
    const { useAuth } = await import('@/hooks/useAuth');
    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    
    vi.mocked(useAuth).mockReturnValue({
      signInWithMagicLink: mockSignIn,
    } as any);
    
    renderWithProviders(<MagicLinkAuth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });
  });

  it('should display error message on authentication failure', async () => {
    const user = userEvent.setup();
    const { useAuth } = await import('@/hooks/useAuth');
    const mockSignIn = vi.fn().mockResolvedValue({
      error: { message: 'Invalid email address' },
    });
    
    vi.mocked(useAuth).mockReturnValue({
      signInWithMagicLink: mockSignIn,
    } as any);
    
    renderWithProviders(<MagicLinkAuth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    
    await user.type(emailInput, 'error@test.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    const { useAuth } = await import('@/hooks/useAuth');
    const mockSignIn = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );
    
    vi.mocked(useAuth).mockReturnValue({
      signInWithMagicLink: mockSignIn,
    } as any);
    
    renderWithProviders(<MagicLinkAuth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    expect(screen.getByText(/sending magic link/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should prevent double submission', async () => {
    const user = userEvent.setup();
    const { useAuth } = await import('@/hooks/useAuth');
    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    
    vi.mocked(useAuth).mockReturnValue({
      signInWithMagicLink: mockSignIn,
    } as any);
    
    renderWithProviders(<MagicLinkAuth />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    await user.click(submitButton); // Try to submit again
    
    // Should only be called once
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onClose when provided and close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    renderWithProviders(<MagicLinkAuth onClose={onClose} />);
    
    // First send magic link to show success state
    const { useAuth } = await import('@/hooks/useAuth');
    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    
    vi.mocked(useAuth).mockReturnValue({
      signInWithMagicLink: mockSignIn,
    } as any);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should allow resending magic link', async () => {
    const user = userEvent.setup();
    const { useAuth } = await import('@/hooks/useAuth');
    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    
    vi.mocked(useAuth).mockReturnValue({
      signInWithMagicLink: mockSignIn,
    } as any);
    
    renderWithProviders(<MagicLinkAuth />);
    
    // Send first magic link
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    
    // Click send another link
    const resendButton = screen.getByRole('button', { name: /send another link/i });
    await user.click(resendButton);
    
    // Should show form again
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});

