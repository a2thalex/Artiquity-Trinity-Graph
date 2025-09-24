export enum AppStep {
  LANDING,
  IDENTITY_INPUT,
  GENERATING,
  IDENTITY_RESULT,
  CREATIVITY_CATEGORY_SELECTION,
  CREATIVITY_RESULT,
  SYNCHRONICITY_RESULT,
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