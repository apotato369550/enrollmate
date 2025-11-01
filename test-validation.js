/**
 * Comprehensive Validation Test Suite for Enrollmate
 * Tests all API endpoints with realistic sample data
 */

import { ScheduleAPI } from './lib/api/scheduleAPI.js';
import { SemesterAPI } from './lib/api/semesterAPI.js';
import { SemesterCourseAPI } from './lib/api/semesterCourseAPI.js';
import UserCourseAPI from './lib/api/userCourseAPI.js';
import { supabase } from './src/lib/supabase.js';

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  errors: []
};

// Test user (would need to be created in Supabase)
const testUserId = 'test-user-' + Date.now();

// Sample course data for testing
const sampleCourses = [
  {
    courseCode: 'CIS 3100',
    courseName: 'Data Structures and Algorithms',
    sectionGroup: 1,
    schedule: 'MW 10:00 AM - 11:30 AM',
    enrolledCurrent: 28,
    enrolledTotal: 30,
    room: 'CIS311TC',
    instructor: 'Dr. Smith',
    status: 'OK'
  },
  {
    courseCode: 'MATH 2010',
    courseName: 'Calculus II',
    sectionGroup: 2,
    schedule: 'TTh 09:00 AM - 10:30 AM',
    enrolledCurrent: 32,
    enrolledTotal: 35,
    room: 'MATH203',
    instructor: 'Prof. Johnson',
    status: 'OK'
  },
  {
    courseCode: 'ENGL 1101',
    courseName: 'English Composition',
    sectionGroup: 1,
    schedule: 'MWF 02:00 PM - 03:00 PM',
    enrolledCurrent: 25,
    enrolledTotal: 25,
    room: 'ENGL105',
    instructor: 'Dr. Williams',
    status: 'FULL'
  },
  {
    courseCode: 'CHEM 1010',
    courseName: 'Chemistry I',
    sectionGroup: 3,
    schedule: 'TTh 01:00 PM - 02:30 PM',
    enrolledCurrent: 1,
    enrolledTotal: 30,
    room: 'CHEM101',
    instructor: 'Dr. Brown',
    status: 'AT-RISK'
  }
];

// Helper function for colored output
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m',  // green
    error: '\x1b[31m',    // red
    warning: '\x1b[33m',  // yellow
    reset: '\x1b[0m'
  };
  console.log(`${colors[type] || colors.info}${message}${colors.reset}`);
}

// Test wrapper
async function runTest(testName, testFn) {
  try {
    log(`\nTesting: ${testName}...`, 'info');
    await testFn();
    testResults.passed.push(testName);
    log(`✓ PASSED: ${testName}`, 'success');
  } catch (error) {
    testResults.failed.push({ test: testName, error: error.message });
    log(`✗ FAILED: ${testName}`, 'error');
    log(`  Error: ${error.message}`, 'error');
  }
}

// Main test suite
async function runValidationSuite() {
  log('\n========================================', 'info');
  log('ENROLLMATE VALIDATION TEST SUITE', 'info');
  log('========================================', 'info');

  // Test 1: Check Supabase connection
  log('\n--- Phase 1: Environment Validation ---', 'info');
  await runTest('Supabase Connection', async () => {
    const { data, error } = await supabase.from('semesters').select('count()', { count: 'exact' }).limit(0);
    if (error) throw new Error(`Connection failed: ${error.message}`);
    log('  Supabase connected successfully', 'info');
  });

  // Test 2: Create Semester
  log('\n--- Phase 2: Semester API Tests ---', 'info');
  let semesterId = null;

  await runTest('SemesterAPI.createSemester()', async () => {
    const semester = await SemesterAPI.createSemester(
      testUserId,
      'Fall 2025',
      '2025-2026',
      '1st',
      2025
    );
    semesterId = semester.id;
    if (!semesterId) throw new Error('Semester ID not returned');
    log(`  Created semester: ${semesterId}`, 'info');
  });

  // Test 3: Get Semester
  await runTest('SemesterAPI.getSemesterById()', async () => {
    if (!semesterId) throw new Error('No semester ID from previous test');
    const semester = await SemesterAPI.getSemesterById(semesterId);
    if (!semester || semester.id !== semesterId) {
      throw new Error('Semester not found or ID mismatch');
    }
    log(`  Retrieved semester: ${semester.name}`, 'info');
  });

  // Test 4: Get User Semesters
  await runTest('SemesterAPI.getUserSemesters()', async () => {
    const semesters = await SemesterAPI.getUserSemesters(testUserId);
    if (!Array.isArray(semesters)) throw new Error('Did not return array');
    log(`  Found ${semesters.length} semester(s) for user`, 'info');
  });

  // Test 5: Update Semester
  await runTest('SemesterAPI.updateSemester()', async () => {
    if (!semesterId) throw new Error('No semester ID from previous test');
    const updated = await SemesterAPI.updateSemester(semesterId, {
      name: 'Fall 2025 - Updated'
    });
    if (updated.name !== 'Fall 2025 - Updated') {
      throw new Error('Semester name not updated');
    }
    log(`  Updated semester name: ${updated.name}`, 'info');
  });

  // Test 6: Add Courses to Semester
  log('\n--- Phase 3: Semester Course API Tests ---', 'info');
  const courseIds = [];

  for (const course of sampleCourses.slice(0, 2)) {
    await runTest(`SemesterCourseAPI.addCourseToSemester() - ${course.courseCode}`, async () => {
      if (!semesterId) throw new Error('No semester ID');
      const added = await SemesterCourseAPI.addCourseToSemester(semesterId, course);
      courseIds.push(added.id);
      if (!added.id) throw new Error('Course ID not returned');
      log(`  Added course: ${added.courseCode}`, 'info');
    });
  }

  // Test 7: Get Semester Courses
  await runTest('SemesterCourseAPI.getSemesterCourses()', async () => {
    if (!semesterId) throw new Error('No semester ID');
    const courses = await SemesterCourseAPI.getSemesterCourses(semesterId);
    if (!Array.isArray(courses)) throw new Error('Did not return array');
    log(`  Found ${courses.length} course(s) in semester`, 'info');
  });

  // Test 8: Get Course by ID
  await runTest('SemesterCourseAPI.getCourseById()', async () => {
    if (courseIds.length === 0) throw new Error('No course IDs from previous tests');
    const course = await SemesterCourseAPI.getCourseById(courseIds[0]);
    if (!course || course.id !== courseIds[0]) {
      throw new Error('Course not found or ID mismatch');
    }
    log(`  Retrieved course: ${course.courseCode}`, 'info');
  });

  // Test 9: Update Course
  await runTest('SemesterCourseAPI.updateCourse()', async () => {
    if (courseIds.length === 0) throw new Error('No course IDs');
    const updated = await SemesterCourseAPI.updateCourse(courseIds[0], {
      enrolledCurrent: 29,
      status: 'OK'
    });
    if (updated.enrolledCurrent !== 29) {
      throw new Error('Course enrollment not updated');
    }
    log(`  Updated course enrollment to ${updated.enrolledCurrent}`, 'info');
  });

  // Test 10: Search Courses
  await runTest('SemesterCourseAPI.searchCourses()', async () => {
    if (!semesterId) throw new Error('No semester ID');
    const courses = await SemesterCourseAPI.searchCourses(semesterId, 'CIS');
    if (!Array.isArray(courses)) throw new Error('Did not return array');
    log(`  Found ${courses.length} course(s) matching "CIS"`, 'info');
  });

  // Test 11: Bulk Import Courses
  await runTest('SemesterCourseAPI.bulkImportCourses()', async () => {
    if (!semesterId) throw new Error('No semester ID');
    const imported = await SemesterCourseAPI.bulkImportCourses(semesterId, sampleCourses.slice(2, 4));
    if (!Array.isArray(imported) || imported.length === 0) {
      throw new Error('Bulk import failed');
    }
    log(`  Bulk imported ${imported.length} course(s)`, 'info');
    courseIds.push(...imported.map(c => c.id));
  });

  // Test 12: Create Schedule
  log('\n--- Phase 4: Schedule API Tests ---', 'info');
  let scheduleId = null;

  await runTest('ScheduleAPI.createSchedule()', async () => {
    if (!semesterId) throw new Error('No semester ID');
    const schedule = await ScheduleAPI.createSchedule(
      semesterId,
      testUserId,
      'Schedule A',
      'My first generated schedule'
    );
    scheduleId = schedule.id;
    if (!scheduleId) throw new Error('Schedule ID not returned');
    log(`  Created schedule: ${scheduleId}`, 'info');
  });

  // Test 13: Get Schedule by ID
  await runTest('ScheduleAPI.getScheduleById()', async () => {
    if (!scheduleId) throw new Error('No schedule ID');
    const schedule = await ScheduleAPI.getScheduleById(scheduleId);
    if (!schedule || schedule.id !== scheduleId) {
      throw new Error('Schedule not found or ID mismatch');
    }
    log(`  Retrieved schedule: ${schedule.name}`, 'info');
  });

  // Test 14: Add Course to Schedule
  await runTest('ScheduleAPI.addCourseToSchedule()', async () => {
    if (!scheduleId || courseIds.length === 0) throw new Error('Missing schedule or course ID');
    const added = await ScheduleAPI.addCourseToSchedule(scheduleId, courseIds[0]);
    if (!added || !added.schedule_id) {
      throw new Error('Course not added to schedule');
    }
    log(`  Added course to schedule`, 'info');
  });

  // Test 15: Get Schedule Courses
  await runTest('ScheduleAPI.getScheduleCourses()', async () => {
    if (!scheduleId) throw new Error('No schedule ID');
    const courses = await ScheduleAPI.getScheduleCourses(scheduleId);
    if (!Array.isArray(courses)) throw new Error('Did not return array');
    log(`  Found ${courses.length} course(s) in schedule`, 'info');
  });

  // Test 16: Update Schedule
  await runTest('ScheduleAPI.updateSchedule()', async () => {
    if (!scheduleId) throw new Error('No schedule ID');
    const updated = await ScheduleAPI.updateSchedule(scheduleId, {
      name: 'Schedule A - Updated',
      isFavorite: true
    });
    if (updated.name !== 'Schedule A - Updated') {
      throw new Error('Schedule name not updated');
    }
    if (!updated.isFavorite) {
      throw new Error('Schedule not marked as favorite');
    }
    log(`  Updated schedule: ${updated.name}`, 'info');
  });

  // Test 17: Get Semester Schedules
  await runTest('ScheduleAPI.getSemesterSchedules()', async () => {
    if (!semesterId) throw new Error('No semester ID');
    const schedules = await ScheduleAPI.getSemesterSchedules(semesterId);
    if (!Array.isArray(schedules)) throw new Error('Did not return array');
    log(`  Found ${schedules.length} schedule(s) for semester`, 'info');
  });

  // Test 18: Duplicate Schedule
  let duplicateId = null;
  await runTest('ScheduleAPI.duplicateSchedule()', async () => {
    if (!scheduleId) throw new Error('No schedule ID');
    const duplicate = await ScheduleAPI.duplicateSchedule(scheduleId, 'Schedule A - Copy');
    duplicateId = duplicate.id;
    if (!duplicateId) throw new Error('Duplicate ID not returned');
    log(`  Duplicated schedule: ${duplicateId}`, 'info');
  });

  // Test 19: Remove Course from Schedule
  await runTest('ScheduleAPI.removeCourseFromSchedule()', async () => {
    if (!scheduleId || courseIds.length === 0) throw new Error('Missing schedule or course ID');
    await ScheduleAPI.removeCourseFromSchedule(scheduleId, courseIds[0]);
    log(`  Removed course from schedule`, 'info');
  });

  // Test 20: User Course API - Save Course
  log('\n--- Phase 5: User Course API Tests ---', 'info');
  let userCourseId = null;

  await runTest('UserCourseAPI.saveCourse()', async () => {
    const saved = await UserCourseAPI.saveCourse(testUserId, sampleCourses[0], 'csv');
    userCourseId = saved.id;
    if (!userCourseId) throw new Error('User course ID not returned');
    log(`  Saved course to user library: ${userCourseId}`, 'info');
  });

  // Test 21: Get User Courses
  await runTest('UserCourseAPI.getUserCourses()', async () => {
    const courses = await UserCourseAPI.getUserCourses(testUserId);
    if (!Array.isArray(courses)) throw new Error('Did not return array');
    log(`  Found ${courses.length} saved course(s) for user`, 'info');
  });

  // Test 22: Get User Course Count
  await runTest('UserCourseAPI.getUserCourseCount()', async () => {
    const count = await UserCourseAPI.getUserCourseCount(testUserId);
    if (typeof count !== 'number') throw new Error('Did not return number');
    log(`  User has ${count} course(s) in library`, 'info');
  });

  // Test 23: Get Courses by Source
  await runTest('UserCourseAPI.getCoursesBySource()', async () => {
    const courses = await UserCourseAPI.getCoursesBySource(testUserId, 'csv');
    if (!Array.isArray(courses)) throw new Error('Did not return array');
    log(`  Found ${courses.length} CSV course(s) for user`, 'info');
  });

  // Test 24: Search User Courses
  await runTest('UserCourseAPI.searchCourses()', async () => {
    const courses = await UserCourseAPI.searchCourses(testUserId, 'CIS');
    if (!Array.isArray(courses)) throw new Error('Did not return array');
    log(`  Found ${courses.length} course(s) matching search`, 'info');
  });

  // Test 25: Get Course Statistics
  await runTest('UserCourseAPI.getCourseStats()', async () => {
    const stats = await UserCourseAPI.getCourseStats(testUserId);
    if (!stats || typeof stats.total !== 'number') {
      throw new Error('Invalid stats object');
    }
    log(`  Stats - Total: ${stats.total}, Manual: ${stats.manual}, CSV: ${stats.csv}`, 'info');
  });

  // Test 26: Create Private Schedule
  log('\n--- Phase 6: Private Schedule Tests ---', 'info');
  let privateScheduleId = null;

  await runTest('ScheduleAPI.createPrivateSchedule()', async () => {
    const schedule = await ScheduleAPI.createPrivateSchedule(
      testUserId,
      'My Personal Schedule',
      'A private schedule not attached to any semester'
    );
    privateScheduleId = schedule.id;
    if (!privateScheduleId) throw new Error('Private schedule ID not returned');
    if (!schedule.isPrivate) throw new Error('Schedule not marked as private');
    log(`  Created private schedule: ${privateScheduleId}`, 'info');
  });

  // Test 27: Get User Private Schedules
  await runTest('ScheduleAPI.getUserPrivateSchedules()', async () => {
    const schedules = await ScheduleAPI.getUserPrivateSchedules(testUserId);
    if (!Array.isArray(schedules)) throw new Error('Did not return array');
    log(`  Found ${schedules.length} private schedule(s) for user`, 'info');
  });

  // Cleanup Tests
  log('\n--- Phase 7: Cleanup Tests ---', 'info');

  // Test 28: Delete Course from Semester
  await runTest('SemesterCourseAPI.deleteCourse()', async () => {
    if (courseIds.length === 0) throw new Error('No course IDs to delete');
    const courseIdToDelete = courseIds.pop();
    await SemesterCourseAPI.deleteCourse(courseIdToDelete);
    log(`  Deleted course: ${courseIdToDelete}`, 'info');
  });

  // Test 29: Delete Schedule
  await runTest('ScheduleAPI.deleteSchedule()', async () => {
    if (!duplicateId) throw new Error('No duplicate schedule ID');
    await ScheduleAPI.deleteSchedule(duplicateId);
    log(`  Deleted duplicate schedule: ${duplicateId}`, 'info');
  });

  // Test 30: Delete User Course
  await runTest('UserCourseAPI.deleteCourse()', async () => {
    if (!userCourseId) throw new Error('No user course ID');
    await UserCourseAPI.deleteCourse(userCourseId);
    log(`  Deleted user course: ${userCourseId}`, 'info');
  });

  // Test 31: Archive Semester
  await runTest('SemesterAPI.archiveSemester()', async () => {
    if (!semesterId) throw new Error('No semester ID');
    const archived = await SemesterAPI.archiveSemester(semesterId);
    if (archived.status !== 'archived') {
      throw new Error('Semester not archived');
    }
    log(`  Archived semester: ${semesterId}`, 'info');
  });

  // Test 32: Delete Semester
  await runTest('SemesterAPI.deleteSemester()', async () => {
    if (!semesterId) throw new Error('No semester ID');
    await SemesterAPI.deleteSemester(semesterId);
    log(`  Deleted semester: ${semesterId}`, 'info');
  });

  // Final Report
  log('\n========================================', 'info');
  log('TEST SUITE COMPLETE', 'info');
  log('========================================', 'info');

  log(`\nTotal Tests Run: ${testResults.passed.length + testResults.failed.length}`, 'info');
  log(`Passed: ${testResults.passed.length}`, 'success');
  log(`Failed: ${testResults.failed.length}`, testResults.failed.length > 0 ? 'error' : 'success');

  if (testResults.failed.length > 0) {
    log('\nFailed Tests:', 'error');
    testResults.failed.forEach(f => {
      log(`  - ${f.test}: ${f.error}`, 'error');
    });
  }

  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run the test suite
runValidationSuite().catch(error => {
  log(`\nFATAL ERROR: ${error.message}`, 'error');
  process.exit(1);
});
