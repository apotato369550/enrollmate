# lib/api/ - Data Access Layer (DAOs)

**Purpose**: Database operations using the Data Access Object (DAO) pattern. Pure CRUD operations with no business logic.

**Pattern**: Static methods for all database interactions via Supabase client.

**Remember**: Update `/CHANGELOG.md` after any changes to this directory.

---

## Files Overview

| File | Purpose | Primary Operations |
|------|---------|-------------------|
| `scheduleAPI.js` | Schedule CRUD | Create, read, update, delete schedules; manage schedule-course relationships |
| `semesterAPI.js` | Semester management | Semester CRUD, current semester tracking, archiving |
| `semesterCourseAPI.js` | Course catalog | Course catalog CRUD, bulk import, search |
| `userCourseAPI.js` | User library | User's saved courses (max 50), source tracking |

---

## Key Principles

### 1. Static Methods Only
All DAO classes use static methods (no instantiation):
```javascript
// ✅ CORRECT
const schedule = await ScheduleAPI.getScheduleById(id);

// ❌ WRONG
const api = new ScheduleAPI();
const schedule = await api.getScheduleById(id);
```

### 2. No Business Logic
DAOs only handle database operations. Business logic belongs in `lib/domain/`:
```javascript
// ❌ WRONG (business logic in DAO)
static async addCourse(scheduleId, courseId) {
  const schedule = await this.getScheduleById(scheduleId);
  if (schedule.courses.length >= 10) {  // Business rule!
    throw new Error('Max courses exceeded');
  }
  // ...
}

// ✅ CORRECT (business logic in domain model)
// In lib/domain/Schedule.js
addCourse(course) {
  if (this.courses.length >= 10) {
    throw new Error('Max courses exceeded');
  }
  this.courses.push(course);
}
```

### 3. Snake Case ↔ Camel Case Mapping
Database uses `snake_case`, JavaScript uses `camelCase`:
```javascript
// Database: semester_id, user_id, is_private
// JavaScript: semesterId, userId, isPrivate

// Mapping happens at API layer
const { data, error } = await supabase
  .from('schedules')
  .select('*')
  .eq('id', scheduleId)
  .single();

return {
  id: data.id,
  semesterId: data.semester_id,
  userId: data.user_id,
  isPrivate: data.is_private,
  // ...
};
```

### 4. Error Handling
Always throw descriptive errors with context:
```javascript
const { data, error } = await supabase
  .from('schedules')
  .insert(scheduleData);

if (error) {
  throw new Error(`Failed to create schedule: ${error.message}`);
}
```

### 5. Query Patterns

**Single Record**:
```javascript
.select('*').eq('id', id).single()  // Returns object, not array
```

**Multiple Records**:
```javascript
.select('*').eq('semester_id', semesterId).order('created_at', { ascending: false })
```

**Joins** (Supabase nested queries):
```javascript
.select(`
  *,
  schedule_courses (
    semester_course:semester_courses (*)
  )
`)
```

---

## File-Specific Details

### scheduleAPI.js
**Responsibilities**:
- Schedule CRUD operations
- Schedule-course relationship management
- Private vs semester-attached schedules
- Schedule duplication

**Key Methods**:
- `createSchedule()` - Semester-attached schedules
- `createPrivateSchedule()` - Private schedules
- `addCourseToSchedule()` - Many-to-many relationship
- `removeCourseFromSchedule()` - Relationship cleanup
- `duplicateSchedule()` - Copy with new name

### semesterAPI.js
**Responsibilities**:
- Semester lifecycle management
- Current semester tracking (only one active)
- Archiving semesters

**Key Methods**:
- `createSemester()` - Creates new semester
- `getCurrentSemester()` - Retrieves user's active semester
- `setCurrentSemester()` - Sets active (unsets others)
- `archiveSemester()` - Archives and unsets current flag

**Business Rules Enforced at DB**:
- Only one `is_current = true` per user
- Handled via transaction when setting current

### semesterCourseAPI.js
**Responsibilities**:
- Course catalog management per semester
- Bulk import from CSV
- Course search and filtering

**Key Methods**:
- `bulkImportCourses()` - CSV import (transaction)
- `searchCourses()` - Full-text search
- `getAvailableCourses()` - Filters out FULL/CLOSED courses

**Performance Note**:
- Bulk imports use single transaction
- Consider pagination for large catalogs

### userCourseAPI.js
**Responsibilities**:
- User's personal course library
- Source tracking (manual, csv, extension)
- 50-course limit enforcement

**Key Methods**:
- `saveCourse()` - Single course save
- `saveCourses()` - Bulk save with limit check
- `getCoursesBySource()` - Filter by source
- `getCourseStats()` - Count and breakdown

**Important**:
- 50-course limit enforced at application layer (not DB constraint)
- Always check `getCourseStats()` before bulk saves

---

## Common Operations

### Creating Relationships
```javascript
// Many-to-many: schedules ↔ courses via schedule_courses
await supabase
  .from('schedule_courses')
  .insert({
    schedule_id: scheduleId,
    course_id: courseId
  });
```

### Bulk Operations
```javascript
// Use single insert with array
await supabase
  .from('semester_courses')
  .insert(coursesArray);  // Array of course objects
```

### Transactions
Supabase doesn't support explicit transactions, but operations are atomic. Use RPC for complex multi-step operations:
```javascript
await supabase.rpc('set_current_semester', {
  semester_id: semesterId,
  user_id: userId
});
```

---

## Testing Guidelines

- Mock Supabase client responses
- Test error handling paths
- Verify snake_case ↔ camelCase mapping
- Test bulk operations with edge cases (empty arrays, duplicates)
- Verify relationship cleanup on deletes

---

**Last Updated**: 2025-11-07
