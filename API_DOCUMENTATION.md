# Enrollmate API Documentation

**Version**: 1.0.0
**Base URL**: Your deployed Enrollmate instance
**Purpose**: Chrome Extension integration and external API access

---

## Table of Contents
1. [Authentication](#authentication)
2. [User Course Library](#user-course-library)
3. [Schedules](#schedules)
4. [Semesters](#semesters)
5. [Course Catalog](#course-catalog)
6. [Error Handling](#error-handling)

---

## Authentication

Enrollmate uses **Supabase Authentication**. The Chrome extension must authenticate users and obtain an access token.

### Get Current User
```javascript
import { supabase } from './supabase.js';

const { data: { user }, error } = await supabase.auth.getUser();
```

**Response**:
```javascript
{
  data: {
    user: {
      id: "uuid",
      email: "user@example.com",
      // ... other user fields
    }
  }
}
```

---

## User Course Library

The user course library stores up to 50 courses per user with source tracking.

### 1. Save Course to Library

**Method**: `UserCourseAPI.saveCourse(userId, courseData, source)`

**Parameters**:
```javascript
{
  userId: "uuid",           // User's ID
  courseData: {
    courseCode: "CIS 3100",          // Required
    courseName: "Data Structures",   // Required
    sectionGroup: 1,                 // Required (number)
    schedule: "MW 10:00 AM - 11:30 AM",
    enrolledCurrent: 30,
    enrolledTotal: 40,
    room: "CIS311TC",
    instructor: "Dr. Smith"
  },
  source: "extension"       // 'manual', 'csv', or 'extension'
}
```

**Example**:
```javascript
import UserCourseAPI from '../lib/api/userCourseAPI.js';

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

**Response**:
```javascript
{
  id: "uuid",
  user_id: "uuid",
  course_code: "CIS 3100",
  course_name: "Data Structures",
  section_group: 1,
  schedule: "MW 10:00 AM - 11:30 AM",
  enrolled_current: 30,
  enrolled_total: 40,
  room: "CIS311TC",
  instructor: "Dr. Smith",
  source: "extension",
  created_at: "2025-11-10T12:00:00Z"
}
```

---

### 2. Bulk Save Courses

**Method**: `UserCourseAPI.saveCourses(userId, coursesArray, source)`

**Parameters**:
```javascript
{
  userId: "uuid",
  coursesArray: [
    { courseCode: "CIS 3100", courseName: "Data Structures", sectionGroup: 1, ... },
    { courseCode: "MATH 2010", courseName: "Calculus I", sectionGroup: 2, ... }
  ],
  source: "extension"
}
```

**Example**:
```javascript
const result = await UserCourseAPI.saveCourses(user.id, [
  {
    courseCode: "CIS 3100",
    courseName: "Data Structures",
    sectionGroup: 1,
    schedule: "MW 10:00 AM - 11:30 AM",
    enrolledCurrent: 30,
    enrolledTotal: 40
  },
  {
    courseCode: "MATH 2010",
    courseName: "Calculus I",
    sectionGroup: 2,
    schedule: "TThF 09:00 AM - 10:30 AM",
    enrolledCurrent: 40,
    enrolledTotal: 40
  }
], 'extension');
```

**Response**:
```javascript
{
  success: [/* array of saved courses */],
  errors: [/* array of errors if any */],
  message: "Saved 2/2 courses"
}
```

**Note**: Enforces 50-course limit. Check `getCourseStats()` first.

---

### 3. Get User's Courses

**Method**: `UserCourseAPI.getUserCourses(userId)`

**Example**:
```javascript
const courses = await UserCourseAPI.getUserCourses(user.id);
```

**Response**: Array of course objects

---

### 4. Get Courses by Source

**Method**: `UserCourseAPI.getCoursesBySource(userId, source)`

**Parameters**:
- `source`: `'manual'`, `'csv'`, or `'extension'`

**Example**:
```javascript
const extensionCourses = await UserCourseAPI.getCoursesBySource(user.id, 'extension');
```

---

### 5. Get Course Statistics

**Method**: `UserCourseAPI.getCourseStats(userId)`

**Example**:
```javascript
const stats = await UserCourseAPI.getCourseStats(user.id);
```

**Response**:
```javascript
{
  total: 15,
  manual: 5,
  csv: 7,
  extension: 3,
  remaining: 35
}
```

**Use this to check if user can save more courses before bulk import.**

---

### 6. Delete Course

**Method**: `UserCourseAPI.deleteCourse(courseId)`

**Example**:
```javascript
await UserCourseAPI.deleteCourse("course-uuid");
```

---

### 7. Search Courses

**Method**: `UserCourseAPI.searchCourses(userId, searchTerm)`

**Example**:
```javascript
const results = await UserCourseAPI.searchCourses(user.id, "CIS");
```

---

## Schedules

### 1. Create Schedule

**Method**: `ScheduleAPI.createSchedule(semesterId, userId, name, description)`

**Example**:
```javascript
import { ScheduleAPI } from '../lib/api/scheduleAPI.js';

const schedule = await ScheduleAPI.createSchedule(
  semesterId,
  user.id,
  "Schedule A",
  "My perfect schedule"
);
```

---

### 2. Create Private Schedule

**Method**: `ScheduleAPI.createPrivateSchedule(userId, name, description)`

**Example**:
```javascript
const privateSchedule = await ScheduleAPI.createPrivateSchedule(
  user.id,
  "My Dream Schedule",
  "Not attached to any semester"
);
```

---

### 3. Get Schedule

**Method**: `ScheduleAPI.getScheduleById(scheduleId)`

**Example**:
```javascript
const schedule = await ScheduleAPI.getScheduleById("schedule-uuid");
```

**Response**:
```javascript
{
  id: "uuid",
  semester_id: "uuid" | null,
  user_id: "uuid",
  name: "Schedule A",
  description: "My perfect schedule",
  status: "draft",
  is_favorite: false,
  is_private: false,
  courses: [/* array of courses */]
}
```

---

### 4. Add Course to Schedule

**Method**: `ScheduleAPI.addCourseToSchedule(scheduleId, courseId)`

**Example**:
```javascript
await ScheduleAPI.addCourseToSchedule(scheduleId, courseId);
```

**Note**: Course must exist in `semester_courses` table first.

---

### 5. Remove Course from Schedule

**Method**: `ScheduleAPI.removeCourseFromSchedule(scheduleId, courseId)`

**Example**:
```javascript
await ScheduleAPI.removeCourseFromSchedule(scheduleId, courseId);
```

---

## Semesters

### 1. Get Current Semester

**Method**: `SemesterAPI.getCurrentSemester(userId)`

**Example**:
```javascript
import { SemesterAPI } from '../lib/api/semesterAPI.js';

const semester = await SemesterAPI.getCurrentSemester(user.id);
```

**Response**:
```javascript
{
  id: "uuid",
  user_id: "uuid",
  name: "1st Semester 2025",
  school_year: "2024-2025",
  semester_type: "1st",
  year: 2025,
  status: "active",
  is_current: true
}
```

---

### 2. Create Semester

**Method**: `SemesterAPI.createSemester(userId, semesterType, year)`

**Parameters**:
- `semesterType`: `'1st'`, `'2nd'`, or `'Summer'`
- `year`: Number (e.g., `2025`)

**Example**:
```javascript
const semester = await SemesterAPI.createSemester(user.id, '1st', 2025);
```

---

### 3. Get All User Semesters

**Method**: `SemesterAPI.getUserSemesters(userId)`

**Example**:
```javascript
const semesters = await SemesterAPI.getUserSemesters(user.id);
```

---

## Course Catalog

### 1. Add Course to Semester Catalog

**Method**: `SemesterCourseAPI.addCourseToSemester(semesterId, courseData)`

**Example**:
```javascript
import { SemesterCourseAPI } from '../lib/api/semesterCourseAPI.js';

const course = await SemesterCourseAPI.addCourseToSemester(semesterId, {
  courseCode: "CIS 3100",
  courseName: "Data Structures",
  sectionGroup: 1,
  schedule: "MW 10:00 AM - 11:30 AM",
  enrolledCurrent: 30,
  enrolledTotal: 40,
  room: "CIS311TC",
  instructor: "Dr. Smith"
});
```

---

### 2. Get Semester Courses

**Method**: `SemesterCourseAPI.getSemesterCourses(semesterId)`

**Example**:
```javascript
const courses = await SemesterCourseAPI.getSemesterCourses(semesterId);
```

---

### 3. Bulk Import Courses

**Method**: `SemesterCourseAPI.bulkImportCourses(semesterId, coursesArray)`

**Example**:
```javascript
await SemesterCourseAPI.bulkImportCourses(semesterId, [
  { courseCode: "CIS 3100", courseName: "Data Structures", ... },
  { courseCode: "MATH 2010", courseName: "Calculus I", ... }
]);
```

---

## Error Handling

All API methods throw errors that should be caught:

```javascript
try {
  const course = await UserCourseAPI.saveCourse(user.id, courseData, 'extension');
  console.log('✅ Course saved:', course);
} catch (error) {
  console.error('❌ Error:', error.message);
  // Handle error appropriately
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Course library is full` | User has 50 courses | Ask user to delete some courses |
| `Missing required fields` | courseCode or courseName missing | Validate data before saving |
| `Failed to save course` | Database error | Check data format and try again |

---

## Chrome Extension Example

Complete example of saving courses from a Chrome extension:

```javascript
// content-script.js
import { supabase } from './supabase.js';
import UserCourseAPI from './userCourseAPI.js';

async function scrapeCourses() {
  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Not authenticated');
    return;
  }

  // 2. Check course limit
  const stats = await UserCourseAPI.getCourseStats(user.id);
  if (stats.remaining === 0) {
    alert('Your course library is full (50 courses). Please delete some courses first.');
    return;
  }

  // 3. Scrape courses from DOM
  const courses = [];
  document.querySelectorAll('.course-row').forEach(row => {
    courses.push({
      courseCode: row.querySelector('.code').textContent,
      courseName: row.querySelector('.name').textContent,
      sectionGroup: parseInt(row.querySelector('.section').textContent),
      schedule: row.querySelector('.schedule').textContent,
      enrolledCurrent: parseInt(row.querySelector('.enrolled').textContent),
      enrolledTotal: parseInt(row.querySelector('.capacity').textContent),
      room: row.querySelector('.room')?.textContent || '',
      instructor: row.querySelector('.instructor')?.textContent || ''
    });
  });

  // 4. Check if we can save all courses
  if (courses.length > stats.remaining) {
    alert(`Can only save ${stats.remaining} more courses. You have ${courses.length} scraped.`);
    courses.splice(stats.remaining); // Keep only what we can save
  }

  // 5. Save courses
  try {
    const result = await UserCourseAPI.saveCourses(user.id, courses, 'extension');
    alert(result.message);
  } catch (error) {
    console.error('Error saving courses:', error);
    alert('Failed to save courses: ' + error.message);
  }
}

// Run when button clicked
document.getElementById('save-to-enrollmate').addEventListener('click', scrapeCourses);
```

---

## Best Practices

1. **Always check authentication first**
2. **Check course limit before bulk import** using `getCourseStats()`
3. **Validate data** (courseCode, courseName, sectionGroup are required)
4. **Use proper source tagging** (`'extension'` for Chrome extension)
5. **Handle errors gracefully** with try-catch
6. **Provide user feedback** (success/error messages)

---

## Testing

Test your integration:

1. **Save single course**: Verify it appears in user's library
2. **Save multiple courses**: Test bulk import
3. **Check 50-course limit**: Try saving when at limit
4. **Test invalid data**: Missing required fields
5. **Test duplicates**: Same course+section should update, not duplicate

---

## Support

For questions or issues:
- GitHub: https://github.com/yourusername/enrollmate/issues
- Documentation: See `/CLAUDE.md` for detailed codebase documentation

---

**Last Updated**: 2025-11-10
