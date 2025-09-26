export enum AppStep {
  LANDING,
  IDENTITY_INPUT,
  GENERATING,
  IDENTITY_RESULT,
  CREATIVITY_CATEGORY_SELECTION,
  CREATIVITY_RESULT,
  SYNCHRONICITY_RESULT,
  CAMPAIGN_SELECTION,
  CAMPAIGN_RESULT,
}

export interface IdentityCapsule {
  hero_products: string[];
  aesthetic_codes_and_expressions: string[];
  mission_and_values: string[];
  usage_contexts: string[];
  constraints_and_boundaries: string[];
  brand_archetype: string[];
}

export interface CreativeIdeas {
  audience_expansion: string[];
  product_and_format_transposition: string[];
  campaign_and_experience_innovation: string[];
  category_exploration: string[];
  partnership_and_collaboration: string[];
}

export interface SynchronicityAnalysis {
  trend_brand_fit_mapping: string[];
  influencer_and_node_id: string[];
  activation_concepts: string[];
  distribution_hooks_and_hacks: string[];
}

export interface GroundingChunk {
  // FIX: Made the 'web' property optional to align with the @google/genai library's GroundingChunk type, resolving a type assignment error.
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface SynchronicityResult {
  idea: string;
  analysis: SynchronicityAnalysis;
  sources: GroundingChunk[];
  score: number;
  rationale: string;
}

export interface Campaign {
  id: string;
  creative_idea: string;
  campaign_name: string;
  campaign_tagline: string;
  campaign_type: 'social' | 'influencer' | 'experiential' | 'digital' | 'hybrid' | 'content' | 'guerrilla';
  platforms: string[];
  target_audience: {
    primary: string;
    secondary: string[];
    demographics: string[];
    psychographics: string[];
  };
  key_messages: string[];
  activation_timeline: {
    phase: string;
    duration: string;
    activities: string[];
    milestones: string[];
  }[];
  budget_tier: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
  estimated_budget_range: string;
  kpis: {
    metric: string;
    target: string;
    measurement: string;
  }[];
  distribution_strategy: string[];
  content_pillars: string[];
  creative_assets_needed: string[];
  partnership_opportunities: string[];
  success_metrics: string[];
  risk_mitigation: string[];
  amplification_tactics: string[];
}

export interface CampaignGenerationResult {
  campaign: Campaign;
  executionPlan: CampaignExecutionPlan;
  deploymentUrl?: string;
}

export interface CampaignExecutionPlan {
  week1: string[];
  week2_4: string[];
  month2: string[];
  month3: string[];
  ongoing: string[];
}

// Contextual Campaign Types
export interface AdCopyVariation {
  headline: string;
  body: string;
  cta: string;
}

export interface SubcultureAdCopy {
  [subculture: string]: {
    variation_1: AdCopyVariation;
    variation_2: AdCopyVariation;
    variation_3: AdCopyVariation;
  } | { error: string; fallback?: any };
}

export interface SocialPlanDay {
  day: number;
  platform: string;
  format: string;
  theme: string;
  content_idea: string;
  sample_caption: string;
  timing: string;
}

export interface OutreachTemplate {
  subject: string;
  body: string;
  follow_up: string;
}

export interface InfluencerOutreach {
  [influencer: string]: OutreachTemplate | { error: string; fallback?: any };
}

export interface PlatformStrategy {
  content_strategy: string;
  content_types: string[];
  posting_frequency: string;
  engagement_tactics: string[];
  success_metrics: string[];
}

export interface PlatformContent {
  [platform: string]: PlatformStrategy;
}

export interface ContextualCampaign {
  id: string;
  name: string;
  type: string;
  culturalContext: any[];
  targetAudiences: any[];
  adCopy: SubcultureAdCopy;
  socialPlan: SocialPlanDay[] | { error: string; fallback?: any };
  outreachTemplates: InfluencerOutreach;
  platformContent: PlatformContent | { error: string; fallback?: any };
  metadata: {
    identityElements: string[];
    generationMethod: string;
    culturalAlignment: string;
  };
}

export interface ContextualCampaignResult {
  success: boolean;
  brandName: string;
  generatedAt: string;
  campaign: ContextualCampaign;
}