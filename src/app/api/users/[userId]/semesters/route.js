/**
 * EnrollMate Browser Extension - Get User Semesters Endpoint
 *
 * File: /app/api/users/[userId]/semesters/route.js
 * Purpose: Fetch all semesters for authenticated user
 */

import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase.js';
import { SemesterAPI } from '../../../../../../lib/api/semesterAPI.js';

/**
 * GET /api/users/{userId}/semesters
 * Get all semesters for a specific user
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

    // Verify user matches requested userId (authorization check)
    if (user.id !== userId) {
      return NextResponse.json(
        { message: 'Forbidden. You can only access your own semesters.' },
        { status: 403 }
      );
    }

    // Fetch semesters using existing SemesterAPI
    const semesters = await SemesterAPI.getUserSemesters(userId);

    // Format response for browser extension
    return NextResponse.json({
      semesters: semesters.map(sem => ({
        id: sem.id,
        name: sem.name,
        year: sem.year,
        semester_type: sem.semesterType || sem.semester_type,
        is_current: sem.isCurrent !== undefined ? sem.isCurrent : sem.is_current,
        status: sem.status
      }))
    });

  } catch (error) {
    console.error('Get semesters error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch semesters' },
      { status: 500 }
    );
  }
}
