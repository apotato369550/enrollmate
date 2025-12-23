import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserCourseAPI from '@lib/api/userCourseAPI.js';
import { supabase } from '@/lib/supabase.js'; // Use the mocked supabase
import { testUser1 } from '../../fixtures/sample-users.js';
import { computerscienceCourses } from '../../fixtures/sample-courses.js';

describe('User Course Library API', () => {
  const userId = testUser1.id;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveCourse', () => {
    it('should save a new course successfully', async () => {
      const course = computerscienceCourses[0];
      
      // Mock database response for check existing
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });

      // Mock database response for count
      const mockCount = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }) // Current count 5
        })
      });
      
      // Mock database response for insert
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'course-123', ...course }, error: null })
        })
      });

      // Setup the chain
      supabase.from.mockImplementation((table) => {
        if (table === 'user_courses') {
            return {
                select: (cols, opts) => {
                    if (opts && opts.count) return mockCount().select(cols, opts); // for count check
                    return mockSelect().eq().eq().eq(); // for existing check
                },
                insert: (data) => mockInsert().insert(data)
            };
        }
        return {};
      });
      
      // Re-mocking more precisely to handle the sequence of calls in saveCourse
      // 1. getUserCourseCount -> select('id', { count: 'exact' })
      // 2. check existing -> select('id').eq...maybeSingle
      // 3. insert -> insert(...).select().single()
      
      const selectMock = vi.fn();
      const insertMock = vi.fn();
      
      supabase.from.mockReturnValue({
          select: selectMock,
          insert: insertMock
      });
      
      // 1. Count
      selectMock.mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({ count: 10, error: null })
      });
      
      // 2. Existing check
      selectMock.mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
                  })
              })
          })
      });
      
      // 3. Insert
      insertMock.mockReturnValue({
          select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'new-id', ...course }, error: null })
          })
      });

      const result = await UserCourseAPI.saveCourse(userId, course, 'manual');

      expect(result).toBeDefined();
      expect(result.id).toBe('new-id');
      expect(supabase.from).toHaveBeenCalledWith('user_courses');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        user_id: userId,
        course_code: course.courseCode,
        section_group: course.sectionGroup
      }));
    });

    it('should enforce 50-course limit', async () => {
      const course = computerscienceCourses[0];

      // Mock count to return 50
      const selectMock = vi.fn();
      supabase.from.mockReturnValue({ select: selectMock });
      
      selectMock.mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({ count: 50, error: null })
      });

      await expect(UserCourseAPI.saveCourse(userId, course)).rejects.toThrow('Course library is full');
    });
  });

  describe('saveCourses (Bulk)', () => {
    it('should save multiple courses', async () => {
      const courses = computerscienceCourses.slice(0, 2);
      
      // Mock count check
      const selectMock = vi.fn();
      const insertMock = vi.fn();
      
      supabase.from.mockReturnValue({
          select: selectMock,
          insert: insertMock
      });
      
      // 1. Initial count check
      selectMock.mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({ count: 10, error: null })
      });
      
      // For each course:
      // 1. Count check (inside saveCourse)
      // 2. Existing check
      // 3. Insert
      
      // We need to mock the sequence for EACH course
      courses.forEach(() => {
          // Count check inside saveCourse
          selectMock.mockReturnValueOnce({
              eq: vi.fn().mockResolvedValue({ count: 10, error: null })
          });
          // Existing check
          selectMock.mockReturnValueOnce({
              eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockReturnValue({
                          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
                      })
                  })
              })
          });
          // Insert
          insertMock.mockReturnValueOnce({
              select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'new-id', ...courses[0] }, error: null })
              })
          });
      });

      const result = await UserCourseAPI.saveCourses(userId, courses, 'csv');

      expect(result.success).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('getUserCourses', () => {
      it('should fetch user courses sorted by created_at', async () => {
          const mockData = [
              { id: 1, course_code: 'CIS 3100' },
              { id: 2, course_code: 'MATH 2010' }
          ];
          
          const selectMock = vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockData, error: null })
              })
          });
          
          supabase.from.mockReturnValue({ select: selectMock });
          
          const result = await UserCourseAPI.getUserCourses(userId);
          
          expect(result).toEqual(mockData);
          expect(selectMock).toHaveBeenCalledWith('*');
      });
  });
});
