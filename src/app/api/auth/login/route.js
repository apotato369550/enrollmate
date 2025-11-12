/**
 * EnrollMate Browser Extension - Authentication Endpoint
 *
 * File: /app/api/auth/login/route.js
 * Purpose: Authenticate user and return JWT token for browser extension
 */

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate request body
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Authentication error:', error.message);
      return NextResponse.json(
        { message: error.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user data exists
    if (!data.user || !data.session) {
      return NextResponse.json(
        { message: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Return user info and token for browser extension
    return NextResponse.json({
      token: data.session.access_token,
      userId: data.user.id,
      email: data.user.email,
      expiresAt: data.session.expires_at
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
