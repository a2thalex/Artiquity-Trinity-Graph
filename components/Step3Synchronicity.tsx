import React, { useState, useEffect } from 'react';
import { generateSynchronicityDashboard } from '../services/artistCapsuleService';
import type { CreativeOutput, SynchronicityResult, TrendMatch, AudienceNode, FormatSuggestion } from '../types/artistCapsule';
import Card from './Card';
import Loader from './Loader';

interface Step3SynchronicityProps {
  creativeOutput: CreativeOutput | null;
  onComplete: (result: SynchronicityResult) => void;
  result: SynchronicityResult | null;
  onRestart: () => void;
}

// Modal component for displaying detailed information
const InfoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  type: 'trend' | 'audience' | 'format';
}> = ({ isOpen, onClose, title, content, type }) => {
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
            {content}
          </div>
          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
}) => {
  const [isLoading, setIsLoading] = useState(!result);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    type: 'trend' | 'audience' | 'format';
  }>({
    isOpen: false,
    title: '',
    content: '',
    type: 'trend'
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

  const openModal = (title: string, content: string, type: 'trend' | 'audience' | 'format') => {
    setModalState({
      isOpen: true,
      title,
      content,
      type
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
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
              className="px-8 py-3 bg-white/70 hover:bg-white/90 text-stone-800 font-bold rounded-xl transition-all duration-300"
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
              className="px-8 py-3 bg-white/70 hover:bg-white/90 text-stone-800 font-bold rounded-xl transition-all duration-300"
            >
              Start Over
            </button>
        </Card>
    );
  }
  
  const { dashboard, sources } = result;

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

       <div className="text-center pt-4">
            <button
              onClick={onRestart}
              className="px-10 py-4 bg-white/80 hover:bg-white text-stone-800 font-bold rounded-xl transition-all duration-300 text-lg"
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
        />
    </div>
  );
};

export default Step3Synchronicity;