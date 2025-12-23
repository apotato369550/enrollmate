import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

export function loadSampleCsv(category) {
  const filePath = path.join(
    process.cwd(),
    `sample-schedules/${category}/${category}-student-schedule.csv`
  );

  // Check if file exists to avoid crashing if data is missing
  if (!fs.existsSync(filePath)) {
    console.warn(`Sample CSV not found at: ${filePath}`);
    return [];
  }

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
