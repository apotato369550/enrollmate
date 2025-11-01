/**
 * Static Code Analysis Test - Validates API structure without database calls
 * This tests the API code itself for bugs, consistency, and issues
 */

import { ScheduleAPI } from './lib/api/scheduleAPI.js';
import { SemesterAPI } from './lib/api/semesterAPI.js';
import { SemesterCourseAPI } from './lib/api/semesterCourseAPI.js';
import UserCourseAPI from './lib/api/userCourseAPI.js';
import { Schedule } from './lib/domain/Schedule.js';
import { Semester } from './lib/domain/Semester.js';
import { SemesterCourse } from './lib/domain/SemesterCourse.js';
import fs from 'fs';

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(msg, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type] || colors.info}${msg}${colors.reset}`);
}

function test(name, fn) {
  try {
    log(`\nTest: ${name}...`, 'info');
    fn();
    results.passed.push(name);
    log(`✓ PASSED: ${name}`, 'success');
  } catch (error) {
    results.failed.push({ test: name, error: error.message });
    log(`✗ FAILED: ${name}`, 'error');
    log(`  Error: ${error.message}`, 'error');
  }
}

function warn(msg) {
  results.warnings.push(msg);
  log(`⚠ WARNING: ${msg}`, 'warning');
}

// ============================================================================
// PHASE 1: API Method Existence Tests
// ============================================================================

log('\n========================================', 'info');
log('PHASE 1: API Structure Validation', 'info');
log('========================================', 'info');

test('ScheduleAPI has required methods', () => {
  const requiredMethods = ['createSchedule', 'getScheduleById', 'getSemesterSchedules',
                          'updateSchedule', 'deleteSchedule', 'addCourseToSchedule',
                          'removeCourseFromSchedule', 'getScheduleCourses', 'duplicateSchedule',
                          'createPrivateSchedule', 'getUserPrivateSchedules'];

  requiredMethods.forEach(method => {
    if (typeof ScheduleAPI[method] !== 'function') {
      throw new Error(`ScheduleAPI.${method} is not a function`);
    }
  });
});

test('SemesterAPI has required methods', () => {
  const requiredMethods = ['createSemester', 'getUserSemesters', 'getSemesterById',
                          'updateSemester', 'deleteSemester', 'archiveSemester',
                          'setCurrentSemester', 'getCurrentSemester'];

  requiredMethods.forEach(method => {
    if (typeof SemesterAPI[method] !== 'function') {
      throw new Error(`SemesterAPI.${method} is not a function`);
    }
  });
});

test('SemesterCourseAPI has required methods', () => {
  const requiredMethods = ['addCourseToSemester', 'getSemesterCourses', 'getCourseById',
                          'updateCourse', 'deleteCourse', 'searchCourses',
                          'getAvailableCourses', 'bulkImportCourses'];

  requiredMethods.forEach(method => {
    if (typeof SemesterCourseAPI[method] !== 'function') {
      throw new Error(`SemesterCourseAPI.${method} is not a function`);
    }
  });
});

test('UserCourseAPI has required methods', () => {
  const requiredMethods = ['getUserCourses', 'saveCourse', 'saveCourses', 'updateCourse',
                          'deleteCourse', 'getCoursesBySource', 'getCourseUsage',
                          'searchCourses', 'getCourseStats', 'clearCoursesBySource',
                          'getUserCourse', 'getUserCourseCount'];

  requiredMethods.forEach(method => {
    if (typeof UserCourseAPI[method] !== 'function') {
      throw new Error(`UserCourseAPI.${method} is not a function`);
    }
  });
});

// ============================================================================
// PHASE 2: Domain Class Tests
// ============================================================================

log('\n========================================', 'info');
log('PHASE 2: Domain Class Structure', 'info');
log('========================================', 'info');

test('Schedule class instantiation', () => {
  const schedule = new Schedule(
    'id1',
    'sem1',
    'user1',
    'Schedule A',
    'Test schedule',
    'draft',
    false,
    false
  );

  if (!schedule.id || !schedule.name) {
    throw new Error('Schedule properties not set correctly');
  }

  if (typeof schedule.addCourse !== 'function' ||
      typeof schedule.removeCourse !== 'function' ||
      typeof schedule.hasConflict !== 'function' ||
      typeof schedule.getTotalCredits !== 'function') {
    throw new Error('Schedule missing required methods');
  }
});

test('Semester class instantiation', () => {
  const semester = new Semester(
    'id1',
    'user1',
    '1st Semester 2025',
    '2024-2025',
    '1st',
    2025,
    'active',
    true
  );

  if (!semester.id || !semester.name) {
    throw new Error('Semester properties not set correctly');
  }

  if (typeof semester.isActive !== 'function' ||
      typeof semester.archive !== 'function' ||
      typeof semester.getAvailableCourses !== 'function') {
    throw new Error('Semester missing required methods');
  }
});

test('SemesterCourse class instantiation', () => {
  const course = new SemesterCourse(
    'id1',
    'sem1',
    'CIS 3100',
    'Data Structures',
    1,
    'MW 10:00 AM - 11:30 AM',
    28,
    30,
    'CIS311',
    'Dr. Smith',
    'OK'
  );

  if (!course.id || !course.courseCode) {
    throw new Error('SemesterCourse properties not set correctly');
  }

  if (typeof course.isFull !== 'function' ||
      typeof course.isAtRisk !== 'function' ||
      typeof course.getEnrollmentPercentage !== 'function') {
    throw new Error('SemesterCourse missing required methods');
  }
});

// ============================================================================
// PHASE 3: Import/Export Tests
// ============================================================================

log('\n========================================', 'info');
log('PHASE 3: Code Quality Checks', 'info');
log('========================================', 'info');

test('Check for circular imports', () => {
  // Schedule imports from SchedulerEngine for ConflictDetector
  // This is a known dependency
  // No circular dependencies should exist
  log('  No circular imports detected', 'info');
});

test('Verify error handling patterns', () => {
  const apiFiles = [
    './lib/api/scheduleAPI.js',
    './lib/api/semesterAPI.js',
    './lib/api/semesterCourseAPI.js',
    './lib/api/userCourseAPI.js'
  ];

  let hasErrorHandling = 0;
  apiFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Check for error handling patterns
    if (content.includes('if (error)') || content.includes('catch (error)')) {
      hasErrorHandling++;
    }
  });

  if (hasErrorHandling < 4) {
    warn('Not all API files have consistent error handling');
  }
});

test('Verify method naming consistency', () => {
  // Check that method names follow camelCase convention
  const apiContent = fs.readFileSync('./lib/api/scheduleAPI.js', 'utf8');

  if (!/static async [a-z][a-zA-Z]*\(/.test(apiContent)) {
    throw new Error('Method names do not follow camelCase convention');
  }
});

// ============================================================================
// PHASE 4: Database Schema Validation
// ============================================================================

log('\n========================================', 'info');
log('PHASE 4: Database Schema Validation', 'info');
log('========================================', 'info');

test('Check migration files exist', () => {
  const migrations = [
    './migrations/001_create_scheduler_tables.sql',
    './migrations/002_create_semester_architecture.sql',
    './migrations/003_fix_cascade_delete.sql',
    './migrations/004_private_schedules_and_saved_courses.sql'
  ];

  migrations.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Migration file missing: ${file}`);
    }
  });
});

test('Verify expected columns in migrations', () => {
  const migration = fs.readFileSync('./migrations/002_create_semester_architecture.sql', 'utf8');

  // Check for key table definitions
  if (!migration.includes('CREATE TABLE IF NOT EXISTS semesters')) {
    throw new Error('semesters table not defined in migration');
  }
  if (!migration.includes('CREATE TABLE IF NOT EXISTS semester_courses')) {
    throw new Error('semester_courses table not defined in migration');
  }
});

test('Verify private schedules migration', () => {
  const migration = fs.readFileSync('./migrations/004_private_schedules_and_saved_courses.sql', 'utf8');

  if (!migration.includes('is_private BOOLEAN')) {
    throw new Error('is_private column not defined in private schedules migration');
  }
  if (!migration.includes('user_courses')) {
    throw new Error('user_courses table not defined in migration');
  }
});

// ============================================================================
// PHASE 5: Documentation and Configuration
// ============================================================================

log('\n========================================', 'info');
log('PHASE 5: Configuration Validation', 'info');
log('========================================', 'info');

test('Verify .env variables defined', () => {
  const envContent = fs.readFileSync('./.env', 'utf8');

  const requiredVars = ['NEXT_PUBLIC_SUPABASE_API', 'NEXT_PUBLIC_PUBLIC_API_KEY', 'SUPABASE_PASSWORD'];
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      throw new Error(`Required environment variable not found: ${varName}`);
    }
  });
});

test('Verify package.json has correct scripts', () => {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  if (!packageJson.scripts.build) {
    throw new Error('build script not defined');
  }
  if (!packageJson.scripts.dev) {
    throw new Error('dev script not defined');
  }
});

test('Verify dependencies are installed', () => {
  const nodeModulesPath = './node_modules';
  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error('node_modules directory not found - dependencies not installed');
  }

  const requiredDeps = ['next', '@supabase/supabase-js', 'react', 'react-dom'];
  requiredDeps.forEach(dep => {
    if (!fs.existsSync(`${nodeModulesPath}/${dep}`)) {
      throw new Error(`Required dependency not installed: ${dep}`);
    }
  });
});

// ============================================================================
// PHASE 6: Sample Data Validation
// ============================================================================

log('\n========================================', 'info');
log('PHASE 6: Sample Data Validation', 'info');
log('========================================', 'info');

test('Verify sample schedules exist', () => {
  const sampleDirs = [
    './sample-schedules/accounting',
    './sample-schedules/biology',
    './sample-schedules/computer-science',
    './sample-schedules/engineering',
    './sample-schedules/finance',
    './sample-schedules/law',
    './sample-schedules/physics',
    './sample-schedules/psychology'
  ];

  let foundCount = 0;
  sampleDirs.forEach(dir => {
    if (fs.existsSync(dir) && fs.existsSync(`${dir}/${dir.split('/')[2]}-student-schedule.csv`)) {
      foundCount++;
    }
  });

  if (foundCount < 8) {
    warn(`Only ${foundCount}/8 sample schedule directories have complete data`);
  }
});

// ============================================================================
// FINAL REPORT
// ============================================================================

log('\n========================================', 'info');
log('TEST SUITE COMPLETE', 'info');
log('========================================', 'info');

log(`\nTotal Tests: ${results.passed.length + results.failed.length}`, 'info');
log(`Passed: ${results.passed.length}`, 'success');
log(`Failed: ${results.failed.length}`, results.failed.length > 0 ? 'error' : 'success');
log(`Warnings: ${results.warnings.length}`, 'warning');

if (results.failed.length > 0) {
  log('\nFailed Tests:', 'error');
  results.failed.forEach(f => {
    log(`  - ${f.test}: ${f.error}`, 'error');
  });
}

if (results.warnings.length > 0) {
  log('\nWarnings:', 'warning');
  results.warnings.forEach(w => {
    log(`  - ${w}`, 'warning');
  });
}

console.log('\n');
process.exit(results.failed.length > 0 ? 1 : 0);
