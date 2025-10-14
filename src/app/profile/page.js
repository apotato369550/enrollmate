'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
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
        setFormData({
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          student_id: profile?.student_id || '',
          email: user.email || '',
          program: profile?.program || '',
          year_level: profile?.year_level || '',
          contact_number: profile?.contact_number || '',
        });
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Check file constraints
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      console.error('File too large:', file.size, 'Max allowed:', maxSize);
      setErrors({ avatar: 'File size must be less than 5MB' });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type, 'Allowed types:', allowedTypes);
      setErrors({ avatar: 'File must be an image (JPEG, PNG, GIF, WebP)' });
      return;
    }

    // Upload to Supabase storage
    // Note: Ensure a storage bucket named 'avatars' exists in Supabase with public access
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    console.log('Attempting upload to bucket "avatars" with fileName:', fileName);

    const { data, error } = await supabase.storage
      .from('avatars') // Assuming bucket name 'avatars'
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Supabase storage upload error:', error);
      console.log('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        hint: error.hint
      });
      setErrors({ avatar: 'Failed to upload image' });
      return;
    }

    console.log('Upload successful, data:', data);

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    console.log('Public URL generated:', publicUrl);
    setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.student_id.trim()) newErrors.student_id = 'Student ID is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      console.log('Starting profile save process...');
      console.log('Form data:', formData);

      // Update email if changed
      if (formData.email !== user.email) {
        console.log('Updating email...');
        const { error: emailError } = await supabase.auth.updateUser({ email: formData.email });
        if (emailError) {
          console.error('Email update error:', emailError);
          setErrors({ email: emailError.message });
          return;
        }
        console.log('Email updated successfully');
      }

      // Check if student_id is unique (if changed)
      if (formData.student_id !== profile.student_id) {
        console.log('Checking student ID uniqueness...');
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('student_id', formData.student_id)
          .neq('id', user.id)
          .single();
        if (existing) {
          console.log('Student ID already exists');
          setErrors({ student_id: 'Student ID already taken' });
          return;
        }
        console.log('Student ID is unique');
      }

      // Update profile
      console.log('Updating profile in database...');
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          student_id: formData.student_id,
          program: formData.program,
          year_level: formData.year_level,
          contact_number: formData.contact_number,
          avatar_url: formData.avatar_url,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        setErrors({ general: error.message });
        return;
      }
      console.log('Profile updated successfully');

      // Refresh profile
      console.log('Refreshing profile data...');
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(updatedProfile);
      setIsEditing(false);
      setErrors({});
      console.log('Profile save completed successfully');
    } catch (err) {
      console.error('Unexpected error during save:', err);
      setErrors({ general: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      student_id: profile?.student_id || '',
      email: user?.email || '',
      program: profile?.program || '',
      year_level: profile?.year_level || '',
      contact_number: profile?.contact_number || '',
      avatar_url: profile?.avatar_url || '',
    });
    setIsEditing(false);
    setErrors({});
  };

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
                        src={isEditing ? (formData.avatar_url || 'https://api.builder.io/api/v1/image/assets/TEMP/680fcbda4df1115fe0357aadd4ff2ef39f8fb0f6?width=596') : (profile?.avatar_url || 'https://api.builder.io/api/v1/image/assets/TEMP/680fcbda4df1115fe0357aadd4ff2ef39f8fb0f6?width=596')}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                      {isEditing && (
                        <>
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">Click to change</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-center lg:text-left">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder="First Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center lg:text-left"
                        />
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Last Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center lg:text-left"
                        />
                        {errors.first_name && <p className="text-red-500 text-sm">{errors.first_name}</p>}
                        {errors.last_name && <p className="text-red-500 text-sm">{errors.last_name}</p>}
                      </div>
                    ) : (
                      <h2 className="text-[#111827] font-jakarta font-bold text-xl md:text-2xl">{profile ? `${profile.first_name} ${profile.last_name}` : 'Not set'}</h2>
                    )}
                    <p className="text-sm text-gray-500">{profile?.program || 'Program not set'}</p>
                  </div>
                </div>

                {/* Middle/Right - Details */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-500 font-semibold mb-2">Full Name</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            placeholder="First Name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md"
                          />
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            placeholder="Last Name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile ? `${profile.first_name} ${profile.last_name}` : 'Not set'}</div>
                      )}
                      {errors.first_name && <p className="text-red-500 text-sm">{errors.first_name}</p>}
                      {errors.last_name && <p className="text-red-500 text-sm">{errors.last_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-500 font-semibold mb-2">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Email"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700">{user?.email || 'Not set'}</div>
                      )}
                      {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-500 font-semibold mb-2">Student ID</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="student_id"
                          value={formData.student_id}
                          onChange={handleInputChange}
                          placeholder="Student ID"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile?.student_id || 'Not set'}</div>
                      )}
                      {errors.student_id && <p className="text-red-500 text-sm">{errors.student_id}</p>}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-500 font-semibold mb-2">Program</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="program"
                          value={formData.program}
                          onChange={handleInputChange}
                          placeholder="Program"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile?.program || 'Not set'}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-500 font-semibold mb-2">Year Level</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="year_level"
                          value={formData.year_level}
                          onChange={handleInputChange}
                          placeholder="Year Level"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile?.year_level || 'Not set'}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-500 font-semibold mb-2">Contact No.</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="contact_number"
                          value={formData.contact_number}
                          onChange={handleInputChange}
                          placeholder="Contact Number"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700">{profile?.contact_number || 'Not set'}</div>
                      )}
                    </div>
                  </div>

                  {errors.general && <p className="text-red-500 text-sm mt-4">{errors.general}</p>}
                  {errors.avatar && <p className="text-red-500 text-sm mt-4">{errors.avatar}</p>}
                  <div className="mt-8 flex flex-wrap gap-3">
                    {isEditing ? (
                      <>
                        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-enrollmate-green text-white rounded-md font-jakarta font-semibold shadow disabled:opacity-50">
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded-md font-jakarta shadow">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-enrollmate-green text-white rounded-md font-jakarta font-semibold shadow">Edit Profile</button>
                    )}
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
  );
}
