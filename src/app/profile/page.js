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
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const router = useRouter();

  // Fallback image in case the user hasn't uploaded one yet
  const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

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
          avatar_url: profile?.avatar_url || '',
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

  // --- UPDATED: Instant Preview + Background Upload ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      setErrors({ avatar: 'File size must be less than 5MB' });
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setErrors({ avatar: 'File must be an image (JPEG, PNG, GIF, WebP)' });
      return;
    }

    // 2. INSTANT PREVIEW: Create local URL for immediate feedback
    const localPreviewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, avatar_url: localPreviewUrl }));
    setErrors(prev => ({ ...prev, avatar: null })); // Clear errors

    try {
      console.log('Uploading in background...');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;

      // 3. Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 4. Get Real URL + Timestamp (Cache Busting)
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;
      
      console.log('Upload finished. Server URL:', publicUrlWithTimestamp);

      // Update state with the REAL url so it saves to DB correctly
      setFormData(prev => ({ ...prev, avatar_url: publicUrlWithTimestamp }));
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ avatar: `Upload failed: ${error.message}` });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name?.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name?.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.student_id?.trim()) newErrors.student_id = 'Student ID is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    // Simple email regex
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    
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
          setSaving(false);
          return;
        }
        console.log('Email updated successfully');
      }

      // --- CRITICAL FIX: Use Optional Chaining (?.student_id) ---
      // Check if student_id is unique (if changed)
      if (formData.student_id !== profile?.student_id) {
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
          setSaving(false);
          return;
        }
        console.log('Student ID is unique');
      }

      // --- CRITICAL FIX: Use .upsert() instead of .update() ---
      console.log('Updating profile in database...');
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id, // Required for upsert
          first_name: formData.first_name,
          last_name: formData.last_name,
          student_id: formData.student_id,
          program: formData.program,
          year_level: formData.year_level,
          contact_number: formData.contact_number,
          avatar_url: formData.avatar_url, // This will save the latest URL
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Profile update error:', error);
        setErrors({ general: error.message });
        setSaving(false);
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

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;

    setPasswordSaving(true);

    try {
      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        setPasswordErrors({ general: updateError.message });
        return;
      }

      // Success - reset form and close modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      setPasswordErrors({});
      alert('Password changed successfully!');

    } catch (err) {
      console.error('Password change error:', err);
      setPasswordErrors({ general: 'An error occurred while changing password' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
    setPasswordErrors({});
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "url('/assets/images/login-background.png')",
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
            "url('/assets/images/login-background.png')",
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
              <div />
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left - Avatar */}
                <div className="flex flex-col items-center lg:items-start gap-6">
                  <div className="relative">
                    <div className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gray-100">
                      <img
                        src={isEditing 
                          ? (formData.avatar_url || DEFAULT_AVATAR) 
                          : (profile?.avatar_url || DEFAULT_AVATAR)
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                      />
                      {isEditing && (
                        <>
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center transition-opacity hover:bg-opacity-60">
                            <span className="text-white text-sm font-medium">Click to change</span>
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

                  <div className="text-center lg:text-left w-full">
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
                      <h2 className="text-[#111827] font-jakarta font-bold text-xl md:text-2xl">
                        {profile ? `${profile.first_name} ${profile.last_name}` : 'New Student'}
                      </h2>
                    )}
                    <p className="text-sm text-gray-500 mt-1">{profile?.program || 'Program not set'}</p>
                  </div>
                </div>

                {/* Middle/Right - Details */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-500 font-semibold mb-2">First Name</label>
                      {isEditing ? (
                         // Handled in left column for name, but keeping structure if you want separate fields
                         <div className="p-3 bg-gray-50 rounded text-gray-500 text-sm italic">
                           Edit name under profile picture
                         </div>
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700 border border-gray-100">
                            {profile?.first_name || 'Not set'}
                        </div>
                      )}
                    </div>
                     
                    <div>
                        <label className="block text-sm text-gray-500 font-semibold mb-2">Last Name</label>
                        {isEditing ? (
                             <div className="p-3 bg-gray-50 rounded text-gray-500 text-sm italic">
                             Edit name under profile picture
                           </div>
                        ) : (
                            <div className="bg-white px-4 py-3 rounded-md text-gray-700 border border-gray-100">
                                {profile?.last_name || 'Not set'}
                            </div>
                        )}
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-enrollmate-green/20 focus:border-enrollmate-green outline-none transition-all"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700 border border-gray-100">{user?.email || 'Not set'}</div>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-enrollmate-green/20 focus:border-enrollmate-green outline-none transition-all"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700 border border-gray-100">{profile?.student_id || 'Not set'}</div>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-enrollmate-green/20 focus:border-enrollmate-green outline-none transition-all"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700 border border-gray-100">{profile?.program || 'Not set'}</div>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-enrollmate-green/20 focus:border-enrollmate-green outline-none transition-all"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700 border border-gray-100">{profile?.year_level || 'Not set'}</div>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-enrollmate-green/20 focus:border-enrollmate-green outline-none transition-all"
                        />
                      ) : (
                        <div className="bg-white px-4 py-3 rounded-md text-gray-700 border border-gray-100">{profile?.contact_number || 'Not set'}</div>
                      )}
                    </div>
                  </div>

                  {errors.general && <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 rounded">{errors.general}</p>}
                  {errors.avatar && <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 rounded">{errors.avatar}</p>}

                  {/* Change Password Modal */}
                  {isChangingPassword && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-semibold mb-4">Change Password</h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Current Password
                            </label>
                            <input
                              type="password"
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-enrollmate-green"
                              placeholder="Enter current password"
                            />
                            {passwordErrors.currentPassword && (
                              <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              New Password
                            </label>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-enrollmate-green"
                              placeholder="Enter new password"
                            />
                            {passwordErrors.newPassword && (
                              <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-enrollmate-green"
                              placeholder="Confirm new password"
                            />
                            {passwordErrors.confirmPassword && (
                              <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                            )}
                          </div>

                          {passwordErrors.general && (
                            <p className="text-red-500 text-sm">{passwordErrors.general}</p>
                          )}
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={handlePasswordChange}
                            disabled={passwordSaving}
                            className="flex-1 px-4 py-2 bg-enrollmate-green text-white rounded-md font-jakarta font-semibold shadow disabled:opacity-50 hover:opacity-90 transition-opacity"
                          >
                            {passwordSaving ? 'Changing...' : 'Change Password'}
                          </button>
                          <button
                            onClick={handlePasswordCancel}
                            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md font-jakarta shadow hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap gap-3">
                    {isEditing ? (
                      <>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-enrollmate-green text-white rounded-md font-jakarta font-semibold shadow hover:shadow-md transition-all disabled:opacity-50 hover:scale-[1.02]">
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button onClick={handleCancel} className="px-6 py-2.5 bg-gray-500 text-white rounded-md font-jakarta shadow hover:bg-gray-600 transition-colors">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-enrollmate-green text-white rounded-md font-jakarta font-semibold shadow hover:shadow-md transition-all hover:scale-[1.02]">Edit Profile</button>
                    )}
                    <button onClick={() => setIsChangingPassword(true)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-md font-jakarta shadow hover:bg-gray-50 transition-colors">Change Password</button>
                    <button onClick={() => alert('Deactivate account not implemented')} className="px-6 py-2.5 bg-red-600 text-white rounded-md font-jakarta shadow hover:bg-red-700 transition-colors">Deactivate Account</button>
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