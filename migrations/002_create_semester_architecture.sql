-- Migration: Create semester architecture tables for EnrollMate
-- Created: 2025-10-23
-- Description: Implements semester containers, semester-specific courses, schedules (A/B/C), and schedule-course relationships

-- ============================================================================
-- SEMESTERS TABLE: Container for each semester (1st Semester 2025, Summer 2024)
-- ============================================================================
CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,  -- "1st Semester 2025", "Summer 2024", "2nd Semester 2023"
    school_year VARCHAR(50) NOT NULL,  -- "2024-2025", "2023-2024"
    semester_type VARCHAR(20) NOT NULL CHECK (semester_type IN ('1st', '2nd', 'Summer')),
    year INTEGER NOT NULL,  -- 2025, 2024, 2023
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    is_current BOOLEAN DEFAULT false,  -- Only one current semester per user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique semester names per user
    CONSTRAINT unique_semester_per_user UNIQUE(user_id, name)
);

-- Index for fast user semester queries
CREATE INDEX IF NOT EXISTS idx_semesters_user_id ON semesters(user_id);
CREATE INDEX IF NOT EXISTS idx_semesters_current ON semesters(user_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_semesters_status ON semesters(status);

-- ============================================================================
-- SEMESTER_COURSES TABLE: Course catalog specific to each semester
-- ============================================================================
CREATE TABLE IF NOT EXISTS semester_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    course_code VARCHAR(50) NOT NULL,  -- "CIS 3100", "MATH 2010"
    course_name TEXT NOT NULL,  -- "Data Structures and Algorithms"
    section_group INTEGER NOT NULL,  -- 1, 2, 3
    schedule VARCHAR(100) NOT NULL,  -- "MW 11:00 AM - 12:30 PM"
    enrolled_current INTEGER DEFAULT 0,
    enrolled_total INTEGER NOT NULL,
    room VARCHAR(50),  -- "CIS311TC", "MATH201TC"
    instructor VARCHAR(255),  -- "Dr. Smith", "Prof. Johnson"
    status VARCHAR(20) DEFAULT 'OK' CHECK (status IN ('OK', 'FULL', 'AT-RISK')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique course sections per semester
    CONSTRAINT unique_course_section_per_semester UNIQUE(semester_id, course_code, section_group)
);

-- Indexes for fast course queries
CREATE INDEX IF NOT EXISTS idx_semester_courses_semester ON semester_courses(semester_id);
CREATE INDEX IF NOT EXISTS idx_semester_courses_code ON semester_courses(semester_id, course_code);
CREATE INDEX IF NOT EXISTS idx_semester_courses_status ON semester_courses(status);

-- ============================================================================
-- SCHEDULES TABLE: Alternative schedules (Schedule A, B, C) per semester
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,  -- "Schedule A", "Schedule B", "My Perfect Schedule"
    description TEXT,  -- Optional description
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'finalized', 'archived')),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique schedule names per semester per user
    CONSTRAINT unique_schedule_per_semester UNIQUE(semester_id, user_id, name)
);

-- Indexes for fast schedule queries
CREATE INDEX IF NOT EXISTS idx_schedules_semester ON schedules(semester_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_favorite ON schedules(is_favorite) WHERE is_favorite = true;

-- ============================================================================
-- SCHEDULE_COURSES TABLE: Junction table linking schedules to courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS schedule_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    semester_course_id UUID NOT NULL REFERENCES semester_courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate courses in same schedule
    CONSTRAINT unique_course_per_schedule UNIQUE(schedule_id, semester_course_id)
);

-- Indexes for fast junction queries
CREATE INDEX IF NOT EXISTS idx_schedule_courses_schedule ON schedule_courses(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_courses_course ON schedule_courses(semester_course_id);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================
CREATE TRIGGER update_semesters_updated_at
    BEFORE UPDATE ON semesters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semester_courses_updated_at
    BEFORE UPDATE ON semester_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS): Ensure users can only see their own data
-- ============================================================================
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for semesters
CREATE POLICY "Users can view their own semesters" ON semesters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own semesters" ON semesters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own semesters" ON semesters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own semesters" ON semesters
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for schedules
CREATE POLICY "Users can view their own schedules" ON schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" ON schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" ON schedules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" ON schedules
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for schedule_courses (based on schedule ownership)
CREATE POLICY "Users can view courses in their schedules" ON schedule_courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM schedules
            WHERE schedules.id = schedule_courses.schedule_id
            AND schedules.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add courses to their schedules" ON schedule_courses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM schedules
            WHERE schedules.id = schedule_courses.schedule_id
            AND schedules.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove courses from their schedules" ON schedule_courses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM schedules
            WHERE schedules.id = schedule_courses.schedule_id
            AND schedules.user_id = auth.uid()
        )
    );

-- RLS for semester_courses (based on semester ownership)
CREATE POLICY "Users can view courses in their semesters" ON semester_courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM semesters
            WHERE semesters.id = semester_courses.semester_id
            AND semesters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add courses to their semesters" ON semester_courses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM semesters
            WHERE semesters.id = semester_courses.semester_id
            AND semesters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update courses in their semesters" ON semester_courses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM semesters
            WHERE semesters.id = semester_courses.semester_id
            AND semesters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete courses from their semesters" ON semester_courses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM semesters
            WHERE semesters.id = semester_courses.semester_id
            AND semesters.user_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMENTS: Documentation for tables
-- ============================================================================
COMMENT ON TABLE semesters IS 'Container for academic semesters (e.g., 1st Semester 2025). Each user can have multiple semesters.';
COMMENT ON TABLE semester_courses IS 'Course catalog specific to each semester. Contains available course sections that can be added to schedules.';
COMMENT ON TABLE schedules IS 'Alternative schedules (Schedule A, B, C) created by users for each semester.';
COMMENT ON TABLE schedule_courses IS 'Junction table linking schedules to specific course sections from the semester catalog.';

-- ============================================================================
-- HELPER FUNCTION: Ensure only one current semester per user
-- ============================================================================
CREATE OR REPLACE FUNCTION enforce_single_current_semester()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = true THEN
        -- Set all other semesters for this user to not current
        UPDATE semesters
        SET is_current = false
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_current_semester_trigger
    AFTER INSERT OR UPDATE OF is_current ON semesters
    FOR EACH ROW
    WHEN (NEW.is_current = true)
    EXECUTE FUNCTION enforce_single_current_semester();
