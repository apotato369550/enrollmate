'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberPassword: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const inputClasses =
    'w-full h-12 px-4 rounded-2xl border border-gray-200 bg-white/90 text-[#2B2B2B] placeholder:text-gray-400 outline-none shadow-sm focus:ring-2 focus:ring-[#9DF313]/60 focus:border-[#9DF313] transition';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      if (data.user) {
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
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
            "url('/assets/images/login-background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center relative z-20 -mb-12 sm:-mb-16">
            <div className="rounded-full p-3 bg-white/95 border-4 border-[#9DF313] inline-flex items-center justify-center shadow-md">
              <img
                src="/assets/images/logo-or-icon.png"
                alt="EnrollMate"
                className="w-28 h-28 sm:w-36 sm:h-36 object-contain"
              />
            </div>
          </div>
          {/* Card */}
          <div className="relative z-10 mt-8 sm:mt-10 bg-white/95 backdrop-blur rounded-3xl p-8 sm:p-10 shadow-xl border border-white/60">

            {/* Title */}
            <h1 className="text-[#1f2937] font-jakarta font-semibold tracking-tight text-3xl sm:text-4xl mb-6 text-center">
              Log in
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
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

              {/* Remember */}
              <div className="flex items-center gap-3">
                <input
                  id="remember"
                  type="checkbox"
                  name="rememberPassword"
                  checked={formData.rememberPassword}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-[#7CB342] focus:ring-[#9DF313] accent-[#9DF313]"
                />
                <label htmlFor="remember" className="text-[#374151] font-jakarta text-sm">
                  Remember password
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#9DF313] to-[#7CB342] text-white font-jakarta font-medium text-lg py-3 rounded-2xl shadow-sm hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
              {errors.general && (
                <p className="text-red-500 text-sm mt-2 text-center">{errors.general}</p>
              )}

              {/* Link */}
              <p className="text-center text-[#374151] font-jakarta text-sm pt-1">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[#0ea5e9] hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
