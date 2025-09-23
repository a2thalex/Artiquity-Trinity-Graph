
import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';

// Marketing Landing Page Component
const MarketingLandingPage: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8F0FE' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50" style={{ backgroundColor: 'rgba(232, 240, 254, 0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-10 py-5 border-b" style={{ borderColor: 'rgba(107, 114, 128, 0.2)' }}>
          <nav className="flex justify-between items-center">
            <div className="text-2xl font-bold" style={{ color: '#000000' }}>Security</div>
            <div className="text-lg" style={{ color: '#000000' }}>Inkwell</div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative pt-24">
        <div className="max-w-7xl mx-auto px-10">
          <div className="max-w-4xl z-10 relative">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm mb-8" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', border: '1px solid rgba(107, 114, 128, 0.2)', color: '#374151' }}>
              🛡️ AI-Powered Content Protection
            </div>
            
            <h1 className="text-6xl md:text-8xl font-extrabold leading-tight mb-8 tracking-tight" style={{ color: '#000000' }}>
              Content <span style={{ color: '#DC2626' }}>Security</span><br />
              for the AI Era
            </h1>
            
            <p className="text-2xl mb-10 leading-relaxed" style={{ color: 'rgba(55, 65, 81, 0.8)' }}>
              Protect your digital assets with invisible RSL metadata licensing
            </p>
            
            <p className="text-lg mb-12 leading-relaxed" style={{ color: 'rgba(55, 65, 81, 0.6)' }}>
              Upload any file, choose your licensing terms, and get back your content with embedded RSL metadata that AI systems can understand and respect. Your work, your rules, your revenue.
            </p>
            
            <button 
              onClick={onGetStarted}
              className="inline-flex items-center gap-3 px-9 py-5 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
              style={{ backgroundColor: '#6B7280' }}
            >
              <span>Get Started</span>
              <span>→</span>
            </button>
            
            <div className="mt-10 text-sm" style={{ color: 'rgba(55, 65, 81, 0.5)' }}>
              An <span style={{ color: '#6B7280', fontWeight: '600' }}>Inkwell AI</span> Product
            </div>
          </div>
        </div>

        {/* Floating Art Carousels */}
        <div className="absolute top-0 right-0 w-2/5 h-screen overflow-hidden z-0">
          <div className="absolute w-44 h-screen" style={{ right: '200px', top: '-100px' }}>
            <div className="flex flex-col gap-5 animate-bounce" style={{ animation: 'float-vertical 20s linear infinite' }}>
              {['🎨', '📸', '🎵', '📱', '🎬'].map((icon, i) => (
                <div key={i} className="min-h-48 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:scale-105" style={{ backgroundColor: 'rgba(107, 114, 128, 0.02)', border: '1px solid rgba(107, 114, 128, 0.05)' }}>
                  <div className="text-center z-10">
                    <div className="text-5xl mb-2 opacity-30">{icon}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute top-0 right-0 w-1/3 h-full z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(232, 240, 254, 0.3) 0%, rgba(232, 240, 254, 0.1) 50%, transparent 100%)' }}></div>
      </section>

      {/* Features Section */}
      <section className="py-24" style={{ background: 'linear-gradient(180deg, #E8F0FE 0%, #F3F4F6 100%)' }}>
        <div className="max-w-7xl mx-auto px-10">
          <h2 className="text-5xl font-extrabold text-center mb-5" style={{ color: '#000000' }}>How It Works</h2>
          <p className="text-lg text-center mb-20 max-w-2xl mx-auto" style={{ color: 'rgba(55, 65, 81, 0.7)' }}>
            Three simple steps to protect your content with RSL metadata licensing
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white rounded-2xl p-10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ border: '1px solid rgba(107, 114, 128, 0.2)' }}>
              <div className="text-6xl mb-5 opacity-90">📤</div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Upload Any File</h3>
              <p style={{ color: 'rgba(55, 65, 81, 0.7)' }}>Upload images, videos, documents, audio, or any digital content. Our platform supports all file formats with intelligent metadata embedding.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ border: '1px solid rgba(107, 114, 128, 0.2)' }}>
              <div className="text-6xl mb-5 opacity-90">⚙️</div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Choose Your Terms</h3>
              <p style={{ color: 'rgba(55, 65, 81, 0.7)' }}>Select licensing permissions, usage rights, payment models, and restrictions. From blocking AI training to enabling fair-use licensing.</p>
            </div>
            
            <div className="bg-white rounded-2xl p-10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ border: '1px solid rgba(107, 114, 128, 0.2)' }}>
              <div className="text-6xl mb-5 opacity-90">🛡️</div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#000000' }}>Get Protected Content</h3>
              <p style={{ color: 'rgba(55, 65, 81, 0.7)' }}>Download your files with invisible RSL metadata embedded. AI systems and crawlers can now understand and respect your licensing terms.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-10 py-6">
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
};

// Main App Component
function App() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start font-sans" style={{ backgroundColor: '#E8F0FE' }}>
        <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#000000' }}>
                    Security
                </h1>
            </div>
        </header>
        <main className="w-full flex-grow flex items-center justify-center p-4">
            <LandingPage />
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

  return <MarketingLandingPage onGetStarted={() => setShowApp(true)} />;
}

export default App;
