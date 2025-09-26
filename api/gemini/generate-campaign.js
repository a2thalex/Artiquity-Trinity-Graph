// api/gemini/generate-campaign.js
// Campaign generation endpoint for Artiquity Trinity Graph

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

// Access the API Key securely from environment variables
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
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Extract data safely from synchronicity result
    const idea = synchronicityResult.idea || 'Creative concept';
    const score = synchronicityResult.score || 85;
    const rationale = synchronicityResult.rationale || 'Strong cultural alignment';
    
    // Extract trend data from dashboard if available
    const dashboard = synchronicityResult.dashboard || {};
    const trendMatches = dashboard.trendMatches || [];
    const audienceNodes = dashboard.audienceNodes || [];
    const formatSuggestions = dashboard.formatSuggestions || [];
    
    const campaignPrompt = `
Create a campaign strategy for ${brandName}.

CREATIVE IDEA: ${idea}
SCORE: ${score}/100
BRAND ELEMENTS: ${identityElements.slice(0, 3).join(', ')}

Generate a focused campaign strategy with:

Return JSON:
{
  "campaign": {
    "id": "campaign_${Date.now()}",
    "creative_idea": "${idea}",
    "campaign_name": "memorable name",
    "campaign_tagline": "powerful tagline",
    "campaign_type": "hybrid",
    "platforms": ["Instagram", "TikTok", "Website"],
    "target_audience": {
      "primary": "main audience description",
      "demographics": ["25-35", "Urban", "College+"],
      "psychographics": ["Creative", "Tech-savvy", "Trend-conscious"]
    },
    "key_messages": [
      "core message 1",
      "core message 2",
      "core message 3"
    ],
    "timeline": [
      {
        "phase": "Launch",
        "duration": "Weeks 1-2",
        "activities": ["activity 1", "activity 2"]
      },
      {
        "phase": "Amplify",
        "duration": "Weeks 3-6",
        "activities": ["engagement 1", "engagement 2"]
      },
      {
        "phase": "Convert",
        "duration": "Weeks 7-12",
        "activities": ["conversion 1", "sustain"]
      }
    ],
    "budget_tier": "medium",
    "budget_range": "$80,000 - $180,000",
    "duration": "90 Days",
    "kpis": [
      {
        "metric": "Reach",
        "target": "500K impressions"
      },
      {
        "metric": "Engagement",
        "target": "5% rate"
      },
      {
        "metric": "Conversions",
        "target": "2,500 actions"
      }
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

    console.log('Generating campaign with prompt length:', campaignPrompt.length);

    // Add timeout to prevent Heroku timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 25000) // 25 seconds
    );

    const generatePromise = model.generateContent(campaignPrompt);

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

    console.log('Raw campaign response:', text.substring(0, 500) + '...');

    try {
      // Clean the response text to ensure it's valid JSON
      let cleanText = text.trim();

      // Remove any markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const campaignData = JSON.parse(cleanText);

      // Ensure the response has the expected structure
      if (!campaignData.campaign) {
        throw new Error('Invalid campaign structure: missing campaign object');
      }

      console.log('Successfully parsed campaign data');
      res.status(200).json(campaignData);

    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Raw response (first 1000 chars):', text.substring(0, 1000));

      // Fallback: create a basic campaign structure
      const fallbackCampaign = {
        campaign: {
          id: `campaign_${Date.now()}`,
          creative_idea: synchronicityResult.idea || 'Creative concept',
          campaign_name: `${brandName} Campaign`,
          campaign_tagline: 'Innovative brand experience',
          campaign_type: 'digital',
          platforms: ['Instagram', 'TikTok', 'Website'],
          target_audience: {
            primary: 'Creative professionals and art enthusiasts',
            secondary: ['Digital natives', 'Cultural trendsetters'],
            demographics: ['25-45 years', 'Urban areas', 'College educated'],
            psychographics: ['Innovation-focused', 'Aesthetically driven', 'Culturally aware']
          },
          key_messages: ['Authentic creativity', 'Cultural relevance', 'Innovative expression'],
          budget_tier: 'small',
          estimated_budget_range: '$10K-50K',
          success_metrics: ['Engagement rate', 'Brand awareness', 'Creative impact']
        },
        executionPlan: {
          week1: ['Campaign setup', 'Content creation', 'Platform preparation'],
          week2_4: ['Content publishing', 'Community engagement', 'Performance monitoring'],
          month2: ['Optimization', 'Scaling', 'Partnership development'],
          month3: ['Analysis', 'Reporting', 'Next phase planning'],
          ongoing: ['Community management', 'Content updates', 'Performance tracking']
        }
      };

      console.log('Using fallback campaign structure');
      res.status(200).json(fallbackCampaign);
    }

  } catch (error) {
    console.error('Campaign Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate campaign', details: error.message });
  }
}
