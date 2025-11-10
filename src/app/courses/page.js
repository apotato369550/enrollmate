'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import UserCourseAPI from '../../../lib/api/userCourseAPI';
import Link from 'next/link';

export default function CoursesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, manual: 0, csv: 0, extension: 0, remaining: 50 });
  const [deletingId, setDeletingId] = useState(null);
  const [showDependencies, setShowDependencies] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [message, setMessage] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState('csv'); // 'csv' or 'manual'
  const [importing, setImporting] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [manualCourseForm, setManualCourseForm] = useState({
    courseCode: '',
    courseName: '',
    sectionGroup: '',
    schedule: '',
    enrolledCurrent: '',
    enrolledTotal: '',
    room: '',
    instructor: ''
  });

  // Load user and courses
  useEffect(() => {
    const loadUserAndCourses = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        setCurrentUser(user);

        // Load courses and stats
        const [loadedCourses, stats] = await Promise.all([
          UserCourseAPI.getUserCourses(user.id),
          UserCourseAPI.getCourseStats(user.id)
        ]);

        setCourses(loadedCourses);
        setStats(stats);
      } catch (error) {
        console.error('Error loading courses:', error);
        console.error('Error details:', error.message || 'Unknown error');
        setMessage('❌ Failed to load courses. Please check console for details.');
        // Keep default stats on error
        setStats({ total: 0, manual: 0, csv: 0, extension: 0, remaining: 50 });
      } finally {
        setLoading(false);
      }
    };

    loadUserAndCourses();
  }, [router]);

  // Filter courses based on search and source
  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = sourceFilter === 'all' || course.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  // Handle delete course
  const handleDeleteCourse = async (courseId, courseCode, sectionGroup) => {
    try {
      // Check if course is used in any schedules
      const uses = await UserCourseAPI.getCourseUsage(currentUser.id, courseCode, sectionGroup);

      if (uses.length > 0) {
        setShowDependencies(courseId);
        setDependencies(uses);
        setMessage(`⚠️ This course is used in ${uses.length} schedule(s). Delete schedules first.`);
        return;
      }

      // Confirm deletion
      if (!confirm(`Delete ${courseCode} - Section ${sectionGroup}?`)) {
        return;
      }

      setDeletingId(courseId);
      await UserCourseAPI.deleteCourse(courseId);

      // Remove from local state
      setCourses(courses.filter(c => c.id !== courseId));

      // Update stats
      const updatedStats = await UserCourseAPI.getCourseStats(currentUser.id);
      setStats(updatedStats);

      setMessage(`✅ Course deleted successfully`);
    } catch (error) {
      console.error('Error deleting course:', error);
      setMessage(`❌ Failed to delete course: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle course selection
  const toggleCourseSelection = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map(c => c.id));
    }
  };

  // Handle clear selected courses
  const handleClearSelected = async () => {
    if (selectedCourses.length === 0) {
      setMessage('❌ No courses selected');
      return;
    }

    if (!confirm(`Delete ${selectedCourses.length} selected course${selectedCourses.length !== 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      // Delete each selected course
      for (const courseId of selectedCourses) {
        await UserCourseAPI.deleteCourse(courseId);
      }

      // Reload courses
      const loadedCourses = await UserCourseAPI.getUserCourses(currentUser.id);
      setCourses(loadedCourses);

      // Update stats
      const updatedStats = await UserCourseAPI.getCourseStats(currentUser.id);
      setStats(updatedStats);

      setMessage(`✅ Deleted ${selectedCourses.length} courses`);
      setSelectedCourses([]);
    } catch (error) {
      console.error('Error clearing selected courses:', error);
      setMessage(`❌ Failed to clear courses: ${error.message}`);
    }
  };

  // Handle clear all courses
  const handleClearAll = async () => {
    if (courses.length === 0) {
      setMessage('❌ No courses to delete');
      return;
    }

    if (!confirm(`Delete ALL ${courses.length} courses? This cannot be undone.`)) {
      return;
    }

    try {
      // Delete all courses
      for (const course of courses) {
        await UserCourseAPI.deleteCourse(course.id);
      }

      // Reload courses
      const loadedCourses = await UserCourseAPI.getUserCourses(currentUser.id);
      setCourses(loadedCourses);

      // Update stats
      const updatedStats = await UserCourseAPI.getCourseStats(currentUser.id);
      setStats(updatedStats);

      setMessage(`✅ Deleted all courses`);
      setSelectedCourses([]);
    } catch (error) {
      console.error('Error clearing all courses:', error);
      setMessage(`❌ Failed to clear all courses: ${error.message}`);
    }
  };

  // Handle CSV file upload
  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      setMessage('');

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setMessage('❌ CSV file is empty or invalid');
        return;
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim());
      const coursesData = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const course = {};

        headers.forEach((header, index) => {
          course[header] = values[index] || '';
        });

        // Map CSV columns to our format
        coursesData.push({
          courseCode: course['Course Code'] || course['course_code'],
          courseName: course['Course Name'] || course['course_name'],
          sectionGroup: parseInt(course['Section'] || course['section_group']) || 1,
          schedule: course['Schedule'] || course['schedule'],
          enrolledCurrent: parseInt(course['Enrolled'] || course['enrolled_current']) || 0,
          enrolledTotal: parseInt(course['Capacity'] || course['enrolled_total']) || 0,
          room: course['Room'] || course['room'] || '',
          instructor: course['Instructor'] || course['instructor'] || ''
        });
      }

      // Save courses
      const result = await UserCourseAPI.saveCourses(currentUser.id, coursesData, 'csv');

      // Reload courses and stats
      const loadedCourses = await UserCourseAPI.getUserCourses(currentUser.id);
      setCourses(loadedCourses);
      const updatedStats = await UserCourseAPI.getCourseStats(currentUser.id);
      setStats(updatedStats);

      setMessage(`✅ ${result.message}`);
      setShowImportModal(false);

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing CSV:', error);
      setMessage(`❌ Failed to import CSV: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Handle manual course addition
  const handleManualAdd = async () => {
    try {
      setImporting(true);
      setMessage('');

      // Validate form
      if (!manualCourseForm.courseCode || !manualCourseForm.courseName) {
        setMessage('❌ Course code and name are required');
        return;
      }

      // Save course
      await UserCourseAPI.saveCourse(currentUser.id, {
        courseCode: manualCourseForm.courseCode,
        courseName: manualCourseForm.courseName,
        sectionGroup: parseInt(manualCourseForm.sectionGroup) || 1,
        schedule: manualCourseForm.schedule || '',
        enrolledCurrent: parseInt(manualCourseForm.enrolledCurrent) || 0,
        enrolledTotal: parseInt(manualCourseForm.enrolledTotal) || 0,
        room: manualCourseForm.room || '',
        instructor: manualCourseForm.instructor || ''
      }, 'manual');

      // Reload courses and stats
      const loadedCourses = await UserCourseAPI.getUserCourses(currentUser.id);
      setCourses(loadedCourses);
      const updatedStats = await UserCourseAPI.getCourseStats(currentUser.id);
      setStats(updatedStats);

      setMessage('✅ Course added successfully');
      setShowImportModal(false);

      // Reset form
      setManualCourseForm({
        courseCode: '',
        courseName: '',
        sectionGroup: '',
        schedule: '',
        enrolledCurrent: '',
        enrolledTotal: '',
        room: '',
        instructor: ''
      });
    } catch (error) {
      console.error('Error adding course:', error);
      setMessage(`❌ Failed to add course: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-enrollmate-green/10 to-enrollmate-light-green/10 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 font-jakarta">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-enrollmate-green/10 to-enrollmate-light-green/10 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 font-jakarta">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl lg:text-6xl font-jakarta font-bold text-white drop-shadow-lg mb-2">
              📚 My Course Library
            </h1>
            <p className="text-white/90 font-jakarta text-lg drop-shadow-md">
              Manage your saved courses • {stats.total}/50 courses
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              disabled={stats.remaining === 0}
              className="px-6 py-3 bg-enrollmate-green text-white font-jakarta font-bold rounded-xl hover:bg-enrollmate-green/90 shadow-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ➕ Import Courses
            </button>
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-jakarta font-bold rounded-xl hover:bg-white/30 shadow-lg transition-all duration-300 border border-white/30">
                ← Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 p-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl font-jakarta font-medium border-2 border-white/50">
            {message}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl border-2 border-enrollmate-green/30 hover:border-enrollmate-green hover:scale-105 transition-all">
              <p className="text-enrollmate-green/70 text-xs font-jakarta font-bold mb-1 uppercase tracking-wide">Total</p>
              <p className="text-4xl font-bold text-enrollmate-green font-jakarta">{stats.total}</p>
              <p className="text-xs text-gray-500 font-jakarta mt-1">of 50</p>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl border-2 border-enrollmate-green/20 hover:border-enrollmate-green/40 hover:scale-105 transition-all">
              <p className="text-enrollmate-green/70 text-xs font-jakarta font-bold mb-1 uppercase tracking-wide">Manual</p>
              <p className="text-4xl font-bold text-enrollmate-green/80 font-jakarta">{stats.manual}</p>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl border-2 border-enrollmate-green/20 hover:border-enrollmate-green/40 hover:scale-105 transition-all">
              <p className="text-enrollmate-green/70 text-xs font-jakarta font-bold mb-1 uppercase tracking-wide">CSV</p>
              <p className="text-4xl font-bold text-enrollmate-green/80 font-jakarta">{stats.csv}</p>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl border-2 border-enrollmate-green/20 hover:border-enrollmate-green/40 hover:scale-105 transition-all">
              <p className="text-enrollmate-green/70 text-xs font-jakarta font-bold mb-1 uppercase tracking-wide">Extension</p>
              <p className="text-4xl font-bold text-enrollmate-green/80 font-jakarta">{stats.extension}</p>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl border-2 border-green-400/40 hover:border-green-400 hover:scale-105 transition-all">
              <p className="text-green-700/70 text-xs font-jakarta font-bold mb-1 uppercase tracking-wide">Available</p>
              <p className="text-4xl font-bold text-green-600 font-jakarta">{stats.remaining}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl mb-6 border-2 border-white/50">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-jakarta font-bold text-enrollmate-green mb-2 uppercase tracking-wide">
                🔍 Search Courses
              </label>
              <input
                type="text"
                placeholder="Search by course code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-3 border-2 border-enrollmate-green/30 rounded-xl focus:outline-none focus:border-enrollmate-green focus:ring-2 focus:ring-enrollmate-green/20 font-jakarta transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-jakarta font-bold text-enrollmate-green mb-2 uppercase tracking-wide">
                Filter
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-enrollmate-green/30 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta transition-all"
              >
                <option value="all">All</option>
                <option value="manual">Manual</option>
                <option value="csv">CSV</option>
                <option value="extension">Extension</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleClearSelected}
                disabled={selectedCourses.length === 0}
                className="px-4 py-2 bg-orange-500 text-white font-jakarta font-bold rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-md text-sm"
              >
                🗑️ Clear Selected ({selectedCourses.length})
              </button>
              <button
                onClick={handleClearAll}
                disabled={courses.length === 0}
                className="px-4 py-2 bg-red-600 text-white font-jakarta font-bold rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-md text-sm"
              >
                🗑️ Clear All Courses
              </button>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-16 text-center shadow-xl border-2 border-white/50">
            <div className="text-6xl mb-4">{courses.length === 0 ? '📚' : '🔍'}</div>
            <p className="text-gray-700 text-xl font-jakarta font-bold mb-2">
              {courses.length === 0 ? 'No courses saved yet' : 'No courses match your filters'}
            </p>
            {courses.length === 0 && (
              <p className="text-gray-500 font-jakarta">
                Import courses via CSV or add them from the scheduler to get started
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border-2 border-white/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-enrollmate-green to-enrollmate-light-green text-white">
                    <th className="px-4 py-4 text-center font-jakarta font-bold uppercase tracking-wide text-sm w-12">
                      <input
                        type="checkbox"
                        checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-left font-jakarta font-bold uppercase tracking-wide text-sm">Course</th>
                    <th className="px-6 py-4 text-left font-jakarta font-bold uppercase tracking-wide text-sm">Name</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold uppercase tracking-wide text-sm">Section</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold uppercase tracking-wide text-sm">Schedule</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold uppercase tracking-wide text-sm">Enrollment</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold uppercase tracking-wide text-sm">Source</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold uppercase tracking-wide text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enrollmate-green/10">
                  {filteredCourses.map((course, idx) => (
                    <tr key={course.id} className="hover:bg-enrollmate-green/5 transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={() => toggleCourseSelection(course.id)}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-jakarta font-bold text-enrollmate-green text-lg">
                        {course.course_code}
                      </td>
                      <td className="px-6 py-4 font-jakarta text-gray-800 font-medium">
                        {course.course_name}
                      </td>
                      <td className="px-6 py-4 text-center font-jakarta font-bold text-gray-700">
                        {course.section_group}
                      </td>
                      <td className="px-6 py-4 text-center font-jakarta text-sm text-gray-600">
                        {course.schedule}
                      </td>
                      <td className="px-6 py-4 text-center font-jakarta">
                        <div className="inline-flex flex-col items-center px-3 py-2 bg-enrollmate-green/10 rounded-lg">
                          <div className="text-sm font-bold text-enrollmate-green">
                            {course.enrolled_current}/{course.enrolled_total}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">
                            {Math.round((course.enrolled_current / course.enrolled_total) * 100)}% full
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-jakarta text-xs">
                        <span className={`px-3 py-2 rounded-xl font-bold shadow-sm ${
                          course.source === 'csv' ? 'bg-enrollmate-green/20 text-enrollmate-green' :
                          course.source === 'extension' ? 'bg-enrollmate-light-green/30 text-enrollmate-green' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {course.source === 'csv' ? '📥 CSV' :
                           course.source === 'extension' ? '🔌 Extension' :
                           '✏️ Manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.course_code, course.section_group)}
                          disabled={deletingId === course.id}
                          className="px-4 py-2 bg-red-500 text-white font-jakarta font-bold rounded-xl hover:bg-red-600 hover:scale-105 disabled:bg-gray-300 disabled:scale-100 transition-all duration-200 text-sm shadow-md"
                        >
                          {deletingId === course.id ? '⏳' : '🗑️'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dependencies Modal */}
        {showDependencies && dependencies.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md shadow-2xl">
              <h3 className="text-2xl font-jakarta font-bold text-gray-800 mb-4">
                ⚠️ Course In Use
              </h3>
              <p className="text-gray-600 font-jakarta mb-4">
                This course is used in {dependencies.length} schedule{dependencies.length !== 1 ? 's' : ''}:
              </p>
              <ul className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {dependencies.map((dep, idx) => (
                  <li key={idx} className="font-jakarta text-gray-700 p-2 bg-gray-50 rounded">
                    • {dep.scheduleName}
                  </li>
                ))}
              </ul>
              <p className="text-gray-600 font-jakarta text-sm mb-4">
                Delete these schedules first, then delete the course.
              </p>
              <button
                onClick={() => {
                  setShowDependencies(null);
                  setDependencies([]);
                }}
                className="w-full px-4 py-3 bg-enrollmate-green text-white font-jakarta font-bold rounded-xl hover:bg-enrollmate-green/90"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-jakarta font-bold text-gray-800">
                  ➕ Import Courses
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setImportTab('csv')}
                  className={`px-6 py-3 font-jakarta font-bold transition-all ${
                    importTab === 'csv'
                      ? 'text-enrollmate-green border-b-2 border-enrollmate-green'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📥 Import CSV
                </button>
                <button
                  onClick={() => setImportTab('manual')}
                  className={`px-6 py-3 font-jakarta font-bold transition-all ${
                    importTab === 'manual'
                      ? 'text-enrollmate-green border-b-2 border-enrollmate-green'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✏️ Add Manually
                </button>
              </div>

              {/* CSV Import Tab */}
              {importTab === 'csv' && (
                <div>
                  <p className="text-gray-600 font-jakarta mb-4">
                    Upload a CSV file with your course data. The file should have the following columns:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 font-mono text-sm">
                    Course Code, Course Name, Section, Schedule, Enrolled, Capacity, Room, Instructor
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                      Choose CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVImport}
                      disabled={importing}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
                    />
                  </div>
                  {importing && (
                    <div className="text-center py-4">
                      <div className="text-enrollmate-green font-jakarta font-bold">
                        Importing courses...
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Add Tab */}
              {importTab === 'manual' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                        Course Code *
                      </label>
                      <input
                        type="text"
                        value={manualCourseForm.courseCode}
                        onChange={(e) => setManualCourseForm({...manualCourseForm, courseCode: e.target.value})}
                        placeholder="e.g., CIS 3100"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                        Section Group *
                      </label>
                      <input
                        type="number"
                        value={manualCourseForm.sectionGroup}
                        onChange={(e) => setManualCourseForm({...manualCourseForm, sectionGroup: e.target.value})}
                        placeholder="e.g., 1"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                      Course Name *
                    </label>
                    <input
                      type="text"
                      value={manualCourseForm.courseName}
                      onChange={(e) => setManualCourseForm({...manualCourseForm, courseName: e.target.value})}
                      placeholder="e.g., Data Structures"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                      Schedule
                    </label>
                    <input
                      type="text"
                      value={manualCourseForm.schedule}
                      onChange={(e) => setManualCourseForm({...manualCourseForm, schedule: e.target.value})}
                      placeholder="e.g., MW 10:00 AM - 11:30 AM"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                        Enrolled
                      </label>
                      <input
                        type="number"
                        value={manualCourseForm.enrolledCurrent}
                        onChange={(e) => setManualCourseForm({...manualCourseForm, enrolledCurrent: e.target.value})}
                        placeholder="e.g., 30"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={manualCourseForm.enrolledTotal}
                        onChange={(e) => setManualCourseForm({...manualCourseForm, enrolledTotal: e.target.value})}
                        placeholder="e.g., 40"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                        Room
                      </label>
                      <input
                        type="text"
                        value={manualCourseForm.room}
                        onChange={(e) => setManualCourseForm({...manualCourseForm, room: e.target.value})}
                        placeholder="e.g., CIS311TC"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                        Instructor
                      </label>
                      <input
                        type="text"
                        value={manualCourseForm.instructor}
                        onChange={(e) => setManualCourseForm({...manualCourseForm, instructor: e.target.value})}
                        placeholder="e.g., Dr. Smith"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-enrollmate-green font-jakarta"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleManualAdd}
                      disabled={importing}
                      className="flex-1 px-6 py-3 bg-enrollmate-green text-white font-jakarta font-bold rounded-xl hover:bg-enrollmate-green/90 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                    >
                      {importing ? 'Adding...' : 'Add Course'}
                    </button>
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 font-jakarta font-bold rounded-xl hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
