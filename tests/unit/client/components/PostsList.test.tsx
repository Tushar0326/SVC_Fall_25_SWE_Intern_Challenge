import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PostsList } from '@/components/PostsList';
import { renderWithProviders } from '../../../utils/test-helpers';
import { server } from '../../../setup-frontend';
import { http, HttpResponse } from 'msw';

// Import whatwg-fetch for fetch API support
import 'whatwg-fetch';

describe('PostsList Component', () => {
  beforeEach(() => {
    // Reset MSW handlers before each test
    server.resetHandlers();
  });

  afterEach(() => {
    // Clean up after each test
    server.resetHandlers();
  });

  describe('Successful API Response', () => {
    it('should render loading state initially', () => {
      // Mock delayed response to see loading state
      server.use(
        http.get('/api/posts', async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            success: true,
            posts: [
              {
                id: 1,
                title: 'Test Post',
                content: 'Test content',
                author: 'Test Author',
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
          });
        })
      );

      renderWithProviders(<PostsList />);

      expect(screen.getByText(/loading posts/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loader2 has role="status"
    });

    it('should fetch and display posts successfully', async () => {
      const mockPosts = [
        {
          id: 1,
          title: 'First Post',
          content: 'This is the first post content',
          author: 'John Doe',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          title: 'Second Post',
          content: 'This is the second post content',
          author: 'Jane Smith',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];

      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.json({
            success: true,
            posts: mockPosts,
          });
        })
      );

      renderWithProviders(<PostsList />);

      // Wait for posts to load
      await waitFor(() => {
        expect(screen.getByText('First Post')).toBeInTheDocument();
      });

      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('This is the first post content')).toBeInTheDocument();
      expect(screen.getByText('By John Doe')).toBeInTheDocument();

      expect(screen.getByText('Second Post')).toBeInTheDocument();
      expect(screen.getByText('This is the second post content')).toBeInTheDocument();
      expect(screen.getByText('By Jane Smith')).toBeInTheDocument();
    });

    it('should display formatted dates', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.json({
            success: true,
            posts: [
              {
                id: 1,
                title: 'Test Post',
                content: 'Content',
                author: 'Author',
                createdAt: '2024-01-15T10:30:00Z',
              },
            ],
          });
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByText('Test Post')).toBeInTheDocument();
      });

      // Check that date is displayed (format may vary by locale)
      const dateText = screen.getByText(/1\/15\/2024|15\/1\/2024|2024-01-15/i);
      expect(dateText).toBeInTheDocument();
    });

    it('should display empty state when no posts', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.json({
            success: true,
            posts: [],
          });
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByText(/no posts available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on 500 server error', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Internal server error',
            },
            { status: 500 }
          );
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });

      // Check error alert is displayed
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('destructive');
    });

    it('should display error message on 404 not found', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Posts not found',
            },
            { status: 404 }
          );
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByText(/posts not found/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Should show error message
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
    });

    it('should handle malformed JSON response', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.text('invalid json', {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should handle response without posts array', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.json({
            success: true,
            // Missing posts array
          });
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/invalid response format/i)).toBeInTheDocument();
    });

    it('should handle response with success: false', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.json({
            success: false,
            message: 'Failed to load posts',
          });
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load posts/i)).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    it('should render posts in cards', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.json({
            success: true,
            posts: [
              {
                id: 1,
                title: 'Test Post',
                content: 'Content',
                author: 'Author',
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
          });
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByText('Test Post')).toBeInTheDocument();
      });

      // Check that posts are rendered in card structure
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should display section title', async () => {
      server.use(
        http.get('/api/posts', () => {
          return HttpResponse.json({
            success: true,
            posts: [],
          });
        })
      );

      renderWithProviders(<PostsList />);

      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument();
      });
    });
  });
});

