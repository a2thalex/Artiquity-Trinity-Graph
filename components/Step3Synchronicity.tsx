import React, { useState, useEffect, useCallback } from 'react';
import { generateSynchronicityDashboard } from '../services/artistCapsuleService';
import { generateContextualCampaign } from '../services/geminiService';
import type { CreativeOutput, SynchronicityResult, TrendMatch, AudienceNode, FormatSuggestion } from '../types/artistCapsule';
import type { ContextualCampaignResult } from '../types/trinity';
import Card from './Card';
import Loader from './Loader';

interface Step3SynchronicityProps {
  creativeOutput: CreativeOutput | null;
  onComplete: (result: SynchronicityResult) => void;
  result: SynchronicityResult | null;
  onRestart: () => void;
  artistName: string;
  selectedIdentityElements: string[];
}

// Modal component for displaying detailed information
const InfoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  type: 'trend' | 'audience' | 'format';
  isLoading: boolean;
  sources: Array<{title: string, url: string, snippet: string}>;
}> = ({ isOpen, onClose, title, content, type, isLoading, sources }) => {
  if (!isOpen) return null;

  const getTypeColor = () => {
    switch (type) {
      case 'trend': return 'border-blue-500 bg-blue-50';
      case 'audience': return 'border-green-500 bg-green-50';
      case 'format': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 ${getTypeColor()}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Searching for real-world insights...</span>
              </div>
            ) : (
              content
            )}
          </div>

          {!isLoading && sources.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Sources:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sources.map((source, index) => (
                  <div key={index} className="text-sm">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {source.title}
                    </a>
                    {source.snippet && (
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{source.snippet}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Step3Synchronicity: React.FC<Step3SynchronicityProps> = ({
  creativeOutput,
  onComplete,
  result,
  onRestart,
  artistName,
  selectedIdentityElements,
}) => {
  const [isLoading, setIsLoading] = useState(!result);
  const [error, setError] = useState<string | null>(null);
  const [contextualCampaign, setContextualCampaign] = useState<ContextualCampaignResult | null>(null);
  const [isCampaignLoading, setIsCampaignLoading] = useState<boolean>(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    type: 'trend' | 'audience' | 'format';
    isLoading: boolean;
    sources: Array<{title: string, url: string, snippet: string}>;
  }>({
    isOpen: false,
    title: '',
    content: '',
    type: 'trend',
    isLoading: false,
    sources: []
  });

  useEffect(() => {
    if (!result && creativeOutput) {
      const generateDashboard = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const resultData = await generateSynchronicityDashboard(creativeOutput);
          onComplete(resultData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
          setIsLoading(false);
        }
      };
      generateDashboard();
    }
  }, [creativeOutput, onComplete, result]);

  const handleGenerateContextualCampaign = useCallback(async () => {
    if (!result) return;

    setIsCampaignLoading(true);
    setCampaignError(null);

    try {
      const campaign = await generateContextualCampaign(
        artistName,
        result,
        selectedIdentityElements
      );
      setContextualCampaign(campaign);
    } catch (err) {
      setCampaignError(err instanceof Error ? err.message : 'Failed to generate contextual campaign');
    } finally {
      setIsCampaignLoading(false);
    }
  }, [artistName, result, selectedIdentityElements]);

  const openModal = async (title: string, staticContent: string, type: 'trend' | 'audience' | 'format') => {
    // Open modal immediately with loading state
    setModalState({
      isOpen: true,
      title,
      content: 'Loading real-world insights...',
      type,
      isLoading: true,
      sources: []
    });

    try {
      // Fetch real insights from web search
      const response = await fetch('/api/gemini/search-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: title,
          type: type,
          context: staticContent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();

      // Update modal with real data
      setModalState(prev => ({
        ...prev,
        content: data.insights,
        isLoading: false,
        sources: data.sources || []
      }));

    } catch (error) {
      console.error('Error fetching insights:', error);
      // Fallback to static content if search fails
      setModalState(prev => ({
        ...prev,
        content: staticContent + '\n\n*Note: Unable to fetch current web data. Showing general insights.*',
        isLoading: false,
        sources: []
      }));
    }
  };

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
      sources: []
    }));
  };

  const getTrendDetails = (match: TrendMatch) => {
    return `**Trend Name:** ${match.name}\n\n**Velocity:** ${match.velocity}\n\n**Description:** ${match.description}\n\n**Strategic Insights:**\n• This trend represents a significant cultural shift that aligns with your creative output\n• The velocity indicator shows how quickly this trend is gaining momentum\n• Consider how your artwork can tap into this cultural moment for maximum impact\n\n**Implementation Tips:**\n• Create content that speaks to this trend's core themes\n• Engage with communities already discussing this trend\n• Time your releases to coincide with peak trend activity`;
  };

  const getAudienceDetails = (node: AudienceNode) => {
    return `**Category:** ${node.category}\n\n**Target Audience:**\n${node.items.map(item => `• ${item}`).join('\n')}\n\n**Strategic Insights:**\n• These are the key communities and influencers who can amplify your work\n• Each audience node represents a different pathway to cultural relevance\n• Consider creating tailored content for each specific audience segment\n\n**Engagement Strategy:**\n• Research the specific platforms and communities mentioned\n• Understand the unique culture and language of each audience\n• Create content that resonates with their specific interests and values`;
  };

  const getFormatDetails = (suggestion: FormatSuggestion) => {
    return `**Creative Idea:** ${suggestion.idea}\n\n**Timing:** ${suggestion.timing}\n\n**Strategic Insights:**\n• This format suggestion is specifically tailored to maximize cultural impact\n• The timing recommendation considers current cultural moments and audience availability\n• The format leverages proven engagement patterns and platform capabilities\n\n**Implementation Guide:**\n• Break down the idea into actionable steps\n• Research similar successful campaigns in this format\n• Prepare content that can be adapted across multiple platforms\n• Set up tracking to measure success against this format's typical performance metrics`;
  };

  if (isLoading) {
    return <Loader message={`Scanning cultural signals...`} />;
  }

  if (error) {
    return (
        <Card className="text-center">
            <h2 className="text-2xl font-bold text-red-700 mb-2">Error Generating Dashboard</h2>
            <p className="text-stone-600 mb-4">{error}</p>
            <button
              onClick={onRestart}
              className="px-8 py-3 text-white font-bold rounded-xl transition-all duration-300 hover:opacity-90" style={{ backgroundColor: '#6B7280' }}
            >
              Start Over
            </button>
        </Card>
    );
  }

  if (!result || !creativeOutput) {
    return (
        <Card className="text-center">
             <p className="text-stone-600 mb-4">Could not load dashboard. Please try again.</p>
             <button
              onClick={onRestart}
              className="px-8 py-3 text-white font-bold rounded-xl transition-all duration-300 hover:opacity-90" style={{ backgroundColor: '#6B7280' }}
            >
              Start Over
            </button>
        </Card>
    );
  }
  
  const { dashboard, sources } = result;

  // Defensive check to ensure dashboard has the expected structure
  if (!dashboard || !dashboard.trendMatches || !dashboard.audienceNodes || !dashboard.formatSuggestions) {
    return (
        <Card className="text-center">
             <p className="text-stone-600 mb-4">Dashboard data is incomplete. Please try regenerating.</p>
             <button
              onClick={onRestart}
              className="px-8 py-3 text-white font-bold rounded-xl transition-all duration-300 hover:opacity-90" style={{ backgroundColor: '#6B7280' }}
            >
              Start Over
            </button>
        </Card>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white text-shadow-md">Synchronicity Dashboard</h2>
        <p className="text-white/80 mt-2 max-w-3xl mx-auto">
          Your new work is ready. Here’s how to launch it into culture.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Artwork */}
        <div className="lg:col-span-1 space-y-4">
            <Card>
                <img src={creativeOutput.imageUrl} alt="Generated artwork" className="rounded-lg shadow-md w-full aspect-square object-cover" />
            </Card>
             <Card>
                <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Generated Prompt</h4>
                <p className="text-stone-700 leading-relaxed italic text-sm mt-1">{creativeOutput.prompt}</p>
            </Card>
        </div>

        {/* Right Column: Dashboard Panels */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <h3 className="font-bold text-lg mb-3">Trend Match</h3>
                <div className="space-y-3">
                    {dashboard.trendMatches.map((match, i) => (
                        <div 
                            key={i} 
                            className="p-3 bg-white/30 rounded-lg cursor-pointer hover:bg-white/40 transition-colors duration-200 border-2 border-transparent hover:border-blue-300"
                            onClick={() => openModal(match.name, getTrendDetails(match), 'trend')}
                        >
                            <p className="font-bold text-stone-800">{match.name} <span className="text-sm font-normal text-sky-700 ml-2">{match.velocity}</span></p>
                            <p className="text-sm text-stone-600">{match.description}</p>
                            <p className="text-xs text-blue-600 mt-2 font-medium">Click for detailed insights →</p>
                        </div>
                    ))}
                </div>
            </Card>
            <Card>
                <h3 className="font-bold text-lg mb-3">Audience & Nodes</h3>
                {dashboard.audienceNodes.map((node, i) => (
                    <div 
                        key={i} 
                        className="mb-3 p-3 bg-white/30 rounded-lg cursor-pointer hover:bg-white/40 transition-colors duration-200 border-2 border-transparent hover:border-green-300"
                        onClick={() => openModal(node.category, getAudienceDetails(node), 'audience')}
                    >
                        <h4 className="font-semibold text-stone-800">{node.category}</h4>
                        <p className="text-sm text-stone-600">{node.items.join(', ')}</p>
                        <p className="text-xs text-green-600 mt-2 font-medium">Click for audience insights →</p>
                    </div>
                ))}
            </Card>
             <Card>
                <h3 className="font-bold text-lg mb-3">Format & Timing Suggestions</h3>
                 <div className="space-y-3">
                    {dashboard.formatSuggestions.map((suggestion, i) => (
                        <div 
                            key={i} 
                            className="p-3 bg-white/30 rounded-lg cursor-pointer hover:bg-white/40 transition-colors duration-200 border-2 border-transparent hover:border-purple-300"
                            onClick={() => openModal(suggestion.idea, getFormatDetails(suggestion), 'format')}
                        >
                            <p className="font-bold text-stone-800">{suggestion.idea}</p>
                            <p className="text-sm text-stone-600">{suggestion.timing}</p>
                            <p className="text-xs text-purple-600 mt-2 font-medium">Click for format insights →</p>
                        </div>
                    ))}
                </div>
            </Card>
            {/* Mocked Panels */}
            <Card className="opacity-70">
                <h3 className="font-bold text-lg mb-2">Licensing & Monetization (RSL)</h3>
                <p className="text-sm text-stone-600">Attach rule-aligned licenses to enable safe sharing and monetization. (Feature in development)</p>
            </Card>
             <Card className="opacity-70">
                <h3 className="font-bold text-lg mb-2">Feedback Loop</h3>
                <p className="text-sm text-stone-600">Track engagement metrics post-launch to refine future creative generations. (Feature in development)</p>
            </Card>
             {sources.length > 0 && (
                <Card>
                    <h3 className="font-bold text-lg mb-3">Data Sources</h3>
                    <ul className="space-y-1 text-sm">
                        {sources.map((source, i) =>(
                            <li key={i}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline truncate block">
                                    {source.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </div>
      </div>

      {/* Contextual Campaign Generation Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">🎯 Deep Research & Campaign Generation</h3>
          <p className="text-white/80">
            Transform your synchronicity analysis into culturally-aware marketing campaigns with specialized AI prompts
          </p>
        </div>

        {!contextualCampaign && !isCampaignLoading && (
          <div className="text-center">
            <button
              onClick={handleGenerateContextualCampaign}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-bold text-lg shadow-lg"
            >
              🎯 Generate Contextual Campaign
            </button>
          </div>
        )}

        {isCampaignLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-white/80">Generating your contextual campaign...</p>
          </div>
        )}

        {campaignError && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mb-4">
            <p className="text-red-200">{campaignError}</p>
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
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-400/50">
              <h4 className="text-xl font-bold text-emerald-200 mb-2">
                ✅ Contextual Campaign Generated!
              </h4>
              <p className="text-emerald-100/80">
                Your culturally-aware marketing campaign is ready with specialized AI-generated content for each target audience.
              </p>
            </div>

            {/* Campaign Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ad Copy */}
              {contextualCampaign.campaign.adCopy && Object.keys(contextualCampaign.campaign.adCopy).length > 0 && (
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <h5 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                    📢 Targeted Ad Copy
                  </h5>
                  <div className="space-y-3">
                    {Object.entries(contextualCampaign.campaign.adCopy).slice(0, 2).map(([subculture, adData]: [string, any]) => (
                      <div key={subculture} className="border-l-4 border-emerald-400 pl-3">
                        <p className="font-medium text-emerald-300 mb-1">{subculture}</p>
                        {adData.variation_1 && (
                          <div className="text-sm text-white/70">
                            <p className="font-medium mb-1">"{adData.variation_1.headline}"</p>
                            <p className="text-xs text-white/50">{adData.variation_1.body.substring(0, 100)}...</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Plan */}
              {contextualCampaign.campaign.socialPlan && Array.isArray(contextualCampaign.campaign.socialPlan) && (
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <h5 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                    📱 7-Day Social Plan
                  </h5>
                  <div className="space-y-2">
                    {contextualCampaign.campaign.socialPlan.slice(0, 3).map((day: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-400 pl-3">
                        <p className="font-medium text-blue-300">Day {day.day}: {day.platform}</p>
                        <p className="text-sm text-white/70">{day.theme}</p>
                        <p className="text-xs text-white/50">{day.content_idea.substring(0, 80)}...</p>
                      </div>
                    ))}
                    <p className="text-xs text-white/50 mt-2">+ {contextualCampaign.campaign.socialPlan.length - 3} more days</p>
                  </div>
                </div>
              )}

              {/* Influencer Outreach */}
              {contextualCampaign.campaign.outreachTemplates && Object.keys(contextualCampaign.campaign.outreachTemplates).length > 0 && (
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <h5 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                    🤝 Influencer Outreach
                  </h5>
                  <div className="space-y-2">
                    {Object.entries(contextualCampaign.campaign.outreachTemplates).slice(0, 2).map(([influencer, template]: [string, any]) => (
                      <div key={influencer} className="border-l-4 border-purple-400 pl-3">
                        <p className="font-medium text-purple-300">{influencer}</p>
                        {template.subject && (
                          <p className="text-sm text-white/70">"{template.subject}"</p>
                        )}
                        {template.body && (
                          <p className="text-xs text-white/50">{template.body.substring(0, 80)}...</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Strategies */}
              {contextualCampaign.campaign.platformContent && Object.keys(contextualCampaign.campaign.platformContent).length > 0 && (
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <h5 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
                    🌐 Platform Strategies
                  </h5>
                  <div className="space-y-2">
                    {Object.entries(contextualCampaign.campaign.platformContent).slice(0, 2).map(([platform, strategy]: [string, any]) => (
                      <div key={platform} className="border-l-4 border-orange-400 pl-3">
                        <p className="font-medium text-orange-300">{platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
                        {strategy.content_strategy && (
                          <p className="text-sm text-white/70">{strategy.content_strategy.substring(0, 100)}...</p>
                        )}
                        {strategy.posting_frequency && (
                          <p className="text-xs text-white/50">Frequency: {strategy.posting_frequency}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
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
                className="px-6 py-3 bg-gray-600/80 text-white rounded-lg hover:bg-gray-700/80 transition-colors flex items-center gap-2"
              >
                📥 Export Campaign
              </button>
              <button
                onClick={() => {
                  alert('Campaign deployment feature coming soon! For now, use the export function to download your campaign data.');
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors flex items-center gap-2"
              >
                🚀 Deploy Campaign
              </button>
            </div>
          </div>
        )}
      </div>

       <div className="text-center pt-4">
            <button
              onClick={onRestart}
              className="px-10 py-4 text-white font-bold rounded-xl transition-all duration-300 text-lg hover:opacity-90" style={{ backgroundColor: '#6B7280' }}
            >
              Create Another
            </button>
        </div>

        {/* Info Modal */}
        <InfoModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalState.title}
          content={modalState.content}
          type={modalState.type}
          isLoading={modalState.isLoading}
          sources={modalState.sources}
        />
    </div>
  );
};

export default Step3Synchronicity;