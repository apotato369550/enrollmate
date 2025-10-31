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
  const [stats, setStats] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDependencies, setShowDependencies] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [message, setMessage] = useState('');

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
        setMessage('❌ Failed to load courses');
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

  // Handle clear all courses from a source
  const handleClearSource = async (source) => {
    const sourceName = source === 'csv' ? 'CSV' : source === 'extension' ? 'Chrome Extension' : 'Manual';
    if (!confirm(`Delete all courses imported from ${sourceName}?`)) {
      return;
    }

    try {
      const count = await UserCourseAPI.clearCoursesBySource(currentUser.id, source);

      // Reload courses
      const loadedCourses = await UserCourseAPI.getUserCourses(currentUser.id);
      setCourses(loadedCourses);

      // Update stats
      const updatedStats = await UserCourseAPI.getCourseStats(currentUser.id);
      setStats(updatedStats);

      setMessage(`✅ Deleted ${count} courses`);
    } catch (error) {
      console.error('Error clearing courses:', error);
      setMessage(`❌ Failed to clear courses: ${error.message}`);
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
    <div className="min-h-screen bg-gradient-to-br from-enrollmate-green/10 to-enrollmate-light-green/10 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-jakarta font-bold text-enrollmate-green mb-2">
              📚 My Course Library
            </h1>
            <p className="text-gray-600 font-jakarta">
              Saved courses that you can add to schedules
            </p>
          </div>
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-enrollmate-green text-white font-jakarta font-bold rounded-xl hover:bg-enrollmate-green/90 shadow-lg transition-all duration-300">
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 p-4 bg-white rounded-xl border-2 border-enrollmate-green/20 shadow-md font-jakarta">
            {message}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-enrollmate-green/20">
              <p className="text-gray-600 text-sm font-jakarta mb-2">Total Courses</p>
              <p className="text-3xl font-bold text-enrollmate-green font-jakarta">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200">
              <p className="text-gray-600 text-sm font-jakarta mb-2">Manual</p>
              <p className="text-3xl font-bold text-blue-600 font-jakarta">{stats.manual}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-purple-200">
              <p className="text-gray-600 text-sm font-jakarta mb-2">CSV Import</p>
              <p className="text-3xl font-bold text-purple-600 font-jakarta">{stats.csv}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-orange-200">
              <p className="text-gray-600 text-sm font-jakarta mb-2">Extension</p>
              <p className="text-3xl font-bold text-orange-600 font-jakarta">{stats.extension}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-emerald-200">
              <p className="text-gray-600 text-sm font-jakarta mb-2">Space Left</p>
              <p className="text-3xl font-bold text-emerald-600 font-jakarta">{stats.remaining}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-8 border border-enrollmate-green/20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                Search Courses
              </label>
              <input
                type="text"
                placeholder="Course code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-2 border-enrollmate-green/30 rounded-lg focus:outline-none focus:border-enrollmate-green font-jakarta"
              />
            </div>
            <div>
              <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                Filter by Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-enrollmate-green/30 rounded-lg focus:outline-none focus:border-enrollmate-green font-jakarta"
              >
                <option value="all">All Sources</option>
                <option value="manual">Manual</option>
                <option value="csv">CSV Import</option>
                <option value="extension">Chrome Extension</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-jakarta font-bold text-gray-700 mb-2">
                Actions
              </label>
              <button
                onClick={() => {
                  if (stats.total > 0) {
                    handleClearSource('manual');
                  }
                }}
                disabled={stats.manual === 0}
                className="w-full px-4 py-2 bg-red-500 text-white font-jakarta font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-all duration-300"
              >
                Clear Manual ({stats.manual})
              </button>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md border border-enrollmate-green/20">
            <p className="text-gray-600 text-lg font-jakarta mb-4">
              {courses.length === 0 ? '📚 No courses saved yet' : '🔍 No courses match your filters'}
            </p>
            {courses.length === 0 && (
              <p className="text-gray-500 font-jakarta">
                Save courses from your schedules or import them via CSV to get started
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-md border border-enrollmate-green/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-enrollmate-green to-enrollmate-light-green text-white">
                    <th className="px-6 py-4 text-left font-jakarta font-bold">Course Code</th>
                    <th className="px-6 py-4 text-left font-jakarta font-bold">Course Name</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold">Section</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold">Schedule</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold">Enrollment</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold">Source</th>
                    <th className="px-6 py-4 text-center font-jakarta font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCourses.map((course, idx) => (
                    <tr key={course.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 font-jakarta font-bold text-enrollmate-green">
                        {course.course_code}
                      </td>
                      <td className="px-6 py-4 font-jakarta text-gray-700">
                        {course.course_name}
                      </td>
                      <td className="px-6 py-4 text-center font-jakarta">
                        {course.section_group}
                      </td>
                      <td className="px-6 py-4 text-center font-jakarta text-sm text-gray-600">
                        {course.schedule}
                      </td>
                      <td className="px-6 py-4 text-center font-jakarta">
                        <div className="text-sm">
                          {course.enrolled_current}/{course.enrolled_total}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round((course.enrolled_current / course.enrolled_total) * 100)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-jakarta text-xs">
                        <span className={`px-2 py-1 rounded-full font-bold ${
                          course.source === 'csv' ? 'bg-purple-100 text-purple-700' :
                          course.source === 'extension' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {course.source === 'csv' ? 'CSV' :
                           course.source === 'extension' ? 'Extension' :
                           'Manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.course_code, course.section_group)}
                          disabled={deletingId === course.id}
                          className="px-3 py-2 bg-red-500 text-white font-jakarta font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-all duration-300 text-sm"
                        >
                          {deletingId === course.id ? '⏳ Deleting...' : '🗑️ Delete'}
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
      </div>
    </div>
  );
}
