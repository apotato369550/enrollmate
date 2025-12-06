'use client';

import { useState, useEffect } from 'react';
import { SemesterAPI } from '../../lib/api/semesterAPI.js';

/**
 * SemesterSelector Component
 * Dropdown for selecting and switching between semesters
 * Green theme with Plus Jakarta Sans font
 */
export default function SemesterSelector({ userId, currentSemester, onSemesterChange, onCreateNew }) {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSemesters();
  }, [userId]);

  const loadSemesters = async () => {
    try {
      setLoading(true);
      const data = await SemesterAPI.getUserSemesters(userId);
      setSemesters(data);
    } catch (error) {
      console.error('Failed to load semesters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSemester = async (semester) => {
    try {
      await SemesterAPI.setCurrentSemester(userId, semester.id);
      setIsOpen(false);
      if (onSemesterChange) {
        onSemesterChange(semester);
      }
    } catch (error) {
      console.error('Failed to set current semester:', error);
      alert('Failed to switch semester. Please try again.');
    }
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    if (onCreateNew) {
      onCreateNew();
    }
  };

  if (loading) {
    return (
      <div className="bg-[#4d4d4d] backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
        <div className="text-gray-300 font-jakarta">Loading semesters...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#4d4d4d] backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border-2 border-enrollmate-green/30 hover:border-enrollmate-green hover:shadow-xl transition-all duration-300 w-full sm:w-auto min-w-[300px]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-enrollmate-green/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-enrollmate-green" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19Z"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="text-xs font-jakarta font-medium text-gray-400">Active Semester</div>
              <div className="text-base font-jakarta font-bold text-white">
                {currentSemester ? currentSemester.name : 'No semester selected'}
              </div>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full mt-2 left-0 right-0 sm:left-auto sm:right-0 sm:min-w-[300px] bg-[#4d4d4d] rounded-2xl shadow-2xl border border-gray-600 z-50 max-h-96 overflow-y-auto">
            {/* Create New Button */}
            <button
              onClick={handleCreateNew}
              className="w-full px-6 py-4 text-left hover:bg-gray-700 transition-colors border-b border-gray-600 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-enrollmate-green flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <div className="font-jakarta font-bold text-enrollmate-green">Create New Semester</div>
                <div className="text-xs font-jakarta text-gray-400">Start a new semester</div>
              </div>
            </button>

            {/* Semester List */}
            {semesters.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-300 font-jakarta">No semesters yet</div>
                <div className="text-sm text-gray-400 font-jakarta mt-1">Create your first semester above</div>
              </div>
            ) : (
              semesters.map((semester) => (
                <button
                  key={semester.id}
                  onClick={() => handleSelectSemester(semester)}
                  className={`w-full px-6 py-4 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    currentSemester?.id === semester.id ? 'bg-enrollmate-green/10' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentSemester?.id === semester.id
                        ? 'bg-enrollmate-green text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19Z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className={`font-jakarta font-bold ${
                        currentSemester?.id === semester.id ? 'text-enrollmate-green' : 'text-white'
                      }`}>
                        {semester.name}
                      </div>
                      <div className="text-xs font-jakarta text-gray-400">
                        {semester.schoolYear} • {semester.status}
                      </div>
                    </div>
                  </div>
                  {currentSemester?.id === semester.id && (
                    <svg className="w-5 h-5 text-enrollmate-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}