-- Migration 003: Fix CASCADE DELETE for schedule_courses
-- Purpose: Prevent orphaned records when schedules or courses are deleted
-- Date: 2025-10-29

-- Drop existing constraints without CASCADE
ALTER TABLE schedule_courses
DROP CONSTRAINT IF EXISTS schedule_courses_semester_course_id_fkey;

ALTER TABLE schedule_courses
DROP CONSTRAINT IF EXISTS schedule_courses_schedule_id_fkey;

-- Re-add with CASCADE DELETE
-- When a semester_course is deleted, all references in schedule_courses are also deleted
ALTER TABLE schedule_courses
ADD CONSTRAINT schedule_courses_semester_course_id_fkey
  FOREIGN KEY (semester_course_id)
  REFERENCES semester_courses(id)
  ON DELETE CASCADE;

-- When a schedule is deleted, all references in schedule_courses are also deleted
ALTER TABLE schedule_courses
ADD CONSTRAINT schedule_courses_schedule_id_fkey
  FOREIGN KEY (schedule_id)
  REFERENCES schedules(id)
  ON DELETE CASCADE;
