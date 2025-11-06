# src/app/ - Next.js App Router

**Purpose**: Page routes and layouts using Next.js App Router (file-based routing).

**Pattern**: Each folder = route segment, `page.js` = route endpoint, `layout.js` = shared UI wrapper.

**Remember**: Update `/CHANGELOG.md` after any changes to this directory.

---

## Route Structure

| Route | File | Purpose |
|-------|------|---------|
| `/` | `page.js` | Landing page |
| `/dashboard` | `dashboard/page.js` | Main dashboard with semester overview |
| `/scheduler` | `scheduler/page.js` | Course scheduling interface |
| `/schedule/[id]` | `schedule/[scheduleId]/page.js` | Individual schedule view/edit |
| `/courses` | `courses/page.js` | Course catalog browser |
| `/profile` | `profile/page.js` | User profile settings |
| `/login` | `login/page.js` | Authentication (login) |
| `/signup` | `signup/page.js` | User registration |

---

## File Conventions

### page.js
- Defines route UI
- Can be server or client component
- Default export is the page component

### layout.js
- Shared UI wrapper for routes
- Wraps page.js and nested layouts
- Persists across navigations

### loading.js (optional)
- Loading UI shown while page loads
- Automatic code-splitting boundary

### error.js (optional)
- Error boundary for route segment
- Catches errors and shows fallback UI

---

## Authentication Requirements

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page

### Protected Routes (require authentication)
- `/dashboard`
- `/scheduler`
- `/schedule/[id]`
- `/courses`
- `/profile`

**Protection Mechanism**:
1. **Client-side**: useEffect checks `supabase.auth.getUser()`
2. **Server-side**: `middleware.js` intercepts at edge

---

## Common Page Patterns

### Client Component Structure
```javascript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase.js';

export default function Page() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
      else setUser(user);
    };
    getUser();
  }, []);

  // Data loading
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        // Fetch data
        setLoading(false);
      };
      loadData();
    }
  }, [user]);

  if (!user || loading) return <div>Loading...</div>;

  return (/* page UI */);
}
```

### Dynamic Route Parameters
```javascript
// In schedule/[scheduleId]/page.js
export default function SchedulePage({ params }) {
  const scheduleId = params.scheduleId;
  // Use scheduleId to fetch specific schedule
}
```

---

## Key Pages Overview

### Dashboard (`dashboard/page.js`)
**Purpose**: Main hub showing current semester, schedules, and quick actions

**Key Features**:
- Semester selector dropdown
- List of user's schedules
- Quick create buttons
- Recent activity

**Data Loaded**:
- Current semester
- All schedules for current semester
- User profile info

### Scheduler (`scheduler/page.js`)
**Purpose**: Interactive scheduling interface for building course schedules

**Key Features**:
- Course search/filter
- Add/remove courses
- Real-time conflict detection
- Multiple schedule creation
- Course list from semester catalog

**Data Loaded**:
- Available courses for semester
- User's schedules
- Enrollment status

### Schedule Detail (`schedule/[scheduleId]/page.js`)
**Purpose**: View and edit individual schedule

**Key Features**:
- Schedule details (name, description)
- Course list with times
- Edit mode toggle
- Delete schedule
- Export to PDF

**Data Loaded**:
- Specific schedule by ID
- Associated courses with details

### Courses (`courses/page.js`)
**Purpose**: Browse and manage semester course catalog

**Key Features**:
- Course search
- Filter by status (OK, FULL, CLOSED)
- CSV import
- Add to user library (max 50)

**Data Loaded**:
- All courses for current semester
- User's saved courses count

### Profile (`profile/page.js`)
**Purpose**: User settings and profile management

**Key Features**:
- Profile picture upload
- Email/name update
- Semester management
- Account deletion

**Data Loaded**:
- User profile
- User's semesters

---

## Navigation Pattern

Use Next.js `useRouter` for programmatic navigation:
```javascript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate to route
router.push('/dashboard');

// Navigate with state
router.push(`/schedule/${scheduleId}`);

// Go back
router.back();
```

Use `Link` component for declarative navigation:
```javascript
import Link from 'next/link';

<Link href="/dashboard">Go to Dashboard</Link>
```

---

## State Management

**Local State** (most pages):
- useState for component state
- useEffect for data fetching
- Props for parent-child communication

**Global State** (when needed):
- React Context for user/semester context
- URL parameters for shareable state

---

## Error Handling

```javascript
try {
  await API.createSchedule(data);
  router.push(`/schedule/${schedule.id}`);
} catch (error) {
  console.error('Error:', error);
  alert('Failed to create schedule. Please try again.');
}
```

---

## Performance Tips

- Use `loading.js` for route loading states
- Lazy load heavy components
- Optimize images with `next/image`
- Minimize client-side JavaScript (use server components when possible)

---

## Testing Considerations

- Test authenticated vs. unauthenticated access
- Test navigation flows
- Test data loading states (loading, error, success)
- Test dynamic route parameters
- Mock Supabase auth and API calls

---

**Last Updated**: 2025-11-07
