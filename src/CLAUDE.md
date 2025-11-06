# src/ - Frontend Application

**Purpose**: Next.js 15 application with React 19, App Router, and client-side logic.

**Architecture**: File-based routing, server/client components, Tailwind CSS styling.

**Remember**: Update `/CHANGELOG.md` after any changes to this directory.

---

## Directory Structure

```
src/
├── app/          # Next.js App Router - Pages and routes
├── components/   # Reusable React components
└── lib/          # Frontend utilities (Supabase client, helpers)
```

---

## Key Principles

### 1. Next.js App Router (v13+)
- **Server Components** by default (no 'use client' directive)
- **Client Components** marked with `'use client'` at top of file
- **File-based routing** in `app/` directory

### 2. Component Types

**Server Components** (default):
- Fetch data on server
- No useState, useEffect, or event handlers
- Better performance, smaller bundle
- Direct database access possible

**Client Components** (`'use client'`):
- Interactive UI with hooks
- Event handlers
- Browser-only APIs
- State management

### 3. Authentication Pattern
All protected pages check auth and redirect:
```javascript
'use client';

export default function ProtectedPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
      else setUser(user);
    };
    getUser();
  }, []);

  if (!user) return <div>Loading...</div>;
  return (/* page content */);
}
```

### 4. Import Paths
Frontend imports from backend layer:
```javascript
// ✅ CORRECT (with .js extension)
import { ScheduleAPI } from '../../../lib/api/scheduleAPI.js';
import { supabase } from '../../lib/supabase.js';
```

---

## Subdirectory Contexts

- **app/**: See `src/app/CLAUDE.md` for routing and page structure
- **components/**: See `src/components/CLAUDE.md` for reusable UI components
- **lib/**: See `src/lib/CLAUDE.md` for frontend utilities

---

## Common Patterns

### Data Fetching
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const result = await API.getData();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

### Error Handling
```javascript
try {
  await API.createSchedule(data);
  alert('Schedule created successfully!');
} catch (error) {
  console.error('Failed to create schedule:', error);
  alert('Error creating schedule. Please try again.');
}
```

### Conditional Rendering
```javascript
if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!data) return <div>No data found</div>;
return <div>{/* Render data */}</div>;
```

---

## Styling with Tailwind CSS 4

- Utility-first CSS framework
- Responsive design with breakpoints (`md:`, `lg:`)
- Dark mode support (if configured)
- Custom theme in `tailwind.config.js`

**Example**:
```javascript
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-bold mb-4">Schedule A</h2>
</div>
```

---

## Performance Considerations

- Use React.memo for expensive components
- Lazy load routes with dynamic imports
- Optimize images with next/image
- Minimize client bundle size (use server components when possible)

---

## Testing Guidelines

- Test component rendering
- Test user interactions (click, input)
- Test authentication flows
- Test error states
- Mock API calls

---

**Last Updated**: 2025-11-07
