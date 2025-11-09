import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { createMockUser, createMockSession } from '../../../utils/test-helpers';

// Import whatwg-fetch for fetch API support
import 'whatwg-fetch';

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

describe('useAuth Hook - Branching Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('Mounted State Branching', () => {
    it('should not update state if component unmounts before session loads', async () => {
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
        data: { session: createMockSession() },
        error: null,
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // State should remain unchanged
      expect(result.current.user).toBe(null);
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
  });

  describe('Session Loading Branching', () => {
    it('should handle session loading error branch', async () => {
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
      expect(consoleSpy).toHaveBeenCalledWith('Error getting session:', mockError);

      consoleSpy.mockRestore();
    });

    it('should handle session loading exception branch', async () => {
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

    it('should set user when session exists branch', async () => {
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

    it('should set user to null when session is null branch', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
    });
  });

  describe('Sign Out Branching', () => {
    it('should clear user when sign out succeeds', async () => {
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

      const initialUser = result.current.user;
      expect(initialUser).not.toBe(null);

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
    });

    it('should not clear user when sign out fails', async () => {
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

      await act(async () => {
        await result.current.signOut();
      });

      // User should not be cleared on error
      expect(result.current.user).toEqual(initialUser);
    });
  });

  describe('Sign In Branching', () => {
    it('should use VITE_SITE_URL when available', async () => {
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

    it('should use window.location.origin when VITE_SITE_URL not set', async () => {
      const originalEnv = import.meta.env.VITE_SITE_URL;
      delete import.meta.env.VITE_SITE_URL;

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
          emailRedirectTo: window.location.origin,
        },
      });

      // Restore
      import.meta.env.VITE_SITE_URL = originalEnv;
    });
  });

  describe('useAuth Hook Branching', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return context when used within AuthProvider', () => {
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

  describe('Auth State Change Branching', () => {
    it('should update state on SIGNED_IN event', async () => {
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

      const mockSession = createMockSession();

      act(() => {
        authStateCallback!('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
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

      // Simulate SIGNED_OUT
      act(() => {
        authStateCallback!('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(result.current.user).toBe(null);
        expect(result.current.session).toBe(null);
      });
    });
  });
});

