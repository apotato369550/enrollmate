/**
 * EnrollMate Browser Extension - Import Courses to User Library Endpoint
 *
 * File: /app/api/users/[userId]/courses/route.js
 * Purpose: Import courses from browser extension to user's course library (max 50 courses)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase server-side client creation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_API;
const supabaseAnonKey = process.env.NEXT_PUBLIC_PUBLIC_API_KEY;

/**
 * Helper function to save a single course with authenticated client
 */
async function saveCourse(supabase, userId, courseData, source = 'extension') {
  // Validate required fields
  const courseCode = courseData.courseCode || courseData.course_code;
  const courseName = courseData.courseName || courseData.course_name;
  const sectionGroup = parseInt(courseData.sectionGroup || courseData.section_group) || 1;

  if (!courseCode || !courseName) {
    throw new Error(`Missing required fields: courseCode="${courseCode}", courseName="${courseName}"`);
  }

  // Check if course already exists for this user
  const { data: existing, error: existingError } = await supabase
    .from('user_courses')
    .select('id')
    .eq('user_id', userId)
    .eq('course_code', courseCode)
    .eq('section_group', sectionGroup)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    // Course already saved, update the source
    const { data, error } = await supabase
      .from('user_courses')
      .update({ source })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Insert new course
  const { data, error } = await supabase
    .from('user_courses')
    .insert({
      user_id: userId,
      course_code: courseCode,
      course_name: courseName,
      section_group: sectionGroup,
      schedule: courseData.schedule || '',
      enrolled_current: parseInt(courseData.enrolledCurrent || courseData.enrolled_current) || 0,
      enrolled_total: parseInt(courseData.enrolledTotal || courseData.enrolled_total) || 0,
      room: courseData.room || null,
      instructor: courseData.instructor || null,
      source: source,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    throw new Error(`Failed to save course: ${error.message}`);
  }

  return data;
}

/**
 * Helper function to get course stats
 */
async function getCourseStats(supabase, userId) {
  const { data, error } = await supabase
    .from('user_courses')
    .select('source')
    .eq('user_id', userId);

  if (error) throw error;

  const stats = {
    total: data.length,
    manual: data.filter(c => c.source === 'manual').length,
    csv: data.filter(c => c.source === 'csv').length,
    extension: data.filter(c => c.source === 'extension').length,
    remaining: 50 - data.length,
  };

  return stats;
}

/**
 * Helper function to save multiple courses
 */
async function saveCourses(supabase, userId, coursesData, source = 'extension') {
  const savedCourses = [];
  const errors = [];

  for (const courseData of coursesData) {
    try {
      const saved = await saveCourse(supabase, userId, courseData, source);
      savedCourses.push(saved);
    } catch (error) {
      errors.push({
        course: `${courseData.courseCode} - Section ${courseData.sectionGroup || courseData.section_group}`,
        error: error.message,
      });
    }
  }

  return {
    success: savedCourses,
    errors: errors,
    message: errors.length > 0
      ? `Saved ${savedCourses.length}/${coursesData.length} courses. ${errors.length} failed.`
      : `Successfully saved all ${savedCourses.length} courses`,
  };
}

/**
 * POST /api/users/{userId}/courses
 * Import courses to user's course library from browser extension
 */
export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    const authHeader = request.headers.get('authorization');

    // Validate authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized. Missing or invalid Authorization header.' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Create authenticated Supabase client for this request
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verify token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification error:', error?.message);
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Verify user matches requested userId (authorization check)
    if (user.id !== userId) {
      return NextResponse.json(
        { message: 'Forbidden. You can only import courses to your own library.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { courses } = body;

    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { message: 'Invalid request. "courses" must be a non-empty array.' },
        { status: 400 }
      );
    }

    // Check current course count
    const stats = await getCourseStats(supabase, userId);
    const available = stats.remaining;

    if (available === 0) {
      return NextResponse.json(
        {
          message: 'Course library is full (50-course limit). Please delete some courses before importing.',
          stats: {
            total: stats.total,
            remaining: stats.remaining,
            coursesAttempted: courses.length
          }
        },
        { status: 400 }
      );
    }

    // Limit import to available space
    let coursesToImport = courses;
    let limitWarning = null;

    if (courses.length > available) {
      coursesToImport = courses.slice(0, available);
      limitWarning = `Only importing first ${available} courses due to 50-course limit. ${courses.length - available} courses were skipped.`;
    }

    // Import courses using authenticated client
    const result = await saveCourses(supabase, userId, coursesToImport, 'extension');

    // Prepare response
    const response = {
      message: result.message,
      coursesImported: result.success.length,
      coursesSkipped: result.errors.length,
      stats: await getCourseStats(supabase, userId)
    };

    if (limitWarning) {
      response.limitWarning = limitWarning;
    }

    if (result.errors.length > 0) {
      response.errors = result.errors;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Import courses error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to import courses' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/{userId}/courses
 * Get all courses in user's library
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const authHeader = request.headers.get('authorization');

    // Validate authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized. Missing or invalid Authorization header.' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Create authenticated Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verify token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification error:', error?.message);
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Verify user matches requested userId
    if (user.id !== userId) {
      return NextResponse.json(
        { message: 'Forbidden. You can only access your own course library.' },
        { status: 403 }
      );
    }

    // Fetch courses
    const { data: courses, error: coursesError } = await supabase
      .from('user_courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (coursesError) throw coursesError;

    // Get stats
    const stats = await getCourseStats(supabase, userId);

    return NextResponse.json({
      courses,
      stats
    });

  } catch (error) {
    console.error('Get user courses error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
