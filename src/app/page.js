import Image from "next/image";

export default function Home() {
 return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-enrollmate-bg-start to-enrollmate-bg-end shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/152290938133b46f59604e8cf4419542cb66556d?width=592"
              alt="EnrollMate"
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto opacity-90 drop-shadow-sm"
            />
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-4 sm:space-x-6 md:space-x-8">
            <button className="text-white font-jakarta font-bold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl drop-shadow-lg hover:text-white/90 transition-colors">
              Login
            </button>
            <button className="text-white font-jakarta font-bold text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl drop-shadow-lg hover:text-white/90 transition-colors">
              Signup
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen">
        {/* Background with gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-5rem)] py-8 lg:py-16">
            
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-6 lg:space-y-8">
              {/* Main Heading */}
              <h1 className="text-white font-jakarta font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                Never struggle with enrollment again
              </h1>
              
              {/* Subheading */}
              <p className="text-white font-jakarta text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-normal leading-relaxed max-w-3xl mx-auto lg:mx-0">
                Smart scheduling for irregular students - find viable schedule combinations instantly
              </p>
              
              {/* CTA Button */}
              <div className="pt-4 lg:pt-8">
                <button className="bg-white hover:bg-gray-50 transition-colors duration-200 rounded-full border-4 sm:border-8 border-orange-50 px-8 sm:px-12 lg:px-16 py-3 sm:py-4 lg:py-5 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                  <span className="text-enrollmate-green font-jakarta font-bold text-xl sm:text-2xl lg:text-3xl xl:text-4xl">
                    Getting Started
                  </span>
                </button>
              </div>
            </div>

            {/* Right Content - Calendar Illustration */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <img 
                  src="https://api.builder.io/api/v1/image/assets/TEMP/98ffc2bac3f2b04d98eef7d0401e4531df775981?width=1594"
                  alt="Calendar with decorative elements"
                  className="w-full max-w-md lg:max-w-lg xl:max-w-xl h-auto drop-shadow-2xl"
                  style={{
                    filter: 'drop-shadow(3px 4px 17.9px rgba(0, 0, 0, 0.25))'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 lg:py-24">
        {/* Background with gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-enrollmate-bg-start to-enrollmate-bg-end"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Smart-Filtering Card */}
            <div className="group transform hover:scale-105 transition-all duration-300">
              <div 
                className="rounded-3xl lg:rounded-[45px] overflow-hidden shadow-2xl aspect-square flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, #FF6B6B, #FF5252)',
                  boxShadow: '-20px 40px 70.9px -1px rgba(255, 0, 0, 0.25)'
                }}
              >
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mb-6">
                      <svg className="w-20 h-20 mx-auto text-white/90" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        <path d="M6.5 9h6v1h-6z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-6 lg:p-8">
                  <h3 className="text-white font-jakarta font-bold text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-center">
                    Smart-Filtering
                  </h3>
                </div>
              </div>
            </div>

            {/* Time-Preferences Card */}
            <div className="group transform hover:scale-105 transition-all duration-300">
              <div 
                className="rounded-3xl lg:rounded-[45px] overflow-hidden shadow-2xl aspect-square flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, #E94CF7, #C21FD6)',
                  boxShadow: '-20px 40px 70.9px -1px rgba(252, 84, 255, 0.25)'
                }}
              >
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mb-6">
                      <svg className="w-20 h-20 mx-auto text-white/90" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-6 lg:p-8">
                  <h3 className="text-white font-jakarta font-bold text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-center">
                    Time-Preferences
                  </h3>
                </div>
              </div>
            </div>

            {/* Multiple Options Card */}
            <div className="group transform hover:scale-105 transition-all duration-300 md:col-span-2 lg:col-span-1">
              <div 
                className="rounded-3xl lg:rounded-[45px] overflow-hidden shadow-2xl aspect-square flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, #5FA9EC, #2196F3)',
                  boxShadow: '-20px 40px 70.9px -1px rgba(87, 159, 236, 0.25)'
                }}
              >
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mb-6">
                      <svg className="w-20 h-20 mx-auto text-white/90" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        <circle cx="8" cy="8" r="2"/>
                        <circle cx="16" cy="8" r="2"/>
                        <circle cx="12" cy="16" r="2"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-6 lg:p-8">
                  <h3 className="text-white font-jakarta font-bold text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-center">
                    Multiple Options
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative">
        {/* Footer bar with shadow */}
        <div className="w-full bg-gradient-to-r from-enrollmate-bg-start to-enrollmate-bg-end shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
              
              {/* Footer Links */}
              <nav className="flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 lg:gap-8">
                <a href="#" className="text-white font-jakarta font-bold text-lg sm:text-xl lg:text-2xl drop-shadow-lg hover:text-white/90 transition-colors">
                  About
                </a>
                <a href="#" className="text-white font-jakarta font-bold text-lg sm:text-xl lg:text-2xl drop-shadow-lg hover:text-white/90 transition-colors">
                  Contact
                </a>
                <a href="#" className="text-white font-jakarta font-bold text-lg sm:text-xl lg:text-2xl drop-shadow-lg hover:text-white/90 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-white font-jakarta font-bold text-lg sm:text-xl lg:text-2xl drop-shadow-lg hover:text-white/90 transition-colors">
                  Confirmation Information
                </a>
              </nav>

              {/* Social Icons */}
              <div className="flex items-center space-x-4">
                {/* Facebook */}
                <a href="#" className="text-white hover:text-white/80 transition-colors">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                
                {/* GitHub */}
                <a href="#" className="text-white hover:text-white/80 transition-colors">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                
                {/* Instagram */}
                <a href="#" className="text-white hover:text-white/80 transition-colors">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
