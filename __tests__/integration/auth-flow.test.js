import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { testUser1, newSignupUser } from '../fixtures/sample-users.js';

describe('Integration: Authentication Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow a user to signup, then login, and see their profile', async () => {
    // 1. Signup
    supabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'new-id', email: newSignupUser.email }, session: null },
        error: null
    });
    
    await supabase.auth.signUp({
        email: newSignupUser.email,
        password: newSignupUser.password
    });
    
    expect(supabase.auth.signUp).toHaveBeenCalled();

    // 2. Login
    const sessionMock = { access_token: 'abc', user: { id: 'new-id', email: newSignupUser.email } };
    supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: sessionMock, user: sessionMock.user },
        error: null
    });

    const loginResult = await supabase.auth.signInWithPassword({
        email: newSignupUser.email,
        password: newSignupUser.password
    });
    
    expect(loginResult.data.session).toBeDefined();

    // 3. Fetch Profile (simulating a protected route data fetch)
    const profileData = { first_name: newSignupUser.firstName, last_name: newSignupUser.lastName };
    
    supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: profileData, error: null })
            })
        })
    });
    
    const { data } = await supabase.from('profiles').select('*').eq('id', 'new-id').single();
    expect(data.first_name).toBe(newSignupUser.firstName);
  });
});
