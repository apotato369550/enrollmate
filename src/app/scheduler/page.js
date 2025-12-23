'use client';

/**
 * Enrollmate Scheduler Page
 * Main interface for course schedule generation using OOP-based scheduler engine
 */

import React, { useState, useEffect } from 'react';
import { Section, ScheduleGenerator, ConflictDetector } from '../../../lib/scheduler/SchedulerEngine.js';
import { saveUserSchedule, fetchUserSchedules, deleteUserSchedule } from '../../../lib/scheduler/schedulerAPI.js';
import { supabase } from '../../../src/lib/supabase.js';
import { SemesterAPI } from '../../../lib/api/semesterAPI.js';
import { ScheduleAPI } from '../../../lib/api/scheduleAPI.js';
import UserCourseAPI from '../../../lib/api/userCourseAPI.js';
import PDFExporter from '../../../lib/utils/pdfExporter.js';

/**
 * CourseLibraryModal Component - Modal for importing courses from user's library
 */
function CourseLibraryModal({ userId, onImport, onClose }) {
  const [libraryCourses, setLibraryCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const courses = await UserCourseAPI.getUserCourses(userId);
        setLibraryCourses(courses);
      } catch (error) {
        console.error('Failed to load course library:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [userId]);

  const toggleCourse = (courseId) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const handleImport = () => {
    const coursesToImport = libraryCourses.filter(c => selectedCourses.has(c.id));
    onImport(coursesToImport);
  };

  const filteredCourses = libraryCourses.filter(course =>
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-jakarta font-bold text-enrollmate-green">📚 Import from Course Library</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 mb-4 border-2 border-enrollmate-green/30 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
        />

        {loading ? (
          <div className="text-center py-12 text-gray-600 font-jakarta">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 text-gray-600 font-jakarta">No courses in your library</div>
        ) : (
          <>
            <div className="overflow-y-auto max-h-96 mb-6 border-2 border-enrollmate-green/20 rounded-xl">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => toggleCourse(course.id)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-enrollmate-green/10 border-b border-gray-200 ${
                    selectedCourses.has(course.id) ? 'bg-enrollmate-green/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-jakarta font-bold text-lg text-gray-800">
                        {course.course_code} - {course.course_name}
                      </div>
                      <div className="text-sm font-jakarta text-gray-600 mt-1">
                        Section {course.section_group} • {course.schedule}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-jakarta text-gray-500">
                        {course.enrolled_current}/{course.enrolled_total}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedCourses.has(course.id)}
                        onChange={() => {}}
                        className="w-5 h-5 text-enrollmate-green focus:ring-enrollmate-green rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-gray-600 font-jakarta">
                {selectedCourses.size} course{selectedCourses.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-300 text-gray-700 font-jakarta font-bold rounded-xl hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedCourses.size === 0}
                  className="px-6 py-3 bg-enrollmate-green text-white font-jakarta font-bold rounded-xl hover:bg-enrollmate-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Import Selected
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * CourseInputPanel Component - Left side panel for adding courses and sections
 */
function CourseInputPanel({ courses, setCourses, currentUser }) {
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseName: '',
    sections: [{ group: 1, schedule: '', enrolled: '0/30' }]
  });
  const [csvError, setCsvError] = useState('');
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  const addSection = () => {
    setNewCourse(prev => ({
      ...prev,
      sections: [...prev.sections, { group: prev.sections.length + 1, schedule: '', enrolled: '0/30' }]
    }));
  };

  const updateSection = (index, field, value) => {
    setNewCourse(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const removeSection = (index) => {
    if (newCourse.sections.length > 1) {
      setNewCourse(prev => ({
        ...prev,
        sections: prev.sections.filter((_, i) => i !== index)
      }));
    }
  };

  const addCourse = async () => {
    if (newCourse.courseCode && newCourse.courseName && newCourse.sections.length > 0) {
      // Validate sections have required fields
      const validSections = newCourse.sections.filter(s => s.schedule && s.enrolled);

      if (validSections.length > 0) {
        setCourses(prev => [...prev, {
          courseCode: newCourse.courseCode,
          courseName: newCourse.courseName,
          sections: validSections
        }]);

        // Save to user's course library if logged in
        if (currentUser) {
          try {
            const coursesToSave = validSections.map(section => {
              const [current, total] = section.enrolled.split('/').map(n => parseInt(n.trim()) || 0);
              return {
                courseCode: newCourse.courseCode,
                courseName: newCourse.courseName,
                sectionGroup: parseInt(section.group) || 1,
                schedule: section.schedule,
                enrolledCurrent: current,
                enrolledTotal: total || 30,
                room: null,
                instructor: null
              };
            });

            await UserCourseAPI.saveCourses(currentUser.id, coursesToSave, 'manual');
            console.log(`✅ Saved ${coursesToSave.length} manually added courses to library`);
          } catch (error) {
            console.error('Failed to save manually added courses:', error);
            // Don't block UI, just log error
          }
        }

        // Reset form
        setNewCourse({
          courseCode: '',
          courseName: '',
          sections: [{ group: 1, schedule: '', enrolled: '0/30' }]
        });
      }
    }
  };

  const removeCourse = (courseIndex) => {
    setCourses(prev => prev.filter((_, i) => i !== courseIndex));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK': return 'bg-blue-100 text-blue-800';
      case 'AT-RISK': return 'bg-yellow-100 text-yellow-800';
      case 'FULL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // CSV Import - Now also saves to user's course library
  const handleCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError('');
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        const lines = text.split('\n').filter(line => line.trim());

        // Expected format: Course Code, Course Name, Group, Schedule, Enrolled
        const parsedCourses = new Map();
        const coursesToSave = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(',').map(p => p.trim());
          if (parts.length < 5) {
            setCsvError(`Line ${i + 1}: Invalid format (expected 5 columns)`);
            continue;
          }

          const [courseCode, courseName, group, schedule, enrolled] = parts;
          const [enrolledCurrent, enrolledTotal] = enrolled.split('/').map(n => parseInt(n.trim()) || 0);

          if (!parsedCourses.has(courseCode)) {
            parsedCourses.set(courseCode, {
              courseCode,
              courseName,
              sections: []
            });
          }

          parsedCourses.get(courseCode).sections.push({
            group: parseInt(group) || 1,
            schedule,
            enrolled
          });

          // Prepare course for saving to library
          coursesToSave.push({
            courseCode,
            courseName,
            sectionGroup: parseInt(group) || 1,
            schedule,
            enrolledCurrent,
            enrolledTotal,
            room: null,
            instructor: null
          });
        }

        setCourses(Array.from(parsedCourses.values()));
        setCsvError('');

        // Save to user's course library if user is logged in
        if (currentUser && coursesToSave.length > 0) {
          try {
            const result = await UserCourseAPI.saveCourses(currentUser.id, coursesToSave, 'csv');
            console.log(`✅ Saved ${result.success.length} courses to library`);
            if (result.errors.length > 0) {
              console.warn(`⚠️ ${result.errors.length} courses failed to save:`, result.errors);
            }
          } catch (error) {
            console.error('Failed to save courses to library:', error);
            // Don't show error to user - courses are still added to generator
          }
        }
      } catch (error) {
        setCsvError(`Failed to parse CSV: ${error.message}`);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // CSV Export
  const handleCsvExport = () => {
    const rows = [['Course Code', 'Course Name', 'Group', 'Schedule', 'Enrolled']];

    for (const course of courses) {
      for (const section of course.sections) {
        rows.push([
          course.courseCode,
          course.courseName,
          section.group,
          section.schedule,
          section.enrolled
        ]);
      }
    }

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `enrollmate_courses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Import from Course Library
  const handleImportFromLibrary = async (selectedCourses) => {
    // Group courses by course code
    const courseMap = new Map();

    for (const course of selectedCourses) {
      if (!courseMap.has(course.course_code)) {
        courseMap.set(course.course_code, {
          courseCode: course.course_code,
          courseName: course.course_name,
          sections: []
        });
      }

      courseMap.get(course.course_code).sections.push({
        group: course.section_group,
        schedule: course.schedule,
        enrolled: `${course.enrolled_current}/${course.enrolled_total}`
      });
    }

    // Add to existing courses (avoid duplicates)
    const existingCodes = new Set(courses.map(c => c.courseCode));
    const newCourses = Array.from(courseMap.values()).filter(c => !existingCodes.has(c.courseCode));

    setCourses([...courses, ...newCourses]);
    setShowLibraryModal(false);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl lg:text-3xl font-jakarta font-bold text-gray-800">Add Courses</h2>

        {/* CSV Import/Export Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowLibraryModal(true)}
            disabled={!currentUser}
            className="px-4 py-2 text-sm font-jakarta font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            📚 Import from Library
          </button>
          <label className="px-4 py-2 text-sm font-jakarta font-bold bg-enrollmate-green text-white rounded-xl hover:bg-enrollmate-green/90 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            📥 Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleCsvExport}
            disabled={courses.length === 0}
            className="px-4 py-2 text-sm font-jakarta font-bold bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            📤 Export CSV
          </button>
        </div>
      </div>

      {/* Course Library Modal */}
      {showLibraryModal && currentUser && (
        <CourseLibraryModal
          userId={currentUser.id}
          onImport={handleImportFromLibrary}
          onClose={() => setShowLibraryModal(false)}
        />
      )}

      {/* CSV Error Message */}
      {csvError && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 border-2 border-red-200 rounded-xl text-sm font-jakarta font-medium">
          ❌ {csvError}
        </div>
      )}

      {/* Add Course Form */}
      <div className="space-y-4 mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Course Code (e.g., CIS 2103)"
            value={newCourse.courseCode}
            onChange={(e) => setNewCourse(prev => ({ ...prev, courseCode: e.target.value }))}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-enrollmate-green focus:border-enrollmate-green font-jakarta"
          />
          <input
            type="text"
            placeholder="Course Name"
            value={newCourse.courseName}
            onChange={(e) => setNewCourse(prev => ({ ...prev, courseName: e.target.value }))}
            className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-enrollmate-green focus:border-enrollmate-green font-jakarta"
          />
        </div>

        {/* Sections */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Sections:</label>
          {newCourse.sections.map((section, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Group"
                value={section.group}
                onChange={(e) => updateSection(index, 'group', parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Schedule (e.g., MW 10:00 AM - 11:30 AM)"
                value={section.schedule}
                onChange={(e) => updateSection(index, 'schedule', e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Enrolled (e.g., 15/30)"
                value={section.enrolled}
                onChange={(e) => updateSection(index, 'enrolled', e.target.value)}
                className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {newCourse.sections.length > 1 && (
                <button
                  onClick={() => removeSection(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addSection}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Section
          </button>
        </div>

        <button
          onClick={addCourse}
          className="w-full px-6 py-3 bg-enrollmate-green text-white rounded-xl hover:bg-enrollmate-green/90 focus:outline-none focus:ring-2 focus:ring-white font-jakarta font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          ➕ Add Course
        </button>
      </div>

      {/* Added Courses List */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-700">Added Courses ({courses.length})</h3>
        {courses.map((course, courseIndex) => (
          <div key={courseIndex} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium text-gray-800">
                  {course.courseCode} - {course.courseName}
                </div>
                <div className="text-sm text-gray-600">
                  {course.sections.length} section{course.sections.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={() => removeCourse(courseIndex)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>

            {/* Section chips */}
            <div className="flex flex-wrap gap-1">
              {course.sections.map((section, sectionIndex) => {
                // Compute status for display
                let status = 'OK';
                const enrolledMatch = section.enrolled.match(/(\d+)\/(\d+)/);
                if (enrolledMatch) {
                  const current = parseInt(enrolledMatch[1]);
                  const total = parseInt(enrolledMatch[2]);
                  if (current >= total) status = 'FULL';
                  else if (current === 0 || (total >= 20 && current < 6) || (total >= 10 && current < 2)) {
                    status = 'AT-RISK';
                  }
                }

                return (
                  <span
                    key={sectionIndex}
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}
                  >
                    {section.group}: {status}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ConstraintsPanel Component - Right side panel for schedule generation settings
 */
function ConstraintsPanel({ constraints, setConstraints, onGenerate, isGenerating, coursesCount }) {
  const updateConstraint = (field, value) => {
    setConstraints(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/20">
      <h2 className="text-2xl lg:text-3xl font-jakarta font-bold mb-6 text-gray-800">⚙️ Generation Settings</h2>

      <div className="space-y-6">
        {/* Time Constraints */}
        <div className="space-y-4">
          <h3 className="font-jakarta font-bold text-lg lg:text-xl text-gray-700">🕐 Time Preferences</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-jakarta font-semibold text-gray-600 mb-2">Earliest Start</label>
              <input
                type="time"
                value={constraints.earliestStart}
                onChange={(e) => updateConstraint('earliestStart', e.target.value)}
                className="w-full px-4 py-3 text-base font-jakarta border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-enrollmate-green focus:border-enrollmate-green transition-all"
              />
            </div>

            <div>
              <label className="block text-base font-jakarta font-semibold text-gray-600 mb-2">Latest End</label>
              <input
                type="time"
                value={constraints.latestEnd}
                onChange={(e) => updateConstraint('latestEnd', e.target.value)}
                className="w-full px-4 py-3 text-base font-jakarta border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-enrollmate-green focus:border-enrollmate-green transition-all"
              />
            </div>
          </div>
        </div>

        {/* Enrollment Constraints */}
        <div className="space-y-4">
          <h3 className="font-jakarta font-bold text-lg lg:text-xl text-gray-700">📊 Enrollment Options</h3>

          <label className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={constraints.allowFull}
              onChange={(e) => updateConstraint('allowFull', e.target.checked)}
              className="mr-3 w-5 h-5 text-enrollmate-green focus:ring-enrollmate-green rounded"
            />
            <span className="text-base font-jakarta font-medium text-gray-700">Allow full sections</span>
          </label>

          <label className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={constraints.allowAtRisk}
              onChange={(e) => updateConstraint('allowAtRisk', e.target.checked)}
              className="mr-3 w-5 h-5 text-enrollmate-green focus:ring-enrollmate-green rounded"
            />
            <span className="text-base font-jakarta font-medium text-gray-700">Allow at-risk sections</span>
          </label>

          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="block text-base font-jakarta font-semibold text-gray-700 mb-3">
              Max full sections per schedule: <span className="text-enrollmate-green text-xl">{constraints.maxFullPerSchedule}</span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              value={constraints.maxFullPerSchedule}
              onChange={(e) => updateConstraint('maxFullPerSchedule', parseInt(e.target.value))}
              className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-green"
            />
          </div>
        </div>

        {/* Generation Limits */}
        <div className="space-y-4">
          <h3 className="font-jakarta font-bold text-lg lg:text-xl text-gray-700">🎯 Generation Limits</h3>

          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="block text-base font-jakarta font-semibold text-gray-700 mb-3">
              Max schedules: <span className="text-enrollmate-green text-xl">{constraints.maxSchedules}</span>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={constraints.maxSchedules}
              onChange={(e) => updateConstraint('maxSchedules', parseInt(e.target.value))}
              className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-green"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || coursesCount === 0}
          className={`w-full px-6 py-4 rounded-xl font-jakarta font-bold text-lg lg:text-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
            isGenerating || coursesCount === 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-enrollmate-green text-white hover:bg-enrollmate-green/90 hover:scale-[1.02]'
          }`}
        >
          {isGenerating ? '⏳ Generating...' : '🚀 Generate Schedules'}
        </button>
      </div>
    </div>
  );
}

/**
 * TimetableGrid Component - Visual timetable grid for a single schedule
 * Matches the reference layout with full-width table, soft colors, and room numbers
 */
function TimetableGrid({ schedule }) {
  const days = ['M', 'T', 'W', 'Th', 'F'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Color palette for courses - soft, muted colors from reference
  const courseColors = [
    'bg-[#C8B8A8] text-gray-800',    // Tan/beige
    'bg-[#E89B8E] text-gray-800',    // Coral
    'bg-[#B8A8C8] text-gray-800',    // Lavender
    'bg-[#5FBDBD] text-gray-800',    // Teal
    'bg-[#A8D5BA] text-gray-800',    // Mint green
    'bg-[#F4C2A8] text-gray-800',    // Peach
    'bg-[#98C1D9] text-gray-800',    // Light blue
    'bg-[#D4A5A5] text-gray-800',    // Dusty rose
  ];

  // Assign consistent colors to each unique course code
  const getCourseColor = (courseCode) => {
    const courseIndex = schedule.selections.findIndex(s => s.courseCode === courseCode);
    return courseColors[courseIndex % courseColors.length];
  };

  // Generate room number based on course code and group
  const getRoomNumber = (courseCode, group) => {
    // Extract building code from course code (e.g., "CIS" from "CIS 3100")
    const buildingCode = courseCode.split(' ')[0];
    // Generate a room number based on course and group
    const courseNum = courseCode.split(' ')[1] || '100';
    const baseRoom = parseInt(courseNum.substring(0, 2)) || 10;
    return `${buildingCode}${baseRoom}${group}TC`;
  };

  // Generate 30-minute interval time slots
  const generateTimeSlots = () => {
    const slots = [];
    // Start at 7:30 AM (450 minutes) and end at 5:30 PM (1050 minutes)
    for (let minutes = 450; minutes <= 1050; minutes += 30) {
      slots.push(minutes);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Format time for display (e.g., "08:00 AM - 08:30 AM")
  const formatTimeRange = (startMinutes) => {
    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${ampm}`;
    };

    return `${formatTime(startMinutes)} - ${formatTime(startMinutes + 30)}`;
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mt-8 w-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-jakarta font-bold text-enrollmate-green flex items-center gap-2">
          <span className="text-2xl">✦</span>
          YOUR SCHEDULE FOR THIS TERM
        </h3>
      </div>

      {/* Full-width table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left font-jakarta font-bold text-sm text-gray-700 w-48">
                Time
              </th>
              {dayNames.map((day) => (
                <th key={day} className="border border-gray-300 p-3 text-center font-jakarta font-bold text-sm text-gray-700">
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {timeSlots.slice(0, -1).map((timeSlot) => {
              return (
                <tr key={timeSlot} className="hover:bg-gray-50/50 transition-colors">
                  {/* Time column */}
                  <td className="border border-gray-300 p-3 text-sm font-jakarta text-gray-600 bg-gray-50/30">
                    {formatTimeRange(timeSlot)}
                  </td>

                  {/* Day columns */}
                  {days.map((day) => {
                    // Find sections that occupy this time slot on this day
                    const sectionsInSlot = schedule.selections.filter((_, idx) => {
                      const parsed = schedule.parsed[idx];
                      if (!parsed) return false;
                      return parsed.days.includes(day) &&
                        parsed.startTime <= timeSlot &&
                        parsed.endTime > timeSlot;
                    });

                    // Check if this is the start of a course block
                    const startingSection = sectionsInSlot.find((section) => {
                      const sectionIdx = schedule.selections.indexOf(section);
                      const parsed = schedule.parsed[sectionIdx];
                      return parsed.startTime === timeSlot;
                    });

                    if (startingSection) {
                      const sectionIdx = schedule.selections.indexOf(startingSection);
                      const parsed = schedule.parsed[sectionIdx];

                      // Calculate rowspan based on duration (30-minute slots)
                      const duration = parsed.endTime - parsed.startTime;
                      const rowspan = Math.ceil(duration / 30);

                      return (
                        <td
                          key={day}
                          rowSpan={rowspan}
                          className={`border border-gray-300 p-4 text-center align-middle ${getCourseColor(startingSection.courseCode)}`}
                        >
                          <div className="font-jakarta space-y-1">
                            <div className="font-bold text-sm leading-tight">
                              {startingSection.courseCode} {getRoomNumber(startingSection.courseCode, startingSection.group)}
                            </div>
                            <div className="text-xs font-semibold opacity-90">
                              Group {startingSection.group}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Skip cell if it's part of a rowspan from above
                    const isPartOfSpan = sectionsInSlot.length > 0;
                    if (isPartOfSpan) {
                      return null;
                    }

                    // Empty cell
                    return (
                      <td key={day} className="border border-gray-300 p-4 bg-white">
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Print Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handlePrint}
          className="px-8 py-3 bg-gradient-to-r from-enrollmate-bg-start to-enrollmate-bg-end hover:from-enrollmate-green hover:to-enrollmate-green text-white font-jakarta font-bold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          Print Schedule
        </button>
      </div>

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          button {
            display: none;
          }
          .overflow-x-auto {
            overflow: visible;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * ResultsPanel Component - Bottom section for displaying generated schedules
 */
function ResultsPanel({ schedules, onSaveSchedule, onCopySchedule, onSaveToSemester, currentSemester }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('best');

  if (!schedules || schedules.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-gray-500 text-lg">No schedules generated yet</div>
        <div className="text-gray-400 text-sm mt-2">Add courses and click "Generate Schedules" to see results</div>
      </div>
    );
  }

  // Apply filters and sorting
  let filteredSchedules = schedules;

  if (activeFilter === 'endsByTime') {
    filteredSchedules = schedules.filter(s => s.meta.endsByPreferred);
  } else if (activeFilter === 'hasLate') {
    filteredSchedules = schedules.filter(s => s.meta.hasLate);
  } else if (activeFilter === 'hasFull') {
    filteredSchedules = schedules.filter(s => s.meta.fullCount > 0);
  }

  // Apply sorting
  if (sortBy === 'earliest') {
    filteredSchedules.sort((a, b) => a.meta.latestEnd - b.meta.latestEnd);
  } else if (sortBy === 'fewestFull') {
    filteredSchedules.sort((a, b) => a.meta.fullCount - b.meta.fullCount);
  }
  // 'best' uses the order from the generator

  const copyToClipboard = (schedule) => {
    const text = schedule.selections.map(s =>
      `${s.courseCode} (${s.group}): ${s.schedule} - ${s.enrolled}`
    ).join('\n');

    navigator.clipboard.writeText(text);
    onCopySchedule?.(schedule);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-jakarta font-bold text-gray-800">
            ✨ Generated Schedules ({filteredSchedules.length})
          </h2>
          <div className="text-base font-jakarta text-gray-600 mt-2 space-x-4">
            <span>📊 Total: <span className="font-bold text-enrollmate-green">{schedules.length}</span></span>
            <span>⏰ Ends by time: <span className="font-bold text-green-600">{schedules.filter(s => s.meta.endsByPreferred).length}</span></span>
            <span>🌙 Late: <span className="font-bold text-orange-600">{schedules.filter(s => s.meta.hasLate).length}</span></span>
            <span>📌 Full: <span className="font-bold text-red-600">{schedules.filter(s => s.meta.fullCount > 0).length}</span></span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter Tabs */}
          <div className="flex bg-white rounded-xl p-1 shadow-md border border-gray-200">
            {[
              { key: 'all', label: 'All' },
              { key: 'endsByTime', label: '⏰ Ends by Time' },
              { key: 'hasLate', label: '🌙 Late' },
              { key: 'hasFull', label: '📌 Full' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 text-sm font-jakarta font-bold rounded-lg transition-all duration-300 ${
                  activeFilter === filter.key
                    ? 'bg-enrollmate-green text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-jakarta font-semibold focus:outline-none focus:ring-2 focus:ring-enrollmate-green focus:border-enrollmate-green bg-white"
          >
            <option value="best">🏆 Best Match</option>
            <option value="earliest">⏱️ Earliest End</option>
            <option value="fewestFull">📊 Fewest Full</option>
          </select>
        </div>
      </div>

      {/* Schedule Cards - Full Width */}
      <div className="space-y-6">
        {filteredSchedules.map((schedule, index) => (
          <div key={index} className="bg-gradient-to-br from-white to-gray-50 border-2 border-enrollmate-green/20 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300">
            {/* Schedule Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-jakarta font-bold text-2xl text-enrollmate-green">Schedule #{index + 1}</h3>
                <div className="flex gap-2 mt-2">
                  <span className={`px-3 py-1 text-sm font-jakarta font-bold rounded-full ${
                    schedule.meta.endsByPreferred
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {schedule.meta.endsByPreferred ? '✅ Ends by time' : '⏰ Late end'}
                  </span>
                  {schedule.meta.fullCount > 0 && (
                    <span className="px-3 py-1 text-sm font-jakarta font-bold rounded-full bg-orange-100 text-orange-700">
                      📌 {schedule.meta.fullCount} full
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => copyToClipboard(schedule)}
                  className="px-4 py-2 text-sm font-jakarta font-bold bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => {
                    // Create schedule object for PDF export
                    const scheduleObj = {
                      name: `Generated Schedule ${new Date().toLocaleDateString()}`,
                      courses: schedule.selections.map(section => ({
                        courseCode: section.courseCode,
                        courseName: section.courseName,
                        sectionGroup: section.group,
                        schedule: section.schedule,
                        enrolledCurrent: parseInt(section.enrolled.split('/')[0]),
                        enrolledTotal: parseInt(section.enrolled.split('/')[1]),
                        room: section.room || 'TBA',
                        instructor: section.instructor || 'TBA',
                        status: section.status || 'OK'
                      }))
                    };
                    PDFExporter.exportSchedule(scheduleObj);
                  }}
                  className="px-4 py-2 text-sm font-jakarta font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg transition-all duration-300"
                  title="Download schedule as PDF"
                >
                  📄 PDF
                </button>
                {currentSemester && (
                  <button
                    onClick={() => onSaveToSemester?.(schedule)}
                    className="px-4 py-2 text-sm font-jakarta font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    📚 Save to Semester
                  </button>
                )}
                <button
                  onClick={() => onSaveSchedule?.(schedule)}
                  className="px-4 py-2 text-sm font-jakarta font-bold bg-enrollmate-green text-white rounded-xl hover:bg-enrollmate-green/90 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  💾 Save Privately
                </button>
              </div>
            </div>

            {/* Course Table */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-sm font-jakarta font-bold text-gray-700 border-b-2 border-enrollmate-green/30 pb-2">
                <div className="col-span-3">📚 Course</div>
                <div className="col-span-1">Group</div>
                <div className="col-span-5">🕐 Schedule</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Enrolled</div>
              </div>

              {schedule.selections.map((section, sectionIndex) => {
                let status = 'OK';
                const enrolledMatch = section.enrolled.match(/(\d+)\/(\d+)/);
                if (enrolledMatch) {
                  const current = parseInt(enrolledMatch[1]);
                  const total = parseInt(enrolledMatch[2]);
                  if (current >= total) status = 'FULL';
                  else if (current === 0 || (total >= 20 && current < 6) || (total >= 10 && current < 2)) {
                    status = 'AT-RISK';
                  }
                }

                const statusColors = {
                  'OK': 'bg-enrollmate-green/10 text-enrollmate-green border-enrollmate-green',
                  'AT-RISK': 'bg-yellow-50 text-yellow-700 border-yellow-400',
                  'FULL': 'bg-red-50 text-red-700 border-red-400'
                };

                return (
                  <div key={sectionIndex} className="grid grid-cols-12 gap-3 text-base font-jakarta py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="col-span-3 font-bold text-gray-800">
                      {section.courseCode}
                    </div>
                    <div className="col-span-1 text-gray-700 font-medium">{section.group}</div>
                    <div className="col-span-5 text-gray-600 text-sm">{section.schedule}</div>
                    <div className={`col-span-2 text-xs font-bold px-2 py-1 rounded-lg border ${statusColors[status]} text-center`}>
                      {status}
                    </div>
                    <div className="col-span-1 text-gray-600 text-sm">{section.enrolled}</div>
                  </div>
                );
              })}
            </div>

            {/* Timetable Grid Visualization */}
            <TimetableGrid schedule={schedule} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SavedSchedulesView Component - Display user's saved schedules
 */
function SavedSchedulesView({ savedSchedules, loading, currentUser, onLoad, onDelete }) {
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);

  if (!currentUser) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/20 text-center">
        <div className="text-xl lg:text-2xl font-jakarta font-bold text-gray-700 mb-4">🔒 Please log in to view saved schedules</div>
        <p className="text-base lg:text-lg font-jakarta text-gray-500">You need to be logged in to save and view schedules</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/20 text-center">
        <div className="text-xl lg:text-2xl font-jakarta font-bold text-gray-700">⏳ Loading saved schedules...</div>
      </div>
    );
  }

  if (savedSchedules.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/20 text-center">
        <div className="text-xl lg:text-2xl font-jakarta font-bold text-gray-700 mb-4">📭 No saved schedules yet</div>
        <p className="text-base lg:text-lg font-jakarta text-gray-500">Generate and save schedules from the "Generate New" tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-white font-jakarta font-bold text-xl lg:text-2xl mb-6 drop-shadow-md">
        💾 You have {savedSchedules.length} saved schedule{savedSchedules.length !== 1 ? 's' : ''}
      </div>

      <div className="space-y-6">
        {savedSchedules.map((savedSchedule) => (
          <div key={savedSchedule.id} className="bg-white/95 backdrop-blur-sm border-2 border-white/30 rounded-3xl p-6 hover:shadow-2xl transition-all duration-300">
            {/* Schedule Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-jakarta font-bold text-enrollmate-green text-xl lg:text-2xl">{savedSchedule.name}</h3>
                <div className="text-base font-jakarta text-gray-500 mt-2">
                  📅 Created: {new Date(savedSchedule.created_at).toLocaleDateString()}
                </div>
                <div className="text-base font-jakarta font-medium text-gray-700 mt-1">
                  📚 {savedSchedule.sections_json.length} course{savedSchedule.sections_json.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onLoad(savedSchedule)}
                  className="px-4 py-2 text-sm font-jakarta font-bold bg-enrollmate-green text-white rounded-xl hover:bg-enrollmate-green/90 shadow-md hover:shadow-lg transition-all duration-300"
                  title="Load this schedule into generator"
                >
                  📂 Load
                </button>
                <button
                  onClick={() => setExpandedScheduleId(expandedScheduleId === savedSchedule.id ? null : savedSchedule.id)}
                  className="px-4 py-2 text-sm font-jakarta font-bold bg-blue-500 text-white rounded-xl hover:bg-blue-600 shadow-md hover:shadow-lg transition-all duration-300"
                  title="View timetable"
                >
                  {expandedScheduleId === savedSchedule.id ? '📊 Hide' : '📊 View'}
                </button>
                <button
                  onClick={() => onDelete(savedSchedule.id, savedSchedule.name)}
                  className="px-4 py-2 text-sm font-jakarta font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-300"
                  title="Delete this schedule"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            {/* Course List */}
            <div className="space-y-2 mb-4 bg-gray-50 rounded-xl p-4">
              {savedSchedule.sections_json.map((section, idx) => (
                <div key={idx} className="text-base font-jakarta text-gray-700 flex justify-between items-center py-1">
                  <span className="font-bold text-gray-800">{section.courseCode}</span>
                  <span className="text-gray-600 font-medium">Group {section.group} • {section.schedule}</span>
                </div>
              ))}
            </div>

            {/* Expandable Timetable */}
            {expandedScheduleId === savedSchedule.id && (
              <SavedScheduleTimetable schedule={savedSchedule} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SavedScheduleTimetable Component - Display timetable for a saved schedule
 */
function SavedScheduleTimetable({ schedule }) {
  const days = ['M', 'T', 'W', 'Th', 'F'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const courseColors = [
    'bg-[#C8B8A8] text-gray-800',
    'bg-[#E89B8E] text-gray-800',
    'bg-[#B8A8C8] text-gray-800',
    'bg-[#5FBDBD] text-gray-800',
    'bg-[#A8D5BA] text-gray-800',
    'bg-[#F4C2A8] text-gray-800',
    'bg-[#98C1D9] text-gray-800',
    'bg-[#D4A5A5] text-gray-800',
  ];

  const getCourseColor = (courseCode) => {
    const courseIndex = schedule.sections_json.findIndex(s => s.courseCode === courseCode);
    return courseColors[courseIndex % courseColors.length];
  };

  const getRoomNumber = (courseCode, group) => {
    const buildingCode = courseCode.split(' ')[0];
    const courseNum = courseCode.split(' ')[1] || '100';
    const baseRoom = parseInt(courseNum.substring(0, 2)) || 10;
    return `${buildingCode}${baseRoom}${group}TC`;
  };

  const parseSchedule = (scheduleStr) => {
    const match = scheduleStr.match(/([A-Za-z]+)\s+(\d{1,2}):(\d{2})\s*(?:AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(?:AM|PM)?/i);
    if (!match) return null;

    const daysStr = match[1].toUpperCase();
    const startHour = parseInt(match[2]);
    const startMin = parseInt(match[3]);
    const endHour = parseInt(match[4]);
    const endMin = parseInt(match[5]);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return { days: daysStr.split(''), startTime, endTime };
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let minutes = 450; minutes <= 1050; minutes += 30) {
      slots.push(minutes);
    }
    return slots;
  };

  const formatTimeRange = (startMinutes) => {
    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${ampm}`;
    };
    return `${formatTime(startMinutes)} - ${formatTime(startMinutes + 30)}`;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="mt-6 border-t-2 border-enrollmate-green/30 pt-6">
      <h4 className="text-lg font-jakarta font-bold text-enrollmate-green mb-4">
        <span className="text-xl">✦</span> YOUR SCHEDULE
      </h4>

      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left font-jakarta font-bold text-sm text-gray-700 w-48">
                Time
              </th>
              {dayNames.map((day) => (
                <th key={day} className="border border-gray-300 p-3 text-center font-jakarta font-bold text-sm text-gray-700">
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {timeSlots.slice(0, -1).map((timeSlot) => {
              return (
                <tr key={timeSlot} className="hover:bg-gray-50/50 transition-colors">
                  <td className="border border-gray-300 p-3 text-sm font-jakarta text-gray-600 bg-gray-50/30">
                    {formatTimeRange(timeSlot)}
                  </td>

                  {days.map((day) => {
                    const sectionsInSlot = schedule.sections_json.filter((section) => {
                      const parsed = parseSchedule(section.schedule);
                      if (!parsed) return false;
                      return parsed.days.includes(day) &&
                        parsed.startTime <= timeSlot &&
                        parsed.endTime > timeSlot;
                    });

                    const startingSection = sectionsInSlot.find((section) => {
                      const parsed = parseSchedule(section.schedule);
                      return parsed && parsed.startTime === timeSlot;
                    });

                    if (startingSection) {
                      const parsed = parseSchedule(startingSection.schedule);
                      const duration = parsed.endTime - parsed.startTime;
                      const rowspan = Math.ceil(duration / 30);

                      return (
                        <td
                          key={day}
                          rowSpan={rowspan}
                          className={`border border-gray-300 p-4 text-center align-middle ${getCourseColor(startingSection.courseCode)}`}
                        >
                          <div className="font-jakarta space-y-1">
                            <div className="font-bold text-sm leading-tight">
                              {startingSection.courseCode} {getRoomNumber(startingSection.courseCode, startingSection.group)}
                            </div>
                            <div className="text-xs font-semibold opacity-90">
                              Group {startingSection.group}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    const isPartOfSpan = sectionsInSlot.length > 0;
                    if (isPartOfSpan) {
                      return null;
                    }

                    return (
                      <td key={day} className="border border-gray-300 p-4 bg-white">
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Main Scheduler Page Component
 */
export default function SchedulerPage() {
  // State for active tab
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'saved'

  // State for courses and constraints
  const [courses, setCourses] = useState([]);
  const [constraints, setConstraints] = useState({
    earliestStart: '07:30',
    latestEnd: '16:30',
    allowFull: false,
    allowAtRisk: true,
    maxFullPerSchedule: 1,
    maxSchedules: 20
  });

  // State for generated schedules and UI
  const [schedules, setSchedules] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [generationTime, setGenerationTime] = useState(null);

  // State for saved schedules
  const [savedSchedules, setSavedSchedules] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // State for semester
  const [currentSemester, setCurrentSemester] = useState(null);
  const [loadingSemester, setLoadingSemester] = useState(true);

  // Generate schedules using the OOP scheduler engine
  const generateSchedules = async () => {
    if (courses.length === 0) {
      setMessage('❌ Please add at least one course before generating schedules.');
      return;
    }

    // Validate time constraints
    const earliestMinutes = constraints.earliestStart.split(':').reduce((h, m) => parseInt(h) * 60 + parseInt(m));
    const latestMinutes = constraints.latestEnd.split(':').reduce((h, m) => parseInt(h) * 60 + parseInt(m));

    if (earliestMinutes >= latestMinutes) {
      setMessage('❌ Earliest start time must be before latest end time.');
      return;
    }

    setIsGenerating(true);
    setMessage('');
    setSchedules([]);
    setGenerationTime(null);

    try {
      console.log('🚀 Starting schedule generation...');
      const startTime = performance.now();

      // Convert course data to Section objects for each course
      const sectionArrays = courses.map(course =>
        course.sections.map(sectionData => {
          const section = new Section(sectionData.group, sectionData.schedule, sectionData.enrolled, 'OK');
          // Add course metadata to section for display purposes
          section.courseCode = course.courseCode;
          section.courseName = course.courseName;
          return section;
        })
      );

      // Create ScheduleGenerator instance
      const generator = new ScheduleGenerator(sectionArrays, constraints);

      // Generate schedules
      const results = generator.generate();

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      console.log(`✅ Generated ${results.length} valid schedules in ${duration}ms`);
      setSchedules(results);
      setGenerationTime(duration);

      if (results.length === 0) {
        setMessage('No valid schedules found. Try relaxing your constraints or adding more section options.');
      } else {
        setMessage(`✅ Generated ${results.length} valid schedule${results.length !== 1 ? 's' : ''} in ${duration}ms`);
      }

    } catch (error) {
      console.error('❌ Schedule generation failed:', error);
      setMessage(`❌ Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch current user and semester on mount
  useEffect(() => {
    const loadUserAndSemester = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
          const semester = await SemesterAPI.getCurrentSemester(user.id);
          setCurrentSemester(semester);
        }
      } catch (error) {
        console.error('Failed to load user/semester:', error);
      } finally {
        setLoadingSemester(false);
      }
    };
    loadUserAndSemester();
  }, []);

  // Fetch saved schedules when switching to saved tab
  useEffect(() => {
    if (activeTab === 'saved' && currentUser) {
      loadSavedSchedules();
    }
  }, [activeTab, currentUser]);

  // Load saved schedules from database
  const loadSavedSchedules = async () => {
    if (!currentUser) return;

    setLoadingSaved(true);
    try {
      const schedules = await fetchUserSchedules(currentUser.id);
      setSavedSchedules(schedules);
    } catch (error) {
      console.error('Failed to fetch saved schedules:', error);
      setMessage(`❌ Failed to load saved schedules: ${error.message}`);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Save schedule as private (not attached to any semester)
  const saveSchedule = async (schedule) => {
    if (!currentUser) {
      setMessage('❌ Please log in to save schedules');
      return;
    }

    try {
      const scheduleName = prompt('Enter a name for this schedule:', `Schedule ${new Date().toLocaleDateString()}`);
      if (!scheduleName) return;

      // Save to user_schedules table (legacy format for "Saved Schedules" tab)
      await saveUserSchedule(
        currentUser.id,
        scheduleName,
        schedule.selections,
        constraints
      );

      // Save courses to user's library
      const coursesToSave = schedule.selections.map(section => {
        const [current, total] = section.enrolled.split('/').map(n => parseInt(n.trim()) || 0);
        return {
          courseCode: section.courseCode,
          courseName: section.courseName,
          sectionGroup: parseInt(section.group) || 1,
          schedule: section.schedule,
          enrolledCurrent: current,
          enrolledTotal: total || 30,
          room: section.room || null,
          instructor: section.instructor || null
        };
      });

      try {
        await UserCourseAPI.saveCourses(currentUser.id, coursesToSave, 'manual');
        console.log(`✅ Saved ${coursesToSave.length} courses from private schedule to library`);
      } catch (error) {
        console.error('Failed to save courses to library:', error);
      }

      setMessage(`✅ Schedule "${scheduleName}" saved privately!`);

      // Refresh saved schedules list if on saved tab
      if (activeTab === 'saved') {
        loadSavedSchedules();
      }

    } catch (error) {
      console.error('Failed to save schedule:', error);
      setMessage(`❌ Failed to save schedule: ${error.message}`);
    }
  };

  // Helper function to find or create semester course
  const findOrCreateSemesterCourse = async (semesterId, section) => {
    // Query for existing course
    const { data: existing } = await supabase
      .from('semester_courses')
      .select('*')
      .eq('semester_id', semesterId)
      .eq('course_code', section.courseCode)
      .eq('section_group', section.group)
      .maybeSingle();

    if (existing) {
      return existing; // Return existing course
    }

    // Create new course if doesn't exist
    const { data: newCourse, error } = await supabase
      .from('semester_courses')
      .insert({
        semester_id: semesterId,
        course_code: section.courseCode,
        course_name: section.courseName,
        section_group: section.group,
        schedule: section.schedule,
        enrolled_current: parseInt(section.enrolled.split('/')[0]) || 0,
        enrolled_total: parseInt(section.enrolled.split('/')[1]) || 30,
        room: null,
        instructor: null,
        status: section.status || 'OK'
      })
      .select()
      .single();

    if (error) throw error;
    return newCourse;
  };

  // Save schedule to current semester
  const saveScheduleToSemester = async (schedule) => {
    if (!currentUser) {
      setMessage('❌ Please log in to save schedules');
      return;
    }

    if (!currentSemester) {
      setMessage('❌ Please create or select a semester first');
      return;
    }

    try {
      setMessage('⏳ Saving schedule to semester...');

      // Count existing schedules in semester to auto-name
      const existingSchedules = await ScheduleAPI.getSemesterSchedules(currentSemester.id);
      const scheduleNumber = existingSchedules.length + 1;
      const scheduleName = `Schedule ${String.fromCharCode(64 + scheduleNumber)}`; // A, B, C...

      // Create schedule in semester
      const newSchedule = await ScheduleAPI.createSchedule(
        currentSemester.id,
        currentUser.id,
        scheduleName,
        `Auto-generated on ${new Date().toLocaleDateString()}`
      );

      // Add courses to schedule
      let successCount = 0;
      let errorCount = 0;

      for (const section of schedule.selections) {
        try {
          // Find existing or create new semester_course
          const semesterCourse = await findOrCreateSemesterCourse(
            currentSemester.id,
            section
          );

          // ALWAYS link to schedule (this is the fix!)
          await ScheduleAPI.addCourseToSchedule(newSchedule.id, semesterCourse.id);
          successCount++;

        } catch (err) {
          console.error(`Failed to add ${section.courseCode}:`, err.message);
          errorCount++;
        }
      }

      // Save courses to user's library
      const coursesToSave = schedule.selections.map(section => {
        const [current, total] = section.enrolled.split('/').map(n => parseInt(n.trim()) || 0);
        return {
          courseCode: section.courseCode,
          courseName: section.courseName,
          sectionGroup: parseInt(section.group) || 1,
          schedule: section.schedule,
          enrolledCurrent: current,
          enrolledTotal: total || 30,
          room: section.room || null,
          instructor: section.instructor || null
        };
      });

      try {
        await UserCourseAPI.saveCourses(currentUser.id, coursesToSave, 'manual');
        console.log(`✅ Saved ${coursesToSave.length} courses from semester schedule to library`);
      } catch (error) {
        console.error('Failed to save courses to library:', error);
      }

      // Better success message
      if (errorCount > 0) {
        setMessage(`⚠️ Schedule saved as "${scheduleName}" with ${successCount}/${schedule.selections.length} courses (${errorCount} failed)`);
      } else {
        setMessage(`✅ Schedule saved to "${currentSemester.name}" as "${scheduleName}" with ${successCount} courses!`);
      }
      setTimeout(() => setMessage(''), 4000);

    } catch (error) {
      console.error('Failed to save schedule to semester:', error);
      setMessage(`❌ Failed to save schedule: ${error.message}`);
    }
  };

  // Load a saved schedule into the generator
  const loadSchedule = (savedSchedule) => {
    try {
      // Extract courses from saved schedule
      const sectionsJson = savedSchedule.sections_json;

      // Group sections by course code
      const coursesMap = new Map();
      for (const section of sectionsJson) {
        if (!coursesMap.has(section.courseCode)) {
          coursesMap.set(section.courseCode, {
            courseCode: section.courseCode,
            courseName: section.courseName,
            sections: []
          });
        }
        coursesMap.get(section.courseCode).sections.push({
          group: section.group,
          schedule: section.schedule,
          enrolled: section.enrolled
        });
      }

      setCourses(Array.from(coursesMap.values()));

      // Load constraints if available
      if (savedSchedule.constraints_json) {
        setConstraints(savedSchedule.constraints_json);
      }

      // Switch to generate tab
      setActiveTab('generate');
      setMessage(`✅ Loaded schedule: ${savedSchedule.name}`);
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('Failed to load schedule:', error);
      setMessage(`❌ Failed to load schedule: ${error.message}`);
    }
  };

  // Delete a saved schedule
  const deleteSavedSchedule = async (scheduleId, scheduleName) => {
    if (!confirm(`Are you sure you want to delete "${scheduleName}"?`)) {
      return;
    }

    try {
      await deleteUserSchedule(scheduleId);
      setMessage(`✅ Schedule deleted successfully!`);
      loadSavedSchedules(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      setMessage(`❌ Failed to delete schedule: ${error.message}`);
    }
  };

  // Copy schedule to clipboard
  const copySchedule = (schedule) => {
    setMessage('✅ Schedule copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end">
      {/* Header */}
      <header className="relative z-20 bg-gradient-to-r from-enrollmate-bg-start to-enrollmate-bg-end shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/assets/images/logo-or-icon.png"
              alt="EnrollMate"
              className="h-12 sm:h-14 md:h-16 w-auto opacity-90 drop-shadow-sm"
            />
          </div>

          {/* Semester Indicator */}
          {!loadingSemester && currentSemester && (
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
              <span className="text-white font-jakarta font-medium text-sm sm:text-base">📚</span>
              <span className="text-white font-jakarta font-bold text-sm sm:text-base">{currentSemester.name}</span>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <a
              href="/dashboard"
              className="text-white font-jakarta font-medium text-sm sm:text-base hover:text-white/80 transition-colors"
            >
              ← Back to Dashboard
            </a>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page Title */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-white font-jakarta font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg mb-3">
            Course Scheduler
          </h1>
          <p className="text-white/90 font-jakarta text-lg sm:text-xl lg:text-2xl drop-shadow-md">
            Generate conflict-free schedules using intelligent backtracking
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-white/20">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('generate')}
              className={`pb-4 px-4 border-b-4 font-jakarta font-bold text-xl sm:text-2xl transition-all duration-300 ${
                activeTab === 'generate'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/40'
              }`}
            >
              Generate New
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-4 px-4 border-b-4 font-jakarta font-bold text-xl sm:text-2xl transition-all duration-300 flex items-center ${
                activeTab === 'saved'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/40'
              }`}
            >
              Private Schedules
              {savedSchedules.length > 0 && (
                <span className="ml-2 px-3 py-1 text-sm bg-white text-enrollmate-green rounded-full font-bold">
                  {savedSchedules.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-5 rounded-2xl shadow-xl font-jakarta font-medium text-lg ${
            message.startsWith('✅')
              ? 'bg-white text-enrollmate-green border-2 border-white'
              : message.startsWith('❌')
              ? 'bg-white text-red-600 border-2 border-red-200'
              : 'bg-white text-blue-600 border-2 border-blue-200'
          }`}>
            {message}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'generate' ? (
          <>
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Left Panel - Course Input */}
              <CourseInputPanel courses={courses} setCourses={setCourses} currentUser={currentUser} />

              {/* Right Panel - Constraints */}
              <ConstraintsPanel
                constraints={constraints}
                setConstraints={setConstraints}
                onGenerate={generateSchedules}
                isGenerating={isGenerating}
                coursesCount={courses.length}
              />
            </div>

            {/* Bottom Panel - Results */}
            <ResultsPanel
              schedules={schedules}
              onSaveSchedule={saveSchedule}
              onCopySchedule={copySchedule}
              onSaveToSemester={saveScheduleToSemester}
              currentSemester={currentSemester}
            />
          </>
        ) : (
          <SavedSchedulesView
            savedSchedules={savedSchedules}
            loading={loadingSaved}
            currentUser={currentUser}
            onLoad={loadSchedule}
            onDelete={deleteSavedSchedule}
          />
        )}
      </div>
    </div>
  );
}