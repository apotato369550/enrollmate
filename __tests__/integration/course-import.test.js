import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserCourseAPI from '@lib/api/userCourseAPI.js';
import { supabase } from '@/lib/supabase';
import { computerscienceCourses } from '../fixtures/sample-courses.js';

describe('Integration: Course Import Workflow', () => {
    const userId = 'user-import-test';
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should bulk import courses and allow searching them', async () => {
        // Setup mocks for UserCourseAPI usage
        
        const mockInsert = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'new-course', ...computerscienceCourses[0] }, error: null })
            })
        });
        
        const mockSelect = vi.fn(); // The function returned by supabase.from()
        
        supabase.from.mockReturnValue({
            select: mockSelect,
            insert: mockInsert
        });

        // Smart mock for select()
        mockSelect.mockImplementation((columns, options) => {
            // 1. Handle Count Query: select('id', { count: 'exact' })
            if (options && options.count === 'exact') {
                return {
                    eq: vi.fn().mockResolvedValue({ count: 5, error: null })
                };
            }
            
            // 2. Handle Existing Check: select('id') -> .eq().eq().eq().maybeSingle()
            if (columns === 'id') {
                return {
                    eq: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
                            })
                        })
                    })
                };
            }
            
            // 3. Handle Search: select('*') -> .eq().or().order()
            return {
                eq: vi.fn().mockReturnValue({
                    or: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: [computerscienceCourses[0]], error: null })
                    })
                })
            };
        });

        // Run Import
        const importResult = await UserCourseAPI.saveCourses(userId, [computerscienceCourses[0]], 'csv');
        
        // Debug output if failure continues
        if (importResult.success.length === 0) {
            console.error('Import failed with errors:', importResult.errors);
        }
        
        expect(importResult.success.length).toBe(1);

        // Run Search
        const searchResults = await UserCourseAPI.searchCourses(userId, 'CIS');
        expect(searchResults.length).toBe(1);
        expect(searchResults[0].courseCode).toBe('CIS 3100');
    });
});
