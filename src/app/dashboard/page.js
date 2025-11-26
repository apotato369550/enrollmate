"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SemesterSelector from "../../components/SemesterSelector";
import { SemesterAPI } from "../../../lib/api/semesterAPI";
import { ScheduleAPI } from "../../../lib/api/scheduleAPI";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState({
    totalSchedules: 0,
    activeSchedules: 0,
    lastUpdated: null,
  });

  const dropdownRef = useRef(null);
  const router = useRouter();

  // Semester modal form data
  const [semesterForm, setSemesterForm] = useState({
    semesterType: "1st",
    year: new Date().getFullYear(),
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Fetch user and profile
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profile);

        // Load current semester
        await loadCurrentSemester(user.id);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  // Load current semester
  const loadCurrentSemester = async (userId) => {
    try {
      const semester = await SemesterAPI.getCurrentSemester(userId);
      setCurrentSemester(semester);

      if (semester) {
        await loadSchedules(semester.id);
      }
    } catch (error) {
      console.error("Failed to load current semester:", error);
    }
  };

  // Load schedules for current semester
  const loadSchedules = async (semesterId) => {
    try {
      const data = await ScheduleAPI.getSemesterSchedules(semesterId);
      setSchedules(data);

      // Calculate stats
      const totalSchedules = data.length;
      const activeSchedules = data.filter(
        (s) => s.status === "active" || s.status === "draft"
      ).length;

      // Find the most recent update date
      let lastUpdated = null;
      if (data.length > 0) {
        const dates = data
          .map((s) => {
            const dateStr = s.updated_at || s.created_at;
            if (!dateStr) return null;
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
          })
          .filter((d) => d !== null);

        if (dates.length > 0) {
          lastUpdated = new Date(Math.max(...dates.map((d) => d.getTime())));
        }
      }

      setStats({
        totalSchedules,
        activeSchedules,
        lastUpdated,
      });
    } catch (error) {
      console.error("Failed to load schedules:", error);
    }
  };

  // Handle semester change
  const handleSemesterChange = async (semester) => {
    setCurrentSemester(semester);
    await loadSchedules(semester.id);
  };

  // Handle create new semester
  const handleCreateSemester = async (e) => {
    e.preventDefault();

    try {
      const { semesterType, year } = semesterForm;
      const name = `${semesterType} Semester ${year}`;
      const schoolYear =
        semesterType === "Summer"
          ? `${year}`
          : semesterType === "1st"
          ? `${year}-${year + 1}`
          : `${year - 1}-${year}`;

      const newSemester = await SemesterAPI.createSemester(
        user.id,
        name,
        schoolYear,
        semesterType,
        year
      );

      setCurrentSemester(newSemester);
      setShowSemesterModal(false);
      setSemesterForm({ semesterType: "1st", year: new Date().getFullYear() });

      // Reload schedules (will be empty for new semester)
      await loadSchedules(newSemester.id);
    } catch (error) {
      console.error("Failed to create semester:", error);
      alert("Failed to create semester. Please try again.");
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && showSemesterModal) {
        setShowSemesterModal(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showSemesterModal]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format last updated time
  const formatLastUpdated = (date) => {
    if (!date) return "Never";

    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end flex items-center justify-center">
        <div className="text-white font-jakarta font-bold text-2xl">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2d2d2d]">
      {/* Header */}
      <header className="relative z-20 bg-[#2d2d2d] shadow-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/assets/images/logo-or-icon.png"
              alt="EnrollMate"
              className="h-12 sm:h-14 md:h-16 lg:h-18 w-auto opacity-90 drop-shadow-sm"
            />
          </div>

          {/* User Info and Actions */}
          <nav className="flex items-center space-x-4 sm:space-x-6 md:space-x-8">
            {profile && (
              <span className="text-white font-jakarta font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl drop-shadow-lg mr-4">
                Welcome, {profile.first_name}
              </span>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white shadow-lg hover:scale-105 transition-transform duration-200"
              >
                <img
                  src={
                    profile?.avatar_url || "/assets/images/default-avatar.png"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 font-jakarta font-medium transition-colors"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 font-jakarta font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page Title */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-white font-jakarta font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg">
            My Schedules
          </h1>
        </div>

        {/* Semester Selector */}
        <div className="flex justify-center mb-8">
          <SemesterSelector
            userId={user?.id}
            currentSemester={currentSemester}
            onSemesterChange={handleSemesterChange}
            onCreateNew={() => setShowSemesterModal(true)}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
          {/* Total Schedules */}
          <div
            className="bg-[#4d4d4d] rounded-3xl lg:rounded-[38px] p-6 lg:p-8 shadow-xl border-2 border-enrollmate-green/30 hover:border-enrollmate-green
           transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
          >
            <div className="text-center">
              <div className="mb-3">
                <svg
                  className="w-12 h-12 text-enrollmate-green mx-auto group-hover:scale-110 transition-transform duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10ZM7 14H9V16H7V14ZM11 14H13V16H11V14ZM15 14H17V16H15V14Z" />
                </svg>
              </div>
              <h3 className="text-white font-jakarta font-bold text-lg sm:text-xl lg:text-2xl mb-2">
                Total Schedules
              </h3>
              <span className="text-enrollmate-green font-jakarta font-bold text-3xl sm:text-4xl lg:text-5xl">
                {stats.totalSchedules}
              </span>
              <p className="text-gray-300 font-jakarta text-sm mt-2">
                {currentSemester
                  ? `in ${currentSemester.name}`
                  : "No semester selected"}
              </p>
            </div>
          </div>

          {/* Active Schedules */}
          <div
            className="bg-[#4d4d4d] rounded-3xl lg:rounded-[38px] p-6 lg:p-8 shadow-xl border-2 border-enrollmate-green/30 hover:border-enrollmate-green
            transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
          >
            <div className="text-center">
              <div className="mb-3">
                <svg
                  className="w-12 h-12 text-indigo-500 mx-auto group-hover:scale-110 transition-transform duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 3H6C4.9 3 4 3.9 4 5V21L12 17L20 21V5C20 3.9 19.1 3 18 3Z" />
                </svg>
              </div>
              <h3 className="text-white font-jakarta font-bold text-lg sm:text-xl lg:text-2xl mb-2">
                Active Schedules
              </h3>
              <span className="text-indigo-500 font-jakarta font-bold text-3xl sm:text-4xl lg:text-5xl">
                {stats.activeSchedules}
              </span>
              <p className="text-gray-300 font-jakarta text-sm mt-2">
                {currentSemester
                  ? `for ${currentSemester.name}`
                  : "No active schedules"}
              </p>
            </div>
          </div>

          {/* Last Updated */}
          <div
            className="bg-[#4d4d4d] rounded-3xl lg:rounded-[38px] p-6 lg:p-8 shadow-xl border-2 border-enrollmate-green/30 hover:border-enrollmate-green
            transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
          >
            <div className="text-center">
              <div className="mb-3">
                <svg
                  className="w-12 h-12 text-yellow-500 mx-auto group-hover:scale-110 transition-transform duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8V12L15 15L16.5 13.5L14 11V8M12 4A8 8 0 0 1 20 12A8 8 0 0 1 12 20A8 8 0 0 1 4 12A8 8 0 0 1 12 4Z" />
                </svg>
              </div>
              <h3 className="text-white font-jakarta font-bold text-lg sm:text-xl lg:text-2xl mb-2">
                Last Updated
              </h3>
              <span className="text-yellow-500 font-jakarta font-bold text-2xl sm:text-3xl lg:text-4xl">
                {stats?.lastUpdated
                  ? formatLastUpdated(stats.lastUpdated)
                  : "Never"}
              </span>
              <p className="text-gray-300 font-jakarta text-sm mt-2">
                Overall system update time
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 lg:mb-12">
          <button
            onClick={() => router.push("/scheduler")}
            className="bg-[#4d4d4d] hover:bg-[#5d5d5d] text-white font-jakarta font-bold text-xl sm:text-2xl lg:text-3xl px-8 sm:px-12 lg:px-16 py-3 sm:py-4 lg:py-5 rounded-xl border-2 border-enrollmate-green/30 hover:border-enrollmate-green drop-shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Open Course Scheduler
          </button>
          <button
            onClick={() => router.push("/courses")}
            className="bg-[#4d4d4d] hover:bg-[#5d5d5d] text-white font-jakarta font-bold text-lg sm:text-xl lg:text-2xl px-6 sm:px-10 lg:px-14 py-3 sm:py-4 lg:py-5 rounded-xl border-2 border-enrollmate-green/30 hover:border-enrollmate-green drop-shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            📚 My Course Library
          </button>
        </div>

        {/* Schedules Section */}
        <div className="bg-[#4d4d4d] backdrop-blur-sm rounded-3xl lg:rounded-[38px] p-6 lg:p-8 shadow-xl">
          <h2 className="bg-gradient-to-r from-enrollmate-green via-blue-400 to-purple-500 bg-clip-text text-transparent font-jakarta font-bold text-2xl sm:text-3xl lg:text-4xl mb-6">
            📅 My Schedules
          </h2>
          {!currentSemester ? (
            <div className="text-center py-12">
              <div className="text-[#ffffff] font-jakarta text-xl mb-4">
                No semester selected
              </div>
              <p className="text-[#ffffff] font-jakarta mb-6">
                Create your first semester to get started
              </p>
              <button
                onClick={() => setShowSemesterModal(true)}
                className="bg-enrollmate-green hover:bg-enrollmate-green/90 text-white font-jakarta font-bold px-8 py-3 rounded-xl drop-shadow-lg transform hover:scale-105 transition-all duration-300">
                Create New Semester
              </button>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white font-jakarta text-xl mb-4">
                No schedules yet
              </div>
              <p className="text-gray-300 font-jakarta mb-6">
                Create your first schedule in the Course Scheduler
              </p>
              <button
                onClick={() => router.push("/scheduler")}
                className="bg-enrollmate-green hover:bg-enrollmate-green/90 text-white font-jakarta font-bold px-8 py-3 rounded-xl drop-shadow-lg transform hover:scale-105 transition-all duration-300">
                Go to Course Scheduler
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-gradient-to-br from-white to-gray-50 border-2 border-enrollmate-green/20 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300"S>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-jakarta font-bold text-2xl text-enrollmate-green mb-2">
                        {schedule.name}
                      </h3>
                      <p className="text-gray-600 font-jakarta text-base mb-3">
                        {schedule.getCourseCount()} course
                        {schedule.getCourseCount() !== 1 ? "s" : ""}
                        {schedule.courses.length > 0 && (
                          <span className="text-gray-500">
                            {" "}
                            • {schedule.getPreviewCourses()}
                          </span>
                        )}
                      </p>
                      {schedule.description && (
                        <p className="text-gray-500 font-jakarta text-sm italic">
                          {schedule.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Link
                        href={`/schedule/${schedule.id}`}
                        className="px-4 py-2 text-sm font-jakarta font-bold bg-enrollmate-green text-white rounded-xl hover:bg-enrollmate-green/90 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Semester Modal */}
      {showSemesterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#4d4d4d] rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-jakarta font-bold text-2xl lg:text-3xl">
                  Create New Semester
                </h2>
                <button
                  onClick={() => setShowSemesterModal(false)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateSemester} className="space-y-6">
                <div>
                  <label className="block text-white font-jakarta font-bold text-lg mb-3">
                    Semester Type
                  </label>
                  <select
                    value={semesterForm.semesterType}
                    onChange={(e) =>
                      setSemesterForm({
                        ...semesterForm,
                        semesterType: e.target.value,
                      })
                    }
                    className="w-full bg-[#3d3d3d] text-white border-2 border-gray-600 rounded-xl px-4 py-3 text-base font-jakarta focus:outline-none focus:ring-2 focus:ring-enrollmate-green focus:border-enrollmate-green"
                  >
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-jakarta font-bold text-lg mb-3">
                    Year
                  </label>
                  <input
                    type="number"
                    value={semesterForm.year}
                    onChange={(e) =>
                      setSemesterForm({
                        ...semesterForm,
                        year: parseInt(e.target.value),
                      })
                    }
                    min="2020"
                    max="2030"
                    className="w-full bg-[#3d3d3d] text-white border-2 border-gray-600 rounded-xl px-4 py-3 text-base font-jakarta focus:outline-none focus:ring-2 focus:ring-enrollmate-green focus:border-enrollmate-green"
                  />
                </div>

                <div className="bg-[#3d3d3d] rounded-xl p-4 border border-gray-600">
                  <p className="text-gray-300 font-jakarta text-sm">
                    <strong className="text-white">Preview:</strong>{" "}
                    {semesterForm.semesterType} Semester {semesterForm.year}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-enrollmate-green hover:bg-enrollmate-green/90 text-white font-jakarta font-bold px-6 py-3 rounded-xl drop-shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Create Semester
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSemesterModal(false)}
                    className="px-6 py-3 bg-[#5d5d5d] hover:bg-[#6d6d6d] text-white font-jakarta font-bold rounded-xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
