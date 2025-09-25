import React, { useState } from 'react';

type Tab = 'security' | 'capsule' | 'branding' | 'data';

interface HomeScreenProps {
  onNavigateToSecurity: () => void;
  onNavigateToTrinity: () => void;
  onNavigateToArtistCapsule: () => void;
  onNavigateToData: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToSecurity, onNavigateToTrinity, onNavigateToArtistCapsule, onNavigateToData }) => {
  const [activeTab, setActiveTab] = useState<Tab>('security');

  const tabs = [
    { id: 'security' as Tab, label: 'Security', description: 'Content Protection & RSL Licensing' },
    { id: 'capsule' as Tab, label: 'Authenticity', description: 'AI-Powered Artist Development' },
    { id: 'branding' as Tab, label: 'Centricity', description: 'Brand Intelligence & Creative Strategy' },
    { id: 'data' as Tab, label: 'Equivocity', description: 'Intelligent Data Marketplace' }
  ];

  const handleTabClick = (tabId: Tab) => {
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen app-background">
      {/* Header */}
      <header className="w-full py-8">
        <div className="max-w-7xl mx-auto px-10">
          <div className="text-center">
            <h1 className="text-8xl md:text-9xl font-extrabold leading-tight mb-4 tracking-tight" style={{ color: '#000000' }}>
              Artiquity
            </h1>
            <h2 className="text-3xl md:text-4xl font-light mb-8" style={{ color: '#6B7280' }}>
              Inkwell
            </h2>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="w-full">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex justify-center space-x-1 bg-white rounded-2xl p-2 shadow-lg" style={{ border: '1px solid rgba(107, 114, 128, 0.2)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex-1 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? '#6B7280' : 'transparent'
                }}
              >
                <div className="text-center">
                  <div className="font-bold">{tab.label}</div>
                  <div className="text-sm font-normal opacity-80 mt-1">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 py-16">
        <div className="max-w-7xl mx-auto px-10">
          {activeTab === 'security' && (
            <div className="text-center">
              <div className="inline-flex items-center px-6 py-3 rounded-full text-lg mb-8" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', border: '1px solid rgba(107, 114, 128, 0.2)', color: '#374151' }}>
                🛡️ AI-Powered Content Protection
              </div>
              
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-8 tracking-tight" style={{ color: '#000000' }}>
                Content <span style={{ color: '#DC2626' }}>Security</span><br />
                for the AI Era
              </h2>
              
              <p className="text-xl mb-10 leading-relaxed max-w-3xl mx-auto" style={{ color: 'rgba(55, 65, 81, 0.8)' }}>
                Protect your digital assets with invisible RSL metadata licensing. Upload any file, choose your licensing terms, and get back your content with embedded RSL metadata that AI systems can understand and respect.
              </p>
              
              <button 
                onClick={onNavigateToSecurity}
                className="inline-flex items-center gap-3 px-9 py-5 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
                style={{ backgroundColor: '#6B7280' }}
              >
                <span>Begin</span>
                <span>→</span>
              </button>
            </div>
          )}

          {activeTab === 'capsule' && (
            <div className="text-center">
              <div className="inline-flex items-center px-6 py-3 rounded-full text-lg mb-8" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', border: '1px solid rgba(107, 114, 128, 0.2)', color: '#374151' }}>
                🎨 AI-Powered Artist Development
              </div>
              
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-8 tracking-tight" style={{ color: '#000000' }}>
                Artist <span style={{ color: '#DC2626' }}>Authenticity</span><br />
                Trinity Graph
              </h2>
              
              <p className="text-xl mb-10 leading-relaxed max-w-3xl mx-auto" style={{ color: 'rgba(55, 65, 81, 0.8)' }}>
                Discover your artistic identity, generate creative expressions, and analyze cultural trends with AI-powered insights. Build a comprehensive artistic strategy through our three-step Trinity Graph methodology.
              </p>
              
              <button 
                onClick={onNavigateToArtistCapsule}
                className="inline-flex items-center gap-3 px-9 py-5 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
                style={{ backgroundColor: '#6B7280' }}
              >
                <span>Begin</span>
                <span>→</span>
              </button>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="text-center">
              <div className="inline-flex items-center px-6 py-3 rounded-full text-lg mb-8" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', border: '1px solid rgba(107, 114, 128, 0.2)', color: '#374151' }}>
                📊 AI-Powered Brand Intelligence
              </div>
              
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-8 tracking-tight" style={{ color: '#000000' }}>
                Trinity <span style={{ color: '#DC2626' }}>Graph</span><br />
                Brand Strategy
              </h2>
              
              <p className="text-xl mb-10 leading-relaxed max-w-3xl mx-auto" style={{ color: 'rgba(55, 65, 81, 0.8)' }}>
                Discover your brand's identity, generate creative expressions, and analyze cultural trends with AI-powered insights. Build a comprehensive brand strategy through our three-step Trinity Graph methodology.
              </p>
              
              <button 
                onClick={onNavigateToTrinity}
                className="inline-flex items-center gap-3 px-9 py-5 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
                style={{ backgroundColor: '#6B7280' }}
              >
                <span>Begin</span>
                <span>→</span>
              </button>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="text-center">
              <div className="inline-flex items-center px-6 py-3 rounded-full text-lg mb-8" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', border: '1px solid rgba(107, 114, 128, 0.2)', color: '#374151' }}>
                🎯 AI-Powered Data Marketplace
              </div>
              
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-8 tracking-tight" style={{ color: '#000000' }}>
                <span style={{ color: '#DC2626' }}>Equivocity</span><br />
                Data Intelligence
              </h2>
              
              <p className="text-xl mb-10 leading-relaxed max-w-3xl mx-auto" style={{ color: 'rgba(55, 65, 81, 0.8)' }}>
                Find and license organized, high-quality data from artists for your AI company. Generate creative identity capsules, refine data profiles, and get comprehensive dataset previews with AI-powered insights.
              </p>
              
              <button 
                onClick={onNavigateToData}
                className="inline-flex items-center gap-3 px-9 py-5 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
                style={{ backgroundColor: '#6B7280' }}
              >
                <span>Begin</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      </main>

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
