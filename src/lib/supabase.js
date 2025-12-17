import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_API
const supabaseAnonKey = process.env.NEXT_PUBLIC_PUBLIC_API_KEY

// Debug logging for environment variables (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Supabase Configuration:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyPrefix: supabaseAnonKey?.substring(0, 20)
  });
}

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'enrollmate-web'
    }
  },
  // Add fetch options for better error handling
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})