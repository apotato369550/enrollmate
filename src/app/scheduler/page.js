'use client';

/**
 * Enrollmate Scheduler Page
 * Main interface for course schedule generation using OOP-based scheduler engine
 */

import { useState, useEffect } from 'react';
import { Section, ScheduleGenerator, ConflictDetector } from '../../lib/scheduler/SchedulerEngine.js';
import { saveUserSchedule, fetchUserSchedules, deleteUserSchedule } from '../../lib/scheduler/schedulerAPI.js';

/**
 * CourseInputPanel Component - Left side panel for adding courses and sections
 */
function CourseInputPanel({ courses, setCourses }) {
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseName: '',
    sections: [{ group: 1, schedule: '', enrolled: '0/30' }]
  });

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Add Courses</h2>

      {/* Add Course Form */}
      <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Course Code (e.g., CIS 2103)"
            value={newCourse.courseCode}
            onChange={(e) => setNewCourse(prev => ({ ...prev, courseCode: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Course Name"
            value={newCourse.courseName}
            onChange={(e) => setNewCourse(prev => ({ ...prev, courseName: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Course
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
function ConstraintsPanel({ constraints, setConstraints, onGenerate, isGenerating }) {
  const updateConstraint = (field, value) => {
    setConstraints(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Generation Settings</h2>

      <div className="space-y-4">
        {/* Time Constraints */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Time Preferences</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Earliest Start</label>
              <input
                type="time"
                value={constraints.earliestStart}
                onChange={(e) => updateConstraint('earliestStart', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Latest End</label>
              <input
                type="time"
                value={constraints.latestEnd}
                onChange={(e) => updateConstraint('latestEnd', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Enrollment Constraints */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Enrollment Options</h3>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={constraints.allowFull}
              onChange={(e) => updateConstraint('allowFull', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Allow full sections</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={constraints.allowAtRisk}
              onChange={(e) => updateConstraint('allowAtRisk', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Allow at-risk sections</span>
          </label>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Max full sections per schedule: {constraints.maxFullPerSchedule}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              value={constraints.maxFullPerSchedule}
              onChange={(e) => updateConstraint('maxFullPerSchedule', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Generation Limits */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700">Generation Limits</h3>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Max schedules: {constraints.maxSchedules}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={constraints.maxSchedules}
              onChange={(e) => updateConstraint('maxSchedules', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || courses.length === 0}
          className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
            isGenerating || courses.length === 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Schedules'}
        </button>
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Generated Schedules ({filteredSchedules.length})
          </h2>
          <div className="text-sm text-gray-600 mt-1">
            Total: {schedules.length} | Ends by preferred time: {schedules.filter(s => s.meta.endsByPreferred).length} |
            Has late classes: {schedules.filter(s => s.meta.hasLate).length} |
            Has full sections: {schedules.filter(s => s.meta.fullCount > 0).length}
          </div>
        </div>

        <div className="flex gap-4">
          {/* Filter Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'endsByTime', label: 'Ends by Time' },
              { key: 'hasLate', label: 'Has Late' },
              { key: 'hasFull', label: 'Has Full' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeFilter === filter.key
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
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
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="best">Best Match</option>
            <option value="earliest">Earliest End</option>
            <option value="fewestFull">Fewest Full</option>
          </select>
        </div>
      </div>

      {/* Schedule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSchedules.map((schedule, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* Schedule Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-gray-800">Schedule #{index + 1}</h3>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    schedule.meta.endsByPreferred
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {schedule.meta.endsByPreferred ? 'Ends by time' : 'Late end'}
                  </span>
                  {schedule.meta.fullCount > 0 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                      {schedule.meta.fullCount} full
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(schedule)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Copy
                </button>
                <button
                  onClick={() => onSaveSchedule?.(schedule)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Course Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 border-b pb-1">
                <div className="col-span-3">Course</div>
                <div className="col-span-1">Grp</div>
                <div className="col-span-5">Schedule</div>
                <div className="col-span-2">Status</div>
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
                  'OK': 'text-blue-600',
                  'AT-RISK': 'text-yellow-600',
                  'FULL': 'text-red-600'
                };

                return (
                  <div key={sectionIndex} className="grid grid-cols-12 gap-2 text-sm">
                    <div className="col-span-3 font-medium text-gray-800 truncate">
                      {section.courseCode}
                    </div>
                    <div className="col-span-1 text-gray-600">{section.group}</div>
                    <div className="col-span-5 text-gray-600 text-xs">{section.schedule}</div>
                    <div className={`col-span-2 text-xs font-medium ${statusColors[status]}`}>
                      {status}
                    </div>
                  </div>
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
 * Main Scheduler Page Component
 */
export default function SchedulerPage() {
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

  // Generate schedules using the OOP scheduler engine
  const generateSchedules = async () => {
    if (courses.length === 0) {
      setMessage('Please add at least one course before generating schedules.');
      return;
    }

    setIsGenerating(true);
    setMessage('');
    setSchedules([]);

    try {
      console.log('🚀 Starting schedule generation...');

      // Convert course data to Section objects for each course
      const sectionArrays = courses.map(course =>
        course.sections.map(sectionData =>
          new Section(sectionData.group, sectionData.schedule, sectionData.enrolled, 'OK')
        )
      );

      // Create ScheduleGenerator instance
      const generator = new ScheduleGenerator(sectionArrays, constraints);

      // Generate schedules
      const results = generator.generate();

      console.log(`✅ Generated ${results.length} valid schedules`);
      setSchedules(results);

      if (results.length === 0) {
        setMessage('No valid schedules found. Try adjusting your constraints or course selections.');
      }

    } catch (error) {
      console.error('❌ Schedule generation failed:', error);
      setMessage(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save schedule to database
  const saveSchedule = async (schedule) => {
    try {
      // Get current user (you'll need to implement proper auth)
      const userId = 'current-user-id'; // Replace with actual user auth

      const scheduleId = await saveUserSchedule(
        userId,
        `Schedule ${new Date().toLocaleDateString()}`,
        schedule.selections,
        constraints
      );

      setMessage(`✅ Schedule saved successfully!`);
      console.log('Schedule saved with ID:', scheduleId);

    } catch (error) {
      console.error('Failed to save schedule:', error);
      setMessage(`❌ Failed to save schedule: ${error.message}`);
    }
  };

  // Copy schedule to clipboard
  const copySchedule = (schedule) => {
    setMessage('✅ Schedule copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Scheduler</h1>
          <p className="text-gray-600">
            Add your courses and generate conflict-free schedules using our intelligent backtracking algorithm.
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.startsWith('✅')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : message.startsWith('❌')
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

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
          />
        </div>

        {/* Bottom Panel - Results */}
        <ResultsPanel
          schedules={schedules}
          onSaveSchedule={saveSchedule}
          onCopySchedule={copySchedule}
        />
      </div>
    </div>
  );
}