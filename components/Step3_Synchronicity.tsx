import React, { useState } from 'react';
import type { SynchronicityResult } from '../types/trinity';
import { generateSamples, generateVisionBoard } from '../services/geminiService';

interface Step3SynchronicityProps {
    brandName: string;
    results: SynchronicityResult[] | null;
    handleRestart: () => void;
}

const StepHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="text-center mb-8 md:mb-12 animate-fade-in-down">
        <h1 className="text-5xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="max-w-3xl mx-auto text-slate-600">{description}</p>
    </div>
);

// Helper component to format text with a bolded title before a colon.
const FormattedPillContent: React.FC<{ text: string }> = ({ text }) => {
    const cleanedText = text.replace(/\*/g, '');
    const parts = cleanedText.split(/:(.*)/s); // Split on the first colon, 's' flag for multiline
    if (parts.length > 1 && parts[1] && parts[1].trim()) {
        return (
            <span>
                <span className="font-semibold">{parts[0]}</span>
                <span>:{parts[1]}</span>
            </span>
        );
    }
    return <span className="font-semibold">{cleanedText}</span>;
};

const InteractiveCategory: React.FC<{
    idea: string;
    brandName: string;
    categoryTitle: 'influencer' | 'activation';
    items: string[];
}> = ({ idea, brandName, categoryTitle, items }) => {
    const [samples, setSamples] = useState<Record<string, string[]>>({});
    const [loadingSamples, setLoadingSamples] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    const handleGenerateSamples = async (item: string) => {
        const key = `${categoryTitle}-${item}`;
        setLoadingSamples(prev => ({ ...prev, [key]: true }));
        setError(null);

        try {
            const result = await generateSamples(brandName, idea, categoryTitle, item);
            setSamples(prev => ({ ...prev, [key]: result }));
        } catch (e) {
            console.error(e);
            setError(`Could not generate samples for "${item}". Please try again.`);
        } finally {
            setLoadingSamples(prev => ({ ...prev, [key]: false }));
        }
    };

    const formattedTitle = categoryTitle === 'influencer' ? 'Influencer & Node ID' : 'Activation Concepts';

    return (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
            <h3 className="text-xl font-bold text-brand-text mb-4">{formattedTitle}</h3>
            {error && <p className="text-xs text-red-600 bg-red-100 p-2 rounded-md mb-2">{error}</p>}
            <div className="space-y-3 flex-grow">
                {items.map((item, index) => {
                    const key = `${categoryTitle}-${item}`;
                    const isLoading = loadingSamples[key];
                    const generatedSamples = samples[key];

                    return (
                        <div key={index} className="bg-white/50 backdrop-blur-sm rounded-lg p-3 transition-shadow hover:shadow-md">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-brand-text/90">
                                   <FormattedPillContent text={item} />
                                </p>
                                {!generatedSamples && (
                                    <button
                                        onClick={() => handleGenerateSamples(item)}
                                        disabled={isLoading}
                                        className="text-xs bg-brand-primary/80 text-white px-2 py-1 rounded-md hover:bg-brand-primary disabled:bg-gray-400 disabled:cursor-wait flex-shrink-0 ml-2"
                                    >
                                        {isLoading ? 'Generating...' : 'Generate Samples'}
                                    </button>
                                )}
                            </div>
                            {generatedSamples && (
                                <ul className="mt-2 pl-4 border-l-2 border-brand-primary/30 space-y-1">
                                    {generatedSamples.map((sample, s_idx) => (
                                        <li key={s_idx} className="text-xs text-brand-text/80 list-disc list-inside">{sample.replace(/\*/g, '')}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const StaticCategoryCard: React.FC<{title: string, items: string[]}> = ({ title, items }) => {
     const formattedTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
            <h3 className="text-xl font-bold text-brand-text">{formattedTitle}</h3>
            <div className="flex flex-wrap gap-2 mt-4">
                 {items.map((item, index) => (
                    <div key={index} className="bg-white/60 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-brand-text shadow-sm">
                        <FormattedPillContent text={item} />
                    </div>
                ))}
            </div>
        </div>
    )
}

const Step3_Synchronicity: React.FC<Step3SynchronicityProps> = ({ brandName, results, handleRestart }) => {
    const [visionBoards, setVisionBoards] = useState<Record<string, string | null>>({});
    const [loadingVisionBoard, setLoadingVisionBoard] = useState<string | null>(null);
    const [visionBoardError, setVisionBoardError] = useState<string | null>(null);
    const [visibleSources, setVisibleSources] = useState<Record<number, boolean>>({});

    const toggleSources = (index: number) => {
        setVisibleSources(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleGenerateVisionBoard = async (idea: string) => {
        setLoadingVisionBoard(idea);
        setVisionBoardError(null);
        try {
            const imageUrl = await generateVisionBoard(brandName, idea);
            setVisionBoards(prev => ({ ...prev, [idea]: imageUrl }));
        } catch (e) {
            console.error(e);
            setVisionBoardError("Sorry, the vision board could not be created at this time.");
        } finally {
            setLoadingVisionBoard(null);
        }
    };


    if (!results) {
        return <p>Loading trend analysis...</p>;
    }

    return (
        <div className="w-full max-w-7xl animate-fade-in">
            <StepHeader 
                title="Synchronicity: The Trend Scanner"
                description={`Aligning ${brandName}'s creative potential with the live cultural moment to ensure relevance, resonance, and reach.`}
            />
            
            <div className="space-y-12">
                {results.map((result, idx) => (
                    <div key={idx} className="bg-white/30 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-lg relative">
                        <div className="absolute top-4 right-4 bg-slate-500 text-white text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-20">
                            #{idx + 1}
                        </div>
                        
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-brand-text mb-2 pr-12">
                                Idea: <span className="font-normal">{result.idea.replace(/\*/g, '')}</span>
                            </h2>
                            
                            <div className="relative group/score inline-flex items-center gap-2 mb-6 cursor-help">
                                <span className="text-sm font-semibold uppercase tracking-wider text-brand-text/80">Intensity Score:</span>
                                <span className="bg-black text-white font-bold px-3 py-1 rounded-full text-lg">
                                    {result.score}
                                </span>
                                {/* Rationale Tooltip */}
                                <div className="absolute top-full mt-2 w-72 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover/score:opacity-100 transition-opacity duration-300 pointer-events-none z-30">
                                    {result.rationale}
                                    <svg className="absolute text-slate-800 h-2 w-full left-0 -top-2" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
                                        <polygon className="fill-current" points="0,255 127.5,127.5 255,255"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                {loadingVisionBoard === result.idea && (
                                    <div className="flex items-center justify-center bg-slate-200/50 rounded-lg h-48">
                                        <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
                                        <p className="ml-4 text-brand-text">Generating Vision Board...</p>
                                    </div>
                                )}
                                {visionBoards[result.idea] && (
                                    <img src={visionBoards[result.idea]!} alt={`Vision board for ${result.idea}`} className="w-full rounded-lg shadow-md" />
                                )}
                                {!visionBoards[result.idea] && loadingVisionBoard !== result.idea && (
                                    <div className="text-center py-4">
                                        <button onClick={() => handleGenerateVisionBoard(result.idea)} className="bg-black text-white font-bold py-2 px-6 rounded-full shadow-lg hover:bg-gray-800 transition-colors duration-300 text-sm">
                                            Generate Vision Board
                                        </button>
                                        {visionBoardError && <p className="text-xs text-red-600 mt-2">{visionBoardError}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pt-6 border-t border-brand-text/20">
                                <StaticCategoryCard title="Trend-Brand Fit Mapping" items={result.analysis.trend_brand_fit_mapping} />
                                <InteractiveCategory idea={result.idea} brandName={brandName} categoryTitle="influencer" items={result.analysis.influencer_and_node_id} />
                                <InteractiveCategory idea={result.idea} brandName={brandName} categoryTitle="activation" items={result.analysis.activation_concepts} />
                                <StaticCategoryCard title="Distribution Hooks & Hacks" items={result.analysis.distribution_hooks_and_hacks} />
                            </div>

                            {result.sources.length > 0 && (
                                <div>
                                    <h3 
                                        onClick={() => toggleSources(idx)}
                                        className="text-lg font-bold text-brand-text mb-2 cursor-pointer flex items-center select-none"
                                    >
                                        Referenced Trends & Sources
                                        <svg className={`w-5 h-5 ml-2 transform transition-transform duration-300 ${visibleSources[idx] ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </h3>
                                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${visibleSources[idx] ? 'max-h-96' : 'max-h-0'}`}>
                                        <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 mt-2">
                                            <ul className="space-y-1 text-sm">
                                                {result.sources.filter(source => source.web?.uri).map((source, index) => (
                                                    <li key={index}>
                                                        <a 
                                                            href={source.web!.uri} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-brand-primary hover:underline"
                                                        >
                                                            {source.web!.title || source.web!.uri}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-12">
                <button onClick={handleRestart} className="bg-brand-title text-brand-text hover:bg-white transition-colors duration-300 font-bold py-3 px-8 rounded-full shadow-lg text-lg">
                    Start a New Analysis
                </button>
            </div>
        </div>
    );
};

export default Step3_Synchronicity;