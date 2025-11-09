import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { createMockUser, createMockSession } from '../../../utils/test-helpers';

// Mock Supabase client
const mockGetSession = vi.fn();
const mockSignInWithOtp = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      signInWithOtp: mockSignInWithOtp,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default behavior
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthProvider - Initial Session', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
    });

    it('should load initial session successfully', async () => {
      const mockSession = createMockSession();
      const mockUser = createMockUser();

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle session loading error', async () => {
      const mockError = { message: 'Session error', status: 500 };
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
      expect(consoleSpy).toHaveBeenCalledWith('Error getting session:', mockError);

      consoleSpy.mockRestore();
    });

    it('should handle session loading exception', async () => {
      const mockError = new Error('Network error');
      mockGetSession.mockRejectedValue(mockError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get initial session:', mockError);

      consoleSpy.mockRestore();
    });

    it('should not update state if component unmounts', async () => {
      const mockSession = createMockSession();
      let resolveSession: (value: any) => void;

      mockGetSession.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSession = resolve;
          })
      );

      const { result, unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Unmount before session loads
      unmount();

      // Resolve session after unmount
      resolveSession!({
        data: { session: mockSession },
        error: null,
      });

      // Wait a bit to ensure no state updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      // State should remain in initial state
      expect(result.current.user).toBe(null);
    });
  });

  describe('AuthProvider - Auth State Changes', () => {
    it('should listen for auth state changes', () => {
      renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should update state on SIGNED_IN event', async () => {
      const mockSession = createMockSession();
      const mockUser = createMockUser();

      let authStateCallback: (event: string, session: any) => void;

      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Simulate SIGNED_IN event
      act(() => {
        authStateCallback!('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should update state on SIGNED_OUT event', async () => {
      let authStateCallback: (event: string, session: any) => void;

      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      });

      // Start with a session
      mockGetSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate SIGNED_OUT event
      act(() => {
        authStateCallback!('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(result.current.user).toBe(null);
        expect(result.current.session).toBe(null);
      });
    });

    it('should not update state if component unmounts during auth change', async () => {
      let authStateCallback: (event: string, session: any) => void;

      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      });

      const { result, unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      unmount();

      // Try to trigger auth state change after unmount
      act(() => {
        authStateCallback!('SIGNED_IN', createMockSession());
      });

      // State should not change
      expect(result.current.user).toBe(null);
    });

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn();
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('signInWithMagicLink', () => {
    it('should sign in with magic link successfully', async () => {
      mockSignInWithOtp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const email = 'test@example.com';
      const signInResult = await act(async () => {
        return await result.current.signInWithMagicLink(email);
      });

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      expect(signInResult.error).toBe(null);
    });

    it('should use VITE_SITE_URL if available', async () => {
      const originalEnv = import.meta.env.VITE_SITE_URL;
      import.meta.env.VITE_SITE_URL = 'https://custom-site.com';

      mockSignInWithOtp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signInWithMagicLink('test@example.com');
      });

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'https://custom-site.com',
        },
      });

      // Restore
      import.meta.env.VITE_SITE_URL = originalEnv;
    });

    it('should handle sign in error', async () => {
      const mockError = { message: 'Invalid email', status: 400 };
      mockSignInWithOtp.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const signInResult = await act(async () => {
        return await result.current.signInWithMagicLink('invalid@example.com');
      });

      expect(signInResult.error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      // Start with a session
      mockGetSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const signOutResult = await act(async () => {
        return await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(signOutResult.error).toBe(null);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
    });

    it('should handle sign out error', async () => {
      const mockError = { message: 'Sign out failed', status: 500 };
      mockSignOut.mockResolvedValue({ error: mockError });

      // Start with a session
      mockGetSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialUser = result.current.user;

      const signOutResult = await act(async () => {
        return await result.current.signOut();
      });

      expect(signOutResult.error).toEqual(mockError);
      // User should not be cleared on error
      expect(result.current.user).toEqual(initialUser);
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return auth context when used within AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('session');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('signInWithMagicLink');
      expect(result.current).toHaveProperty('signOut');
    });
  });
});

