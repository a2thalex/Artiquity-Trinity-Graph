import React, { useState, useCallback } from 'react';
import { DataStep } from '../types/data';
import type { DataProfile, DataLicensingTerms, DatasetPreview, DataIdentityCapsule } from '../types/data';
import { generateIdentityCapsules, generateDatasetPreview, generateDataProfileAndKeywords } from '../services/dataService';

const DataApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Overall App State
    const [step, setStep] = useState<DataStep>(DataStep.LANDING);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    
    // Step 1 State
    const [description, setDescription] = useState<string>('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    // Step 2 State
    const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);

    // Step 3 State
    const [capsules, setCapsules] = useState<DataIdentityCapsule[]>([]);
    const [regenerationPrompt, setRegenerationPrompt] = useState<string>('');
    const [tentativeSelectedCapsule, setTentativeSelectedCapsule] = useState<DataIdentityCapsule | null>(null);
    
    // Step 4 State
    const [selectedCapsule, setSelectedCapsule] = useState<DataIdentityCapsule | null>(null);
    const [refinedProfile, setRefinedProfile] = useState<DataProfile | null>(null);

    // Step 5 & 6 State
    const [licensingTerms, setLicensingTerms] = useState<DataLicensingTerms | null>(null);
    const [datasetPreview, setDatasetPreview] = useState<DatasetPreview | null>(null);

    const handleStart = () => setStep(DataStep.DESCRIBE);
    
    const handleBack = () => {
        if (step > DataStep.LANDING) {
            setStep(prev => prev - 1);
            setError(null);
        }
    };

    const handleDescribeNext = (desc: string, files: File[]) => {
        setDescription(desc);
        setUploadedFiles(files);
        setStep(DataStep.PURPOSE);
    };

    const handlePurposeNext = async (purposes: string[]) => {
        if (purposes.length === 0) {
            setError("Please select at least one purpose.");
            return;
        }
        setError(null);
        setSelectedPurposes(purposes);
        setTentativeSelectedCapsule(null);
        setStep(DataStep.CAPSULE_SELECTION);
        setIsLoading(true);
        setLoadingMessage("Generating creative capsules...");
        try {
            const generatedCapsules = await generateIdentityCapsules(description, purposes, uploadedFiles);
            setCapsules(generatedCapsules);
        } catch(e) {
            console.error(e);
            setError("Could not generate creative capsules. Please try again.");
            setStep(DataStep.PURPOSE);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRegenerateCapsules = async () => {
        setTentativeSelectedCapsule(null);
        setIsLoading(true);
        setLoadingMessage("Regenerating creative capsules...");
        setError(null);
        try {
            const combinedDescription = `${description} ${regenerationPrompt}`.trim();
            const generatedCapsules = await generateIdentityCapsules(combinedDescription, selectedPurposes, uploadedFiles);
            setCapsules(generatedCapsules);
        } catch (e) {
            console.error(e);
            setError("Could not regenerate capsules. Please try again.");
        } finally {
            setIsLoading(false);
            setRegenerationPrompt('');
        }
    };

    const handleCapsuleSelect = (capsule: DataIdentityCapsule) => {
        setSelectedCapsule(capsule);
        setStep(DataStep.REFINE_CAPSULE);
    };

    const handleRefineNext = (profile: DataProfile) => {
        setRefinedProfile(profile);
        setStep(DataStep.LICENSING);
    };
    
    const handleLicensingNext = async (terms: DataLicensingTerms) => {
        setLicensingTerms(terms);
        setIsLoading(true);
        setLoadingMessage("Generating dataset preview...");
        try {
            if (!refinedProfile) throw new Error("Missing required data for preview generation.");
            const preview = await generateDatasetPreview(selectedPurposes, refinedProfile, terms);
            setDatasetPreview(preview);
            setStep(DataStep.FINALIZE);
        } catch(e) {
            console.error(e);
            setError("Could not generate the dataset preview. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestart = () => {
        setStep(DataStep.LANDING);
        setError(null);
        setDescription('');
        setUploadedFiles([]);
        setSelectedPurposes([]);
        setCapsules([]);
        setSelectedCapsule(null);
        setRefinedProfile(null);
        setLicensingTerms(null);
        setDatasetPreview(null);
        setRegenerationPrompt('');
        setTentativeSelectedCapsule(null);
    };
    
    const generateSuggestionsCallback = useCallback(async (desc: string): Promise<{ profile: DataProfile, suggestions: any }> => {
        return generateDataProfileAndKeywords(desc);
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-lg text-gray-600">{loadingMessage}</p>
                </div>
            );
        }

        switch (step) {
            case DataStep.LANDING:
                return (
                    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden app-background">
                        {/* Back Button */}
                        <div className="absolute top-8 left-8">
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="font-medium">Back to Home</span>
                            </button>
                        </div>
                        
                        <div className="text-center px-6">
                            <h1 className="font-sans text-6xl md:text-8xl font-bold text-slate-800 mb-8 animate-fade-in-down">Artiquity Research</h1>
                            <p className="text-slate-600 mb-8 text-lg max-w-2xl mx-auto animate-fade-in">The intelligent data marketplace for your AI company to find and license organized, high quality data from artists.</p>
                            <button onClick={handleStart} className="text-white hover:opacity-90 transition-opacity duration-300 font-bold py-3 px-8 rounded-full shadow-lg text-xl animate-fade-in-up" style={{ backgroundColor: '#6B7280' }}>
                                Begin
                            </button>
                        </div>
                    </div>
                );
            case DataStep.DESCRIBE:
                return (
                    <div className="w-full max-w-4xl mx-auto px-6 py-8">
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-bold text-slate-800 mb-2">Describe Your Dataset</h1>
                            <p className="max-w-3xl mx-auto text-slate-600">Tell us about the type of data you're looking for and upload any reference materials.</p>
                        </div>
                        
                        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-lg p-8">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the type of data you need... (e.g., 'High-quality portrait photography with diverse lighting conditions and expressions')"
                                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                            />
                            
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Reference Images (Optional)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-between mt-8">
                                <button onClick={onBack} className="bg-gray-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-600 transition-colors">
                                    Back to Home
                                </button>
                                <button onClick={() => handleDescribeNext(description, uploadedFiles)} className="text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: '#6B7280' }}>
                                    Next: Select Purpose
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case DataStep.PURPOSE:
                return (
                    <div className="w-full max-w-4xl mx-auto px-6 py-8">
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-bold text-slate-800 mb-2">Select Purpose</h1>
                            <p className="max-w-3xl mx-auto text-slate-600">What will you use this data for?</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {['fine_tuning', 'training_new_model', 'filling_gaps', 'bias_correction', 'safety_filtering', 'prototyping'].map((purpose) => (
                                <button
                                    key={purpose}
                                    onClick={() => {
                                        const newPurposes = selectedPurposes.includes(purpose)
                                            ? selectedPurposes.filter(p => p !== purpose)
                                            : [...selectedPurposes, purpose];
                                        setSelectedPurposes(newPurposes);
                                    }}
                                    className={`p-4 rounded-lg border-2 transition-colors ${
                                        selectedPurposes.includes(purpose)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                >
                                    {purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                        </div>

                        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

                        <div className="flex justify-between">
                            <button onClick={handleBack} className="bg-gray-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-600 transition-colors">
                                Back
                            </button>
                            <button onClick={() => handlePurposeNext(selectedPurposes)} className="text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: '#6B7280' }}>
                                Generate Capsules
                            </button>
                        </div>
                    </div>
                );
            case DataStep.CAPSULE_SELECTION:
                return (
                    <div className="w-full max-w-6xl mx-auto px-6 py-8 relative">
                        <button onClick={handleBack} className="absolute top-2 left-0 bg-transparent text-gray-600 hover:bg-white/50 font-bold py-2 px-4 rounded-full transition-colors duration-300">
                            ← Back
                        </button>
                        <div className="text-center mb-8 md:mb-12">
                            <h1 className="text-5xl font-bold text-slate-800 mb-2">Select a Capsule</h1>
                            <p className="max-w-3xl mx-auto text-slate-600">We've generated four creative directions based on your description. Choose one to refine further, or regenerate them with a new prompt.</p>
                        </div>
                        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {capsules.map((capsule, index) => (
                                <div 
                                    key={index}
                                    onClick={() => setTentativeSelectedCapsule(capsule)}
                                    className={`p-6 bg-white/40 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-4 flex flex-col text-center ${
                                        tentativeSelectedCapsule?.title === capsule.title ? 'border-blue-500' : 'border-transparent'
                                    }`}
                                >
                                    <h3 className="font-bold text-2xl text-gray-800 mb-3">{capsule.title}</h3>
                                    <p className="text-sm text-gray-600 flex-grow">{capsule.description}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 my-8">
                            <input 
                                type="text"
                                placeholder="Optional: add a hint to guide regeneration..."
                                value={regenerationPrompt}
                                onChange={(e) => setRegenerationPrompt(e.target.value)}
                                className="flex-grow w-full sm:w-auto max-w-md px-4 py-2 bg-white/50 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                            />
                            <button onClick={handleRegenerateCapsules} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-300">
                                Regenerate
                            </button>
                        </div>

                        {tentativeSelectedCapsule && (
                            <div className="text-center animate-fade-in-up">
                                <button 
                                    onClick={() => handleCapsuleSelect(tentativeSelectedCapsule)} 
                                    className="text-white font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-opacity duration-300 text-lg" style={{ backgroundColor: '#6B7280' }}
                                >
                                    Finetune "{tentativeSelectedCapsule.title}" →
                                </button>
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div className="w-full max-w-4xl mx-auto px-6 py-8">
                        <div className="text-center">
                            <h1 className="text-5xl font-bold text-slate-800 mb-8">Coming Soon</h1>
                            <p className="text-slate-600 mb-8">This step is being implemented. Please use the capsule selection for now.</p>
                            <button onClick={handleRestart} className="text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: '#6B7280' }}>
                                Start Over
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen app-background">
            {renderContent()}
        </div>
    );
};

export default DataApp;
