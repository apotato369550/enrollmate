# src/components/ - Reusable React Components

**Purpose**: Shared, reusable UI components used across multiple pages.

**Pattern**: Client components with clear props interfaces, composable, testable.

**Remember**: Update `/CHANGELOG.md` after any changes to this directory.

---

## Files Overview

| File | Component | Purpose |
|------|-----------|---------|
| `SemesterSelector.jsx` | SemesterSelector | Dropdown for selecting current semester |
| `PFPToolbar.js` | PFPToolbar | Profile toolbar with user info and logout |

---

## Key Principles

### 1. Component Design
- **Single Responsibility**: One component, one purpose
- **Reusability**: Used in multiple pages/contexts
- **Props Interface**: Clear, typed props (consider PropTypes or TypeScript)
- **Client Components**: All components use `'use client'` directive

### 2. Composition Over Inheritance
Build complex UIs by composing simple components:
```javascript
<PFPToolbar user={user}>
  <SemesterSelector onSemesterChange={handleChange} />
</PFPToolbar>
```

### 3. Controlled vs Uncontrolled
Prefer controlled components (parent manages state):
```javascript
// ✅ Controlled
<SemesterSelector
  value={selectedSemester}
  onChange={setSelectedSemester}
/>

// ❌ Uncontrolled
<SemesterSelector defaultValue={semester} />
```

---

## Component Details

### SemesterSelector.jsx

**Purpose**: Dropdown for selecting and managing semesters.

**Props**:
```javascript
{
  onSemesterChange: (semesterId) => void,  // Callback when semester changes
  currentSemester: Semester | null,        // Currently selected semester
}
```

**Features**:
- Lists all user semesters
- Highlights current semester
- Create new semester button
- Updates current semester in database
- Refreshes page after semester change

**Usage**:
```javascript
import SemesterSelector from '../../components/SemesterSelector.jsx';

<SemesterSelector
  currentSemester={currentSemester}
  onSemesterChange={(semesterId) => {
    // Handle semester change
    loadSchedules(semesterId);
  }}
/>
```

**State Management**:
- Internal state for dropdown open/close
- Fetches semesters on mount
- Updates database on selection

### PFPToolbar.js

**Purpose**: User profile toolbar with navigation and logout.

**Props**:
```javascript
{
  user: User | null,  // Supabase user object
}
```

**Features**:
- Displays user profile picture (or initials)
- Shows user email/name
- Logout button
- Navigation dropdown
- Links to profile, settings

**Usage**:
```javascript
import PFPToolbar from '../../components/PFPToolbar.js';

<PFPToolbar user={user} />
```

**Actions**:
- Logout: Calls `supabase.auth.signOut()` and redirects to `/login`
- Profile navigation: Uses Next.js `router.push()`

---

## Component Patterns

### Data Fetching in Components
```javascript
'use client';

export default function MyComponent({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const result = await API.getData(userId);
      setData(result);
      setLoading(false);
    };
    loadData();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render data */}</div>;
}
```

### Event Handling
```javascript
const handleClick = async () => {
  try {
    await API.performAction();
    // Success handling
  } catch (error) {
    console.error('Error:', error);
    // Error handling
  }
};

<button onClick={handleClick}>Action</button>
```

### Conditional Rendering
```javascript
{isLoading ? (
  <div>Loading...</div>
) : error ? (
  <div>Error: {error.message}</div>
) : (
  <div>{/* Content */}</div>
)}
```

---

## Styling Guidelines

### Tailwind CSS Classes
Use utility classes for styling:
```javascript
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-bold text-gray-800 mb-4">Title</h2>
  <p className="text-gray-600">Content</p>
</div>
```

### Responsive Design
```javascript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

### Interactive States
```javascript
<button className="
  bg-blue-600 text-white px-4 py-2 rounded
  hover:bg-blue-700
  active:bg-blue-800
  disabled:bg-gray-400 disabled:cursor-not-allowed
">
  Click Me
</button>
```

---

## Component Checklist

When creating new components, ensure:
- [ ] `'use client'` directive if using hooks/interactivity
- [ ] Clear props interface with defaults
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Accessible (ARIA labels, keyboard navigation)
- [ ] Responsive design
- [ ] Consistent styling with app theme

---

## Testing Guidelines

### Unit Tests
- Test rendering with different props
- Test user interactions (clicks, inputs)
- Test loading/error states
- Mock API calls and Supabase

### Integration Tests
- Test component integration with pages
- Test navigation flows
- Test data updates

---

## Future Components

Consider adding:
- `CourseCard` - Display individual course details
- `ScheduleCard` - Display schedule summary
- `SearchBar` - Reusable search component
- `Modal` - Generic modal wrapper
- `Toast` - Notification component
- `ConfirmDialog` - Confirmation dialogs
- `LoadingSpinner` - Consistent loading indicator

---

## Performance Considerations

- Use `React.memo` for expensive components
- Memoize callbacks with `useCallback`
- Memoize computed values with `useMemo`
- Lazy load heavy components
- Optimize re-renders (avoid unnecessary state updates)

---

**Last Updated**: 2025-11-07
