import React, { useState } from 'react';
import type { SynchronicityResult, CampaignGenerationResult } from '../types/trinity';

interface Step4_CampaignProps {
    brandName: string;
    synchronicityResults: SynchronicityResult[] | null;
    campaignResults: CampaignGenerationResult[] | null;
    selectedCampaign: CampaignGenerationResult | null;
    setSelectedCampaign: (campaign: CampaignGenerationResult | null) => void;
    handleGenerateCampaign: (results?: SynchronicityResult[]) => void;
    handleGenerateContextualCampaign?: (results?: SynchronicityResult[]) => void;
    handleDeployCampaign: () => void;
    handleRestart: () => void;
    error: string | null;
    setError: (error: string | null) => void;
    isSelectionMode?: boolean;
}

const Step4_Campaign: React.FC<Step4_CampaignProps> = ({
    brandName,
    synchronicityResults,
    campaignResults,
    selectedCampaign,
    setSelectedCampaign,
    handleGenerateCampaign,
    handleGenerateContextualCampaign,
    handleDeployCampaign,
    handleRestart,
    error,
    setError,
    isSelectionMode = true
}) => {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [showDeploymentSuccess, setShowDeploymentSuccess] = useState(false);
    const [deploymentData, setDeploymentData] = useState<any>(null);

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Selection mode: Choose which ideas to turn into campaigns
    if (isSelectionMode && synchronicityResults) {
        const topResults = synchronicityResults.slice(0, 3);
        
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Campaign Activation
                    </h2>
                    <p className="text-gray-600">
                        Transform your top-scoring ideas into executable campaigns
                    </p>
                </div>

                <div className="bg-white/90 rounded-xl p-8 shadow-lg">
                    <h3 className="text-xl font-semibold mb-6">Top Campaign Candidates</h3>
                    <div className="space-y-4">
                        {topResults.map((result, index) => (
                            <div key={index} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                index === 0 ? 'bg-gold-100 text-gold-800' :
                                                index === 1 ? 'bg-silver-100 text-silver-800' :
                                                'bg-bronze-100 text-bronze-800'
                                            }`}>
                                                {index === 0 ? '🏆 #1' : index === 1 ? '🥈 #2' : '🥉 #3'}
                                            </span>
                                            <span className="text-sm font-semibold text-purple-600">
                                                Score: {result.score}/100
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-lg mb-2">{result.idea}</h4>
                                        <p className="text-sm text-gray-600 mb-4">{result.rationale}</p>
                                        
                                        {result.analysis.activation_concepts && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-700 mb-1">Key Activation Concepts:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.analysis.activation_concepts.slice(0, 3).map((concept, i) => (
                                                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                                            {concept}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-between items-center">
                        <button
                            onClick={handleRestart}
                            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            ← Back to Results
                        </button>
                        <div className="flex gap-4 flex-wrap">
                            <button
                                onClick={() => handleGenerateCampaign([topResults[0]])}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Generate Top Campaign
                            </button>
                            <button
                                onClick={() => handleGenerateCampaign(topResults)}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                            >
                                Generate All 3 Variations
                            </button>
                            {handleGenerateContextualCampaign && (
                                <button
                                    onClick={() => handleGenerateContextualCampaign([topResults[0]])}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-colors"
                                >
                                    🎯 Generate Contextual Campaign
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}
            </div>
        );
    }

    // Display generated campaigns
    if (campaignResults && campaignResults.length > 0) {
        const campaign = selectedCampaign || campaignResults[0];
        
        return (
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Campaign Blueprint: {campaign.campaign.campaign_name}
                    </h2>
                    <p className="text-xl text-purple-600 italic">"{campaign.campaign.campaign_tagline}"</p>
                    {(campaign as any).contextualData && (
                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <p className="text-emerald-700 font-medium">🎯 Contextual Campaign Generated</p>
                            <p className="text-sm text-emerald-600">This campaign uses specialized prompts for cultural authenticity</p>
                        </div>
                    )}
                </div>

                {/* Campaign Variations Selector */}
                {campaignResults.length > 1 && (
                    <div className="bg-white/90 rounded-xl p-4 shadow-lg">
                        <div className="flex justify-center gap-2">
                            {campaignResults.map((result, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedCampaign(result)}
                                    className={`px-4 py-2 rounded-lg transition-all ${
                                        campaign === result
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Variation {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Campaign Overview */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white/90 rounded-xl p-6 shadow-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">Campaign Type</h3>
                        <p className="text-2xl font-bold text-purple-600 capitalize">{campaign.campaign.campaign_type}</p>
                    </div>
                    <div className="bg-white/90 rounded-xl p-6 shadow-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">Budget Tier</h3>
                        <p className="text-2xl font-bold text-green-600 capitalize">{campaign.campaign.budget_tier}</p>
                        <p className="text-sm text-gray-600 mt-1">{campaign.campaign.estimated_budget_range}</p>
                    </div>
                    <div className="bg-white/90 rounded-xl p-6 shadow-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">Duration</h3>
                        <p className="text-2xl font-bold text-blue-600">
                            {campaign.campaign.activation_timeline.length * 30} Days
                        </p>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="space-y-4">
                    {/* Target Audience */}
                    <div className="bg-white/90 rounded-xl shadow-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('audience')}
                            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="text-xl font-semibold">🎯 Target Audience</h3>
                            <svg className={`w-6 h-6 transition-transform ${expandedSection === 'audience' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSection === 'audience' && (
                            <div className="px-6 pb-6 space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Primary Audience</h4>
                                    <p className="text-gray-600">{campaign.campaign.target_audience.primary}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Demographics</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.campaign.target_audience.demographics.map((demo, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                                {demo}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Psychographics</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.campaign.target_audience.psychographics.map((psycho, i) => (
                                            <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                                                {psycho}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Platforms & Distribution */}
                    <div className="bg-white/90 rounded-xl shadow-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('platforms')}
                            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="text-xl font-semibold">📱 Platforms & Distribution</h3>
                            <svg className={`w-6 h-6 transition-transform ${expandedSection === 'platforms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSection === 'platforms' && (
                            <div className="px-6 pb-6 space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Primary Platforms</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {campaign.campaign.platforms.map((platform, i) => (
                                            <div key={i} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                                                <span className="text-2xl">
                                                    {platform.toLowerCase().includes('instagram') ? '📷' :
                                                     platform.toLowerCase().includes('tiktok') ? '🎵' :
                                                     platform.toLowerCase().includes('youtube') ? '📺' :
                                                     platform.toLowerCase().includes('twitter') ? '🐦' :
                                                     platform.toLowerCase().includes('linkedin') ? '💼' : '🌐'}
                                                </span>
                                                <span className="font-medium">{platform}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Distribution Strategy</h4>
                                    <ul className="space-y-2">
                                        {campaign.campaign.distribution_strategy.map((strategy, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-green-500 mt-1">✓</span>
                                                <span className="text-gray-600">{strategy}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Key Messages & Content */}
                    <div className="bg-white/90 rounded-xl shadow-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('content')}
                            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="text-xl font-semibold">💬 Key Messages & Content</h3>
                            <svg className={`w-6 h-6 transition-transform ${expandedSection === 'content' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSection === 'content' && (
                            <div className="px-6 pb-6 space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Core Messages</h4>
                                    <ol className="space-y-2">
                                        {campaign.campaign.key_messages.map((message, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                    {i + 1}
                                                </span>
                                                <span className="text-gray-600">{message}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Content Pillars</h4>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {campaign.campaign.content_pillars.map((pillar, i) => (
                                            <div key={i} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                                <span className="text-gray-700">{pillar}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline & Execution */}
                    <div className="bg-white/90 rounded-xl shadow-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('timeline')}
                            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="text-xl font-semibold">📅 Timeline & Execution</h3>
                            <svg className={`w-6 h-6 transition-transform ${expandedSection === 'timeline' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSection === 'timeline' && (
                            <div className="px-6 pb-6">
                                <div className="space-y-6">
                                    {campaign.campaign.activation_timeline.map((phase, index) => (
                                        <div key={index} className="relative">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-lg mb-1">{phase.phase}</h4>
                                                    <p className="text-sm text-gray-500 mb-3">{phase.duration}</p>
                                                    <div className="space-y-2">
                                                        {phase.activities.map((activity, i) => (
                                                            <div key={i} className="flex items-start gap-2">
                                                                <span className="text-green-500 mt-1">•</span>
                                                                <span className="text-gray-600">{activity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {phase.milestones && phase.milestones.length > 0 && (
                                                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                                            <p className="text-sm font-medium text-yellow-800 mb-1">Key Milestones:</p>
                                                            {phase.milestones.map((milestone, i) => (
                                                                <p key={i} className="text-sm text-yellow-700">🎯 {milestone}</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {index < campaign.campaign.activation_timeline.length - 1 && (
                                                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 to-transparent"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Execution Plan */}
                                {campaign.executionPlan && (
                                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                                        <h4 className="font-semibold text-lg mb-4">Quick Start Execution Plan</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-1">Week 1 - Launch</p>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    {campaign.executionPlan.week1.map((task, i) => (
                                                        <li key={i}>• {task}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-1">Weeks 2-4 - Build Momentum</p>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    {campaign.executionPlan.week2_4.map((task, i) => (
                                                        <li key={i}>• {task}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* KPIs & Success Metrics */}
                    <div className="bg-white/90 rounded-xl shadow-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection('kpis')}
                            className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="text-xl font-semibold">📊 KPIs & Success Metrics</h3>
                            <svg className={`w-6 h-6 transition-transform ${expandedSection === 'kpis' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {expandedSection === 'kpis' && (
                            <div className="px-6 pb-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {campaign.campaign.kpis.map((kpi, i) => (
                                        <div key={i} className="p-4 bg-gray-50 rounded-lg">
                                            <h5 className="font-medium text-gray-800 mb-1">{kpi.metric}</h5>
                                            <p className="text-2xl font-bold text-purple-600 mb-1">{kpi.target}</p>
                                            <p className="text-sm text-gray-600">{kpi.measurement}</p>
                                        </div>
                                    ))}
                                </div>
                                {campaign.campaign.success_metrics && campaign.campaign.success_metrics.length > 0 && (
                                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm font-medium text-green-800 mb-2">Additional Success Indicators:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {campaign.campaign.success_metrics.map((metric, i) => (
                                                <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                                    {metric}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Contextual Campaign Details */}
                {(campaign as any).contextualData && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                        <h3 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center gap-2">
                            🎯 Contextual Campaign Intelligence
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Ad Copy Section */}
                            {(campaign as any).contextualData.adCopy && Object.keys((campaign as any).contextualData.adCopy).length > 0 && (
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-bold text-lg text-gray-800 mb-3">📢 Targeted Ad Copy</h4>
                                    <div className="space-y-3">
                                        {Object.entries((campaign as any).contextualData.adCopy).slice(0, 2).map(([subculture, adData]: [string, any]) => (
                                            <div key={subculture} className="border-l-4 border-emerald-400 pl-3">
                                                <p className="font-medium text-emerald-700">{subculture}</p>
                                                {adData.variation_1 && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        <p className="font-medium">{adData.variation_1.headline}</p>
                                                        <p className="text-xs">{adData.variation_1.body.substring(0, 100)}...</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Social Plan Section */}
                            {(campaign as any).contextualData.socialPlan && Array.isArray((campaign as any).contextualData.socialPlan) && (
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-bold text-lg text-gray-800 mb-3">📱 Social Media Plan</h4>
                                    <div className="space-y-2">
                                        {(campaign as any).contextualData.socialPlan.slice(0, 3).map((day: any, index: number) => (
                                            <div key={index} className="border-l-4 border-blue-400 pl-3">
                                                <p className="font-medium text-blue-700">Day {day.day}: {day.platform}</p>
                                                <p className="text-sm text-gray-600">{day.theme}</p>
                                                <p className="text-xs text-gray-500">{day.content_idea.substring(0, 80)}...</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Influencer Outreach Section */}
                            {(campaign as any).contextualData.outreachTemplates && Object.keys((campaign as any).contextualData.outreachTemplates).length > 0 && (
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-bold text-lg text-gray-800 mb-3">🤝 Influencer Outreach</h4>
                                    <div className="space-y-2">
                                        {Object.entries((campaign as any).contextualData.outreachTemplates).slice(0, 2).map(([influencer, template]: [string, any]) => (
                                            <div key={influencer} className="border-l-4 border-purple-400 pl-3">
                                                <p className="font-medium text-purple-700">{influencer}</p>
                                                {template.subject && (
                                                    <p className="text-sm text-gray-600">"{template.subject}"</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Platform Content Section */}
                            {(campaign as any).contextualData.platformContent && Object.keys((campaign as any).contextualData.platformContent).length > 0 && (
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="font-bold text-lg text-gray-800 mb-3">🌐 Platform Strategies</h4>
                                    <div className="space-y-2">
                                        {Object.entries((campaign as any).contextualData.platformContent).slice(0, 2).map(([platform, strategy]: [string, any]) => (
                                            <div key={platform} className="border-l-4 border-orange-400 pl-3">
                                                <p className="font-medium text-orange-700">{platform}</p>
                                                {strategy.content_strategy && (
                                                    <p className="text-sm text-gray-600">{strategy.content_strategy.substring(0, 100)}...</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                            <p className="text-sm text-emerald-700">
                                💡 This contextual campaign was generated using specialized AI prompts that analyze cultural trends,
                                audience subcultures, and platform-specific behaviors to create highly targeted marketing strategies.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center bg-white/90 rounded-xl p-6 shadow-lg">
                    <button
                        onClick={handleRestart}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        ← Start New Campaign
                    </button>
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                // Download campaign as JSON
                                const dataStr = JSON.stringify(campaign, null, 2);
                                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                                const exportFileDefaultName = `${brandName}-campaign-${Date.now()}.json`;
                                const linkElement = document.createElement('a');
                                linkElement.setAttribute('href', dataUri);
                                linkElement.setAttribute('download', exportFileDefaultName);
                                linkElement.click();
                            }}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Campaign
                        </button>
                        <button
                            onClick={async () => {
                                const result = await handleDeployCampaign();
                                if (result) {
                                    setDeploymentData(result);
                                    setShowDeploymentSuccess(true);
                                }
                            }}
                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Deploy to Promote.fun
                        </button>
                    </div>
                </div>

                {/* Success Message */}
                {showDeploymentSuccess && deploymentData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-bold text-green-600 flex items-center gap-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Campaign Successfully Deployed!
                                    </h3>
                                    <button
                                        onClick={() => setShowDeploymentSuccess(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="font-semibold mb-2">Campaign Links:</p>
                                        <div className="space-y-2">
                                            {deploymentData.urls && Object.entries(deploymentData.urls).map(([key, url]: [string, any]) => (
                                                <a 
                                                    key={key}
                                                    href={url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: {url}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {deploymentData.estimatedMetrics && (
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="font-semibold mb-2">Estimated Performance:</p>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600">Reach</p>
                                                    <p className="text-xl font-bold text-blue-600">{deploymentData.estimatedMetrics.reach?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Engagement</p>
                                                    <p className="text-xl font-bold text-green-600">{deploymentData.estimatedMetrics.engagement?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Conversions</p>
                                                    <p className="text-xl font-bold text-purple-600">{deploymentData.estimatedMetrics.conversions?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {deploymentData.nextSteps && (
                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <p className="font-semibold mb-2">Next Steps:</p>
                                            <ol className="space-y-1">
                                                {deploymentData.nextSteps.map((step: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-yellow-600 font-bold">{i + 1}.</span>
                                                        <span className="text-gray-700">{step}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-6 flex justify-end gap-4">
                                    <button
                                        onClick={() => setShowDeploymentSuccess(false)}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <a
                                        href={deploymentData.urls?.dashboard || deploymentData.deploymentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Go to Dashboard →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default Step4_Campaign;
