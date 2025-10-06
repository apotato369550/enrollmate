'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [formData, setFormData] = useState({
    scheduleName: '',
    schoolYear: '',
    semester: '',
    creationDate: '',
    status: 'Active',
    yearLevel: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const recentActivities = [
    { id: 1, activity: 'Schedule created successfully', date: '9/26/25 (Just Now)', status: 'Completed', type: 'Create' },
    { id: 2, activity: 'CS101 class added to schedule', date: '9/25/25 (6hrs ago)', status: 'Pending', type: 'Update' },
    { id: 3, activity: 'Math 101 time conflict resolved', date: '9/25/25 (6hrs ago)', status: 'Resolved', type: 'Fix' },
    { id: 4, activity: 'Fall 2024 schedule published', date: '9/24/25 (1 day ago)', status: 'Completed', type: 'Publish' },
    { id: 5, activity: 'Physics lab section changed', date: '9/23/25 (2 days ago)', status: 'Completed', type: 'Update' },
  ];

  const filterOptions = ['All', 'Completed', 'Pending', 'Resolved'];
  
  const filteredActivities = activeFilter === 'All' 
    ? recentActivities 
    : recentActivities.filter(activity => activity.status === activeFilter);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    alert('Schedule created successfully!');
    setShowScheduleForm(false);
    // Reset form
    setFormData({
      scheduleName: '',
      schoolYear: '',
      semester: '',
      creationDate: '',
      status: 'Active',
      yearLevel: ''
    });
  };

  // Fetch user and profile
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showScheduleForm) {
        setShowScheduleForm(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showScheduleForm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end">
      {/* Header */}
      <header className="relative z-20 bg-gradient-to-r from-enrollmate-bg-start to-enrollmate-bg-end shadow-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/152290938133b46f59604e8cf4419542cb66556d?width=592"
              alt="EnrollMate"
              className="h-12 sm:h-14 md:h-16 lg:h-18 w-auto opacity-90 drop-shadow-sm"
            />
          </div>
          
          {/* User Info and Logout */}
          <nav className="flex items-center space-x-4 sm:space-x-6 md:space-x-8">
            {profile && (
              <span className="text-white font-jakarta font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl drop-shadow-lg">
                Welcome, {profile.first_name} {profile.last_name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-white font-jakarta font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl drop-shadow-lg hover:text-white/90 transition-colors"
            >
              Logout
            </button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
          {/* Total Schedules Created */}
          <div className="bg-white rounded-3xl lg:rounded-[38px] p-6 lg:p-8 shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <div className="text-center">
              <div className="mb-3">
                <svg className="w-12 h-12 text-enrollmate-green mx-auto group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10ZM7 14H9V16H7V14ZM11 14H13V16H11V14ZM15 14H17V16H15V14Z"/>
                </svg>
              </div>
              <h3 className="text-[#2B2B2B] font-jakarta font-bold text-lg sm:text-xl lg:text-2xl mb-2">
                Total Schedules Created
              </h3>
              <span className="text-enrollmate-green font-jakarta font-bold text-3xl sm:text-4xl lg:text-5xl">
                12
              </span>
              <p className="text-[#767676] font-jakarta text-sm mt-2">+2 this month</p>
            </div>
          </div>

          {/* Active Schedules */}
          <div className="bg-white rounded-3xl lg:rounded-[38px] p-6 lg:p-8 shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <div className="text-center">
              <div className="mb-3">
                <svg className="w-12 h-12 text-enrollmate-green mx-auto group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
                </svg>
              </div>
              <h3 className="text-[#2B2B2B] font-jakarta font-bold text-lg sm:text-xl lg:text-2xl mb-2">
                Active Schedules
              </h3>
              <span className="text-enrollmate-green font-jakarta font-bold text-3xl sm:text-4xl lg:text-5xl">
                3
              </span>
              <p className="text-[#767676] font-jakarta text-sm mt-2">Currently in use</p>
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-white rounded-3xl lg:rounded-[38px] p-6 lg:p-8 shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
            <div className="text-center">
              <div className="mb-3">
                <svg className="w-12 h-12 text-enrollmate-green mx-auto group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z"/>
                </svg>
              </div>
              <h3 className="text-[#2B2B2B] font-jakarta font-bold text-lg sm:text-xl lg:text-2xl mb-2">
                Last Updated
              </h3>
              <span className="text-[#767676] font-jakarta font-medium text-xl sm:text-2xl lg:text-3xl">
                2 hours ago
              </span>
              <p className="text-[#767676] font-jakarta text-sm mt-2">Fall 2024 schedule</p>
            </div>
          </div>
        </div>

        {/* Create New Schedule Button */}
        <div className="text-center mb-8 lg:mb-12">
          <button
            onClick={() => setShowScheduleForm(true)}
            className="bg-enrollmate-green hover:bg-enrollmate-green/90 text-white font-jakarta font-bold text-xl sm:text-2xl lg:text-3xl px-8 sm:px-12 lg:px-16 py-3 sm:py-4 lg:py-5 rounded-xl drop-shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Create New Schedule
          </button>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-3xl lg:rounded-[38px] p-6 lg:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8">
            <h2 className="text-[#2B2B2B] font-jakarta font-bold text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-0">
              Recent Activity
            </h2>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-jakarta font-medium text-sm transition-all duration-300 ${
                    activeFilter === filter
                      ? 'bg-enrollmate-green text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          {/* Activity Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-[#D9D9D9]">
                <tr>
                  <th className="text-left text-[#A2A2A2] font-jakarta font-bold text-lg sm:text-xl lg:text-2xl pb-4">
                    Activity
                  </th>
                  <th className="text-left text-[#A2A2A2] font-jakarta font-bold text-lg sm:text-xl lg:text-2xl pb-4">
                    Date
                  </th>
                  <th className="text-left text-[#A2A2A2] font-jakarta font-bold text-lg sm:text-xl lg:text-2xl pb-4">
                    Status
                  </th>
                  <th className="text-left text-[#A2A2A2] font-jakarta font-bold text-lg sm:text-xl lg:text-2xl pb-4">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length > 0 ? filteredActivities.map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-4 text-black font-jakarta text-base sm:text-lg lg:text-xl">
                      {activity.activity}
                    </td>
                    <td className="py-4 text-[#767676] font-jakarta text-base sm:text-lg lg:text-xl">
                      {activity.date}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activity.status === 'Completed' 
                          ? 'bg-green-100 text-green-800'
                          : activity.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        activity.type === 'Create' 
                          ? 'bg-purple-100 text-purple-800'
                          : activity.type === 'Update'
                          ? 'bg-blue-100 text-blue-800'
                          : activity.type === 'Fix'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.type}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 font-jakarta">
                      No activities found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Schedule Management Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F8F8F8] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 lg:p-8">
              {/* Header with back button */}
              <div className="flex items-center mb-8">
                <button
                  onClick={() => setShowScheduleForm(false)}
                  className="mr-6 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <h2 className="text-[#2B2B2B] font-jakarta font-bold text-3xl sm:text-4xl lg:text-5xl">
                  Schedule Management
                </h2>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Schedule Name */}
                <div>
                  <label className="block text-[#2B2B2B] font-jakarta font-bold text-xl lg:text-2xl mb-3">
                    Schedule Name
                  </label>
                  <input
                    type="text"
                    name="scheduleName"
                    value={formData.scheduleName}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-enrollmate-green"
                    placeholder="Enter schedule name"
                  />
                </div>

                {/* School Year and Semester */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#2B2B2B] font-jakarta font-bold text-xl lg:text-2xl mb-3">
                      School Year
                    </label>
                    <input
                      type="text"
                      name="schoolYear"
                      value={formData.schoolYear}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-enrollmate-green"
                      placeholder="e.g., 2023-2024"
                    />
                  </div>
                  <div>
                    <label className="block text-[#2B2B2B] font-jakarta font-bold text-xl lg:text-2xl mb-3">
                      Semester
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-enrollmate-green"
                    >
                      <option value="">Select Semester</option>
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                </div>

                {/* Creation Date */}
                <div>
                  <label className="block text-[#2B2B2B] font-jakarta font-bold text-xl lg:text-2xl mb-3">
                    Creation Date
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <select className="bg-white border border-gray-200 rounded-lg px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-enrollmate-green">
                      <option>MM</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
                      ))}
                    </select>
                    <select className="bg-white border border-gray-200 rounded-lg px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-enrollmate-green">
                      <option>DD</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
                      ))}
                    </select>
                    <select className="bg-white border border-gray-200 rounded-lg px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-enrollmate-green">
                      <option>YYYY</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={2024 + i} value={2024 + i}>{2024 + i}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status and Year Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#2B2B2B] font-jakarta font-bold text-xl lg:text-2xl mb-3">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-enrollmate-green"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#2B2B2B] font-jakarta font-bold text-xl lg:text-2xl mb-3">
                      Year Level
                    </label>
                    <select
                      name="yearLevel"
                      value={formData.yearLevel}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-enrollmate-green"
                    >
                      <option value="">Select Year Level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6">
                  <h3 className="text-[#2B2B2B] font-jakarta font-bold text-xl lg:text-2xl mb-4">
                    Action
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="bg-enrollmate-green hover:bg-enrollmate-green/90 text-white font-jakarta font-bold px-6 py-3 rounded-lg drop-shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Publish feature coming soon!')}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-jakarta font-bold px-6 py-3 rounded-lg drop-shadow-lg transition-all duration-300 opacity-40 hover:opacity-60"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this schedule?')) {
                          alert('Schedule deleted!');
                          setShowScheduleForm(false);
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white font-jakarta font-bold px-6 py-3 rounded-lg drop-shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Edit mode activated!')}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-jakarta font-bold px-6 py-3 rounded-lg drop-shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Schedule archived successfully!')}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-jakarta font-bold px-6 py-3 rounded-lg drop-shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Schedule duplicated! Check your schedules list.')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-jakarta font-bold px-6 py-3 rounded-lg drop-shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      Duplicate
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
