'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../src/lib/supabase';
import { ScheduleAPI } from '../../../../lib/api/scheduleAPI';
import { SemesterCourseAPI } from '../../../../lib/api/semesterCourseAPI';
import { SemesterAPI } from '../../../../lib/api/semesterAPI';

// Reuse TimetableGrid from scheduler
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
    const courseIndex = schedule.courses.findIndex(s => s.courseCode === courseCode);
    return courseColors[courseIndex % courseColors.length];
  };

  // Generate room number based on course code and group
  const getRoomNumber = (courseCode, group) => {
    const buildingCode = courseCode.split(' ')[0];
    const courseNum = courseCode.split(' ')[1] || '100';
    const baseRoom = parseInt(courseNum.substring(0, 2)) || 10;
    return `${buildingCode}${baseRoom}${group}TC`;
  };

  // Generate 30-minute interval time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let minutes = 450; minutes <= 1050; minutes += 30) {
      slots.push(minutes);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Format time for display
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

  // Parse schedule string to get days and times
  const parseSchedule = (scheduleStr) => {
    const parts = scheduleStr.trim().split(/\s+/);
    if (parts.length < 4) return null;

    const daysPart = parts[0];
    const days = [];
    for (let i = 0; i < daysPart.length; i++) {
      const day = daysPart[i];
      if (day === 'T' && i + 1 < daysPart.length && daysPart[i + 1] === 'h') {
        days.push('Th');
        i++;
      } else {
        days.push(day);
      }
    }

    const timePart = parts.slice(1).join(' ');
    const timeMatch = timePart.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (!timeMatch) return null;

    const convertToMinutes = (timeStr) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
      if (!match) return null;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const startTime = convertToMinutes(timeMatch[1]);
    const endTime = convertToMinutes(timeMatch[2]);

    return { days, startTime, endTime };
  };

  return (
    <div className="mt-8 w-full">
      <div className="mb-4">
        <h3 className="text-xl font-jakarta font-bold text-enrollmate-green flex items-center gap-2">
          <span className="text-2xl">✦</span>
          YOUR SCHEDULE FOR THIS TERM
        </h3>
      </div>

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
                    const coursesInSlot = schedule.courses.filter((course) => {
                      const parsed = parseSchedule(course.schedule);
                      if (!parsed) return false;
                      return parsed.days.includes(day) &&
                        parsed.startTime <= timeSlot &&
                        parsed.endTime > timeSlot;
                    });

                    const startingCourse = coursesInSlot.find((course) => {
                      const parsed = parseSchedule(course.schedule);
                      return parsed.startTime === timeSlot;
                    });

                    if (startingCourse) {
                      const parsed = parseSchedule(startingCourse.schedule);
                      const duration = parsed.endTime - parsed.startTime;
                      const rowspan = Math.ceil(duration / 30);

                      return (
                        <td
                          key={day}
                          rowSpan={rowspan}
                          className={`border border-gray-300 p-4 text-center align-middle ${getCourseColor(startingCourse.courseCode)}`}
                        >
                          <div className="font-jakarta space-y-1">
                            <div className="font-bold text-sm leading-tight">
                              {startingCourse.courseCode} {getRoomNumber(startingCourse.courseCode, startingCourse.sectionGroup)}
                            </div>
                            <div className="text-xs font-semibold opacity-90">
                              Group {startingCourse.sectionGroup}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    const isPartOfSpan = coursesInSlot.length > 0;
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

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => window.print()}
          className="px-8 py-3 bg-gradient-to-r from-enrollmate-bg-start to-enrollmate-bg-end hover:from-enrollmate-green hover:to-enrollmate-green text-white font-jakarta font-bold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          Print Schedule
        </button>
      </div>
    </div>
  );
}

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [schedule, setSchedule] = useState(null);
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadSchedule();
    loadUser();
  }, [params.scheduleId]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const scheduleData = await ScheduleAPI.getScheduleById(params.scheduleId);
      setSchedule(scheduleData);

      // Load semester info
      const semesterData = await SemesterAPI.getSemesterById(scheduleData.semesterId);
      setSemester(semesterData);

      // Load available courses for this semester
      const courses = await SemesterCourseAPI.getSemesterCourses(scheduleData.semesterId);
      setAvailableCourses(courses);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      alert('Failed to load schedule. Redirecting to dashboard...');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (course) => {
    try {
      // Check for conflicts
      if (schedule.hasConflict(course)) {
        alert(`Time conflict: ${course.courseCode} conflicts with an existing course in your schedule.`);
        return;
      }

      await ScheduleAPI.addCourseToSchedule(schedule.id, course.id);
      await loadSchedule();
      setShowCourseModal(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to add course:', error);
      alert(error.message || 'Failed to add course to schedule.');
    }
  };

  const handleRemoveCourse = async (courseId) => {
    if (!confirm('Remove this course from the schedule?')) return;

    try {
      await ScheduleAPI.removeCourseFromSchedule(schedule.id, courseId);
      await loadSchedule();
    } catch (error) {
      console.error('Failed to remove course:', error);
      alert('Failed to remove course from schedule.');
    }
  };

  const handleDeleteSchedule = async () => {
    if (!confirm('Are you sure you want to delete this entire schedule? This cannot be undone.')) return;

    try {
      await ScheduleAPI.deleteSchedule(schedule.id);
      alert('Schedule deleted successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule.');
    }
  };

  const filteredCourses = availableCourses.filter(course =>
    !schedule?.courses.find(c => c.id === course.id) && // Not already in schedule
    (searchTerm === '' || course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
     course.courseName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end flex items-center justify-center">
        <div className="text-white font-jakarta font-bold text-2xl">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end">
      {/* Header */}
      <header className="relative z-20 bg-gradient-to-r from-enrollmate-bg-start to-enrollmate-bg-end shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/152290938133b46f59604e8cf4419542cb66556d?width=592"
              alt="EnrollMate"
              className="h-12 sm:h-14 md:h-16 w-auto opacity-90 drop-shadow-sm"
            />
          </div>
          <nav className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-white font-jakarta font-medium text-sm sm:text-base hover:text-white/80 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Schedule Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-white font-jakarta font-bold text-4xl sm:text-5xl md:text-6xl drop-shadow-lg mb-2">
                {schedule.name}
              </h1>
              <p className="text-white/90 font-jakarta text-lg sm:text-xl">
                {semester?.name} • {schedule.getCourseCount()} course{schedule.getCourseCount() !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCourseModal(true)}
                className="px-6 py-3 bg-enrollmate-green text-white font-jakarta font-bold rounded-xl hover:bg-enrollmate-green/90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                + Add Course
              </button>
              <button
                onClick={handleDeleteSchedule}
                className="px-6 py-3 bg-red-500 text-white font-jakarta font-bold rounded-xl hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Delete Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Course List */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-2xl border border-white/20 mb-8">
          <h2 className="text-2xl font-jakarta font-bold text-gray-800 mb-6">📚 Courses in Schedule</h2>

          {schedule.courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-jakarta text-lg mb-4">No courses added yet</p>
              <button
                onClick={() => setShowCourseModal(true)}
                className="bg-enrollmate-green hover:bg-enrollmate-green/90 text-white font-jakarta font-bold px-6 py-3 rounded-xl transition-all duration-300"
              >
                Add Your First Course
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.courses.map((course) => (
                <div
                  key={course.id}
                  className="flex justify-between items-center bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-jakarta font-bold text-lg text-gray-800">
                      {course.courseCode} - {course.courseName}
                    </h3>
                    <p className="text-gray-600 font-jakarta text-sm">
                      Group {course.sectionGroup} • {course.schedule} • {course.getEnrollmentDisplay()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveCourse(course.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 font-jakarta font-bold text-sm rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timetable */}
        {schedule.courses.length > 0 && <TimetableGrid schedule={schedule} />}
      </main>

      {/* Course Picker Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#2B2B2B] font-jakarta font-bold text-2xl lg:text-3xl">
                  Add Course to Schedule
                </h2>
                <button
                  onClick={() => {
                    setShowCourseModal(false);
                    setSearchTerm('');
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by course code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-jakarta focus:outline-none focus:ring-2 focus:ring-enrollmate-green focus:border-enrollmate-green"
                />
              </div>

              {/* Course List */}
              <div className="overflow-y-auto max-h-[500px] space-y-3">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 font-jakarta">No courses available</p>
                  </div>
                ) : (
                  filteredCourses.map((course) => {
                    const wouldConflict = schedule.hasConflict(course);
                    return (
                      <div
                        key={course.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          wouldConflict
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200 hover:border-enrollmate-green'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-jakarta font-bold text-base text-gray-800">
                              {course.courseCode} - {course.courseName}
                            </h3>
                            <p className="text-gray-600 font-jakarta text-sm mt-1">
                              Group {course.sectionGroup} • {course.schedule}
                            </p>
                            <p className="text-gray-500 font-jakarta text-xs mt-1">
                              {course.getEnrollmentDisplay()}
                              {course.instructor && ` • ${course.instructor}`}
                            </p>
                            {wouldConflict && (
                              <p className="text-red-600 font-jakarta font-bold text-xs mt-2">
                                ⚠️ Time conflict with existing course
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddCourse(course)}
                            disabled={wouldConflict}
                            className={`px-4 py-2 font-jakarta font-bold text-sm rounded-lg transition-all ${
                              wouldConflict
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-enrollmate-green text-white hover:bg-enrollmate-green/90'
                            }`}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
