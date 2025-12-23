import { vi } from 'vitest';

export const createMockSupabase = () => {
  const mockDb = {
    schedules: [],
    semesters: [],
    semester_courses: [],
    user_courses: [],
    profiles: [],
  };

  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    then: function(resolve) { resolve({ data: mockDb[this.table] || [], error: null }); }
  };

  return {
    from: (table) => {
      queryBuilder.table = table;
      // Reset mocks for each call if needed, or keep them cumulative
      return queryBuilder;
    },
    // Helper to access the mock DB for verification
    _db: mockDb
  };
};
