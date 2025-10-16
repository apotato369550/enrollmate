-- Migration: Create scheduler tables for Enrollmate
-- Created: 2025-10-16
-- Description: Creates course_sections, user_schedules, and schedule_preferences tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create course_sections table
CREATE TABLE IF NOT EXISTS course_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) NOT NULL,
    course_name TEXT NOT NULL,
    section_group INTEGER NOT NULL,
    schedule VARCHAR(100) NOT NULL,
    enrolled_current INTEGER DEFAULT 0,
    enrolled_total INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'OK' CHECK (status IN ('OK', 'FULL', 'AT-RISK')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on course_code for fast filtering
CREATE INDEX IF NOT EXISTS idx_course_sections_course_code ON course_sections(course_code);

-- Create index on status for filtering available sections
CREATE INDEX IF NOT EXISTS idx_course_sections_status ON course_sections(status);

-- Create user_schedules table
CREATE TABLE IF NOT EXISTS user_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'My Schedule',
    sections_json JSONB NOT NULL,
    constraints_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast user schedule queries
CREATE INDEX IF NOT EXISTS idx_user_schedules_user_id ON user_schedules(user_id);

-- Create index on created_at for sorting schedules by date
CREATE INDEX IF NOT EXISTS idx_user_schedules_created_at ON user_schedules(created_at);

-- Create schedule_preferences table
CREATE TABLE IF NOT EXISTS schedule_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_earliest_start TIME DEFAULT '07:30',
    default_latest_end TIME DEFAULT '16:30',
    allow_full_sections BOOLEAN DEFAULT false,
    allow_at_risk_sections BOOLEAN DEFAULT true,
    max_full_per_schedule INTEGER DEFAULT 1,
    max_schedules INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_course_sections_updated_at
    BEFORE UPDATE ON course_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_schedules_updated_at
    BEFORE UPDATE ON user_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_preferences_updated_at
    BEFORE UPDATE ON schedule_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample course data for testing
INSERT INTO course_sections (course_code, course_name, section_group, schedule, enrolled_current, enrolled_total, status) VALUES
-- Computer Science Courses
('CIS 2103', 'Object-Oriented Programming', 1, 'MW 10:00 AM - 11:30 AM', 15, 30, 'OK'),
('CIS 2103', 'Object-Oriented Programming', 2, 'TTh 2:00 PM - 3:30 PM', 28, 30, 'OK'),
('CIS 2103', 'Object-Oriented Programming', 3, 'MW 2:00 PM - 3:30 PM', 30, 30, 'FULL'),

-- Mathematics Courses
('MATH 2010', 'Calculus I', 1, 'MW 8:00 AM - 9:30 AM', 22, 35, 'OK'),
('MATH 2010', 'Calculus I', 2, 'TTh 10:00 AM - 11:30 AM', 33, 35, 'OK'),
('MATH 2010', 'Calculus I', 3, 'MW 1:00 PM - 2:30 PM', 35, 35, 'FULL'),
('MATH 2010', 'Calculus I', 4, 'TTh 4:00 PM - 5:30 PM', 5, 35, 'AT-RISK'),

-- English Courses
('ENGL 1101', 'English Composition I', 1, 'MW 9:00 AM - 10:30 AM', 18, 25, 'OK'),
('ENGL 1101', 'English Composition I', 2, 'TTh 9:00 AM - 10:30 AM', 23, 25, 'OK'),
('ENGL 1101', 'English Composition I', 3, 'MW 3:00 PM - 4:30 PM', 25, 25, 'FULL'),
('ENGL 1101', 'English Composition I', 4, 'TTh 1:00 PM - 2:30 PM', 2, 25, 'AT-RISK'),

-- History Courses
('HIST 2110', 'US History I', 1, 'MW 11:00 AM - 12:30 PM', 45, 50, 'OK'),
('HIST 2110', 'US History I', 2, 'TTh 11:00 AM - 12:30 PM', 48, 50, 'OK'),
('HIST 2110', 'US History I', 3, 'MW 4:00 PM - 5:30 PM', 50, 50, 'FULL'),

-- Physics Courses
('PHYS 2211', 'Principles of Physics I', 1, 'MW 1:00 PM - 2:30 PM', 28, 40, 'OK'),
('PHYS 2211', 'Principles of Physics I', 2, 'TTh 8:00 AM - 9:30 AM', 35, 40, 'OK'),
('PHYS 2211', 'Principles of Physics I', 3, 'MW 3:00 PM - 4:30 PM', 40, 40, 'FULL'),
('PHYS 2211', 'Principles of Physics I', 4, 'TTh 2:00 PM - 3:30 PM', 3, 40, 'AT-RISK'),

-- Psychology Courses
('PSYC 1101', 'Introduction to Psychology', 1, 'MW 10:00 AM - 11:30 AM', 75, 80, 'OK'),
('PSYC 1101', 'Introduction to Psychology', 2, 'TTh 10:00 AM - 11:30 AM', 78, 80, 'OK'),
('PSYC 1101', 'Introduction to Psychology', 3, 'MW 12:00 PM - 1:30 PM', 80, 80, 'FULL'),

-- Biology Courses
('BIOL 1107', 'Principles of Biology I', 1, 'MW 8:00 AM - 9:30 AM', 95, 100, 'OK'),
('BIOL 1107', 'Principles of Biology I', 2, 'TTh 8:00 AM - 9:30 AM', 98, 100, 'OK'),
('BIOL 1107', 'Principles of Biology I', 3, 'MW 2:00 PM - 3:30 PM', 100, 100, 'FULL'),
('BIOL 1107', 'Principles of Biology I', 4, 'TTh 4:00 PM - 5:30 PM', 8, 100, 'AT-RISK'),

-- Chemistry Courses
('CHEM 1211', 'Principles of Chemistry I', 1, 'MW 9:00 AM - 10:30 AM', 55, 60, 'OK'),
('CHEM 1211', 'Principles of Chemistry I', 2, 'TTh 1:00 PM - 2:30 PM', 58, 60, 'OK'),
('CHEM 1211', 'Principles of Chemistry I', 3, 'MW 11:00 AM - 12:30 PM', 60, 60, 'FULL'),

-- Economics Courses
('ECON 2105', 'Principles of Macroeconomics', 1, 'MW 2:00 PM - 3:30 PM', 42, 45, 'OK'),
('ECON 2105', 'Principles of Macroeconomics', 2, 'TTh 2:00 PM - 3:30 PM', 44, 45, 'OK'),
('ECON 2105', 'Principles of Macroeconomics', 3, 'MW 4:00 PM - 5:30 PM', 45, 45, 'FULL'),

-- Sociology Courses
('SOCI 1101', 'Introduction to Sociology', 1, 'MW 1:00 PM - 2:30 PM', 32, 35, 'OK'),
('SOCI 1101', 'Introduction to Sociology', 2, 'TTh 3:00 PM - 4:30 PM', 34, 35, 'OK'),
('SOCI 1101', 'Introduction to Sociology', 3, 'MW 3:00 PM - 4:30 PM', 35, 35, 'FULL'),

-- Political Science Courses
('POLS 1101', 'American Government', 1, 'MW 12:00 PM - 1:30 PM', 85, 90, 'OK'),
('POLS 1101', 'American Government', 2, 'TTh 12:00 PM - 1:30 PM', 88, 90, 'OK'),
('POLS 1101', 'American Government', 3, 'MW 5:00 PM - 6:30 PM', 90, 90, 'FULL'),

-- Art Courses
('ARTS 1010', 'Introduction to Drawing', 1, 'MW 9:00 AM - 11:00 AM', 18, 20, 'OK'),
('ARTS 1010', 'Introduction to Drawing', 2, 'TTh 9:00 AM - 11:00 AM', 19, 20, 'OK'),
('ARTS 1010', 'Introduction to Drawing', 3, 'MW 2:00 PM - 4:00 PM', 20, 20, 'FULL'),

-- Music Courses
('MUSC 1100', 'Music Appreciation', 1, 'MW 11:00 AM - 12:30 PM', 65, 70, 'OK'),
('MUSC 1100', 'Music Appreciation', 2, 'TTh 11:00 AM - 12:30 PM', 68, 70, 'OK'),
('MUSC 1100', 'Music Appreciation', 3, 'MW 1:00 PM - 2:30 PM', 70, 70, 'FULL'),

-- Philosophy Courses
('PHIL 2010', 'Introduction to Philosophy', 1, 'MW 3:00 PM - 4:30 PM', 28, 30, 'OK'),
('PHIL 2010', 'Introduction to Philosophy', 2, 'TTh 3:00 PM - 4:30 PM', 29, 30, 'OK'),
('PHIL 2010', 'Introduction to Philosophy', 3, 'MW 5:00 PM - 6:30 PM', 30, 30, 'FULL'),

-- Theatre Courses
('THEA 1100', 'Theatre Appreciation', 1, 'MW 4:00 PM - 5:30 PM', 42, 45, 'OK'),
('THEA 1100', 'Theatre Appreciation', 2, 'TTh 4:00 PM - 5:30 PM', 43, 45, 'OK'),
('THEA 1100', 'Theatre Appreciation', 3, 'MW 6:00 PM - 7:30 PM', 45, 45, 'FULL'),

-- Communication Courses
('COMM 1100', 'Human Communication', 1, 'MW 8:00 AM - 9:30 AM', 38, 40, 'OK'),
('COMM 1100', 'Human Communication', 2, 'TTh 8:00 AM - 9:30 AM', 39, 40, 'OK'),
('COMM 1100', 'Human Communication', 3, 'MW 10:00 AM - 11:30 AM', 40, 40, 'FULL'),

-- Foreign Language Courses
('SPAN 1001', 'Elementary Spanish I', 1, 'MW 12:00 PM - 1:30 PM', 22, 25, 'OK'),
('SPAN 1001', 'Elementary Spanish I', 2, 'TTh 12:00 PM - 1:30 PM', 24, 25, 'OK'),
('SPAN 1001', 'Elementary Spanish I', 3, 'MW 2:00 PM - 3:30 PM', 25, 25, 'FULL'),
('SPAN 1001', 'Elementary Spanish I', 4, 'TTh 2:00 PM - 3:30 PM', 1, 25, 'AT-RISK'),

-- Business Courses
('BUSA 2106', 'Legal Environment of Business', 1, 'MW 9:00 AM - 10:30 AM', 48, 50, 'OK'),
('BUSA 2106', 'Legal Environment of Business', 2, 'TTh 9:00 AM - 10:30 AM', 49, 50, 'OK'),
('BUSA 2106', 'Legal Environment of Business', 3, 'MW 11:00 AM - 12:30 PM', 50, 50, 'FULL'),

-- Education Courses
('EDUC 2110', 'Investigating Critical Issues in Education', 1, 'MW 1:00 PM - 2:30 PM', 28, 30, 'OK'),
('EDUC 2110', 'Investigating Critical Issues in Education', 2, 'TTh 1:00 PM - 2:30 PM', 29, 30, 'OK'),
('EDUC 2110', 'Investigating Critical Issues in Education', 3, 'MW 3:00 PM - 4:30 PM', 30, 30, 'FULL'),

-- Health Science Courses
('HLTH 2051', 'Health and Wellness', 1, 'MW 10:00 AM - 11:30 AM', 58, 60, 'OK'),
('HLTH 2051', 'Health and Wellness', 2, 'TTh 10:00 AM - 11:30 AM', 59, 60, 'OK'),
('HLTH 2051', 'Health and Wellness', 3, 'MW 12:00 PM - 1:30 PM', 60, 60, 'FULL'),

-- Environmental Science Courses
('ENVS 2202', 'Environmental Science', 1, 'MW 2:00 PM - 3:30 PM', 72, 75, 'OK'),
('ENVS 2202', 'Environmental Science', 2, 'TTh 2:00 PM - 3:30 PM', 74, 75, 'OK'),
('ENVS 2202', 'Environmental Science', 3, 'MW 4:00 PM - 5:30 PM', 75, 75, 'FULL'),

-- Anthropology Courses
('ANTH 1102', 'Introduction to Anthropology', 1, 'MW 3:00 PM - 4:30 PM', 35, 40, 'OK'),
('ANTH 1102', 'Introduction to Anthropology', 2, 'TTh 3:00 PM - 4:30 PM', 38, 40, 'OK'),
('ANTH 1102', 'Introduction to Anthropology', 3, 'MW 5:00 PM - 6:30 PM', 40, 40, 'FULL'),

-- Geography Courses
('GEOG 1101', 'Introduction to Human Geography', 1, 'MW 11:00 AM - 12:30 PM', 42, 45, 'OK'),
('GEOG 1101', 'Introduction to Human Geography', 2, 'TTh 11:00 AM - 12:30 PM', 44, 45, 'OK'),
('GEOG 1101', 'Introduction to Human Geography', 3, 'MW 1:00 PM - 2:30 PM', 45, 45, 'FULL'),

-- Computer Science Advanced Courses
('CIS 3100', 'Data Structures and Algorithms', 1, 'MW 11:00 AM - 12:30 PM', 25, 30, 'OK'),
('CIS 3100', 'Data Structures and Algorithms', 2, 'TTh 11:00 AM - 12:30 PM', 28, 30, 'OK'),
('CIS 3100', 'Data Structures and Algorithms', 3, 'MW 1:00 PM - 2:30 PM', 30, 30, 'FULL'),

-- Statistics Courses
('STAT 2000', 'Introduction to Statistics', 1, 'MW 8:00 AM - 9:30 AM', 48, 50, 'OK'),
('STAT 2000', 'Introduction to Statistics', 2, 'TTh 8:00 AM - 9:30 AM', 49, 50, 'OK'),
('STAT 2000', 'Introduction to Statistics', 3, 'MW 4:00 PM - 5:30 PM', 50, 50, 'FULL'),

-- Literature Courses
('ENGL 2120', 'British Literature I', 1, 'MW 2:00 PM - 3:30 PM', 22, 25, 'OK'),
('ENGL 2120', 'British Literature I', 2, 'TTh 2:00 PM - 3:30 PM', 24, 25, 'OK'),
('ENGL 2120', 'British Literature I', 3, 'MW 4:00 PM - 5:30 PM', 25, 25, 'FULL'),

-- Creative Writing Courses
('ENGL 2060', 'Creative Writing', 1, 'MW 3:00 PM - 4:30 PM', 18, 20, 'OK'),
('ENGL 2060', 'Creative Writing', 2, 'TTh 3:00 PM - 4:30 PM', 19, 20, 'OK'),
('ENGL 2060', 'Creative Writing', 3, 'MW 5:00 PM - 6:30 PM', 20, 20, 'FULL');

-- Add comments for documentation
COMMENT ON TABLE course_sections IS 'Stores course section information including schedule, enrollment, and availability status';
COMMENT ON TABLE user_schedules IS 'Stores user-generated course schedules with selected sections and constraints used';
COMMENT ON TABLE schedule_preferences IS 'Stores user preferences for schedule generation including time windows and enrollment preferences';

-- Enable Row Level Security (RLS) for user_schedules and schedule_preferences
ALTER TABLE user_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_schedules
CREATE POLICY "Users can view their own schedules" ON user_schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" ON user_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" ON user_schedules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" ON user_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for schedule_preferences
CREATE POLICY "Users can view their own preferences" ON schedule_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON schedule_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON schedule_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON schedule_preferences
    FOR DELETE USING (auth.uid() = user_id);