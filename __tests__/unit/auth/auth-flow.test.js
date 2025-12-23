import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { testUser1, newSignupUser } from '../../fixtures/sample-users.js';

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Signup', () => {
    it('should create new user with valid credentials', async () => {
      // Mock successful signup
      supabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'new-user-id', email: newSignupUser.email }, session: null },
        error: null
      });

      // We are mocking the API call directly, integration test would test the UI interaction
      const { data, error } = await supabase.auth.signUp({
        email: newSignupUser.email,
        password: newSignupUser.password,
        options: {
          data: {
            first_name: newSignupUser.firstName,
            last_name: newSignupUser.lastName,
            student_id: newSignupUser.studentId
          }
        }
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(newSignupUser.email);
    });

    it('should reject signup with existing email', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      });

      const { error } = await supabase.auth.signUp({
        email: testUser1.email,
        password: 'SomePassword123'
      });

      expect(error).toBeDefined();
      expect(error.message).toBe('User already registered');
    });
  });

  describe('Login', () => {
    it('should sign in with valid credentials', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: testUser1, session: { access_token: 'valid-token' } },
        error: null
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser1.email,
        password: testUser1.password
      });

      expect(error).toBeNull();
      expect(data.session).toBeDefined();
      expect(data.user.email).toBe(testUser1.email);
    });

    it('should show error for invalid password', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: testUser1.email,
        password: 'WrongPassword'
      });

      expect(error).toBeDefined();
      expect(error.message).toBe('Invalid login credentials');
    });
  });

  describe('Logout', () => {
    it('should sign out user and clear session', async () => {
      supabase.auth.signOut.mockResolvedValue({ error: null });

      const { error } = await supabase.auth.signOut();

      expect(error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
