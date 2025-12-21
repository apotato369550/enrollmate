# Enrollmate Testing Suite Implementation Plan

**Objective**: Create comprehensive command-line tests using Jest/Vitest covering Auth, Navigation, Schedule Generation, and Course Library features with sample data.

**Status**: Planning Phase
**Created**: 2025-12-20

---

## Overview

This plan outlines the implementation of a complete testing suite for EnrollMate using **Vitest** (fast, modern, Vite-compatible) as the primary test runner, with **@testing-library** for React component testing and **Supertest** for API endpoint testing.

### Why Vitest Over Jest?
- **Faster**: Uses ESM natively (matches project setup)
- **Vite-integrated**: Works with Next.js build pipeline
- **Better DX**: Hot module reload for tests
- **ES Module support**: Aligns with project's `.js` extension requirement
- **Jest-compatible**: Can use same syntax and libraries

---

## Testing Architecture

```
enrollmate/
├── __tests__/                          # Test files (mirrors src/ structure)
│   ├── unit/                           # Unit tests
│   │   ├── auth/
│   │   ├── schedules/
│   │   ├── semesters/
│   │   ├── courses/
│   │   └── scheduler/
│   ├── integration/                    # Integration tests
│   │   ├── auth-flow.test.js
│   │   ├── schedule-workflow.test.js
│   │   ├── course-import.test.js
│   │   └── navigation.test.js
│   ├── e2e/                            # End-to-end tests
│   │   ├── user-journey.test.js
│   │   └── full-schedule-creation.test.js
│   ├── fixtures/                       # Test data
│   │   ├── sample-users.js
│   │   ├── sample-courses.js
│   │   ├── sample-semesters.js
│   │   └── csv-parser.js
│   └── setup/                          # Test setup
│       ├── vitest.setup.js
│       └── supabase-mock.js
├── vitest.config.js                    # Vitest configuration
└── package.json                        # Dependencies + test scripts
```

---

## Phase 1: Setup & Infrastructure

### 1.1 Dependencies to Install

```bash
npm install --save-dev \
  vitest \
  @vitest/ui \
  jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  supertest \
  @supabase/supabase-js \
  csv-parse \
  dotenv
```

**Dependency Rationale**:
- **vitest**: Fast test runner with ESM support
- **@vitest/ui**: Visual test dashboard
- **jsdom**: Browser environment simulation
- **@testing-library/react**: Component testing best practices
- **supertest**: HTTP assertion library for API testing
- **csv-parse**: Parse CSV sample data for tests
- **dotenv**: Load test environment variables

### 1.2 Configuration Files

#### vitest.config.js
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.js'],
    include: ['**/__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/fixtures/',
        '__tests__/setup/',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './lib'),
    }
  }
});
```

#### package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:auth": "vitest __tests__/unit/auth",
    "test:schedules": "vitest __tests__/unit/schedules",
    "test:integration": "vitest __tests__/integration",
    "test:e2e": "vitest __tests__/e2e"
  }
}
```

---

## Phase 2: Test Fixtures & Mock Data

### 2.1 Sample Users (`__tests__/fixtures/sample-users.js`)

```javascript
export const testUser1 = {
  id: 'user-001',
  email: 'student1@university.edu',
  password: 'TestPassword123!',
  firstName: 'John',
  lastName: 'Doe',
  studentId: 'STU123456',
  program: 'Computer Science',
  yearLevel: 'Junior',
  contactNumber: '555-0001'
};

export const testUser2 = {
  id: 'user-002',
  email: 'student2@university.edu',
  password: 'SecurePass456!',
  firstName: 'Jane',
  lastName: 'Smith',
  studentId: 'STU654321',
  program: 'Engineering',
  yearLevel: 'Senior',
  contactNumber: '555-0002'
};

export const newSignupUser = {
  firstName: 'Test',
  lastName: 'Student',
  middleInitial: 'T',
  email: 'test@university.edu',
  studentId: 'STU999999',
  password: 'NewPass789!',
  confirmPassword: 'NewPass789!'
};
```

### 2.2 Sample Semesters (`__tests__/fixtures/sample-semesters.js`)

```javascript
export const semesterSpring2025 = {
  name: '1st Semester 2025',
  schoolYear: '2024-2025',
  semesterType: '1st',
  year: 2025
};

export const semesterSummer2025 = {
  name: 'Summer 2025',
  schoolYear: '2024-2025',
  semesterType: 'Summer',
  year: 2025
};
```

### 2.3 Sample Courses (`__tests__/fixtures/sample-courses.js`)

```javascript
// Load from sample-schedules/computer-science/cs-student-schedule.csv
export const computerscienceCourses = [
  {
    courseCode: 'CIS 3100',
    courseName: 'Data Structures and Algorithms',
    sectionGroup: 1,
    schedule: 'MW 11:00 AM - 12:30 PM',
    enrolledCurrent: 25,
    enrolledTotal: 30,
    room: 'CIS311TC',
    instructor: 'Dr. Smith'
  },
  {
    courseCode: 'CIS 3100',
    courseName: 'Data Structures and Algorithms',
    sectionGroup: 2,
    schedule: 'TTh 11:00 AM - 12:30 PM',
    enrolledCurrent: 28,
    enrolledTotal: 30,
    room: 'CIS312TC',
    instructor: 'Prof. Johnson'
  },
  // ... more courses from CSV
];
```

### 2.4 CSV Parser Helper (`__tests__/fixtures/csv-parser.js`)

```javascript
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

export function loadSampleCsv(category) {
  const filePath = path.join(
    process.cwd(),
    `sample-schedules/${category}/${category}-student-schedule.csv`
  );

  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  });

  return records.map(row => ({
    courseCode: row['Course Code'],
    courseName: row['Course Name'],
    sectionGroup: parseInt(row['Group']),
    schedule: row['Schedule'],
    enrolledCurrent: parseInt(row['Enrolled'].split('/')[0]),
    enrolledTotal: parseInt(row['Enrolled'].split('/')[1])
  }));
}

export const sampleCategories = [
  'computer-science',
  'engineering',
  'law',
  'psychology',
  'biology',
  'physics',
  'finance',
  'accounting'
];
```

---

## Phase 3: Unit Tests

### 3.1 Authentication Tests (`__tests__/unit/auth/auth-flow.test.js`)

**Test Cases**:
- Signup with valid credentials
- Signup with invalid email format
- Signup with mismatched passwords
- Signup with duplicate email
- Login with correct credentials
- Login with incorrect password
- Login with non-existent user
- Remember password checkbox functionality
- Logout clears session
- Protected routes redirect when not authenticated

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testUser1, newSignupUser } from '../../fixtures/sample-users.js';

describe('Authentication Flow', () => {
  describe('Signup', () => {
    it('should create new user with valid credentials', async () => {
      // Mock Supabase signup
      // Verify profile created
      // Verify redirect to login
    });

    it('should reject signup with mismatched passwords', async () => {
      // Should show error message
      // Should not create user
    });

    it('should validate email format', async () => {
      // Should reject invalid emails
      // Should accept valid emails
    });
  });

  describe('Login', () => {
    it('should sign in with valid credentials', async () => {
      // Mock auth.signInWithPassword()
      // Verify success redirect to /dashboard
    });

    it('should show error for invalid password', async () => {
      // Should display error message
      // Should not redirect
    });
  });

  describe('Logout', () => {
    it('should sign out user and clear session', async () => {
      // Mock auth.signOut()
      // Verify redirect to /login
      // Verify session cleared
    });
  });
});
```

### 3.2 Profile Update Tests (`__tests__/unit/auth/profile-updates.test.js`)

**Test Cases**:
- Update first name
- Update student ID with uniqueness check
- Update email via Supabase auth
- Update program/year/contact
- Change password (current + new with validation)
- Upload and change avatar
- Validation: required fields, email format, student ID uniqueness
- Error handling for failed updates

### 3.3 Account Deletion Tests (`__tests__/unit/auth/account-deletion.test.js`)

**Test Cases**:
- Show confirmation modal
- Require password re-authentication
- Delete user via admin API
- Cascade delete all user data
- Logout and redirect to landing page
- Verify database cleanup (no orphaned records)

### 3.4 Schedule Domain Model Tests (`__tests__/unit/schedules/Schedule.test.js`)

**Test Cases**:
- Create schedule from database
- Add course without conflict
- Add course with conflict (same day/time)
- Check hasConflict() method
- Calculate total credits
- Status transitions (draft → active → finalized → archived)
- isEditable() based on status
- getTotalCredits() returns correct value
- getPreviewCourses() returns first 3

```javascript
import { describe, it, expect } from 'vitest';
import { Schedule } from '@lib/domain/Schedule.js';
import { computerscienceCourses } from '../../fixtures/sample-courses.js';

describe('Schedule Domain Model', () => {
  it('should detect time conflict for same day/time', () => {
    const course1 = computerscienceCourses[0]; // MW 11:00-12:30
    const course2 = computerscienceCourses[1]; // TTh 11:00-12:30 (no conflict)

    const schedule = new Schedule('test-id', null, 'user-1', 'Test', 'Test');
    expect(schedule.hasConflict(course1)).toBe(false);
    expect(schedule.hasConflict(course2)).toBe(false);

    // Add course1
    schedule.addCourse(course1);

    // Should conflict with another MW 11-12:30
    const conflictingCourse = {
      ...course1,
      courseCode: 'MATH 2010',
      schedule: 'MW 11:30 AM - 1:00 PM'
    };
    expect(schedule.hasConflict(conflictingCourse)).toBe(true);
  });

  it('should calculate total credits', () => {
    const schedule = new Schedule('test-id', null, 'user-1', 'Test', 'Test');
    expect(schedule.getTotalCredits()).toBe(0);

    schedule.courses = computerscienceCourses.slice(0, 3);
    expect(schedule.getTotalCredits()).toBe(9); // 3 courses × 3 credits
  });

  it('should transition between statuses', () => {
    const schedule = new Schedule('test-id', null, 'user-1', 'Test', 'Test');
    expect(schedule.status).toBe('draft');
    expect(schedule.isEditable()).toBe(true);

    schedule.activate();
    expect(schedule.status).toBe('active');
    expect(schedule.isEditable()).toBe(true);

    schedule.finalize();
    expect(schedule.status).toBe('finalized');
    expect(schedule.isEditable()).toBe(false);
  });
});
```

### 3.5 Conflict Detection Tests (`__tests__/unit/scheduler/conflict-detection.test.js`)

**Test Cases**:
- Parse "MW 10:00 AM - 11:30 AM" correctly
- Parse "TTh 2:00 PM - 3:30 PM" correctly
- Detect conflict for same-day overlaps
- No conflict for different days
- No conflict for non-overlapping times
- Boundary conditions (classes ending at 12:00, starting at 12:00)
- Edge cases: all-day, single day, multiple days

### 3.6 Semester Management Tests (`__tests__/unit/semesters/Semester.test.js`)

**Test Cases**:
- Create semester
- Set as current
- Archive semester
- Get active status
- Relationship with schedules

### 3.7 User Course Library Tests (`__tests__/unit/courses/user-course-library.test.js`)

**Test Cases**:
- Save course to library
- Enforce 50-course limit
- Prevent duplicate course sections
- Source tracking (manual, csv, extension)
- Get courses by source
- Delete course (if not in use)
- Get course statistics
- Bulk import from CSV
- Search and filter courses

```javascript
import { describe, it, expect } from 'vitest';
import { UserCourseAPI } from '@lib/api/userCourseAPI.js';
import { loadSampleCsv } from '../../fixtures/csv-parser.js';

describe('User Course Library', () => {
  it('should enforce 50-course limit', async () => {
    // Create 50 courses
    // Try to add 51st → should fail
  });

  it('should track source of imported courses', async () => {
    const courses = loadSampleCsv('computer-science');
    const result = await UserCourseAPI.saveCourses(userId, courses, 'csv');

    expect(result.success.length).toBeGreaterThan(0);

    const stats = await UserCourseAPI.getCourseStats(userId);
    expect(stats.csv).toBe(result.success.length);
  });

  it('should prevent duplicate course sections', async () => {
    // Add course CIS 3100, Section 1
    // Try to add same course/section again → should fail or update
  });
});
```

---

## Phase 4: Integration Tests

### 4.1 Complete Auth Flow (`__tests__/integration/auth-flow.test.js`)

**Workflow**:
1. User signs up with new credentials
2. Verify profile created in database
3. Redirect to login page with success message
4. Login with new credentials
5. Verify redirected to dashboard
6. Update profile information
7. Change password
8. Logout
9. Try to access protected route (redirects to login)

### 4.2 Complete Schedule Workflow (`__tests__/integration/schedule-workflow.test.js`)

**Workflow**:
1. Create semester (1st Semester 2025)
2. Import courses from CSV (computer-science sample)
3. Create two schedules (A and B)
4. Add courses to Schedule A with conflict detection
5. Add different courses to Schedule B
6. Save both schedules
7. Verify schedules persist in database
8. Create private schedule
9. Verify schedule can be archived
10. Delete Schedule A
11. Verify deletion cascade

### 4.3 Course Import Workflow (`__tests__/integration/course-import.test.js`)

**Workflow**:
1. Load sample CSV (computer-science)
2. Parse CSV to course objects
3. Bulk import courses to semester catalog
4. Save courses to user library (with source tracking)
5. Verify 50-course limit enforcement
6. Search for imported courses
7. Use library courses in schedule generation

### 4.4 Navigation Flow (`__tests__/integration/navigation.test.js`)

**Test Cases**:
- Landing → Signup → Login → Dashboard
- Dashboard → Scheduler
- Dashboard → Courses
- Dashboard → Profile
- Dashboard → Schedule Detail → Dashboard
- Protected route redirect when not authenticated
- Semester selector switches context
- All links work without 404s

---

## Phase 5: End-to-End Tests

### 5.1 Complete User Journey (`__tests__/e2e/user-journey.test.js`)

**Full Scenario** (Realistic student workflow):
1. User lands on homepage
2. Clicks "Get Started" → Signup
3. Enters: John Doe, CS student, password
4. Redirected to login with success message
5. Logs in
6. Sees empty dashboard
7. Creates "1st Semester 2025"
8. Imports computer-science CSV
9. Opens scheduler
10. Generates 5 schedules with morning preference
11. Views timetable for Schedule A
12. Saves Schedule A to semester
13. Creates private "Dream Schedule"
14. Views both schedules on dashboard
15. Exports Schedule A to PDF
16. Updates profile with contact info
17. Changes password
18. Logs out
19. Logs back in
20. Verifies all data persisted

### 5.2 Multiple Student Archetypes (`__tests__/e2e/multi-major-schedules.test.js`)

**Test Cases**:
- Computer Science student workflow with CS courses
- Engineering student workflow with ENGR courses
- Psychology student workflow
- Each major has different scheduling constraints
- Verify conflict detection across all majors

---

## Phase 6: Setup & Fixtures Configuration

### 6.1 Vitest Setup (`__tests__/setup/vitest.setup.js`)

```javascript
import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Supabase client
vi.mock('@lib/supabase.js', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(),
  }
}));

// Global test configuration
afterEach(() => {
  vi.clearAllMocks();
});
```

### 6.2 Supabase Mock (`__tests__/setup/supabase-mock.js`)

```javascript
export const createMockSupabase = () => {
  const mockDb = {
    schedules: [],
    semesters: [],
    semesterCourses: [],
    userCourses: [],
    profiles: [],
  };

  return {
    from: (table) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      data: mockDb[table] || [],
    })
  };
};
```

### 6.3 Test Environment File (`.env.test`)

```bash
NEXT_PUBLIC_SUPABASE_API=https://test.supabase.co
NEXT_PUBLIC_PUBLIC_API_KEY=test-key-123
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
DATABASE_URL=postgresql://test:test@localhost:5432/enrollmate_test
```

---

## Phase 7: Implementation Roadmap

### Step 1: Setup (1-2 hours)
- [x] Install dependencies
- [ ] Create vitest.config.js
- [ ] Update package.json scripts
- [ ] Create test directory structure
- [ ] Setup vitest.setup.js
- [ ] Create .env.test

### Step 2: Fixtures & Mock Data (1-2 hours)
- [ ] Create sample-users.js
- [ ] Create sample-courses.js (with CSV loading)
- [ ] Create sample-semesters.js
- [ ] Create supabase-mock.js
- [ ] Create csv-parser.js helper

### Step 3: Unit Tests (4-6 hours)
- [ ] Auth flow tests
- [ ] Profile update tests
- [ ] Account deletion tests
- [ ] Schedule domain model tests
- [ ] Conflict detection tests
- [ ] Semester tests
- [ ] User course library tests

### Step 4: Integration Tests (3-4 hours)
- [ ] Complete auth workflow
- [ ] Complete schedule workflow
- [ ] Course import workflow
- [ ] Navigation tests

### Step 5: E2E Tests (2-3 hours)
- [ ] Full user journey (single student)
- [ ] Multi-major schedules

### Step 6: CI/CD Integration (1-2 hours)
- [ ] GitHub Actions workflow
- [ ] Pre-commit hooks
- [ ] Coverage reports

### Step 7: Documentation & Refinement (1 hour)
- [ ] Write test documentation
- [ ] Add comments to test files
- [ ] Create troubleshooting guide

---

## Running Tests

### Command Reference

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Visual dashboard
npm run test:ui

# Coverage report
npm run test:coverage

# Specific test suite
npm run test:auth
npm run test:schedules
npm run test:integration
npm run test:e2e
```

### Expected Output

```
✓ __tests__/unit/auth/auth-flow.test.js (12 tests)
✓ __tests__/unit/auth/profile-updates.test.js (8 tests)
✓ __tests__/unit/schedules/Schedule.test.js (10 tests)
✓ __tests__/integration/schedule-workflow.test.js (11 tests)
✓ __tests__/e2e/user-journey.test.js (20 tests)

Test Files  5 passed (5)
Tests     61 passed (61)
Duration  2.34s
Coverage  78% lines, 72% branches
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Vitest over Jest** | ESM support, faster, Vite-integrated |
| **Testing Library** | Best practices, accessibility-focused |
| **CSV fixtures** | Real sample data, tests actual workflows |
| **Mock Supabase** | Tests don't hit real DB, fast execution |
| **Phase-based rollout** | Can implement incrementally, MVP first |
| **Fixture organization** | Easy to extend with new archetypes |

---

## Measurement & Success Criteria

### Phase Completion
- ✅ Setup complete: Dependencies installed, config working
- ✅ Fixtures ready: All sample data available
- ✅ Unit tests: 60+ passing tests
- ✅ Integration tests: All workflows covered
- ✅ E2E tests: Full user journey validated
- ✅ Coverage: >70% lines, >60% branches

### Quality Gates
- All tests pass before deployment
- Coverage maintained or improved
- New features must include tests
- Integration tests run on every PR

---

## Future Enhancements

1. **Visual Regression Testing**: Add Percy or Chromatic
2. **Performance Testing**: Measure scheduler engine speed
3. **Accessibility Testing**: Add axe-core for WCAG compliance
4. **Load Testing**: Test with 1000+ courses
5. **Contract Testing**: Browser extension API contracts
6. **Mutation Testing**: Ensure test quality with Stryker

---

## Notes

- All tests use sample data from `sample-schedules/` folder
- Tests are isolated and can run in any order
- Mock Supabase prevents accidental production data changes
- Each test cleans up after itself (no side effects)
- Test fixtures are reusable across multiple test suites

---

**Next Steps**:
1. Review this plan
2. Get approval to proceed
3. Begin Phase 1: Setup & Infrastructure
