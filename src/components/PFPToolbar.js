'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function PFPToolbar({ user, profile }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const goToProfile = () => {
    router.push('/profile-dashboard');
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  if (!user || !profile) return null;

  return (
    <div className="flex items-center space-x-3 md:space-x-4">
      {/* User Name */}
      <span className="text-white font-jakarta font-bold text-sm sm:text-base md:text-lg drop-shadow-lg hidden sm:block">
        {profile.first_name} {profile.last_name}
      </span>

      {/* Profile Picture */}
      <button 
        onClick={goToProfile}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white/20 border-2 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105"
      >
        <img 
          src="/assets/images/default-avatar.png"
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </button>

      {/* Navigation Dropdown */}
      <div className="relative group">
        <button className="text-white font-jakarta font-medium text-sm sm:text-base hover:text-white/90 transition-colors">
          ▼
        </button>
        
        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
          <div className="py-2">
            <button
              onClick={goToDashboard}
              className="w-full text-left px-4 py-2 text-[#2B2B2B] font-jakarta hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-enrollmate-green">
                <path d="M3 12L5 10M5 10L12 3M5 10V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V10M5 10L12 3M12 3L19 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Dashboard</span>
            </button>
            <button
              onClick={goToProfile}
              className="w-full text-left px-4 py-2 text-[#2B2B2B] font-jakarta hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-enrollmate-green">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Profile</span>
            </button>
            <hr className="my-1" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-red-600 font-jakarta hover:bg-red-50 transition-colors flex items-center space-x-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-600">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
