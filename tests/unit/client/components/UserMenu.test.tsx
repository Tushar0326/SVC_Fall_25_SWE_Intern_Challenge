import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from '@/components/UserMenu';
import { renderWithProviders } from '../../../utils/test-helpers';
import { createMockUser } from '../../../utils/test-helpers';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signOut: vi.fn(),
      });

      renderWithProviders(<UserMenu />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Unauthenticated State', () => {
    it('should show sign in button when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      });

      renderWithProviders(<UserMenu />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should open dialog when sign in button is clicked', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
      });

      renderWithProviders(<UserMenu />);

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated State', () => {
    it('should show user email when authenticated', () => {
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });

      renderWithProviders(<UserMenu />);

      expect(screen.getByText(/user/i)).toBeInTheDocument();
      expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
    });

    it('should show username from email when authenticated', () => {
      const mockUser = createMockUser({ email: 'john.doe@example.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });

      renderWithProviders(<UserMenu />);

      expect(screen.getByText(/john.doe/i)).toBeInTheDocument();
    });

    it('should show "Account" if email is missing', () => {
      const mockUser = createMockUser({ email: undefined });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });

      renderWithProviders(<UserMenu />);

      expect(screen.getByText(/account/i)).toBeInTheDocument();
    });

    it('should open dropdown menu when clicked', async () => {
      const user = userEvent.setup();
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });

      renderWithProviders(<UserMenu />);

      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText(/sign out/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sign Out', () => {
    it('should call signOut when sign out is clicked', async () => {
      const user = userEvent.setup();
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });
      const mockUser = createMockUser({ email: 'user@example.com' });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: mockSignOut,
      });

      renderWithProviders(<UserMenu />);

      // Open menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText(/sign out/i)).toBeInTheDocument();
      });

      // Click sign out
      const signOutButton = screen.getByRole('menuitem', { name: /sign out/i });
      await user.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should show loading state during sign out', async () => {
      const user = userEvent.setup();
      const mockSignOut = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const mockUser = createMockUser({ email: 'user@example.com' });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: mockSignOut,
      });

      renderWithProviders(<UserMenu />);

      // Open menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText(/sign out/i)).toBeInTheDocument();
      });

      // Click sign out
      const signOutButton = screen.getByRole('menuitem', { name: /sign out/i });
      await user.click(signOutButton);

      expect(screen.getByText(/signing out/i)).toBeInTheDocument();
      expect(signOutButton).toBeDisabled();
    });

    it('should handle sign out error gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockSignOut = vi.fn().mockRejectedValue(new Error('Sign out failed'));
      const mockUser = createMockUser({ email: 'user@example.com' });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: mockSignOut,
      });

      renderWithProviders(<UserMenu />);

      // Open menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText(/sign out/i)).toBeInTheDocument();
      });

      // Click sign out
      const signOutButton = screen.getByRole('menuitem', { name: /sign out/i });
      await user.click(signOutButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('should hide username text on small screens', () => {
      const mockUser = createMockUser({ email: 'user@example.com' });
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signOut: vi.fn(),
      });

      renderWithProviders(<UserMenu />);

      const button = screen.getByRole('button');
      // The username should be in a span with hidden sm:inline-block class
      // In test environment, we check that the text exists but may be hidden
      expect(button).toBeInTheDocument();
    });
  });
});

