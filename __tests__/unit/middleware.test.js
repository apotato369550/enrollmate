import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from '../../middleware.js';
import { NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      next: vi.fn().mockImplementation(() => ({
          cookies: { set: vi.fn() },
          headers: new Map()
      })),
      redirect: vi.fn().mockImplementation((url) => ({
          status: 307,
          headers: new Map([['Location', url.toString()]]),
          cookies: { set: vi.fn() }
      })),
    },
  };
});

// Mock @supabase/ssr
const mockGetSession = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession
    }
  }))
}));

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(path) {
    return {
      nextUrl: {
        pathname: path,
        startsWith: (p) => path.startsWith(p)
      },
      url: `http://localhost:3000${path}`,
      headers: new Map(),
      cookies: {
        get: vi.fn(),
        set: vi.fn(),
      }
    };
  }

  it('should allow access to home page for unauthenticated users', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const req = createMockRequest('/');
    
    await middleware(req);
    
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect unauthenticated users from /dashboard to /login', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const req = createMockRequest('/dashboard');
    
    await middleware(req);
    
    // Check if redirect was called with login URL
    const redirectUrl = NextResponse.redirect.mock.calls[0][0];
    expect(redirectUrl.toString()).toBe('http://localhost:3000/login');
  });

  it('should redirect unauthenticated users from /scheduler to /login', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const req = createMockRequest('/scheduler');
    
    await middleware(req);
    
    const redirectUrl = NextResponse.redirect.mock.calls[0][0];
    expect(redirectUrl.toString()).toBe('http://localhost:3000/login');
  });
  
  it('should redirect unauthenticated users from /profile to /login', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const req = createMockRequest('/profile');
    
    await middleware(req);
    
    const redirectUrl = NextResponse.redirect.mock.calls[0][0];
    expect(redirectUrl.toString()).toBe('http://localhost:3000/login');
  });
  
  it('should redirect unauthenticated users from /profile-dashboard to /login', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const req = createMockRequest('/profile-dashboard');
    
    await middleware(req);
    
    const redirectUrl = NextResponse.redirect.mock.calls[0][0];
    expect(redirectUrl.toString()).toBe('http://localhost:3000/login');
  });

  it('should allow authenticated users to access protected routes', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    const req = createMockRequest('/dashboard');
    
    await middleware(req);
    
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('should redirect authenticated users from / to /dashboard', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    const req = createMockRequest('/');
    
    await middleware(req);
    
    const redirectUrl = NextResponse.redirect.mock.calls[0][0];
    expect(redirectUrl.toString()).toBe('http://localhost:3000/dashboard');
  });
});
