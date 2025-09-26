import React, { useState, useCallback } from 'react';
import { Step, IdentityCapsule, CreativeOutput, SynchronicityResult } from '../types/artistCapsule';
import { ContextualCampaignResult } from '../types/trinity';
import { generateContextualCampaign } from '../services/geminiService';
import Step1Identity from './Step1Identity';
import Step2Creativity from './Step2Creativity';
import Step3Synchronicity from './Step3Synchronicity';
import Step4_Campaign from './Step4_Campaign';
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
  const [contextualCampaign, setContextualCampaign] = useState<ContextualCampaignResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    setCurrentStep(Step.Campaign);
  }, []);

  const handleGenerateContextualCampaign = useCallback(async () => {
    if (!synchronicityResult) return;

    setIsLoading(true);
    setError(null);

    try {
      const campaign = await generateContextualCampaign(
        artistName,
        synchronicityResult,
        selectedIdentityElements
      );
      setContextualCampaign(campaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate contextual campaign');
    } finally {
      setIsLoading(false);
    }
  }, [artistName, synchronicityResult, selectedIdentityElements]);

  const restartProcess = () => {
    setCurrentStep(Step.Identity);
    setArtistName('');
    setIdentityCapsule(null);
    setSelectedIdentityElements([]);
    setCreativeOutput(null);
    setSynchronicityResult(null);
    setContextualCampaign(null);
    setError(null);
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
          />
        );
      case Step.Campaign:
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                🎯 Contextual Campaign Generation
              </h2>
              <p className="text-gray-600 mb-6">
                Transform your authentic creative work into culturally-aware marketing campaigns
              </p>
            </div>

            {!contextualCampaign && !isLoading && (
              <div className="bg-white/90 rounded-xl p-8 shadow-lg text-center">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Generate Your Campaign?</h3>
                  <p className="text-gray-600">
                    Using your synchronicity analysis, we'll create targeted ad copy, social media plans,
                    influencer outreach templates, and platform-specific strategies.
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={restartProcess}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ← Start Over
                  </button>
                  <button
                    onClick={handleGenerateContextualCampaign}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors font-medium"
                  >
                    🎯 Generate Contextual Campaign
                  </button>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="bg-white/90 rounded-xl p-8 shadow-lg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating your contextual campaign...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={handleGenerateContextualCampaign}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {contextualCampaign && (
              <div className="space-y-6">
                {/* Campaign Success Header */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                  <h3 className="text-2xl font-bold text-emerald-800 mb-2">
                    ✅ Contextual Campaign Generated!
                  </h3>
                  <p className="text-emerald-700">
                    Your culturally-aware marketing campaign is ready. This campaign uses specialized AI prompts
                    to create authentic, audience-specific content that resonates with your target communities.
                  </p>
                </div>

                {/* Campaign Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ad Copy */}
                  {contextualCampaign.campaign.adCopy && Object.keys(contextualCampaign.campaign.adCopy).length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        📢 Targeted Ad Copy
                      </h4>
                      <div className="space-y-4">
                        {Object.entries(contextualCampaign.campaign.adCopy).slice(0, 2).map(([subculture, adData]: [string, any]) => (
                          <div key={subculture} className="border-l-4 border-emerald-400 pl-4">
                            <p className="font-medium text-emerald-700 mb-2">{subculture}</p>
                            {adData.variation_1 && (
                              <div className="text-sm text-gray-600">
                                <p className="font-medium mb-1">"{adData.variation_1.headline}"</p>
                                <p className="text-xs text-gray-500">{adData.variation_1.body.substring(0, 120)}...</p>
                                <p className="text-xs text-emerald-600 mt-1">CTA: {adData.variation_1.cta}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Plan */}
                  {contextualCampaign.campaign.socialPlan && Array.isArray(contextualCampaign.campaign.socialPlan) && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        📱 7-Day Social Plan
                      </h4>
                      <div className="space-y-3">
                        {contextualCampaign.campaign.socialPlan.slice(0, 3).map((day: any, index: number) => (
                          <div key={index} className="border-l-4 border-blue-400 pl-4">
                            <p className="font-medium text-blue-700">Day {day.day}: {day.platform}</p>
                            <p className="text-sm text-gray-600 mb-1">{day.theme}</p>
                            <p className="text-xs text-gray-500">{day.content_idea.substring(0, 100)}...</p>
                          </div>
                        ))}
                        <p className="text-xs text-gray-500 mt-2">+ {contextualCampaign.campaign.socialPlan.length - 3} more days</p>
                      </div>
                    </div>
                  )}

                  {/* Influencer Outreach */}
                  {contextualCampaign.campaign.outreachTemplates && Object.keys(contextualCampaign.campaign.outreachTemplates).length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        🤝 Influencer Outreach
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(contextualCampaign.campaign.outreachTemplates).slice(0, 2).map(([influencer, template]: [string, any]) => (
                          <div key={influencer} className="border-l-4 border-purple-400 pl-4">
                            <p className="font-medium text-purple-700 mb-1">{influencer}</p>
                            {template.subject && (
                              <p className="text-sm text-gray-600">"{template.subject}"</p>
                            )}
                            {template.body && (
                              <p className="text-xs text-gray-500 mt-1">{template.body.substring(0, 100)}...</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platform Strategies */}
                  {contextualCampaign.campaign.platformContent && Object.keys(contextualCampaign.campaign.platformContent).length > 0 && (
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        🌐 Platform Strategies
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(contextualCampaign.campaign.platformContent).slice(0, 2).map(([platform, strategy]: [string, any]) => (
                          <div key={platform} className="border-l-4 border-orange-400 pl-4">
                            <p className="font-medium text-orange-700 mb-1">{platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
                            {strategy.content_strategy && (
                              <p className="text-sm text-gray-600">{strategy.content_strategy.substring(0, 120)}...</p>
                            )}
                            {strategy.posting_frequency && (
                              <p className="text-xs text-gray-500 mt-1">Frequency: {strategy.posting_frequency}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center bg-white/90 rounded-xl p-6 shadow-lg">
                  <button
                    onClick={restartProcess}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ← Create New Campaign
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(contextualCampaign, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                        const exportFileDefaultName = `${artistName}-contextual-campaign-${Date.now()}.json`;
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', exportFileDefaultName);
                        linkElement.click();
                      }}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      📥 Export Campaign
                    </button>
                    <button
                      onClick={() => {
                        // In a real implementation, this would deploy to promote.fun or similar
                        alert('Campaign deployment feature coming soon! For now, use the export function to download your campaign data.');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors flex items-center gap-2"
                    >
                      🚀 Deploy Campaign
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
