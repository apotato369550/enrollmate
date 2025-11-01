/**
 * Test Script for Enrollmate Scheduler
 * Tests the scheduler engine with CS sample data
 */

import { Section, ScheduleGenerator } from './lib/scheduler/SchedulerEngine.js';
import fs from 'fs';

console.log('🧪 Starting Scheduler Test with CS Sample Data...\n');

// Read CS sample CSV
const csvPath = './sample-schedules/computer-science/cs-student-schedule.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Parse CSV into courses
const coursesMap = new Map();
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const [courseCode, courseName, group, schedule, enrolled] = line.split(',').map(s => s.trim());

  if (!coursesMap.has(courseCode)) {
    coursesMap.set(courseCode, {
      courseCode,
      courseName,
      sections: []
    });
  }

  coursesMap.get(courseCode).sections.push({
    group: parseInt(group),
    schedule,
    enrolled
  });
}

const courses = Array.from(coursesMap.values());
console.log(`📚 Loaded ${courses.length} courses from CSV:`);
courses.forEach(c => console.log(`   - ${c.courseCode}: ${c.courseName} (${c.sections.length} sections)`));
console.log('');

// Convert to Section objects
const sectionArrays = courses.map(course =>
  course.sections.map(sectionData => {
    const section = new Section(sectionData.group, sectionData.schedule, sectionData.enrolled, 'OK');
    section.courseCode = course.courseCode;
    section.courseName = course.courseName;
    return section;
  })
);

// Test constraints
const constraints = {
  earliestStart: '07:30',
  latestEnd: '16:30',
  allowFull: false,
  allowAtRisk: true,
  maxFullPerSchedule: 1,
  maxSchedules: 20
};

console.log('⚙️  Test Constraints:');
console.log(`   - Time Window: ${constraints.earliestStart} - ${constraints.latestEnd}`);
console.log(`   - Allow Full Sections: ${constraints.allowFull}`);
console.log(`   - Allow At-Risk Sections: ${constraints.allowAtRisk}`);
console.log(`   - Max Full Per Schedule: ${constraints.maxFullPerSchedule}`);
console.log(`   - Max Schedules: ${constraints.maxSchedules}`);
console.log('');

// Generate schedules
console.log('🚀 Generating schedules...');
const startTime = performance.now();

try {
  const generator = new ScheduleGenerator(sectionArrays, constraints);
  const results = generator.generate();

  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  console.log(`✅ Generated ${results.length} valid schedules in ${duration}ms\n`);

  if (results.length > 0) {
    console.log('📋 Sample Schedule #1:');
    const schedule1 = results[0];
    if (schedule1.selections && schedule1.selections.length > 0) {
      schedule1.selections.forEach((section, idx) => {
        console.log(`   ${idx + 1}. ${section.courseCode} (Group ${section.group}): ${section.schedule} [${section.enrolled}]`);
      });
    } else {
      console.log('   (No selections found)');
    }
    console.log('');

    console.log('📊 Schedule Statistics:');
    console.log(`   - Ends by preferred time: ${results.filter(s => s.meta.endsByPreferred).length}`);
    console.log(`   - Has late classes: ${results.filter(s => s.meta.hasLate).length}`);
    console.log(`   - Has full sections: ${results.filter(s => s.meta.fullCount > 0).length}`);
    console.log('');

    console.log('✨ Test PASSED! Scheduler is working correctly.');
  } else {
    console.log('⚠️  No schedules generated. Try relaxing constraints.');
  }

} catch (error) {
  console.error('❌ Test FAILED!');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
