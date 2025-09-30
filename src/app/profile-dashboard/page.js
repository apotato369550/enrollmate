'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfileDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const goBack = () => {
    router.push('/dashboard');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end flex items-center justify-center">
        <div className="text-white font-jakarta font-bold text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end">
      {/* Header with PFP Toolbar */}
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
          
          {/* PFP Toolbar */}
          <div className="flex items-center space-x-4">
            {profile && (
              <>
                <span className="text-white font-jakarta font-bold text-sm sm:text-base md:text-lg drop-shadow-lg hidden sm:block">
                  {profile.first_name} {profile.last_name}
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                  <img 
                    src="https://api.builder.io/api/v1/image/assets/TEMP/680fcbda4df1115fe0357aadd4ff2ef39f8fb0f6?width=596"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleLogout}
                  className="text-white font-jakarta font-medium text-sm sm:text-base hover:text-white/90 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Profile Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-6rem)] px-4 py-8">
        <div className="w-full max-w-5xl">
          {/* Profile Card */}
          <div className="bg-[#F8F8F8] rounded-xl shadow-2xl p-6 md:p-8 lg:p-12 relative">
            
            {/* Back Arrow */}
            <button
              onClick={goBack}
              className="absolute top-6 left-6 md:top-8 md:left-8 w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-black group-hover:scale-110 transition-transform"
              >
                <path 
                  d="M15 18L9 12L15 6" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Profile Title */}
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-[#2B2B2B] font-jakarta font-bold text-4xl md:text-5xl lg:text-6xl">
                Profile
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
              
              {/* Profile Picture Section */}
              <div className="lg:col-span-1 flex flex-col items-center">
                <div className="relative">
                  <div className="w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full overflow-hidden border-4 border-[#A2A2A2] shadow-xl">
                    <img 
                      src="https://api.builder.io/api/v1/image/assets/TEMP/680fcbda4df1115fe0357aadd4ff2ef39f8fb0f6?width=596"
                      alt="Profile Picture"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Change Profile Picture Button */}
                  <button className="absolute bottom-4 right-4 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-[#9DF313] to-[#F3FD02] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white group-hover:scale-110 transition-transform">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Profile Information Section */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg md:text-xl mb-3">
                    Full Name
                  </label>
                  <div className="bg-white rounded-lg px-4 py-3 md:py-4 text-[#2B2B2B] font-jakarta text-base md:text-lg border border-gray-200">
                    {profile ? `${profile.first_name} ${profile.last_name}` : 'Loading...'}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg md:text-xl mb-3">
                    Email
                  </label>
                  <div className="bg-white rounded-lg px-4 py-3 md:py-4 text-[#2B2B2B] font-jakarta text-base md:text-lg border border-gray-200">
                    {user?.email || 'Loading...'}
                  </div>
                </div>

                {/* Two Column Grid for Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Student ID */}
                  <div>
                    <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg md:text-xl mb-3">
                      Student ID
                    </label>
                    <div className="bg-white rounded-lg px-4 py-3 md:py-4 text-[#2B2B2B] font-jakarta text-base md:text-lg border border-gray-200">
                      {profile?.student_id || 'Not set'}
                    </div>
                  </div>

                  {/* Program */}
                  <div>
                    <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg md:text-xl mb-3">
                      Program
                    </label>
                    <div className="bg-white rounded-lg px-4 py-3 md:py-4 text-[#2B2B2B] font-jakarta text-base md:text-lg border border-gray-200">
                      {profile?.program || 'Not set'}
                    </div>
                  </div>

                  {/* Year Level */}
                  <div>
                    <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg md:text-xl mb-3">
                      Year Level
                    </label>
                    <div className="bg-white rounded-lg px-4 py-3 md:py-4 text-[#2B2B2B] font-jakarta text-base md:text-lg border border-gray-200">
                      {profile?.year_level || 'Not set'}
                    </div>
                  </div>

                  {/* Contact No. */}
                  <div>
                    <label className="block text-[#2B2B2B] font-jakarta font-bold text-lg md:text-xl mb-3">
                      Contact No.
                    </label>
                    <div className="bg-white rounded-lg px-4 py-3 md:py-4 text-[#2B2B2B] font-jakarta text-base md:text-lg border border-gray-200">
                      {profile?.phone || 'Not set'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 flex flex-wrap gap-4">
                  <button className="bg-enrollmate-green hover:bg-enrollmate-green/90 text-white font-jakarta font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    Edit Profile
                  </button>
                  <button 
                    onClick={goBack}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-jakarta font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
