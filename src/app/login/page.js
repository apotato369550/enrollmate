'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberPassword: false
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle login submission here
      console.log('Login form submitted:', formData);
      alert('Login functionality would be implemented here');
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
          backgroundImage: `url('https://api.builder.io/api/v1/image/assets/TEMP/064bbd9f6db011ffd5c822938c930fa2370a9b77?width=5170')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8" />

          {/* Login Card */}
          <div
            className="bg-white rounded-[55px] p-8 sm:p-12 shadow-2xl border border-white"
            style={{
              boxShadow: '0 4px 4px 0 rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Logo inside card (bigger) */}
            <div className="flex justify-center mb-6">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/0ab06d5c74e85b8f2137cf321b9d07d9b7c27912?width=532"
                alt="EnrollMate"
                className="w-40 h-40 sm:w-52 sm:h-52"
              />
            </div>

            {/* Title */}
            <h1 className="text-[#2B2B2B] font-jakarta font-bold text-4xl sm:text-5xl mb-6 text-center">
              Log in
            </h1>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="relative">
                <div className="flex">
                  <div className="w-12 h-14 bg-[#9DF313] rounded-l-xl flex items-center justify-center">
                    <svg width="24" height="20" viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5.66659 26.6666C4.88742 26.6666 4.2204 26.4055 3.66554 25.8833C3.11068 25.361 2.83325 24.7333 2.83325 23.9999V7.99992C2.83325 7.26659 3.11068 6.63881 3.66554 6.11659C4.2204 5.59436 4.88742 5.33325 5.66659 5.33325H28.3333C29.1124 5.33325 29.7794 5.59436 30.3343 6.11659C30.8892 6.63881 31.1666 7.26659 31.1666 7.99992V23.9999C31.1666 24.7333 30.8892 25.361 30.3343 25.8833C29.7794 26.4055 29.1124 26.6666 28.3333 26.6666H5.66659ZM16.9999 17.3333L5.66659 10.6666V23.9999H28.3333V10.6666L16.9999 17.3333ZM16.9999 14.6666L28.3333 7.99992H5.66659L16.9999 14.6666ZM5.66659 10.6666V7.99992V23.9999V10.6666Z" fill="white"/>
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className="flex-1 h-14 px-4 border-4 border-[#9DF313] rounded-r-xl rounded-l-none outline-none text-[#2B2B2B] font-jakarta font-bold text-lg placeholder-[#A2A2A2]"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 ml-2">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="flex">
                  <div className="w-12 h-14 bg-[#9DF313] rounded-l-xl"></div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    className="flex-1 h-14 px-4 border-4 border-[#9DF313] rounded-r-xl rounded-l-none outline-none text-[#2B2B2B] font-jakarta font-bold text-lg placeholder-[#A2A2A2]"
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 ml-2">{errors.password}</p>
                )}
              </div>

              {/* Remember Password */}
              <div className="flex items-center space-x-3 mt-4">
                <input
                  type="checkbox"
                  name="rememberPassword"
                  checked={formData.rememberPassword}
                  onChange={handleInputChange}
                  className="w-4 h-4 border border-[#9DF313] rounded"
                />
                <label className="text-[#2B2B2B] font-jakarta font-bold text-sm">
                  Remember Password
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#9DF313] to-[#7CB342] text-white font-jakarta font-bold text-xl py-3 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Log in
                </button>
              </div>

              {/* Sign up Link */}
              <div className="text-center pt-4">
                <p className="text-[#2B2B2B] font-jakarta font-bold text-sm">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-[#0400FF] hover:underline">
                    Sign up
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
