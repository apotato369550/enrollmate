/**
 * EnrollMate Browser Extension - Import Courses to User Library Endpoint
 *
 * File: /app/api/users/[userId]/courses/route.js
 * Purpose: Import courses from browser extension to user's course library (max 50 courses)
 */

import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase.js';
import UserCourseAPI from '../../../../../../lib/api/userCourseAPI.js';

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

    // Extract and verify token
    const token = authHeader.split(' ')[1];
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
    const stats = await UserCourseAPI.getCourseStats(userId);
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

    // Import courses using UserCourseAPI (source = 'extension')
    const result = await UserCourseAPI.saveCourses(userId, coursesToImport, 'extension');

    // Prepare response
    const response = {
      message: result.message,
      coursesImported: result.success.length,
      coursesSkipped: result.errors.length,
      stats: await UserCourseAPI.getCourseStats(userId)
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

    // Extract and verify token
    const token = authHeader.split(' ')[1];
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

    // Fetch courses and stats
    const courses = await UserCourseAPI.getUserCourses(userId);
    const stats = await UserCourseAPI.getCourseStats(userId);

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
