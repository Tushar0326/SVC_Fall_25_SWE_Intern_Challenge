import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import NotFound from '@/pages/NotFound';
import { renderWithProviders } from '../../../utils/test-helpers';

// Mock useLocation
const mockLocation = { pathname: '/non-existent-route' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation,
  };
});

describe('NotFound Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render 404 message', () => {
    renderWithProviders(<NotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('should render return to home link', () => {
    renderWithProviders(<NotFound />);

    const homeLink = screen.getByRole('link', { name: /return to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should log error to console with pathname', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithProviders(<NotFound />);

    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      '/non-existent-route'
    );

    consoleSpy.mockRestore();
  });

  it('should log different pathname when route changes', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = renderWithProviders(<NotFound />);

    // Change pathname
    mockLocation.pathname = '/another-missing-route';
    rerender(<NotFound />);

    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      '/another-missing-route'
    );

    consoleSpy.mockRestore();
  });

  it('should have proper styling classes', () => {
    const { container } = renderWithProviders(<NotFound />);

    const mainDiv = container.querySelector('.min-h-screen');
    expect(mainDiv).toBeInTheDocument();
  });
});

