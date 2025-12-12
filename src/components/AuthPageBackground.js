'use client';

import { usePathname } from 'next/navigation';

/**
 * AuthPageBackground Component
 * Handles dark mode background for login and signup pages only
 * - Light mode: uses login-background.png with green gradient
 * - Dark mode: uses login-background-dm.jpg with dark background
 */
export default function AuthPageBackground({ isDarkMode }) {
  const pathname = usePathname();
  
  // Only apply background images on /login and /signup routes
  const isLoginOrSignup = pathname === '/login' || pathname === '/signup';
  
  if (!isLoginOrSignup) {
    return null;
  }

  return (
    <>
      {/* Background with gradient */}
      <div className={`absolute inset-0 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#3a3a3a]' 
          : 'bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end'
      }`} />

      {/* Background image - conditional based on dark mode */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isDarkMode ? 'opacity-100' : 'opacity-56'
        }`}
        style={{
          backgroundImage: isDarkMode
            ? "url('/assets/images/login-background-dm.jpg')"
            : "url('/assets/images/login-background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    </>
  );
}
