'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end flex items-center justify-center">
        <div className="text-white text-2xl font-jakarta">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Profile Card */}
      <div className="w-full max-w-6xl bg-[#F8F8F8] rounded-xl shadow-2xl p-6 sm:p-8 lg:p-12">
        {/* Header with Back Arrow and Title */}
        <div className="flex items-center mb-8 lg:mb-12">
          <Link
            href="/dashboard"
            className="mr-4 sm:mr-6 lg:mr-8 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            <svg width="36" height="36" viewBox="0 0 151 139" fill="none" className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9">
              <path 
                d="M68.4002 79.4271L44.9487 56.2604L68.4002 33.0938L73.8722 38.6924L59.9968 52.3993H107.486V60.1215H59.9968L73.8722 73.8285L68.4002 79.4271Z" 
                fill="black" 
                className="group-hover:translate-x-[-2px] transition-transform duration-200"
              />
            </svg>
          </Link>
          <h1 className="text-[#2B2B2B] font-jakarta font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            Profile
          </h1>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Profile Picture */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative">
              <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72 rounded-full border-4 sm:border-[5px] border-[#A2A2A2] overflow-hidden">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/680fcbda4df1115fe0357aadd4ff2ef39f8fb0f6?width=596"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Change Photo Button */}
              <button className="absolute bottom-2 right-2 lg:bottom-4 lg:right-4 w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-[#9DF313] to-[#F3FD02] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 48 47" fill="none" className="w-5 h-5 lg:w-6 lg:h-6">
                  <path d="M28 32.4286H13V27.5714H28V13H33V27.5714H48V32.4286H33V47H28V32.4286Z" fill="white"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Right Side - Profile Information */}
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg sm:text-xl mb-2 sm:mb-3">
                Full Name
              </label>
              <div className="bg-white px-4 py-3 sm:py-4 rounded-md text-gray-700 font-jakarta text-base sm:text-lg">
                {profile ? `${profile.first_name} ${profile.last_name}` : 'Not set'}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg sm:text-xl mb-2 sm:mb-3">
                Email
              </label>
              <div className="bg-white px-4 py-3 sm:py-4 rounded-md text-gray-700 font-jakarta text-base sm:text-lg">
                {user?.email || 'Not set'}
              </div>
            </div>

            {/* Student ID and Program */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg sm:text-xl mb-2 sm:mb-3">
                  Student ID
                </label>
                <div className="bg-white px-4 py-3 sm:py-4 rounded-md text-gray-700 font-jakarta text-base sm:text-lg">
                  {profile?.student_id || 'Not set'}
                </div>
              </div>
              <div>
                <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg sm:text-xl mb-2 sm:mb-3">
                  Program
                </label>
                <div className="bg-white px-4 py-3 sm:py-4 rounded-md text-gray-700 font-jakarta text-base sm:text-lg">
                  {profile?.program || 'Not set'}
                </div>
              </div>
            </div>

            {/* Year Level and Contact No. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg sm:text-xl mb-2 sm:mb-3">
                  Year Level
                </label>
                <div className="bg-white px-4 py-3 sm:py-4 rounded-md text-gray-700 font-jakarta text-base sm:text-lg">
                  {profile?.year_level || 'Not set'}
                </div>
              </div>
              <div>
                <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg sm:text-xl mb-2 sm:mb-3">
                  Contact No.
                </label>
                <div className="bg-white px-4 py-3 sm:py-4 rounded-md text-gray-700 font-jakarta text-base sm:text-lg">
                  {profile?.contact_number || 'Not set'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
