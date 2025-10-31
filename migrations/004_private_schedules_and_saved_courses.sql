-- Migration 004: Private Schedules and Saved Courses System
-- Purpose: Enable users to save schedules privately (not attached to semesters) and maintain a personal course library
-- Date: 2025-11-01
-- Changes:
--   1. Make semester_id nullable in schedules table (allows private schedules)
--   2. Add is_private flag to schedules (default false)
--   3. Create user_courses table for saved course library (50-course limit per user)
--   4. Add RLS policies to user_courses

-- ============================================================================
-- PHASE 1: Update SCHEDULES table - Make semester_id nullable
-- ============================================================================

-- Drop the existing NOT NULL constraint and re-add as nullable
-- First, drop the existing constraint that references schedules.semester_id
ALTER TABLE schedules
ALTER COLUMN semester_id DROP NOT NULL;

-- Add is_private column to schedules table (default false = attached to semester)
ALTER TABLE schedules
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add check constraint ensuring data integrity:
-- If is_private = true, then semester_id MUST be NULL
-- If is_private = false, then semester_id MUST NOT be NULL
ALTER TABLE schedules
ADD CONSTRAINT private_schedule_constraint
CHECK (
    (is_private = true AND semester_id IS NULL) OR
    (is_private = false AND semester_id IS NOT NULL)
);

-- Index for fast private schedule queries
CREATE INDEX IF NOT EXISTS idx_schedules_private
ON schedules(user_id, is_private)
WHERE is_private = true;

-- ============================================================================
-- PHASE 2: Create USER_COURSES table - Personal course library
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Course details (matches semester_courses structure for compatibility)
    course_code VARCHAR(50) NOT NULL,      -- "CIS 3100", "MATH 2010"
    course_name TEXT NOT NULL,              -- "Data Structures and Algorithms"
    section_group INTEGER NOT NULL,         -- 1, 2, 3
    schedule VARCHAR(100) NOT NULL,         -- "MW 11:00 AM - 12:30 PM"
    enrolled_current INTEGER DEFAULT 0,
    enrolled_total INTEGER NOT NULL,
    room VARCHAR(50),                       -- "CIS311TC", "MATH201TC"
    instructor VARCHAR(255),                -- "Dr. Smith", "Prof. Johnson"

    -- Source tracking
    source VARCHAR(50) DEFAULT 'manual',    -- 'manual', 'csv', 'extension'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique courses per user (user can have same course once across all saved courses)
    CONSTRAINT unique_course_per_user UNIQUE(user_id, course_code, section_group)
);

-- Indexes for fast user course queries
CREATE INDEX IF NOT EXISTS idx_user_courses_user ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_code ON user_courses(user_id, course_code);
CREATE INDEX IF NOT EXISTS idx_user_courses_source ON user_courses(user_id, source);

-- ============================================================================
-- PHASE 3: ROW LEVEL SECURITY (RLS) - Protect user_courses
-- ============================================================================

ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Users can only view their own saved courses
CREATE POLICY "Users can view their own saved courses" ON user_courses
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own saved courses
CREATE POLICY "Users can insert their own saved courses" ON user_courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own saved courses
CREATE POLICY "Users can update their own saved courses" ON user_courses
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own saved courses (with dependency check in app layer)
CREATE POLICY "Users can delete their own saved courses" ON user_courses
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PHASE 4: TRIGGERS - Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_user_courses_updated_at
    BEFORE UPDATE ON user_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 5: Helper Function - Count user courses
-- ============================================================================

CREATE OR REPLACE FUNCTION count_user_courses(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM user_courses
        WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 6: Helper Function - Check if course is used in any schedule
-- ============================================================================

CREATE OR REPLACE FUNCTION is_course_used_in_schedule(p_user_id UUID, p_course_code VARCHAR, p_section_group INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM schedule_courses sc
        JOIN semester_courses sem_c ON sc.semester_course_id = sem_c.id
        JOIN schedules s ON sc.schedule_id = s.id
        WHERE s.user_id = p_user_id
        AND sem_c.course_code = p_course_code
        AND sem_c.section_group = p_section_group
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON TABLE user_courses IS 'Personal course library for each user. Stores up to 50 courses per user. Courses can be from manual input, CSV import, or Chrome extension scraping.';
COMMENT ON COLUMN user_courses.source IS 'Source of the course: manual (user typed), csv (imported from file), or extension (scraped by Chrome extension)';
COMMENT ON COLUMN schedules.is_private IS 'If true, schedule is private (not attached to any semester). If false, must be attached to semester_id.';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- After running this migration:
-- 1. All existing schedules remain unchanged (is_private = false, semester_id retained)
-- 2. New private schedules can be created with is_private = true, semester_id = null
-- 3. Users can save up to 50 courses in user_courses table
-- 4. API layer (UserCourseAPI) enforces the 50-course limit
-- 5. Dependency checking must be done in app layer before deleting user_courses entries
