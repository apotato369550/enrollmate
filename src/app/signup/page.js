'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    program: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const programs = [
    'Computer Science',
    'Engineering',
    'Business Administration', 
    'Liberal Arts',
    'Medicine',
    'Psychology',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Program validation
    if (!formData.program) {
      newErrors.program = 'Please select a program';
    }

    // Student ID validation
    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    } else if (formData.studentId.trim().length < 3) {
      newErrors.studentId = 'Student ID must be at least 3 characters';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm Password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle signup submission here
      console.log('Signup form submitted:', formData);
      alert('Signup functionality would be implemented here');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end" />
      
      {/* Diamond decoration background */}
      <div 
        className="absolute inset-0 opacity-56"
        style={{
          backgroundImage: `url('https://api.builder.io/api/v1/image/assets/TEMP/bceb9c7eef79aac65ed81e95189c2395f7fba479?width=5170')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          {/* Signup Card */}
          <div
            className="bg-white rounded-[55px] p-6 sm:p-8 shadow-2xl border border-white"
            style={{
              boxShadow: '0 4px 4px 0 rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Logo inside card (bigger) */}
            <div className="flex justify-center mb-4">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/0ab06d5c74e85b8f2137cf321b9d07d9b7c27912?width=532"
                alt="EnrollMate"
                className="w-40 h-40 sm:w-48 sm:h-48"
              />
            </div>

            {/* Title */}
            <h1 className="text-[#2B2B2B] font-jakarta font-bold text-3xl sm:text-4xl mb-6 text-center">
              Sign up
            </h1>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Field */}
              <div className="relative">
                <div className="flex">
                  <div className="w-12 h-12 bg-[#9DF313] rounded-l-xl"></div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="flex-1 h-12 px-4 border-4 border-[#9DF313] rounded-r-xl rounded-l-none outline-none text-[#2B2B2B] font-jakarta font-bold text-base placeholder-[#A2A2A2]"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1 ml-2">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="relative">
                <div className="flex">
                  <div className="w-12 h-12 bg-[#9DF313] rounded-l-xl flex items-center justify-center">
                    <svg width="20" height="16" viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.66659 26.6666C4.88742 26.6666 4.2204 26.4055 3.66554 25.8833C3.11068 25.361 2.83325 24.7333 2.83325 23.9999V7.99992C2.83325 7.26659 3.11068 6.63881 3.66554 6.11659C4.2204 5.59436 4.88742 5.33325 5.66659 5.33325H28.3333C29.1124 5.33325 29.7794 5.59436 30.3343 6.11659C30.8892 6.63881 31.1666 7.26659 31.1666 7.99992V23.9999C31.1666 24.7333 30.8892 25.361 30.3343 25.8833C29.7794 26.4055 29.1124 26.6666 28.3333 26.6666H5.66659ZM16.9999 17.3333L5.66659 10.6666V23.9999H28.3333V10.6666L16.9999 17.3333ZM16.9999 14.6666L28.3333 7.99992H5.66659L16.9999 14.6666ZM5.66659 10.6666V7.99992V23.9999V10.6666Z" fill="white"/>
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className="flex-1 h-12 px-4 border-4 border-[#9DF313] rounded-r-xl rounded-l-none outline-none text-[#2B2B2B] font-jakarta font-bold text-base placeholder-[#A2A2A2]"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 ml-2">{errors.email}</p>
                )}
              </div>

              {/* Program and Student ID Row */}
              <div className="flex space-x-3">
                {/* Program Field */}
                <div className="flex-1 relative">
                  <div className="flex">
                    <div className="w-6 h-12 bg-[#9DF313] rounded-l-xl"></div>
                    <div className="relative flex-1">
                      <select
                        name="program"
                        value={formData.program}
                        onChange={handleInputChange}
                        className="w-full h-12 px-4 border-4 border-[#9DF313] rounded-r-xl rounded-l-none outline-none text-[#2B2B2B] font-jakarta font-bold text-base bg-white appearance-none pr-8"
                      >
                        <option value="" className="text-[#A2A2A2]">Program</option>
                        {programs.map((program) => (
                          <option key={program} value={program}>{program}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg width="16" height="20" viewBox="0 0 44 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21.9999 35.625L12.8333 23.75H31.1666L21.9999 35.625Z" fill="#A2A2A2"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  {errors.program && (
                    <p className="text-red-500 text-xs mt-1 ml-2">{errors.program}</p>
                  )}
                </div>

                {/* Student ID Field */}
                <div className="flex-1 relative">
                  <div className="flex">
                    <div className="w-6 h-12 bg-[#9DF313] rounded-l-xl"></div>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      placeholder="Student ID"
                      className="flex-1 h-12 px-4 border-4 border-[#9DF313] rounded-r-xl rounded-l-none outline-none text-[#2B2B2B] font-jakarta font-bold text-base placeholder-[#A2A2A2]"
                    />
                  </div>
                  {errors.studentId && (
                    <p className="text-red-500 text-xs mt-1 ml-2">{errors.studentId}</p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="flex">
                  <div className="w-12 h-12 bg-[#9DF313] rounded-l-xl"></div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    className="flex-1 h-12 px-4 border-4 border-[#9DF313] rounded-r-xl rounded-l-none outline-none text-[#2B2B2B] font-jakarta font-bold text-base placeholder-[#A2A2A2]"
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 ml-2">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="relative">
                <div className="flex">
                  <div className="w-12 h-12 bg-[#9DF313] rounded-l-xl"></div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm Password"
                    className="flex-1 h-12 px-4 border-4 border-[#9DF313] rounded-r-xl rounded-l-none outline-none text-[#2B2B2B] font-jakarta font-bold text-base placeholder-[#A2A2A2]"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#9DF313] to-[#7CB342] text-white font-jakarta font-bold text-lg py-3 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Create An Account
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-3">
                <p className="text-[#2B2B2B] font-jakarta font-bold text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#0400FF] hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
