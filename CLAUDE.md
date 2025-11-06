# Enrollmate - Root Documentation

**Purpose**: AI-assisted course scheduling and enrollment management system for students
**Tech Stack**: Next.js 15.5.3, React 19.1.0, Supabase (PostgreSQL + Auth), Tailwind CSS 4
**Architecture**: Domain-Driven Design with DAO pattern, separation of concerns
**Module System**: ES Modules (`.js` extensions required in imports)

## IMPORTANT: Documentation Updates
**ALWAYS update `CHANGELOG.md` after making any changes, refactors, or additions to the codebase.**

Each subdirectory contains its own `CLAUDE.md` file with specific context for that module. Refer to those files for detailed information about specific components.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Tech Stack Details](#tech-stack-details)
5. [Database Schema](#database-schema)
6. [Domain Models](#domain-models)
7. [API Layer](#api-layer)
8. [Scheduler Engine](#scheduler-engine)
9. [Frontend Components](#frontend-components)
10. [Important Conventions](#important-conventions)
11. [Common Tasks](#common-tasks)

---

## Project Overview

Enrollmate helps students:
- Create and manage multiple course schedules per semester
- Import course catalogs from CSV files
- Detect time conflicts automatically
- Maintain a personal course library (up to 50 courses)
- Create private schedules (not attached to semesters)
- Export schedules to PDF format

**Key Features**:
- Multi-semester support with archiving
- Private vs. semester-attached schedules
- User course library with source tracking (manual, CSV, extension)
- Automatic conflict detection using time overlap analysis
- Row-level security (RLS) for user data isolation

---

## Architecture

Enrollmate follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────┐
│   Frontend Layer (Next.js Pages)   │  ← User interface
├─────────────────────────────────────┤
│   Components (React)                │  ← Reusable UI components
├─────────────────────────────────────┤
│   API Layer (DAOs)                  │  ← Data access objects
├─────────────────────────────────────┤
│   Domain Layer (Business Logic)     │  ← Domain models with behavior
├─────────────────────────────────────┤
│   Scheduler Engine (Core Logic)     │  ← Conflict detection, parsing
├─────────────────────────────────────┤
│   Database (Supabase/PostgreSQL)    │  ← Persistent storage
└─────────────────────────────────────┘
```

**Design Patterns Used**:
- **DAO (Data Access Object)**: API classes abstract database operations
- **Domain Model**: Rich domain objects with business logic methods
- **Factory Pattern**: `fromDatabase()` static methods for object creation
- **Strategy Pattern**: Parser classes for different schedule formats
- **Abstract Classes**: `ScheduleParser` defines interface for parsing

**Core Principles**:
- **Abstraction**: Hide complex logic behind simple interfaces
- **Encapsulation**: Domain classes manage their own state
- **Inheritance**: Parser hierarchy demonstrates OOP inheritance
- **Composition**: Schedules contain courses, semesters contain schedules
- **Separation of Concerns**: Each layer has a single responsibility

---

## Directory Structure

```
enrollmate/
├── lib/                          # Backend logic (ES modules)
│   ├── api/                      # Data access layer (DAOs)
│   │   ├── scheduleAPI.js       # Schedule CRUD operations
│   │   ├── semesterAPI.js       # Semester management
│   │   ├── semesterCourseAPI.js # Semester course catalog
│   │   └── userCourseAPI.js     # User's saved course library
│   ├── domain/                   # Domain models (business logic)
│   │   ├── Schedule.js          # Schedule entity with behavior
│   │   ├── Semester.js          # Semester entity
│   │   └── SemesterCourse.js    # Course entity
│   ├── scheduler/                # Core scheduling logic
│   │   ├── SchedulerEngine.js   # Conflict detection, parsing
│   │   └── schedulerAPI.js      # Legacy scheduler data access
│   └── utils/                    # Shared utilities
│
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── dashboard/           # Main dashboard
│   │   ├── scheduler/           # Scheduling interface
│   │   ├── schedule/[id]/       # Individual schedule view
│   │   ├── courses/             # Course catalog
│   │   ├── profile/             # User profile
│   │   ├── login/               # Authentication
│   │   └── signup/              # Registration
│   ├── components/               # Reusable React components
│   │   ├── SemesterSelector.jsx # Semester picker
│   │   └── PFPToolbar.js        # Profile toolbar
│   └── lib/                      # Frontend utilities
│       └── supabase.js          # Supabase client setup
│
├── migrations/                   # Database migrations (SQL)
│   ├── 001_create_scheduler_tables.sql
│   ├── 002_create_semester_architecture.sql
│   ├── 003_fix_cascade_delete.sql
│   ├── 004_private_schedules_and_saved_courses.sql
│   └── apply-migration.js       # Migration runner script
│
├── sample-schedules/             # Test data (CSV files)
│   ├── computer-science/
│   ├── accounting/
│   ├── biology/
│   ├── engineering/
│   ├── finance/
│   ├── law/
│   ├── physics/
│   └── psychology/
│
├── public/                       # Static assets
│   └── assets/images/           # Images
│
├── scripts/                      # Utility scripts
├── references/                   # Documentation/references
├── middleware.js                 # Next.js middleware (auth)
├── tailwind.config.js           # Tailwind CSS configuration
└── package.json                 # Dependencies
```

---

## Tech Stack Details

### Core Dependencies

```json
{
  "next": "15.5.3",              // React framework with App Router
  "react": "19.1.0",             // UI library
  "react-dom": "19.1.0",         // React DOM bindings
  "@supabase/supabase-js": "^2.58.0",  // Supabase client
  "@supabase/ssr": "^0.7.0",     // Supabase SSR support
  "tailwindcss": "^4",           // CSS framework
  "html2canvas": "^1.4.1",       // Screenshot/export functionality
  "jspdf": "^3.0.3"              // PDF generation
}
```

### Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_API=https://your-project.supabase.co
NEXT_PUBLIC_PUBLIC_API_KEY=your-anon-key
```

**Note**: These are public (client-side) variables, safe to expose in browser.

### Module System

**CRITICAL**: Enrollmate uses ES Modules. All imports MUST include `.js` extension:

```javascript
// ✅ CORRECT
import { supabase } from '../../src/lib/supabase.js';
import { Schedule } from '../domain/Schedule.js';

// ❌ WRONG (will cause ERR_MODULE_NOT_FOUND)
import { supabase } from '../../src/lib/supabase';
import { Schedule } from '../domain/Schedule';
```

---

## Database Schema

### Tables Overview

| Table | Purpose | Key Relationships |
|-------|---------|------------------|
| `profiles` | User profiles | 1:1 with `auth.users` |
| `semesters` | Semester containers | 1:many schedules |
| `schedules` | Student schedules | 1:many courses |
| `semester_courses` | Semester course catalog | Referenced by schedules |
| `schedule_courses` | Many-to-many join | Links schedules ↔ courses |
| `user_courses` | User's saved library | Max 50 per user |

### Key Constraints

**Schedules**:
```sql
-- Private schedule constraint
CHECK (
  (is_private = true AND semester_id IS NULL) OR
  (is_private = false AND semester_id IS NOT NULL)
)
```

**User Courses**:
```sql
-- One section per user per course
UNIQUE(user_id, course_code, section_group)
```

### Row-Level Security (RLS)

All tables have RLS policies ensuring users can only:
- View their own data
- Insert their own records
- Update their own records
- Delete their own records

**Example Policy**:
```sql
CREATE POLICY "Users can view their own schedules" ON schedules
  FOR SELECT USING (auth.uid() = user_id);
```

### Cascade Deletion

When a user is deleted, ALL related data is automatically removed:
```sql
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
```

### Migrations

Migrations are applied sequentially:
1. **001**: Initial scheduler tables and course sections
2. **002**: Semester architecture (semesters, semester_courses, schedule_courses)
3. **003**: Fix cascade delete constraints
4. **004**: Private schedules + user course library

**Apply migrations**:
```bash
node migrations/apply-migration.js migrations/001_create_scheduler_tables.sql
```

---

## Domain Models

### Schedule (`lib/domain/Schedule.js`)

Represents a student's schedule (e.g., "Schedule A", "My Perfect Schedule").

**Key Properties**:
```javascript
{
  id: UUID,
  semesterId: UUID | null,  // null if private
  userId: UUID,
  name: string,             // "Schedule A"
  description: string,
  status: 'draft' | 'active' | 'finalized' | 'archived',
  isFavorite: boolean,
  isPrivate: boolean,       // true = not attached to semester
  courses: Array<SemesterCourse>
}
```

**Key Methods**:
- `addCourse(course)` - Adds course with conflict detection
- `removeCourse(courseId)` - Removes course
- `hasConflict(course)` - Checks for time conflicts
- `getTotalCredits()` - Calculates total credits (3 per course)
- `isEditable()` - Returns true if status is 'draft' or 'active'
- `finalize()` / `activate()` / `archive()` - Status transitions
- `getPreviewCourses()` - Returns first 3 course codes

**Factory Methods**:
- `Schedule.fromDatabase(data)` - Creates from DB row

### Semester (`lib/domain/Semester.js`)

Represents a semester container (e.g., "1st Semester 2025").

**Key Properties**:
```javascript
{
  id: UUID,
  userId: UUID,
  name: string,             // "1st Semester 2025"
  schoolYear: string,       // "2024-2025"
  semesterType: '1st' | '2nd' | 'Summer',
  year: number,             // 2025
  status: 'active' | 'archived' | 'draft',
  isCurrent: boolean,
  courses: Array<SemesterCourse>,
  schedules: Array<Schedule>
}
```

**Key Methods**:
- `isActive()` - Returns true if status is 'active'
- `archive()` - Archives semester and sets isCurrent to false
- `setAsCurrent()` - Makes this the active semester
- `addCourse(course)` / `addSchedule(schedule)` - Adds to collections
- `getAvailableCourses()` - Returns non-full courses

### SemesterCourse (`lib/domain/SemesterCourse.js`)

Represents a course section in a semester's catalog.

**Key Properties**:
```javascript
{
  id: UUID,
  semesterId: UUID,
  courseCode: string,       // "CIS 3100"
  courseName: string,       // "Data Structures"
  sectionGroup: number,     // 1, 2, 3
  schedule: string,         // "MW 10:00 AM - 11:30 AM"
  enrolledCurrent: number,
  enrolledTotal: number,
  room: string,             // "CIS311TC"
  instructor: string,
  status: 'OK' | 'FULL' | 'CLOSED'
}
```

**Key Methods**:
- `isFull()` - Returns true if enrolled_current >= enrolled_total
- `hasAvailableSeats()` - Returns true if not full
- `getEnrollmentStatus()` - Returns "X/Y" format

---

## API Layer

All API classes follow the **DAO pattern** and use static methods.

### ScheduleAPI (`lib/api/scheduleAPI.js`)

**Purpose**: CRUD operations for schedules

**Key Methods**:
```javascript
// Create
createSchedule(semesterId, userId, name, description)
createPrivateSchedule(userId, name, description)

// Read
getScheduleById(scheduleId)
getSemesterSchedules(semesterId)
getUserPrivateSchedules(userId)
getScheduleCourses(scheduleId)

// Update
updateSchedule(scheduleId, updates)
addCourseToSchedule(scheduleId, courseId)
removeCourseFromSchedule(scheduleId, courseId)

// Delete
deleteSchedule(scheduleId)

// Utility
duplicateSchedule(scheduleId, newName)
```

**Usage Example**:
```javascript
import { ScheduleAPI } from '../../../lib/api/scheduleAPI.js';

const schedule = await ScheduleAPI.createSchedule(
  semesterId,
  userId,
  'Schedule A',
  'My perfect schedule'
);
```

### SemesterAPI (`lib/api/semesterAPI.js`)

**Purpose**: Semester management and retrieval

**Key Methods**:
```javascript
createSemester(userId, semesterType, year)
getUserSemesters(userId)
getSemesterById(semesterId)
getCurrentSemester(userId)
setCurrentSemester(semesterId, userId)
updateSemester(semesterId, updates)
deleteSemester(semesterId)
archiveSemester(semesterId)
```

### SemesterCourseAPI (`lib/api/semesterCourseAPI.js`)

**Purpose**: Semester course catalog management

**Key Methods**:
```javascript
addCourseToSemester(semesterId, courseData)
getSemesterCourses(semesterId)
getCourseById(courseId)
updateCourse(courseId, updates)
deleteCourse(courseId)
searchCourses(semesterId, query)
getAvailableCourses(semesterId)
bulkImportCourses(semesterId, coursesArray)  // CSV import
```

### UserCourseAPI (`lib/api/userCourseAPI.js`)

**Purpose**: User's personal course library (max 50 courses)

**Key Methods**:
```javascript
saveCourse(userId, courseData)
saveCourses(userId, coursesArray)  // Bulk save
getUserCourses(userId)
getCoursesBySource(userId, source)  // 'manual', 'csv', 'extension'
searchCourses(userId, query)
updateCourse(courseId, updates)
deleteCourse(courseId)
getCourseStats(userId)  // Returns count, sources breakdown
```

**50-Course Limit**: Enforced at application layer before insert.

---

## Scheduler Engine

### SchedulerEngine (`lib/scheduler/SchedulerEngine.js`)

Core scheduling logic with conflict detection and schedule parsing.

### Key Classes

#### 1. ScheduleParser (Abstract)

Base class defining parsing interface.

```javascript
class ScheduleParser {
  parse(scheduleString) {
    throw new Error('Must implement');
  }

  toMinutes(timeStr) {
    // Converts "HH:MM" to minutes from midnight
  }
}
```

#### 2. StandardScheduleParser (Concrete)

Parses standard schedule formats like `"MW 10:00 AM - 11:30 AM"`.

**Parse Output**:
```javascript
{
  days: ['M', 'W'],        // Array of day codes
  startTime: 600,          // Minutes from midnight (10:00 AM)
  endTime: 690             // Minutes from midnight (11:30 AM)
}
```

**Supported Day Codes**: M, T, W, Th, F, S, Su

#### 3. ConflictDetector

Detects time conflicts between two course sections.

**Key Method**:
```javascript
ConflictDetector.hasConflict(section1, section2)
// Returns: true if time overlap exists, false otherwise
```

**Conflict Logic**:
1. Parse both schedule strings
2. Check if days overlap (e.g., both have 'M')
3. Check if time ranges overlap
4. Return true if both conditions met

**Time Overlap Check**:
```javascript
// Conflict exists if:
start1 < end2 && start2 < end1
```

---

## Frontend Components

### Next.js App Router Structure

Enrollmate uses the Next.js 13+ App Router with:
- **Server Components** by default
- **Client Components** marked with `'use client'`
- **File-based routing** in `src/app/`

### Key Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `app/page.js` | Landing page |
| `/dashboard` | `app/dashboard/page.js` | Main dashboard |
| `/scheduler` | `app/scheduler/page.js` | Course scheduling interface |
| `/schedule/[id]` | `app/schedule/[scheduleId]/page.js` | Individual schedule view |
| `/courses` | `app/courses/page.js` | Course catalog |
| `/profile` | `app/profile/page.js` | User profile settings |
| `/login` | `app/login/page.js` | Authentication |
| `/signup` | `app/signup/page.js` | User registration |

### Reusable Components

**SemesterSelector** (`src/components/SemesterSelector.jsx`):
- Dropdown for selecting current semester
- Shows all user semesters
- Handles semester creation
- Updates current semester context

**PFPToolbar** (`src/components/PFPToolbar.js`):
- Profile picture and user info
- Logout functionality
- Navigation dropdown

### Authentication Pattern

All protected pages follow this pattern:

```javascript
'use client';

export default function ProtectedPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    };
    getUser();
  }, []);

  if (!user) return <div>Loading...</div>;

  return (/* page content */);
}
```

**Middleware Protection**: `middleware.js` also protects routes at edge level.

---

## Important Conventions

### 1. Naming Conventions

**Files & Directories**:
- React components: `PascalCase.jsx` or `PascalCase.js`
- API/utilities: `camelCase.js`
- Domain models: `PascalCase.js`
- Directories: `kebab-case/`

**Code**:
- Classes: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Database columns: `snake_case`
- Object properties (JS): `camelCase`

### 2. Database Mapping

**Snake Case ↔ Camel Case**:
```javascript
// Database column: semester_id
// JavaScript property: semesterId

// Always map in fromDatabase() and toDatabase()
static fromDatabase(data) {
  return new Schedule(
    data.id,
    data.semester_id,  // ← snake_case from DB
    data.user_id,
    // ...
  );
}

toDatabase() {
  return {
    id: this.id,
    semester_id: this.semesterId,  // ← camelCase to snake_case
    user_id: this.userId,
    // ...
  };
}
```

### 3. Error Handling

**API Layer**:
```javascript
if (error) {
  throw new Error(`Failed to create schedule: ${error.message}`);
}
```

**Frontend**:
```javascript
try {
  await ScheduleAPI.createSchedule(/* ... */);
} catch (error) {
  console.error('Failed to create schedule:', error);
  // Show user-friendly error message
}
```

### 4. Async/Await Pattern

All database operations are async:
```javascript
// ✅ CORRECT
const schedule = await ScheduleAPI.getScheduleById(id);

// ❌ WRONG (missing await)
const schedule = ScheduleAPI.getScheduleById(id);  // Returns Promise!
```

### 5. Supabase Query Patterns

**Single Record**:
```javascript
const { data, error } = await supabase
  .from('schedules')
  .select('*')
  .eq('id', scheduleId)
  .single();  // ← Returns single object, not array
```

**Multiple Records**:
```javascript
const { data, error } = await supabase
  .from('schedules')
  .select('*')
  .eq('semester_id', semesterId)
  .order('created_at', { ascending: false });
```

**Joins**:
```javascript
const { data, error } = await supabase
  .from('schedules')
  .select(`
    *,
    schedule_courses (
      semester_course:semester_courses (*)
    )
  `)
  .eq('id', scheduleId);
```

### 6. React State Management

**Local State Pattern**:
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const loadData = async () => {
    try {
      const result = await API.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [/* dependencies */]);
```

---

## Common Tasks

### 1. Creating a New Schedule

```javascript
import { ScheduleAPI } from '../../../lib/api/scheduleAPI.js';

// For semester-attached schedule
const schedule = await ScheduleAPI.createSchedule(
  semesterId,
  userId,
  'Schedule A',
  'My perfect schedule'
);

// For private schedule
const privateSchedule = await ScheduleAPI.createPrivateSchedule(
  userId,
  'My Dream Schedule',
  'Not attached to any semester'
);
```

### 2. Adding Courses to Schedule

```javascript
// Get available courses
const courses = await SemesterCourseAPI.getSemesterCourses(semesterId);

// Add course to schedule
await ScheduleAPI.addCourseToSchedule(scheduleId, courseId);

// Fetch updated schedule with courses
const updatedSchedule = await ScheduleAPI.getScheduleById(scheduleId);
```

### 3. Importing Courses from CSV

```javascript
import { SemesterCourseAPI } from '../../../lib/api/semesterCourseAPI.js';

// Parse CSV file (assume you have csvData array)
const coursesArray = csvData.map(row => ({
  courseCode: row['Course Code'],
  courseName: row['Course Name'],
  sectionGroup: parseInt(row['Section']),
  schedule: row['Schedule'],
  enrolledCurrent: parseInt(row['Enrolled']),
  enrolledTotal: parseInt(row['Capacity']),
  room: row['Room'],
  instructor: row['Instructor']
}));

// Bulk import
await SemesterCourseAPI.bulkImportCourses(semesterId, coursesArray);
```

### 4. Conflict Detection

```javascript
import { Schedule } from '../../../lib/domain/Schedule.js';

const schedule = await ScheduleAPI.getScheduleById(scheduleId);
const scheduleObj = Schedule.fromDatabase(schedule);

// Populate courses
scheduleObj.courses = schedule.courses;

// Check conflict before adding
const newCourse = await SemesterCourseAPI.getCourseById(courseId);
if (scheduleObj.hasConflict(newCourse)) {
  alert('This course conflicts with your existing schedule!');
} else {
  await ScheduleAPI.addCourseToSchedule(scheduleId, courseId);
}
```

### 5. Setting Current Semester

```javascript
import { SemesterAPI } from '../../../lib/api/semesterAPI.js';

// Create new semester
const semester = await SemesterAPI.createSemester(userId, '1st', 2025);

// Set as current (unsets all others automatically)
await SemesterAPI.setCurrentSemester(semester.id, userId);

// Retrieve current semester
const currentSemester = await SemesterAPI.getCurrentSemester(userId);
```

### 6. Managing User Course Library

```javascript
import { UserCourseAPI } from '../../../lib/api/userCourseAPI.js';

// Check current count
const stats = await UserCourseAPI.getCourseStats(userId);
if (stats.totalCount >= 50) {
  alert('Course library is full! (50 course maximum)');
  return;
}

// Save course to library
await UserCourseAPI.saveCourse(userId, {
  courseCode: 'CIS 3100',
  courseName: 'Data Structures',
  sectionGroup: 1,
  schedule: 'MW 10:00 AM - 11:30 AM',
  enrolledCurrent: 30,
  enrolledTotal: 40,
  room: 'CIS311TC',
  instructor: 'Dr. Smith',
  source: 'manual'
});

// Get courses by source
const csvCourses = await UserCourseAPI.getCoursesBySource(userId, 'csv');
```

### 7. Running Development Server

```bash
npm run dev
# Opens at http://localhost:3000
```

### 8. Building for Production

```bash
npm run build
npm start
```

### 9. Applying Database Migrations

```bash
node migrations/apply-migration.js migrations/001_create_scheduler_tables.sql
node migrations/apply-migration.js migrations/002_create_semester_architecture.sql
node migrations/apply-migration.js migrations/003_fix_cascade_delete.sql
node migrations/apply-migration.js migrations/004_private_schedules_and_saved_courses.sql
```

---

## Testing Data

Sample schedules are available in `sample-schedules/` for 8 academic programs:
- Computer Science
- Accounting
- Biology
- Engineering
- Finance
- Law
- Physics
- Psychology

Each CSV contains 10+ realistic course sections with varied:
- Schedules (different days/times)
- Enrollment status (OK, FULL, CLOSED)
- Instructors and rooms
- Section groups

**CSV Format**:
```csv
Course Code,Course Name,Section,Schedule,Enrolled,Capacity,Room,Instructor
CIS 3100,Data Structures,1,MW 10:00 AM - 11:30 AM,35,40,CIS311TC,Dr. Smith
MATH 2010,Calculus I,2,TThF 09:00 AM - 10:30 AM,40,40,MATH201TC,Prof. Johnson
```

---

## Security Notes

1. **Row-Level Security (RLS)**: All tables enforce user isolation
2. **Cascade Deletion**: User data auto-deleted when user account is removed
3. **Public Keys**: Supabase anon key is safe to expose (RLS protects data)
4. **Authentication**: Handled by Supabase Auth (no passwords in database)
5. **Middleware Protection**: Routes protected at edge and client level

---

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns indexed
2. **Eager Loading**: Use Supabase joins to avoid N+1 queries
3. **Pagination**: Consider implementing for large course catalogs
4. **Caching**: React state caches data; consider implementing SWR for better UX

---

## Future Enhancements

Potential areas for expansion:
- Real-time collaboration on schedules
- Course prerequisite checking
- GPA calculator integration
- Export to Google Calendar / iCal
- Mobile app (React Native)
- Course rating/review system
- Waitlist management
- Email notifications for course openings

---

## Quick Reference

**Create Schedule**:
```javascript
await ScheduleAPI.createSchedule(semesterId, userId, name, description);
```

**Add Course**:
```javascript
await ScheduleAPI.addCourseToSchedule(scheduleId, courseId);
```

**Check Conflict**:
```javascript
scheduleObj.hasConflict(newCourse);  // Returns boolean
```

**Import CSV**:
```javascript
await SemesterCourseAPI.bulkImportCourses(semesterId, coursesArray);
```

**Get Current Semester**:
```javascript
const semester = await SemesterAPI.getCurrentSemester(userId);
```

---

## File Location Reference

| What You Need | Where to Look |
|---------------|---------------|
| Database operations | `lib/api/*.js` |
| Business logic | `lib/domain/*.js` |
| Conflict detection | `lib/scheduler/SchedulerEngine.js` |
| Page components | `src/app/*/page.js` |
| Reusable UI | `src/components/*.jsx` |
| Database schema | `migrations/*.sql` |
| Test data | `sample-schedules/*/*.csv` |
| Supabase setup | `src/lib/supabase.js` |
| Auth middleware | `middleware.js` |
| Styling | `src/app/globals.css`, `tailwind.config.js` |

---

**Last Updated**: 2025-11-02
**Version**: 0.1.0
**Maintainer**: Enrollmate Development Team
