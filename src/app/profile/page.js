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
    <div className="min-h-screen bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-black/5">
          {/* Header */}
          <div className="flex items-center justify-between px-6 md:px-8 lg:px-10 py-6 bg-gradient-to-r from-enrollmate-bg-start to-enrollmate-bg-end">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 bg-white/90 rounded-full shadow-sm hover:scale-105 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <h1 className="text-white font-jakarta font-bold text-2xl md:text-3xl">Profile</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => alert('Edit profile feature not implemented yet')}
                className="px-4 py-2 bg-white text-enrollmate-green font-jakarta font-semibold rounded-md shadow hover:opacity-95 transition"
              >
                Edit Profile
              </button>
              <button
                onClick={() => alert('Change password feature not implemented yet')}
                className="px-4 py-2 bg-white/80 text-[#374151] font-jakarta rounded-md shadow hover:opacity-95 transition"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left - Avatar & actions */}
              <div className="flex flex-col items-center lg:items-start gap-6">
                <div className="relative">
                  <div className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full ring-4 ring-white shadow-xl overflow-hidden">
                    <img
                      src={profile?.avatar_url || 'https://api.builder.io/api/v1/image/assets/TEMP/680fcbda4df1115fe0357aadd4ff2ef39f8fb0f6?width=596'}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-2">
                    <button
                      onClick={() => alert('Upload photo not implemented')}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#9DF313] to-[#F3FD02] flex items-center justify-center shadow hover:scale-105 transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 48 47" fill="none">
                        <path d="M28 32.4286H13V27.5714H28V13H33V27.5714H48V32.4286H33V47H28V32.4286Z" fill="white"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="text-center lg:text-left">
                  <h2 className="text-[#111827] font-jakarta font-bold text-xl md:text-2xl">{profile ? `${profile.first_name} ${profile.last_name}` : 'Not set'}</h2>
                  <p className="text-sm text-gray-500">{profile?.program || 'Program not set'}</p>
                </div>

                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <button onClick={() => alert('Download vCard not implemented')} className="px-3 py-2 bg-white rounded-md text-sm font-jakarta shadow">Download vCard</button>
                  <button onClick={() => alert('Send message not implemented')} className="px-3 py-2 bg-white rounded-md text-sm font-jakarta shadow">Message</button>
                  <button onClick={() => alert('Share profile not implemented')} className="px-3 py-2 bg-white rounded-md text-sm font-jakarta shadow">Share</button>
                </div>
              </div>

              {/* Middle/Right - Details */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-500 font-semibold mb-2">Full Name</label>
                    <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile ? `${profile.first_name} ${profile.last_name}` : 'Not set'}</div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 font-semibold mb-2">Email</label>
                    <div className="bg-white px-4 py-3 rounded-md text-gray-700">{user?.email || 'Not set'}</div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 font-semibold mb-2">Student ID</label>
                    <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile?.student_id || 'Not set'}</div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 font-semibold mb-2">Program</label>
                    <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile?.program || 'Not set'}</div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 font-semibold mb-2">Year Level</label>
                    <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile?.year_level || 'Not set'}</div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-500 font-semibold mb-2">Contact No.</label>
                    <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile?.contact_number || 'Not set'}</div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => alert('Edit profile not implemented')} className="px-4 py-2 bg-enrollmate-green text-white rounded-md font-jakarta font-semibold shadow">Edit Profile</button>
                  <button onClick={() => alert('Change password not implemented')} className="px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-md font-jakarta shadow">Change Password</button>
                  <button onClick={() => alert('Connect accounts not implemented')} className="px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-md font-jakarta shadow">Connect Accounts</button>
                  <button onClick={() => alert('Deactivate account not implemented')} className="px-4 py-2 bg-red-600 text-white rounded-md font-jakarta shadow">Deactivate Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
