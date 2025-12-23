# Enrollmate - AI-Assisted Course Scheduling System

**Version**: 0.1.0
**Tech Stack**: Next.js 15.5.3, React 19.1.0, Supabase, Tailwind CSS 4
**Architecture**: Domain-Driven Design with DAO pattern

AI-assisted course scheduling and enrollment management system for students.

---

## Features

- 🗓️ **Multi-Semester Management** - Organize schedules across multiple semesters
- 📚 **Course Library** - Save up to 50 courses with source tracking (manual, CSV, extension)
- ⏰ **Conflict Detection** - Automatic time overlap detection
- 📄 **PDF Export** - Export schedules as professional PDFs
- 🔒 **Private Schedules** - Create schedules not tied to any semester
- 📥 **CSV Import** - Bulk import courses from CSV files
- 🔌 **Chrome Extension Ready** - API endpoints for browser extension integration

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/enrollmate.git
cd enrollmate

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables

Create `.env.local` in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_API=https://your-project.supabase.co
NEXT_PUBLIC_PUBLIC_API_KEY=your-anon-key
```

### Database Setup

Apply migrations in order:

```bash
node migrations/apply-migration.js migrations/001_create_scheduler_tables.sql
node migrations/apply-migration.js migrations/002_create_semester_architecture.sql
node migrations/apply-migration.js migrations/003_fix_cascade_delete.sql
node migrations/apply-migration.js migrations/004_private_schedules_and_saved_courses.sql
node migrations/apply-migration.js migrations/005_create_profiles_table.sql
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Integration

Enrollmate provides API endpoints for Chrome extension integration.

### Quick Example

```javascript
import UserCourseAPI from '../lib/api/userCourseAPI.js';
import { supabase } from '../lib/supabase.js';

// Get authenticated user
const { data: { user } } = await supabase.auth.getUser();

// Save course to library
const course = await UserCourseAPI.saveCourse(user.id, {
  courseCode: "CIS 3100",
  courseName: "Data Structures",
  sectionGroup: 1,
  schedule: "MW 10:00 AM - 11:30 AM",
  enrolledCurrent: 30,
  enrolledTotal: 40,
  room: "CIS311TC",
  instructor: "Dr. Smith"
}, 'extension');
```

### Available APIs

| API | Purpose | Documentation |
|-----|---------|---------------|
| **UserCourseAPI** | Manage user's 50-course library | See below |
| **ScheduleAPI** | Create and manage schedules | See below |
| **SemesterAPI** | Semester management | See below |
| **SemesterCourseAPI** | Course catalog per semester | See below |

### User Course Library API

```javascript
import UserCourseAPI from '../lib/api/userCourseAPI.js';

// Save single course
await UserCourseAPI.saveCourse(userId, courseData, 'extension');

// Bulk save courses
await UserCourseAPI.saveCourses(userId, coursesArray, 'extension');

// Get user's courses
const courses = await UserCourseAPI.getUserCourses(userId);

// Get courses by source ('manual', 'csv', 'extension')
const extensionCourses = await UserCourseAPI.getCoursesBySource(userId, 'extension');

// Get stats (check 50-course limit)
const stats = await UserCourseAPI.getCourseStats(userId);
// Returns: { total: 15, manual: 5, csv: 7, extension: 3, remaining: 35 }

// Delete course
await UserCourseAPI.deleteCourse(courseId);

// Search courses
const results = await UserCourseAPI.searchCourses(userId, "CIS");
```

### Schedule API

```javascript
import { ScheduleAPI } from '../lib/api/scheduleAPI.js';

// Create schedule
const schedule = await ScheduleAPI.createSchedule(semesterId, userId, "Schedule A", "Description");

// Create private schedule (not tied to semester)
const privateSchedule = await ScheduleAPI.createPrivateSchedule(userId, "Dream Schedule", "");

// Get schedule
const schedule = await ScheduleAPI.getScheduleById(scheduleId);

// Add/remove courses
await ScheduleAPI.addCourseToSchedule(scheduleId, courseId);
await ScheduleAPI.removeCourseFromSchedule(scheduleId, courseId);
```

### Semester API

```javascript
import { SemesterAPI } from '../lib/api/semesterAPI.js';

// Get current semester
const semester = await SemesterAPI.getCurrentSemester(userId);

// Create semester
const semester = await SemesterAPI.createSemester(userId, '1st', 2025);
// semesterType: '1st', '2nd', or 'Summer'

// Get all semesters
const semesters = await SemesterAPI.getUserSemesters(userId);
```

### Complete API Documentation

For detailed API documentation including:
- All endpoints and parameters
- Error handling
- Chrome extension integration examples
- Best practices

See **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

---

## Project Structure

```
enrollmate/
├── lib/                      # Backend logic
│   ├── api/                  # Data Access Objects (DAOs)
│   ├── domain/               # Domain models
│   ├── scheduler/            # Conflict detection engine
│   └── utils/                # Utilities (PDF export, etc.)
├── src/
│   ├── app/                  # Next.js pages
│   └── components/           # React components
├── migrations/               # Database migrations
├── sample-schedules/         # Test data (CSV files)
└── API_DOCUMENTATION.md      # Complete API reference
```

---

## Key Concepts

### Course Library

Users can save up to **50 courses** with source tracking:
- **Manual**: Manually added by user
- **CSV**: Imported from CSV file
- **Extension**: Added via Chrome extension

Check available space before bulk import:
```javascript
const stats = await UserCourseAPI.getCourseStats(userId);
console.log(`Can save ${stats.remaining} more courses`);
```

### Schedules

Two types of schedules:
1. **Semester Schedules**: Attached to a specific semester
2. **Private Schedules**: Not attached to any semester (for planning)

### Conflict Detection

Automatic time conflict detection when adding courses to schedules:
- Parses schedule strings (e.g., "MW 10:00 AM - 11:30 AM")
- Checks for day overlap (M, T, W, Th, F, S, Su)
- Checks for time overlap using 30-minute intervals

### Scheduler Algorithm & The University Timetabling Problem

The core of Enrollmate's scheduling capability lies in `lib/scheduler/SchedulerEngine.js`, which addresses a variant of the **University Timetabling Problem**. This is a classic Constraint Satisfaction Problem (CSP) where the goal is to assign events (classes) to resources (time slots) without violating constraints.

**How it Works:**

1.  **Parsing & Standardization**:
    - The `StandardScheduleParser` converts human-readable schedule strings (e.g., "MW 10:00 AM - 11:30 AM") into a standardized numerical format (minutes from midnight).

2.  **Constraint Satisfaction via Backtracking**:
    - The `ScheduleGenerator` class implements a **Backtracking Algorithm** to explore possible schedule combinations.
    - **Input**: A list of courses, where each course has multiple available sections.
    - **Process**:
        - It treats the schedule generation as a tree where each level represents a course and each branch represents a specific section choice.
        - It recursively selects a section for the current course.
        - **Pruning**: Before moving deeper, it checks for **Time Conflicts** using `ConflictDetector`. If the selected section overlaps with any already selected section, that branch is "pruned" (abandoned) immediately.
        - It also respects user-defined constraints (filters) like "No classes before 10 AM" or "Avoid full sections" during this process.
    - **Output**: A list of valid, non-conflicting schedule permutations that satisfy all hard and soft constraints.

This approach ensures that users are presented with every possible valid schedule configuration for their chosen courses, solving the "Student Sectioning" sub-problem of university timetabling.

---

## Development

### Tech Stack

- **Frontend**: Next.js 15.5.3 (App Router), React 19.1.0
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Export**: jsPDF + html2canvas

### Module System

**IMPORTANT**: Always use `.js` extensions in imports (ES Modules):

```javascript
// ✅ CORRECT
import { ScheduleAPI } from '../../../lib/api/scheduleAPI.js';

// ❌ WRONG
import { ScheduleAPI } from '../../../lib/api/scheduleAPI';
```

### Code Documentation

Each directory has its own `CLAUDE.md` file with detailed context:
- `/CLAUDE.md` - Root documentation
- `/lib/CLAUDE.md` - Backend architecture
- `/src/app/CLAUDE.md` - Frontend routing
- And more...

See `CHANGELOG.md` for recent changes.

---

## Testing

Enrollmate includes a comprehensive testing suite using **Vitest**.

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode (interactive)
npm run test:watch

# View visual UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Specific Suites

```bash
# Auth tests
npm run test:auth

# Schedule domain tests
npm run test:schedules

# Integration workflows
npm run test:integration

# End-to-end scenarios
npm run test:e2e
```

### Test Structure

- `__tests__/unit/`: Logic tests for API, Auth, and Domain models
- `__tests__/integration/`: Workflow tests (Auth flow, Schedule creation)
- `__tests__/e2e/`: Full user journey simulations
- `__tests__/fixtures/`: Sample data (Users, Courses, Semesters)

### Manual Testing

1. **Authentication**: Sign up and log in
2. **Course Library**: Import CSV, add manually, check 50-course limit
3. **Schedules**: Create schedule, add courses, check conflict detection
4. **PDF Export**: Export schedule and verify styling
5. **Chrome Extension**: Test API integration

### Test Data

Sample CSV files available in `sample-schedules/`:
- Computer Science
- Accounting
- Biology
- Engineering
- Finance
- Law
- Physics
- Psychology

---

## Deployment

### Build

```bash
npm run build
npm start
```

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update `CHANGELOG.md`
5. Submit a pull request

---

## Security

- Row-Level Security (RLS) enabled on all tables
- User data isolated per user
- Cascade deletion on user account removal
- Public Supabase anon key is safe (RLS protects data)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/enrollmate/issues)
- **Documentation**: See `/CLAUDE.md` files throughout the codebase
- **API Reference**: See `API_DOCUMENTATION.md`

---

## License

MIT License - See LICENSE file for details

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and recent changes.

---

**Built with ❤️ for students**
