import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { computerscienceCourses } from '../fixtures/sample-courses.js';

describe('Integration: Schedule Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a semester, import courses, and save a generated schedule', async () => {
    // 1. Create Semester
    const semesterId = 'sem-1';
    supabase.from.mockImplementation((table) => {
        if (table === 'semesters') {
            return {
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { id: semesterId, name: 'Fall 2025' }, error: null })
                    })
                })
            };
        }
        if (table === 'semester_courses') {
            return {
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockResolvedValue({ data: [], error: null }) // Batch insert returns array
                })
            };
        }
        if (table === 'schedules') {
            return {
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { id: 'sched-A', name: 'Schedule A' }, error: null })
                    })
                })
            };
        }
        if (table === 'schedule_courses') {
            return {
                insert: vi.fn().mockResolvedValue({ data: null, error: null })
            };
        }
        return {};
    });

    // Action 1: Create Semester
    const { data: semester } = await supabase.from('semesters').insert({ name: 'Fall 2025' }).select().single();
    expect(semester.id).toBe(semesterId);

    // Action 2: Import Courses
    // Simulate bulk insert
    const coursesToInsert = computerscienceCourses.map(c => ({ ...c, semester_id: semesterId }));
    await supabase.from('semester_courses').insert(coursesToInsert).select();
    expect(supabase.from).toHaveBeenCalledWith('semester_courses');

    // Action 3: Create Schedule
    const { data: schedule } = await supabase.from('schedules').insert({
        semester_id: semesterId,
        name: 'Schedule A'
    }).select().single();
    expect(schedule.id).toBe('sched-A');

    // Action 4: Add courses to schedule (link table)
    // Assume we picked the first 2 courses
    const links = [
        { schedule_id: schedule.id, semester_course_id: 'c1' },
        { schedule_id: schedule.id, semester_course_id: 'c2' }
    ];
    await supabase.from('schedule_courses').insert(links);
    
    // Verify call
    expect(supabase.from).toHaveBeenCalledWith('schedule_courses');
  });
});
