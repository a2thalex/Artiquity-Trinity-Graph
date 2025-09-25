// api/generate-campaign.js
// Campaign generation endpoint for Artiquity Trinity Graph

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Access the API Key securely from Vercel's environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
  }

  const { brandName, synchronicityResult, identityElements, generationType } = req.body;

  if (!brandName || !synchronicityResult) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const campaignPrompt = `
You are a world-class campaign strategist developing a comprehensive campaign for ${brandName}.

CREATIVE IDEA: ${synchronicityResult.idea}
SYNCHRONICITY SCORE: ${synchronicityResult.score}/100
RATIONALE: ${synchronicityResult.rationale}

TREND ANALYSIS:
- Trend-Brand Fit: ${synchronicityResult.analysis.trend_brand_fit_mapping.join(', ')}
- Influencers/Nodes: ${synchronicityResult.analysis.influencer_and_node_id.join(', ')}
- Activation Concepts: ${synchronicityResult.analysis.activation_concepts.join(', ')}
- Distribution Hooks: ${synchronicityResult.analysis.distribution_hooks_and_hacks.join(', ')}

BRAND IDENTITY ELEMENTS: ${identityElements.join(', ')}

Generate a comprehensive campaign strategy that:
1. Leverages the identified cultural trends and synchronicities
2. Aligns with the brand's core identity elements
3. Creates a clear path from strategy to execution
4. Includes specific, actionable tactics
5. Defines measurable success metrics

Return a JSON object with this exact structure:
{
  "campaign": {
    "id": "unique_campaign_id",
    "creative_idea": "the original creative idea",
    "campaign_name": "memorable campaign name",
    "campaign_tagline": "powerful tagline that captures the essence",
    "campaign_type": "social|influencer|experiential|digital|hybrid|content|guerrilla",
    "platforms": ["primary platform", "secondary platform", "tertiary platform"],
    "target_audience": {
      "primary": "detailed primary audience description",
      "secondary": ["secondary audience 1", "secondary audience 2"],
      "demographics": ["age range", "location", "income level", "education"],
      "psychographics": ["interest 1", "value 1", "lifestyle trait 1", "behavior pattern 1"]
    },
    "key_messages": [
      "core message 1 that resonates with the audience",
      "core message 2 that differentiates the brand",
      "core message 3 that drives action"
    ],
    "activation_timeline": [
      {
        "phase": "Phase 1: Launch & Awareness",
        "duration": "Weeks 1-2",
        "activities": [
          "specific launch activity 1",
          "specific launch activity 2",
          "specific launch activity 3"
        ],
        "milestones": ["key milestone to achieve by end of phase"]
      },
      {
        "phase": "Phase 2: Engagement & Amplification",
        "duration": "Weeks 3-6",
        "activities": [
          "engagement activity 1",
          "engagement activity 2",
          "engagement activity 3"
        ],
        "milestones": ["engagement milestone"]
      },
      {
        "phase": "Phase 3: Conversion & Sustain",
        "duration": "Weeks 7-12",
        "activities": [
          "conversion activity 1",
          "conversion activity 2",
          "sustaining activity"
        ],
        "milestones": ["conversion milestone", "campaign wrap milestone"]
      }
    ],
    "budget_tier": "micro|small|medium|large|enterprise",
    "estimated_budget_range": "$X,XXX - $XX,XXX",
    "kpis": [
      {
        "metric": "Reach/Impressions",
        "target": "specific number",
        "measurement": "how it will be measured"
      },
      {
        "metric": "Engagement Rate",
        "target": "specific percentage",
        "measurement": "calculation method"
      },
      {
        "metric": "Conversion/Action",
        "target": "specific number or rate",
        "measurement": "tracking method"
      },
      {
        "metric": "Brand Sentiment",
        "target": "percentage positive",
        "measurement": "monitoring approach"
      }
    ],
    "distribution_strategy": [
      "owned media tactic with specifics",
      "earned media approach with targets",
      "paid media strategy with budget allocation",
      "shared media collaboration plan"
    ],
    "content_pillars": [
      "Content Pillar 1: Theme/Topic",
      "Content Pillar 2: Theme/Topic",
      "Content Pillar 3: Theme/Topic",
      "Content Pillar 4: Theme/Topic"
    ],
    "creative_assets_needed": [
      "hero video/content piece",
      "social media templates",
      "influencer toolkit",
      "landing page/microsite",
      "email sequences"
    ],
    "partnership_opportunities": [
      "potential brand partner with synergy",
      "influencer tier and examples",
      "media partnership possibility",
      "technology/platform partnership"
    ],
    "success_metrics": [
      "quantitative success indicator 1",
      "quantitative success indicator 2",
      "qualitative success indicator 1",
      "qualitative success indicator 2"
    ],
    "risk_mitigation": [
      "potential risk 1 and mitigation strategy",
      "potential risk 2 and mitigation strategy",
      "potential risk 3 and mitigation strategy"
    ],
    "amplification_tactics": [
      "viral mechanism or hook",
      "user-generated content strategy",
      "PR angle or newsworthy element",
      "community activation approach"
    ]
  },
  "executionPlan": {
    "week1": [
      "Day 1-2: Specific task",
      "Day 3-4: Specific task",
      "Day 5-7: Specific task"
    ],
    "week2_4": [
      "Week 2: Key focus and tasks",
      "Week 3: Key focus and tasks",
      "Week 4: Key focus and tasks"
    ],
    "month2": [
      "Week 5-6: Activities",
      "Week 7-8: Activities"
    ],
    "month3": [
      "Week 9-10: Activities",
      "Week 11-12: Activities and wrap-up"
    ],
    "ongoing": [
      "Daily monitoring task",
      "Weekly reporting task",
      "Continuous optimization task"
    ]
  }
}

Make the campaign innovative, culturally relevant, and highly executable. Base budget tiers on:
- Micro: <$10K
- Small: $10K-50K  
- Medium: $50K-250K
- Large: $250K-1M
- Enterprise: >$1M`;

    const result = await model.generateContent(campaignPrompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const campaignData = JSON.parse(text);
      res.status(200).json(campaignData);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Raw response:', text);
      res.status(500).json({ error: 'Failed to parse campaign data', rawResponse: text });
    }

  } catch (error) {
    console.error('Campaign Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate campaign', details: error.message });
  }
}
