'use client';

/**
 * Enrollmate Scheduler Page
 * Main interface for course schedule generation using OOP-based scheduler engine
 */

import React, { useState, useEffect } from 'react';
import { Section, ScheduleGenerator, ConflictDetector } from '../../../lib/scheduler/SchedulerEngine.js';
import { saveUserSchedule, fetchUserSchedules, deleteUserSchedule } from '../../../lib/scheduler/schedulerAPI.js';
import { supabase } from '../../../src/lib/supabase.js';

/**
 * CourseInputPanel Component - Left side panel for adding courses and sections
 */
function CourseInputPanel({ courses, setCourses }) {
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseName: '',
    sections: [{ group: 1, schedule: '', enrolled: '0/30' }]
  });
  const [csvError, setCsvError] = useState('');

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

  const addCourse = () => {
    if (newCourse.courseCode && newCourse.courseName && newCourse.sections.length > 0) {
      // Validate sections have required fields
      const validSections = newCourse.sections.filter(s => s.schedule && s.enrolled);

      if (validSections.length > 0) {
        setCourses(prev => [...prev, {
          courseCode: newCourse.courseCode,
          courseName: newCourse.courseName,
          sections: validSections
        }]);

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

  // CSV Import
  const handleCsvImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError('');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const lines = text.split('\n').filter(line => line.trim());

        // Expected format: Course Code, Course Name, Group, Schedule, Enrolled
        const parsedCourses = new Map();

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
        }

        setCourses(Array.from(parsedCourses.values()));
        setCsvError('');
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
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl lg:text-3xl font-jakarta font-bold text-gray-800">Add Courses</h2>

        {/* CSV Import/Export Buttons */}
        <div className="flex gap-3">
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
 */
function TimetableGrid({ schedule }) {
  const days = ['M', 'T', 'W', 'Th', 'F'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Extract time range from schedule
  const allTimes = schedule.parsed.flatMap(p => [p.startTime, p.endTime]);
  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);

  // Round to hour boundaries
  const startHour = Math.floor(minTime / 60);
  const endHour = Math.ceil(maxTime / 60);

  // Generate time slots (hourly)
  const timeSlots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push(hour * 60);
  }

  // Format time for display
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  // Get status color for a section
  const getStatusColor = (section) => {
    const enrolledMatch = section.enrolled?.match(/(\d+)\/(\d+)/);
    if (enrolledMatch) {
      const current = parseInt(enrolledMatch[1]);
      const total = parseInt(enrolledMatch[2]);
      if (current >= total) return 'bg-red-400';
      if (current === 0 || (total >= 20 && current < 6) || (total >= 10 && current < 2)) {
        return 'bg-yellow-400';
      }
    }
    return 'bg-blue-400';
  };

  return (
    <div className="mt-6 overflow-x-auto bg-white rounded-2xl p-4 shadow-lg">
      <h4 className="font-jakarta font-bold text-lg text-gray-800 mb-3">📅 Weekly Timetable</h4>
      <div className="min-w-full">
        <div className="grid grid-cols-6 gap-2">
          {/* Header row */}
          <div className="text-sm font-jakarta font-bold text-gray-600 p-3 bg-gray-100 rounded-lg">Time</div>
          {days.map((day, idx) => (
            <div key={day} className="text-sm font-jakarta font-bold text-gray-700 p-3 text-center bg-enrollmate-green/10 rounded-lg">
              {dayNames[idx]}
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.slice(0, -1).map((timeSlot, timeIndex) => (
            <React.Fragment key={timeSlot}>
              {/* Time label */}
              <div className="text-sm font-jakarta font-semibold text-gray-600 p-3 bg-gray-50 rounded-lg flex items-center">
                {formatTime(timeSlot)}
              </div>

              {/* Day columns */}
              {days.map((day) => {
                // Find sections for this day and time
                const sectionsInSlot = schedule.selections.filter((section, idx) => {
                  const parsed = schedule.parsed[idx];
                  if (!parsed) return false;
                  return parsed.days.includes(day) &&
                    parsed.startTime < timeSlots[timeIndex + 1] &&
                    parsed.endTime > timeSlot;
                });

                return (
                  <div key={day} className="border-2 border-gray-200 bg-gray-50 rounded-lg relative min-h-[80px]">
                    {sectionsInSlot.map((section, idx) => {
                      const parsed = schedule.parsed[schedule.selections.indexOf(section)];
                      // Check if this is the start of the block for this day
                      const isStart = parsed.startTime >= timeSlot && parsed.startTime < timeSlots[timeIndex + 1];

                      if (isStart) {
                        return (
                          <div
                            key={idx}
                            className={`absolute inset-0 m-1 p-3 rounded-lg text-white shadow-md ${getStatusColor(section)}`}
                            style={{
                              top: '4px',
                              bottom: '4px'
                            }}
                          >
                            <div className="font-jakarta font-bold text-base leading-tight">{section.courseCode}</div>
                            <div className="font-jakarta font-semibold text-sm mt-1 opacity-95">Group {section.group}</div>
                            <div className="font-jakarta text-xs mt-1 opacity-90">{section.enrolled}</div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ResultsPanel Component - Bottom section for displaying generated schedules
 */
function ResultsPanel({ schedules, onSaveSchedule, onCopySchedule }) {
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

      {/* Schedule Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSchedules.map((schedule, index) => (
          <div key={index} className="bg-gradient-to-br from-white to-gray-50 border-2 border-enrollmate-green/20 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
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

              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(schedule)}
                  className="px-4 py-2 text-sm font-jakarta font-bold bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => onSaveSchedule?.(schedule)}
                  className="px-4 py-2 text-sm font-jakarta font-bold bg-enrollmate-green text-white rounded-xl hover:bg-enrollmate-green/90 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  💾 Save
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savedSchedules.map((savedSchedule) => (
          <div key={savedSchedule.id} className="bg-white/95 backdrop-blur-sm border-2 border-white/30 rounded-3xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
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
                  title="Load this schedule"
                >
                  📂 Load
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
                  <span className="text-gray-600 font-medium">Group {section.group}</span>
                </div>
              ))}
            </div>

            {/* Mini Timetable Preview */}
            <div className="mt-4 p-4 bg-enrollmate-green/10 rounded-xl border border-enrollmate-green/30">
              <div className="font-jakarta font-bold text-sm text-gray-700 mb-2">📅 Schedule Preview:</div>
              {savedSchedule.sections_json.slice(0, 3).map((section, idx) => (
                <div key={idx} className="text-sm font-jakarta text-gray-600 truncate py-1">
                  {section.courseCode}: {section.schedule}
                </div>
              ))}
              {savedSchedule.sections_json.length > 3 && (
                <div className="text-sm font-jakarta text-gray-500 mt-2 italic">
                  +{savedSchedule.sections_json.length - 3} more courses...
                </div>
              )}
            </div>
          </div>
        ))}
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

  // Fetch current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
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

  // Save schedule to database
  const saveSchedule = async (schedule) => {
    if (!currentUser) {
      setMessage('❌ Please log in to save schedules');
      return;
    }

    try {
      const scheduleName = prompt('Enter a name for this schedule:', `Schedule ${new Date().toLocaleDateString()}`);
      if (!scheduleName) return;

      const scheduleId = await saveUserSchedule(
        currentUser.id,
        scheduleName,
        schedule.selections,
        constraints
      );

      setMessage(`✅ Schedule saved successfully!`);
      console.log('Schedule saved with ID:', scheduleId);

      // Refresh saved schedules list if on saved tab
      if (activeTab === 'saved') {
        loadSavedSchedules();
      }

    } catch (error) {
      console.error('Failed to save schedule:', error);
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
              src="https://api.builder.io/api/v1/image/assets/TEMP/152290938133b46f59604e8cf4419542cb66556d?width=592"
              alt="EnrollMate"
              className="h-12 sm:h-14 md:h-16 w-auto opacity-90 drop-shadow-sm"
            />
          </div>

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
              Saved Schedules
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
              <CourseInputPanel courses={courses} setCourses={setCourses} />

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