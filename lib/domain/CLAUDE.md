# lib/domain/ - Domain Models

**Purpose**: Rich domain objects containing business logic, validation, and state management. These are the core entities of the application.

**Pattern**: Class-based models with methods for behavior, factory methods for instantiation.

**Remember**: Update `/CHANGELOG.md` after any changes to this directory.

---

## Files Overview

| File | Entity | Key Responsibilities |
|------|--------|---------------------|
| `Schedule.js` | Student's course schedule | Course management, conflict checking, status transitions |
| `Semester.js` | Semester container | Semester lifecycle, current tracking, course/schedule collections |
| `SemesterCourse.js` | Course section | Enrollment tracking, availability checks |

---

## Design Principles

### 1. Rich Domain Models
Models contain behavior, not just data:
```javascript
// ❌ WRONG (anemic model)
class Schedule {
  constructor(id, name, courses) {
    this.id = id;
    this.name = name;
    this.courses = courses;
  }
}
// Business logic lives elsewhere

// ✅ CORRECT (rich model)
class Schedule {
  constructor(id, name, courses) {
    this.id = id;
    this.name = name;
    this.courses = courses;
  }

  addCourse(course) {
    if (this.hasConflict(course)) {
      throw new Error('Course conflicts with existing schedule');
    }
    this.courses.push(course);
  }

  hasConflict(course) {
    // Business logic for conflict detection
  }
}
```

### 2. Factory Pattern
Use static factory methods for object creation from DB data:
```javascript
static fromDatabase(data) {
  return new Schedule(
    data.id,
    data.semester_id,   // snake_case → camelCase
    data.user_id,
    data.name,
    // ...
  );
}
```

### 3. Encapsulation
Models manage their own state and validation:
```javascript
finalize() {
  if (this.status !== 'draft' && this.status !== 'active') {
    throw new Error('Only draft or active schedules can be finalized');
  }
  this.status = 'finalized';
}
```

### 4. Immutability Where Appropriate
Return new objects for transformations when needed:
```javascript
getPreviewCourses() {
  return this.courses.slice(0, 3).map(c => c.courseCode);
}
```

---

## Domain Model Details

### Schedule.js

**Purpose**: Represents a student's course schedule (e.g., "Schedule A", "My Perfect Schedule")

**Key Properties**:
- `id`, `semesterId`, `userId` - Identifiers
- `name`, `description` - Metadata
- `status` - Lifecycle: `'draft' | 'active' | 'finalized' | 'archived'`
- `isPrivate` - Boolean (private schedules have null semesterId)
- `isFavorite` - Boolean
- `courses` - Array of SemesterCourse objects

**Key Methods**:
- `addCourse(course)` - Validates and adds course (conflict check)
- `removeCourse(courseId)` - Removes course by ID
- `hasConflict(course)` - Returns boolean for time conflicts
- `getTotalCredits()` - Calculates total (3 credits per course)
- `isEditable()` - Returns true if status is 'draft' or 'active'
- `finalize()`, `activate()`, `archive()` - Status transitions with validation
- `getPreviewCourses()` - First 3 course codes for display

**Business Rules**:
- Private schedules: `isPrivate = true` AND `semesterId = null`
- Semester schedules: `isPrivate = false` AND `semesterId != null`
- Only draft/active schedules can be edited
- Only draft/active schedules can be finalized
- Conflict detection before adding courses

### Semester.js

**Purpose**: Container for a semester (e.g., "1st Semester 2025")

**Key Properties**:
- `id`, `userId` - Identifiers
- `name` - Display name ("1st Semester 2025")
- `schoolYear` - Academic year ("2024-2025")
- `semesterType` - `'1st' | '2nd' | 'Summer'`
- `year` - Numeric year (2025)
- `status` - `'active' | 'archived' | 'draft'`
- `isCurrent` - Boolean (only one current per user)
- `courses` - Array of available courses for this semester
- `schedules` - Array of schedules in this semester

**Key Methods**:
- `isActive()` - Returns true if status is 'active'
- `archive()` - Sets status to 'archived', isCurrent to false
- `setAsCurrent()` - Sets isCurrent to true
- `addCourse(course)` - Adds to course catalog
- `addSchedule(schedule)` - Adds to schedules collection
- `getAvailableCourses()` - Filters out full/closed courses

**Business Rules**:
- Only one `isCurrent = true` per user
- Archiving sets `isCurrent = false`
- Active semesters show in semester selector

### SemesterCourse.js

**Purpose**: Represents a course section in a semester's catalog

**Key Properties**:
- `id`, `semesterId` - Identifiers
- `courseCode` - Course identifier ("CIS 3100")
- `courseName` - Full name ("Data Structures")
- `sectionGroup` - Section number (1, 2, 3)
- `schedule` - Time string ("MW 10:00 AM - 11:30 AM")
- `enrolledCurrent`, `enrolledTotal` - Enrollment counts
- `room`, `instructor` - Location and faculty
- `status` - `'OK' | 'FULL' | 'CLOSED'`

**Key Methods**:
- `isFull()` - Returns true if `enrolledCurrent >= enrolledTotal`
- `hasAvailableSeats()` - Returns true if not full
- `getEnrollmentStatus()` - Returns formatted string "30/40"

**Business Rules**:
- Status automatically computed based on enrollment
- FULL courses can't be added to schedules (enforced in Schedule.addCourse)
- Unique constraint: (course_code, section_group) per semester

---

## Common Patterns

### Object Creation
```javascript
// From database
const schedule = Schedule.fromDatabase(dbRow);

// Programmatically
const schedule = new Schedule(
  id,
  semesterId,
  userId,
  'Schedule A',
  'My perfect schedule',
  'draft',
  false,
  false
);
```

### State Transitions
```javascript
// With validation
schedule.finalize();  // Throws error if not draft/active

// Check before transition
if (schedule.isEditable()) {
  schedule.addCourse(course);
}
```

### Business Logic Composition
```javascript
// Schedule uses SemesterCourse methods
addCourse(course) {
  if (course.isFull()) {
    throw new Error('Course is full');
  }
  if (this.hasConflict(course)) {
    throw new Error('Time conflict detected');
  }
  this.courses.push(course);
}
```

---

## Testing Guidelines

- Test state transitions with invalid states
- Verify conflict detection with various time overlaps
- Test enrollment calculations
- Validate factory method mappings (snake_case ↔ camelCase)
- Test business rule enforcement (e.g., private schedule constraints)

---

## When to Use Domain Models

**Use domain models when**:
- Implementing business logic
- Validating state transitions
- Checking business rules
- Performing calculations (credits, conflicts, etc.)

**Don't use domain models when**:
- Just fetching/displaying data (use API layer directly)
- Performing simple CRUD without validation
- In React components that only render data

---

**Last Updated**: 2025-11-07
