export enum Step {
  Identity = 1,
  Creativity = 2,
  Synchronicity = 3,
}

export interface IdentityCapsule {
  aestheticCodes: string[];
  tonalSignatures: string[];
  techniquesAndMediums: string[];
  philosophyAndIntent: string[];
  constraintsAndBoundaries: string[];
  signatureGesturesAndCodes: string[];
}

export interface CreativeOutput {
  prompt: string;
  imageUrl: string;
}

// New Types for the Synchronicity Dashboard
export interface TrendMatch {
  name: string;
  velocity: string;
  description: string;
}

export interface AudienceNode {
  category: 'Subcultures' | 'Influencers/Tastemakers' | 'Platforms';
  items: string[];
}

export interface FormatSuggestion {
  idea: string;
  timing: string;
}

export interface SynchronicityDashboard {
  trendMatches: TrendMatch[];
  audienceNodes: AudienceNode[];
  formatSuggestions: FormatSuggestion[];
}

export interface WebSource {
    uri: string;
    title: string;
}

export interface SynchronicityResult {
  dashboard: SynchronicityDashboard;
  sources: WebSource[];
}
