'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const inputClasses =
    'w-full h-12 px-4 rounded-2xl border border-gray-200 bg-white/90 text-[#2B2B2B] placeholder:text-gray-400 outline-none shadow-sm focus:ring-2 focus:ring-[#9DF313]/60 focus:border-[#9DF313] transition';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    } else if (formData.studentId.trim().length < 3) {
      newErrors.studentId = 'Student ID must be at least 3 characters';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

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
      console.log('Signup form submitted:', formData);
      // Simulate successful signup and redirect to dashboard
      window.location.href = '/';
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
          backgroundImage:
            "url('https://api.builder.io/api/v1/image/assets/TEMP/bceb9c7eef79aac65ed81e95189c2395f7fba479?width=5170')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-2xl">
          <div className="flex justify-center relative z-20 -mb-14 sm:-mb-20">
            <div className="rounded-full p-3 bg-white/95 border-4 border-[#9DF313] inline-flex items-center justify-center shadow-md">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/0ab06d5c74e85b8f2137cf321b9d07d9b7c27912?width=532"
                alt="EnrollMate"
                className="w-32 h-32 sm:w-44 sm:h-44 object-contain"
              />
            </div>
          </div>
          {/* Card */}
          <div className="relative z-10 mt-10 sm:mt-12 bg-white/95 backdrop-blur rounded-3xl p-8 sm:p-12 shadow-xl border border-white/60">

            {/* Title */}
            <h1 className="text-[#1f2937] font-jakarta font-semibold tracking-tight text-3xl sm:text-4xl mb-6 text-center">
              Create your account
            </h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  className={inputClasses}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1 ml-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  className={inputClasses}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 ml-1">{errors.email}</p>
                )}
              </div>

              {/* Student ID */}
              <div className="sm:col-span-2">
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="Student ID"
                  className={inputClasses}
                />
                {errors.studentId && (
                  <p className="text-red-500 text-sm mt-1 ml-1">{errors.studentId}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className={inputClasses}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 ml-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                  className={inputClasses}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1 ml-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit */}
              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#9DF313] to-[#7CB342] text-white font-jakarta font-medium text-lg py-3 rounded-2xl shadow-sm hover:shadow-lg transition duration-200"
                >
                  Create account
                </button>
              </div>

              {/* Login Link */}
              <p className="sm:col-span-2 text-center text-[#374151] font-jakarta text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-[#0ea5e9] hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
