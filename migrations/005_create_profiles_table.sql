-- Migration 005: Create Profiles Table with RLS
-- Purpose: Store user profile information (name, student ID, avatar, etc.)
-- Date: 2025-12-21

-- ============================================================================
-- PROFILES TABLE: User profile data
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    middle_initial VARCHAR(1),
    student_id VARCHAR(255) NOT NULL UNIQUE,
    usertype VARCHAR(50) DEFAULT 'student' CHECK (usertype IN ('student', 'admin', 'faculty')),
    avatar_url VARCHAR(500),
    program VARCHAR(255),
    year_level VARCHAR(255),
    contact_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_usertype ON profiles(usertype);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow unauthenticated users (anon) to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS: Documentation
-- ============================================================================

COMMENT ON TABLE profiles IS 'Stores user profile information including name, student ID, contact details, and avatar URL';
COMMENT ON COLUMN profiles.student_id IS 'Unique identifier for student across the system';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to users profile picture stored in Supabase storage';
COMMENT ON COLUMN profiles.usertype IS 'User role: student, admin, or faculty';
