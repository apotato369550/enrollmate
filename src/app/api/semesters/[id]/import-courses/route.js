/**
 * EnrollMate Browser Extension - Import Courses Endpoint
 *
 * File: /app/api/semesters/[id]/import-courses/route.js
 * Purpose: Bulk import courses from browser extension to semester
 */

import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase.js';
import { SemesterCourseAPI } from '../../../../../../lib/api/semesterCourseAPI.js';

/**
 * POST /api/semesters/{semesterId}/import-courses
 * Import courses from browser extension
 */
export async function POST(request, { params }) {
  try {
    const { id: semesterId } = params;
    const { courses, importedAt } = await request.json();
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

    // Validate courses array
    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { message: 'No courses provided. Expected array of courses.' },
        { status: 400 }
      );
    }

    console.log(`Importing ${courses.length} courses for user ${user.id} into semester ${semesterId}`);

    // Verify semester belongs to user
    const { data: semester, error: semesterError } = await supabase
      .from('semesters')
      .select('id, user_id')
      .eq('id', semesterId)
      .single();

    if (semesterError || !semester) {
      return NextResponse.json(
        { message: 'Semester not found' },
        { status: 404 }
      );
    }

    if (semester.user_id !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden. Semester does not belong to user.' },
        { status: 403 }
      );
    }

    // Import to semester_courses table using the existing API
    // This leverages bulkImportCourses which handles duplicates and validation
    const result = await SemesterCourseAPI.bulkImportCourses(semesterId, courses);

    return NextResponse.json({
      message: `Imported ${courses.length} courses successfully`,
      coursesImported: courses.length,
      errors: []
    });

  } catch (error) {
    console.error('Import courses error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to import courses' },
      { status: 500 }
    );
  }
}
