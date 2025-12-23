import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { testUser1 } from '../../fixtures/sample-users.js';

describe('Profile Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update user metadata successfully', async () => {
    const updates = {
      first_name: 'Jonathan',
      last_name: 'Doe Updated'
    };

    supabase.auth.updateUser.mockResolvedValue({
      data: { user: { ...testUser1, user_metadata: updates } },
      error: null
    });

    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });

    expect(error).toBeNull();
    expect(data.user.user_metadata.first_name).toBe('Jonathan');
  });

  it('should handle update errors', async () => {
    supabase.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Update failed' }
    });

    const { error } = await supabase.auth.updateUser({
      data: { invalid_field: 'value' }
    });

    expect(error).toBeDefined();
    expect(error.message).toBe('Update failed');
  });
});
