import React, { useState, useCallback } from 'react';
import type { IdentityCapsule, CreativeIdeas, SynchronicityResult, GroundingChunk } from '../types/trinity';
import { AppStep } from '../types/trinity';
import Layout from './Layout';
import Step1_Identity from './Step1_Identity';
import Step2_CategorySelection from './Step2_CategorySelection';
import Step2_Creativity from './Step2_Creativity';
import Step3_Synchronicity from './Step3_Synchronicity';
import { generateIdentityCapsule, generateCreativeIdeas, analyzeTrendsForIdea } from '../services/geminiService';
import Loader from './Loader';

interface TrinityGraphProps {
  onBack: () => void;
}

const TrinityGraph: React.FC<TrinityGraphProps> = ({ onBack }) => {
    const [step, setStep] = useState<AppStep>(AppStep.LANDING);
    const [brandName, setBrandName] = useState<string>('');
    const [brandFiles, setBrandFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');

    const [identityCapsule, setIdentityCapsule] = useState<IdentityCapsule | null>(null);
    const [selectedIdentityItems, setSelectedIdentityItems] = useState<Record<string, string[]>>({});

    const [selectedCreativeCategories, setSelectedCreativeCategories] = useState<(keyof CreativeIdeas)[]>([]);
    const [creativeIdeas, setCreativeIdeas] = useState<Partial<CreativeIdeas> | null>(null);
    const [selectedCreativeIdeas, setSelectedCreativeIdeas] = useState<Record<string, string[]>>({});

    const [synchronicityResults, setSynchronicityResults] = useState<SynchronicityResult[] | null>(null);

    const handleStart = () => setStep(AppStep.IDENTITY_INPUT);

    const handleProceedToObjectives = useCallback(() => {
        if (!brandName.trim()) {
            setError("Please enter a brand name.");
            return;
        }
        setError(null);
        setStep(AppStep.CREATIVITY_CATEGORY_SELECTION);
    }, [brandName]);

    const handleGenerateIdentity = useCallback(async () => {
        if (selectedCreativeCategories.length === 0) {
            setError("Please select at least one objective to continue.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Building Identity Capsule... This may take a moment.');
        setStep(AppStep.GENERATING);

        try {
            const result = await generateIdentityCapsule(brandName, brandFiles);
            setIdentityCapsule(result);
            setStep(AppStep.IDENTITY_RESULT);
        } catch (e) {
            console.error(e);
            setError("Failed to generate the brand's identity capsule. Please try again.");
            setStep(AppStep.CREATIVITY_CATEGORY_SELECTION);
        } finally {
            setIsLoading(false);
        }
    }, [brandName, brandFiles, selectedCreativeCategories]);

    const handleGenerateCreativeIdeas = useCallback(async () => {
        const flatSelections: string[] = Object.values(selectedIdentityItems).flat();
        if (flatSelections.length === 0) {
            setError("Please select at least one identity element to generate ideas.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Generating Creative Expressions...');
        setStep(AppStep.GENERATING);

        try {
            const result = await generateCreativeIdeas(brandName, flatSelections, selectedCreativeCategories);
            setCreativeIdeas(result);
            setStep(AppStep.CREATIVITY_RESULT);
        } catch (e) {
            console.error(e);
            setError("Failed to generate creative ideas. Please try again.");
            setStep(AppStep.IDENTITY_RESULT);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCreativeCategories, selectedIdentityItems, brandName]);

    const handleGenerateSynchronicity = useCallback(async () => {
        const flatSelections: string[] = Object.values(selectedCreativeIdeas).flat();
        if (flatSelections.length === 0) {
            setError("Please select at least one creative idea to analyze trends.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setLoadingMessage(`Scanning cultural trends for ${flatSelections.length} idea(s)...`);
        setStep(AppStep.GENERATING);

        try {
            const promises = flatSelections.map(async (idea) => {
                const { analysis, sources, score, rationale } = await analyzeTrendsForIdea(brandName, idea);
                return { idea, analysis, sources, score, rationale };
            });

            const results = await Promise.all(promises);
            // Sort results by score in descending order
            results.sort((a, b) => b.score - a.score);
            
            setSynchronicityResults(results);
            setStep(AppStep.SYNCHRONICITY_RESULT);
        } catch (e) {
            console.error(e);
            setError("Failed to analyze cultural trends. Please try again.");
            setStep(AppStep.CREATIVITY_RESULT);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCreativeIdeas, brandName]);

    const handleRestart = () => {
        setStep(AppStep.LANDING);
        setBrandName('');
        setBrandFiles([]);
        setError(null);
        setIdentityCapsule(null);
        setSelectedIdentityItems({});
        setSelectedCreativeCategories([]);
        setCreativeIdeas(null);
        setSelectedCreativeIdeas({});
        setSynchronicityResults(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return <Loader message={loadingMessage} />;
        }

        switch (step) {
            case AppStep.LANDING:
                return (
                    <div className="text-center">
                        <h1 className="font-sans text-6xl md:text-8xl font-bold text-slate-800 mb-8 animate-fade-in-down">The Artiquity<br/>Trinity Graph</h1>
                        <button onClick={handleStart} className="bg-brand-title text-brand-text hover:bg-white transition-colors duration-300 font-bold py-3 px-8 rounded-full shadow-lg text-xl animate-fade-in-up">
                            Begin
                        </button>
                    </div>
                );
            case AppStep.IDENTITY_INPUT:
            case AppStep.IDENTITY_RESULT:
                return (
                    <Step1_Identity
                        step={step}
                        brandName={brandName}
                        setBrandName={setBrandName}
                        setBrandFiles={setBrandFiles}
                        identityCapsule={identityCapsule}
                        setIdentityCapsule={setIdentityCapsule}
                        selectedItems={selectedIdentityItems}
                        setSelectedItems={setSelectedIdentityItems}
                        handleNext={step === AppStep.IDENTITY_INPUT ? handleProceedToObjectives : handleGenerateCreativeIdeas}
                        error={error}
                        setError={setError}
                    />
                );
            case AppStep.CREATIVITY_CATEGORY_SELECTION:
                return (
                    <Step2_CategorySelection
                        selectedCategories={selectedCreativeCategories}
                        setSelectedCategories={setSelectedCreativeCategories}
                        handleNext={handleGenerateIdentity}
                        error={error}
                        setError={setError}
                    />
                );
            case AppStep.CREATIVITY_RESULT:
                 return (
                    <Step2_Creativity
                        brandName={brandName}
                        creativeIdeas={creativeIdeas}
                        selectedItems={selectedCreativeIdeas}
                        setSelectedItems={setSelectedCreativeIdeas}
                        handleNext={handleGenerateSynchronicity}
                        error={error}
                        setError={setError}
                    />
                );
            case AppStep.SYNCHRONICITY_RESULT:
                return (
                    <Step3_Synchronicity
                        brandName={brandName}
                        results={synchronicityResults}
                        handleRestart={handleRestart}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#E8F0FE' }}>
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
                                Trinity Graph
                            </h1>
                        </div>
                        <div className="w-32"></div> {/* Spacer for centering */}
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow flex items-center justify-center p-4">
                <Layout>
                    {renderContent()}
                </Layout>
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

export default TrinityGraph;
