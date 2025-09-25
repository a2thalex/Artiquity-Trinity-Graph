
import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { HomeScreen } from './components/HomeScreen';
import TrinityGraph from './components/TrinityGraph';
import ArtistCapsule from './components/ArtistCapsule';
import ArtiquityLanding from './components/ArtiquityLanding';
import DataApp from './components/DataApp';


function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'home' | 'security' | 'trinity' | 'artistCapsule' | 'data'>('landing');

  const handleNavigate = (newView: 'landing' | 'home' | 'security' | 'trinity' | 'artistCapsule' | 'data') => {
    setCurrentView(newView);
  };

  if (currentView === 'landing') {
    return <ArtiquityLanding onEnter={() => handleNavigate('home')} />;
  }

  if (currentView === 'security') {
    return (
          <div className="min-h-screen flex flex-col items-center justify-start font-sans app-background">
        <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => handleNavigate('home')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Back to Home</span>
                </button>
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2" style={{ color: '#000000' }}>
                        Security
                    </h1>
                </div>
                <div className="w-32"></div> {/* Spacer for centering */}
            </div>
        </header>
            <main className="w-full flex-grow flex items-center justify-center p-4">
                <LandingPage onBack={() => handleNavigate('home')} />
            </main>
        <footer className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm" style={{ color: '#9CA3AF' }}>
            <div>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#9CA3AF' }}></div>
              <span>Inkwell</span>
            </div>
            <div>Confidential</div>
          </div>
        </footer>
      </div>
    );
  }

  if (currentView === 'trinity') {
    return <TrinityGraph onBack={() => handleNavigate('home')} />;
  }

  if (currentView === 'artistCapsule') {
    return <ArtistCapsule onBack={() => handleNavigate('home')} />;
  }

  if (currentView === 'data') {
    return <DataApp onBack={() => handleNavigate('home')} />;
  }

  return <HomeScreen onNavigateToSecurity={() => handleNavigate('security')} onNavigateToTrinity={() => handleNavigate('trinity')} onNavigateToArtistCapsule={() => handleNavigate('artistCapsule')} onNavigateToData={() => handleNavigate('data')} />;
}

export default App;
