import { describe, it, expect } from 'vitest';
import { Schedule } from '../../../lib/domain/Schedule.js';
import { computerscienceCourses } from '../../fixtures/sample-courses.js';

describe('Schedule Domain Model', () => {
  it('should detect time conflict for same day/time', () => {
    // Need to convert fixtures to SemesterCourse objects or mock them to look like SemesterCourses
    // Schedule.js expects objects with properties: sectionGroup, schedule, enrolledCurrent, enrolledTotal, status, courseCode, courseName
    
    // The fixture courses match this structure mostly, but let's ensure
    const course1 = {
        ...computerscienceCourses[0],
        id: 'c1',
        sectionGroup: computerscienceCourses[0].sectionGroup,
        schedule: computerscienceCourses[0].schedule,
        enrolledCurrent: computerscienceCourses[0].enrolledCurrent,
        enrolledTotal: computerscienceCourses[0].enrolledTotal,
        status: 'OK'
    };
    
    const course2 = {
        ...computerscienceCourses[1],
        id: 'c2',
        status: 'OK'
    }; // TTh 11:00-12:30 (no conflict with MW)

    const schedule = new Schedule('test-id', null, 'user-1', 'Test', 'Test', 'draft', false, true);
    expect(schedule.hasConflict(course1)).toBe(false);
    expect(schedule.hasConflict(course2)).toBe(false);

    // Add course1
    schedule.addCourse(course1);

    // Should conflict with another MW 11-12:30
    const conflictingCourse = {
      ...course1,
      id: 'c3',
      courseCode: 'MATH 2010',
      schedule: 'MW 11:30 AM - 1:00 PM'
    };
    expect(schedule.hasConflict(conflictingCourse)).toBe(true);
  });

  it('should calculate total credits', () => {
    const schedule = new Schedule('test-id', null, 'user-1', 'Test', 'Test', 'draft', false, true);
    expect(schedule.getTotalCredits()).toBe(0);
    
    const c1 = { ...computerscienceCourses[0], id: '1', status: 'OK' };
    const c2 = { ...computerscienceCourses[1], id: '2', status: 'OK' };
    const c3 = { ...computerscienceCourses[2], id: '3', status: 'OK' };

    schedule.addCourse(c1);
    schedule.addCourse(c2);
    schedule.addCourse(c3);
    
    expect(schedule.getTotalCredits()).toBe(9); // 3 courses × 3 credits
  });

  it('should transition between statuses', () => {
    const schedule = new Schedule('test-id', null, 'user-1', 'Test', 'Test', 'draft', false, true);
    expect(schedule.status).toBe('draft');
    expect(schedule.isEditable()).toBe(true);

    schedule.activate();
    expect(schedule.status).toBe('active');
    expect(schedule.isEditable()).toBe(true);

    schedule.finalize();
    expect(schedule.status).toBe('finalized');
    expect(schedule.isEditable()).toBe(false);
  });
});
