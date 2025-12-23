import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
  }
}));

// Also mock the one at src/lib/supabase if it exists there (based on file structure check earlier)
// The file structure showed src/lib/supabase.js
// And lib/api/userCourseAPI.js imports from '../../src/lib/supabase.js' which is src/lib/supabase.js

vi.mock('../../src/lib/supabase.js', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
  }
}));


// Global test configuration
afterEach(() => {
  vi.clearAllMocks();
});
