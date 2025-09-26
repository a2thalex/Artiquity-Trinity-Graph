import React, { useState, useCallback } from 'react';
import { Step, IdentityCapsule, CreativeOutput, SynchronicityResult } from '../types/artistCapsule';
import Step1Identity from './Step1Identity';
import Step2Creativity from './Step2Creativity';
import Step3Synchronicity from './Step3Synchronicity';
import StepIndicator from './StepIndicator';

interface ArtistCapsuleProps {
  onBack: () => void;
}

const ArtistCapsule: React.FC<ArtistCapsuleProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Identity);
  const [artistName, setArtistName] = useState<string>('');
  const [identityCapsule, setIdentityCapsule] = useState<IdentityCapsule | null>(null);
  const [selectedIdentityElements, setSelectedIdentityElements] = useState<string[]>([]);
  const [creativeOutput, setCreativeOutput] = useState<CreativeOutput | null>(null);
  const [synchronicityResult, setSynchronicityResult] = useState<SynchronicityResult | null>(null);

  const handleIdentityComplete = useCallback((name: string, capsule: IdentityCapsule, selectedElements: string[]) => {
    setArtistName(name);
    setIdentityCapsule(capsule);
    setSelectedIdentityElements(selectedElements);
    setCurrentStep(Step.Creativity);
  }, []);

  const handleCreativityComplete = useCallback((output: CreativeOutput) => {
    setCreativeOutput(output);
    setCurrentStep(Step.Synchronicity);
  }, []);

  const handleSynchronicityComplete = useCallback((result: SynchronicityResult) => {
    setSynchronicityResult(result);
  }, []);



  const restartProcess = () => {
    setCurrentStep(Step.Identity);
    setArtistName('');
    setIdentityCapsule(null);
    setSelectedIdentityElements([]);
    setCreativeOutput(null);
    setSynchronicityResult(null);
  };

  const renderStep = () => {
    switch (currentStep) {
      case Step.Identity:
        return <Step1Identity onComplete={handleIdentityComplete} />;
      case Step.Creativity:
        return (
          <Step2Creativity
            artistName={artistName}
            selectedIdentityElements={selectedIdentityElements}
            onComplete={handleCreativityComplete}
          />
        );
      case Step.Synchronicity:
        return (
          <Step3Synchronicity
            creativeOutput={creativeOutput}
            onComplete={handleSynchronicityComplete}
            result={synchronicityResult}
            onRestart={restartProcess}
            artistName={artistName}
            selectedIdentityElements={selectedIdentityElements}
          />
        );
      default:
        return <Step1Identity onComplete={handleIdentityComplete} />;
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen app-background">
      {/* Header with back button */}
      <header className="w-full py-4">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>
                Authenticity
              </h1>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <div className="relative min-h-screen w-full bg-gradient-to-br from-[#c1d9e9] to-[#9cb4c8] flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
            {currentStep === Step.Identity && !identityCapsule && (
               <div className="text-center mb-12 animate-fade-in">
                  <h1 className="text-6xl md:text-8xl font-bold text-[#f5f5dc] text-shadow-lg tracking-tight">The Artiquity</h1>
                  <h1 className="text-6xl md:text-8xl font-bold text-[#f5f5dc] text-shadow-lg tracking-tight">Trinity Graph</h1>
               </div>
            )}
            {currentStep !== Step.Identity || identityCapsule ? <StepIndicator currentStep={currentStep} /> : null}
            <div className="w-full transition-all duration-500">
              {renderStep()}
            </div>
          </div>
          <footer className="absolute bottom-5 left-5 text-xs text-white/60">
            {today}
          </footer>
           <div className="absolute bottom-4 inset-x-0 flex justify-center items-center text-sm text-white/70">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C7.383 0 3.633 4.31 3.633 9.645c0 2.84 1.252 5.518 3.515 7.42L3.5 24l7.65-3.375c.28.015.564.025.85.025 4.617 0 8.367-4.31 8.367-9.645C20.367 4.31 16.617 0 12 0z"/></svg>
              Inkwell
           </div>
          <footer className="absolute bottom-5 right-5 text-xs text-white/60">
            Confidential
          </footer>
        </div>
      </main>
    </div>
  );
};

export default ArtistCapsule;
