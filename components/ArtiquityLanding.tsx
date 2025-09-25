import React, { useState, useEffect } from 'react';

interface ArtiquityLandingProps {
  onEnter: () => void;
}

const ArtiquityLanding: React.FC<ArtiquityLandingProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Trigger animations on mount
    const timer1 = setTimeout(() => setIsLoaded(true), 300);
    const timer2 = setTimeout(() => setShowSubtitle(true), 800);
    const timer3 = setTimeout(() => setShowButton(true), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E8F0FE] via-[#F3F4F6] to-[#E5E7EB] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200/30 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gray-300/30 rounded-full animate-float-reverse"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-blue-100/40 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-10 w-12 h-12 bg-gray-200/40 rounded-full animate-float-reverse"></div>
        
        {/* Additional floating elements */}
        <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-blue-300/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-14 h-14 bg-gray-400/20 rounded-full animate-float-reverse" style={{ animationDelay: '4s' }}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6">
        {/* Main Title with Animation */}
        <div className="mb-8">
          <h1 
            className={`text-8xl md:text-9xl lg:text-[12rem] font-extrabold tracking-tight transition-all duration-1000 ease-out ${
              isLoaded 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-8'
            }`}
            style={{ 
              color: '#000000',
              textShadow: '0 4px 8px rgba(0,0,0,0.1)',
              letterSpacing: '-0.02em'
            }}
          >
            Artiquity
          </h1>
        </div>

        {/* Subtitle with Staggered Animation */}
        <div className="mb-12">
          <p 
            className={`text-xl md:text-2xl lg:text-3xl font-light transition-all duration-800 ease-out delay-300 ${
              showSubtitle 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-4'
            }`}
            style={{ color: '#6B7280' }}
          >
            The Future of Creative Intelligence
          </p>
        </div>

        {/* Animated Button */}
        <div className="mb-16">
          <button
            onClick={onEnter}
            className={`group relative inline-flex items-center gap-4 px-12 py-6 rounded-full text-xl font-semibold text-white transition-all duration-700 ease-out transform overflow-hidden ${
              showButton 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 translate-y-4'
            } hover:scale-105 hover:shadow-2xl active:scale-95`}
            style={{ 
              backgroundColor: '#6B7280',
              boxShadow: '0 8px 32px rgba(107, 114, 128, 0.3)'
            }}
          >
            <span className="relative z-10">Enter Platform</span>
            <div className="relative z-10 w-6 h-6 transition-transform duration-300 group-hover:translate-x-1">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            
            {/* Button glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Feature Highlights with Animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: '🛡️', title: 'Content Protection', description: 'AI-Powered RSL Licensing' },
            { icon: '🎨', title: 'Artist Development', description: 'Trinity Graph Intelligence' },
            { icon: '📊', title: 'Brand Strategy', description: 'Cultural Trend Analysis' }
          ].map((feature, index) => (
            <div
              key={index}
              className={`text-center transition-all duration-600 ease-out ${
                showButton 
                  ? 'opacity-100 transform translate-y-0' 
                  : 'opacity-0 transform translate-y-6'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <span>Inkwell</span>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <span>Confidential</span>
        </div>
      </div>
    </div>
  );
};

export default ArtiquityLanding;
