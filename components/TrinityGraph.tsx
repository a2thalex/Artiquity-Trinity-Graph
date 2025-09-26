import React, { useState, useCallback } from 'react';
import type { IdentityCapsule, CreativeIdeas, SynchronicityResult, GroundingChunk, CampaignGenerationResult } from '../types/trinity';
import { AppStep } from '../types/trinity';
import Layout from './Layout';
import Step1_Identity from './Step1_Identity';
import Step2_CategorySelection from './Step2_CategorySelection';
import Step2_Creativity from './Step2_Creativity';
import Step3_Synchronicity from './Step3_Synchronicity';
import Step4_Campaign from './Step4_Campaign';
import { generateIdentityCapsule, generateCreativeIdeas, analyzeTrendsForIdea, generateCampaign, generateCampaignVariations, generateContextualCampaign, deployCampaign } from '../services/geminiService';
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
    
    const [campaignResults, setCampaignResults] = useState<CampaignGenerationResult[] | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<CampaignGenerationResult | null>(null);

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

    const handleProceedToCampaign = useCallback(() => {
        setStep(AppStep.CAMPAIGN_SELECTION);
    }, []);

    const handleGenerateCampaign = useCallback(async (results?: SynchronicityResult[]) => {
        setError(null);
        setIsLoading(true);
        
        const resultsToUse = results || (synchronicityResults ? [synchronicityResults[0]] : []);
        const identityElements = Object.values(selectedIdentityItems).flat();
        
        if (resultsToUse.length === 1) {
            setLoadingMessage('Generating campaign strategy...');
        } else {
            setLoadingMessage(`Generating ${resultsToUse.length} campaign variations...`);
        }
        
        setStep(AppStep.GENERATING);

        try {
            const campaigns = await generateCampaignVariations(
                brandName,
                resultsToUse,
                identityElements,
                resultsToUse.length
            );
            
            setCampaignResults(campaigns);
            setSelectedCampaign(campaigns[0]);
            setStep(AppStep.CAMPAIGN_RESULT);
        } catch (e) {
            console.error(e);
            setError("Failed to generate campaign. Please try again.");
            setStep(AppStep.CAMPAIGN_SELECTION);
        } finally {
            setIsLoading(false);
        }
    }, [brandName, synchronicityResults, selectedIdentityItems]);

    const handleGenerateContextualCampaign = useCallback(async (results?: SynchronicityResult[]) => {
        setError(null);
        setIsLoading(true);

        const resultsToUse = results || (synchronicityResults ? [synchronicityResults[0]] : []);
        const identityElements = Object.values(selectedIdentityItems).flat() as string[];

        setLoadingMessage('Generating contextual campaign with specialized prompts...');
        setStep(AppStep.GENERATING);

        try {
            // For now, we'll use the first result's dashboard data
            // In a real implementation, you might want to combine multiple results
            const primaryResult = resultsToUse[0];

            // We need to check if this is from the artist capsule flow (has dashboard)
            // or trinity flow (has analysis)
            let synchronicityDashboard: any;
            if (primaryResult && 'dashboard' in primaryResult) {
                // Artist capsule flow - has dashboard
                synchronicityDashboard = primaryResult;
            } else if (primaryResult && 'analysis' in primaryResult) {
                // Trinity flow - convert analysis to dashboard format
                synchronicityDashboard = {
                    dashboard: {
                        trendMatches: [
                            { name: 'Cultural Trend Analysis', velocity: 'Rising', description: primaryResult.rationale }
                        ],
                        audienceNodes: [
                            { category: 'Subcultures', items: primaryResult.analysis.trend_brand_fit_mapping.slice(0, 2) },
                            { category: 'Influencers/Tastemakers', items: primaryResult.analysis.influencer_and_node_id.slice(0, 2) },
                            { category: 'Platforms', items: ['Instagram', 'TikTok', 'Website'] }
                        ],
                        formatSuggestions: primaryResult.analysis.activation_concepts.map((concept: string) => ({
                            idea: concept,
                            timing: 'Immediate'
                        }))
                    },
                    sources: primaryResult.sources || []
                };
            } else {
                throw new Error('No valid synchronicity data found');
            }

            const contextualCampaign = await generateContextualCampaign(
                brandName,
                synchronicityDashboard,
                identityElements
            );

            // Convert to the expected format for display
            const campaignResult: CampaignGenerationResult = {
                campaign: {
                    id: contextualCampaign.campaign.id,
                    creative_idea: contextualCampaign.campaign.name,
                    campaign_name: contextualCampaign.campaign.name,
                    campaign_tagline: `Contextual campaign for ${brandName}`,
                    campaign_type: 'hybrid',
                    platforms: Object.keys(contextualCampaign.campaign.platformContent || {}),
                    target_audience: {
                        primary: 'Culturally-aware audiences',
                        secondary: contextualCampaign.campaign.targetAudiences.map(a => a.category || 'General audience'),
                        demographics: ['25-45 years', 'Digital natives', 'Cultural trendsetters'],
                        psychographics: ['Authenticity-focused', 'Trend-conscious', 'Community-oriented']
                    },
                    key_messages: ['Cultural authenticity', 'Community resonance', 'Trend alignment'],
                    activation_timeline: [
                        { phase: 'Launch', duration: 'Week 1', activities: ['Deploy ad copy', 'Start social plan'], milestones: ['Campaign live'] },
                        { phase: 'Engage', duration: 'Weeks 2-4', activities: ['Influencer outreach', 'Community building'], milestones: ['Partnerships secured'] },
                        { phase: 'Scale', duration: 'Month 2+', activities: ['Optimize performance', 'Expand reach'], milestones: ['Growth targets met'] }
                    ],
                    budget_tier: 'medium',
                    estimated_budget_range: '$50K-150K',
                    kpis: [
                        { metric: 'Cultural Engagement', target: '15% rate', measurement: 'Community interaction metrics' },
                        { metric: 'Authentic Reach', target: '250K impressions', measurement: 'Platform analytics' }
                    ],
                    distribution_strategy: ['Targeted subculture advertising', 'Influencer partnerships', 'Platform-specific content'],
                    content_pillars: ['Cultural Authenticity', 'Community Connection', 'Trend Relevance', 'Brand Values'],
                    creative_assets_needed: ['Subculture-specific ad creatives', 'Social media content', 'Influencer toolkits'],
                    partnership_opportunities: Object.keys(contextualCampaign.campaign.outreachTemplates || {}),
                    success_metrics: ['Engagement quality', 'Community growth', 'Cultural impact', 'Brand sentiment'],
                    risk_mitigation: ['Cultural sensitivity review', 'Community feedback loops', 'Trend monitoring'],
                    amplification_tactics: ['Viral content hooks', 'Community challenges', 'Influencer collaborations']
                },
                executionPlan: {
                    week1: ['Launch targeted ad campaigns', 'Begin social media content plan', 'Send influencer outreach'],
                    week2_4: ['Monitor engagement metrics', 'Optimize ad performance', 'Build community relationships'],
                    month2: ['Scale successful campaigns', 'Expand to new platforms', 'Develop partnerships'],
                    month3: ['Analyze cultural impact', 'Plan next phase', 'Document learnings'],
                    ongoing: ['Community management', 'Trend monitoring', 'Performance optimization']
                }
            };

            // Store the contextual campaign data for detailed view
            (campaignResult as any).contextualData = contextualCampaign.campaign;

            setCampaignResults([campaignResult]);
            setSelectedCampaign(campaignResult);
            setStep(AppStep.CAMPAIGN_RESULT);
        } catch (e) {
            console.error(e);
            setError("Failed to generate contextual campaign. Please try again.");
            setStep(AppStep.CAMPAIGN_SELECTION);
        } finally {
            setIsLoading(false);
        }
    }, [brandName, synchronicityResults, selectedIdentityItems]);

    const handleDeployCampaign = useCallback(async () => {
        if (!selectedCampaign) {
            setError("No campaign selected for deployment.");
            return null;
        }
        
        try {
            const result = await deployCampaign(selectedCampaign.campaign, brandName);
            console.log('Deployment result:', result);
            return result; // Return the deployment data
        } catch (e) {
            console.error(e);
            setError("Failed to deploy campaign. Please try again.");
            return null;
        }
    }, [selectedCampaign, brandName]);

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
        setCampaignResults(null);
        setSelectedCampaign(null);
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
                        handleNext={handleProceedToCampaign}
                    />
                );
            case AppStep.CAMPAIGN_SELECTION:
            case AppStep.CAMPAIGN_RESULT:
                return (
                    <Step4_Campaign
                        brandName={brandName}
                        synchronicityResults={synchronicityResults}
                        campaignResults={campaignResults}
                        selectedCampaign={selectedCampaign}
                        setSelectedCampaign={setSelectedCampaign}
                        handleGenerateCampaign={handleGenerateCampaign}
                        handleGenerateContextualCampaign={handleGenerateContextualCampaign}
                        handleDeployCampaign={handleDeployCampaign}
                        handleRestart={handleRestart}
                        error={error}
                        setError={setError}
                        isSelectionMode={step === AppStep.CAMPAIGN_SELECTION}
                    />
                );
            default:
                return null;
        }
    };

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

        </div>
    );
};

export default TrinityGraph;
