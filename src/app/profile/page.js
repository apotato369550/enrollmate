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
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "url('https://api.builder.io/api/v1/image/assets/TEMP/064bbd9f6db011ffd5c822938c930fa2370a9b77?width=5170')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="text-white text-2xl font-jakarta">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background reused from login */}
      <div className="absolute inset-0 bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "url('https://api.builder.io/api/v1/image/assets/TEMP/064bbd9f6db011ffd5c822938c930fa2370a9b77?width=5170')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Card centered vertically */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-black/5">
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

              {/* Top actions removed as requested */}
              <div />
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left - Avatar */}
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

                  {/* Wide space below - Bio & Preferences */}
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-md shadow">
                      <h3 className="text-[#111827] font-jakarta font-semibold mb-3">About</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {profile?.bio || 'Add a short bio about yourself. This area can be used to show interests, study focus, or any other personal notes.'}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-md shadow flex flex-col justify-between">
                      <div>
                        <h3 className="text-[#111827] font-jakarta font-semibold mb-3">Preferences</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Notifications</p>
                              <p className="text-xs text-gray-500">Receive important updates via email</p>
                            </div>
                            <div className="w-14 h-8 bg-gray-200 rounded-full flex items-center p-1 shadow">
                              <div className="w-6 h-6 bg-white rounded-full shadow ml-auto" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Visibility</p>
                              <p className="text-xs text-gray-500">Profile visible to classmates</p>
                            </div>
                            <div className="w-14 h-8 bg-gray-200 rounded-full flex items-center p-1 shadow">
                              <div className="w-6 h-6 bg-white rounded-full shadow ml-auto" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom actions */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button onClick={() => alert('Edit profile not implemented')} className="px-4 py-2 bg-enrollmate-green text-white rounded-md font-jakarta font-semibold shadow">Edit Profile</button>
                        <button onClick={() => alert('Change password not implemented')} className="px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-md font-jakarta shadow">Change Password</button>
                        <button onClick={() => alert('Deactivate account not implemented')} className="px-4 py-2 bg-red-600 text-white rounded-md font-jakarta shadow">Deactivate Account</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
