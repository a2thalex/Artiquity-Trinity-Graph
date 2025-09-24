import React, { useState, useEffect } from 'react';
import { generateSynchronicityDashboard } from '../services/artistCapsuleService';
import type { CreativeOutput, SynchronicityResult } from '../types/artistCapsule';
import Card from './Card';
import Loader from './Loader';

interface Step3SynchronicityProps {
  creativeOutput: CreativeOutput | null;
  onComplete: (result: SynchronicityResult) => void;
  result: SynchronicityResult | null;
  onRestart: () => void;
}

const Step3Synchronicity: React.FC<Step3SynchronicityProps> = ({
  creativeOutput,
  onComplete,
  result,
  onRestart,
}) => {
  const [isLoading, setIsLoading] = useState(!result);
  const [error, setError] = useState<string | null>(null);

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
                        <div key={i} className="p-3 bg-white/30 rounded-lg">
                            <p className="font-bold text-stone-800">{match.name} <span className="text-sm font-normal text-sky-700 ml-2">{match.velocity}</span></p>
                            <p className="text-sm text-stone-600">{match.description}</p>
                        </div>
                    ))}
                </div>
            </Card>
            <Card>
                <h3 className="font-bold text-lg mb-3">Audience & Nodes</h3>
                {dashboard.audienceNodes.map((node, i) => (
                    <div key={i} className="mb-3">
                        <h4 className="font-semibold text-stone-800">{node.category}</h4>
                        <p className="text-sm text-stone-600">{node.items.join(', ')}</p>
                    </div>
                ))}
            </Card>
             <Card>
                <h3 className="font-bold text-lg mb-3">Format & Timing Suggestions</h3>
                 <div className="space-y-3">
                    {dashboard.formatSuggestions.map((suggestion, i) => (
                        <div key={i} className="p-3 bg-white/30 rounded-lg">
                            <p className="font-bold text-stone-800">{suggestion.idea}</p>
                            <p className="text-sm text-stone-600">{suggestion.timing}</p>
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
    </div>
  );
};

export default Step3Synchronicity;