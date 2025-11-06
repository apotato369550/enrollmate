# src/lib/ - Frontend Utilities

**Purpose**: Client-side utility functions and configurations for the frontend.

**Pattern**: Singleton instances, configuration objects, client-side helpers.

**Remember**: Update `/CHANGELOG.md` after any changes to this directory.

---

## Files Overview

| File | Purpose | Exports |
|------|---------|---------|
| `supabase.js` | Supabase client configuration | `supabase` singleton instance |

---

## Key Principles

### 1. Singleton Pattern
Create single instances of clients/configs:
```javascript
// ✅ CORRECT (singleton)
export const supabase = createClient(url, key);

// Import once, use everywhere
import { supabase } from './lib/supabase.js';

// ❌ WRONG (multiple instances)
function getSupabase() {
  return createClient(url, key);  // New instance each time!
}
```

### 2. Environment Variables
Use Next.js public env vars for client-side:
```javascript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_API;
const supabaseKey = process.env.NEXT_PUBLIC_PUBLIC_API_KEY;
```

**Note**: `NEXT_PUBLIC_` prefix makes vars available in browser.

### 3. Client-Side Only
These utilities run in the browser, not on server:
```javascript
// Browser APIs available
window.localStorage.getItem('token');
document.getElementById('root');

// Server-side code won't work here
const fs = require('fs');  // ❌ Won't work in browser
```

---

## supabase.js

**Purpose**: Configures and exports Supabase client for authentication and database operations.

**Setup**:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_API;
const supabaseKey = process.env.NEXT_PUBLIC_PUBLIC_API_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Usage**:
```javascript
import { supabase } from '../../lib/supabase.js';

// Authentication
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Database queries
const { data: schedules } = await supabase
  .from('schedules')
  .select('*')
  .eq('user_id', userId);

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

**Configuration Options**:
- `auth.autoRefreshToken` - Automatic token refresh
- `auth.persistSession` - Persist session in localStorage
- `global.headers` - Custom headers for all requests

---

## Common Frontend Utilities

### Authentication Helpers
```javascript
// Check if user is authenticated
export async function isAuthenticated() {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

// Get current user or redirect
export async function requireAuth(router) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    router.push('/login');
    return null;
  }
  return user;
}
```

### Local Storage Helpers
```javascript
// Store/retrieve user preferences
export function savePreference(key, value) {
  localStorage.setItem(`enrollmate_${key}`, JSON.stringify(value));
}

export function getPreference(key) {
  const value = localStorage.getItem(`enrollmate_${key}`);
  return value ? JSON.parse(value) : null;
}
```

### Format Helpers
```javascript
// Format dates for display
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

// Format time strings
export function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}
```

---

## Environment Configuration

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_API=https://your-project.supabase.co
NEXT_PUBLIC_PUBLIC_API_KEY=your-anon-key
```

**Security Notes**:
- `NEXT_PUBLIC_` vars are exposed to browser (safe for public keys)
- Never expose server-side secrets with `NEXT_PUBLIC_` prefix
- Supabase anon key is safe (Row-Level Security protects data)

---

## Error Handling Patterns

### Supabase Errors
```javascript
const { data, error } = await supabase.from('schedules').select('*');

if (error) {
  console.error('Database error:', error.message);
  // User-friendly error message
  alert('Failed to load schedules. Please try again.');
  return;
}

// Success - use data
setSchedules(data);
```

### Auth Errors
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (error) {
  switch(error.message) {
    case 'Invalid login credentials':
      alert('Incorrect email or password');
      break;
    case 'Email not confirmed':
      alert('Please verify your email first');
      break;
    default:
      alert('Login failed. Please try again.');
  }
  return;
}

// Success - redirect
router.push('/dashboard');
```

---

## Testing Guidelines

- Mock Supabase client in tests
- Test authentication flows
- Test error handling
- Test environment variable fallbacks

**Example Mock**:
```javascript
jest.mock('../../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
    })),
  }
}));
```

---

## Future Utilities

Consider adding:
- `analytics.js` - Analytics tracking helpers
- `validators.js` - Client-side validation functions
- `formatters.js` - Data formatting utilities
- `storage.js` - File upload/download helpers
- `hooks.js` - Custom React hooks (useAuth, useSchedules, etc.)

---

**Last Updated**: 2025-11-07
