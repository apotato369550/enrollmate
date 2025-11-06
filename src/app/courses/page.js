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
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-jakarta font-bold rounded-xl hover:bg-white/30 shadow-lg transition-all duration-300 border border-white/30">
              ← Dashboard
            </button>
          </Link>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <div className="lg:col-span-1 grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-sm font-jakarta font-bold text-red-600 mb-2 uppercase tracking-wide">
                  Clear
                </label>
                <button
                  onClick={() => {
                    if (stats && stats.total > 0) {
                      handleClearSource('manual');
                    }
                  }}
                  disabled={!stats || stats.manual === 0}
                  className="w-full px-4 py-3 bg-red-500 text-white font-jakarta font-bold rounded-xl hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
                  title="Clear all manually added courses"
                >
                  🗑️ {stats ? stats.manual : 0}
                </button>
              </div>
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
      </div>
    </div>
  );
}
