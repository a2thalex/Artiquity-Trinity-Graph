// api/gemini/generate-campaign.js
// Campaign generation endpoint for Artiquity Trinity Graph

import { GoogleGenAI, Type } from "@google/genai";
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
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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
BRAND ELEMENTS: ${(identityElements || []).slice(0, 3).join(', ')}

Return JSON only:
{
  "campaign": {
    "id": "campaign_${Date.now()}",
    "creative_idea": "${idea}",
    "campaign_name": "memorable campaign name",
    "campaign_tagline": "powerful tagline",
    "campaign_type": "digital",
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
    "budget_tier": "medium",
    "budget_range": "$50K-250K",
    "duration": "90 Days",
    "success_metrics": ["Engagement rate", "Brand awareness", "Conversions"],
    "content_pillars": ["Brand story", "User engagement", "Cultural relevance"]
  },
  "executionPlan": {
    "week1": ["Campaign setup", "Content creation", "Platform preparation"],
    "week2_4": ["Content publishing", "Community engagement", "Performance monitoring"],
    "month2": ["Optimization", "Scaling", "Partnership development"],
    "month3": ["Analysis", "Reporting", "Next phase planning"],
    "ongoing": ["Community management", "Content updates", "Performance tracking"]
  }
}

Make it innovative, culturally relevant, and executable.`;

    console.log('Generating campaign with prompt length:', campaignPrompt.length);

    // Add timeout to prevent Heroku timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 35000) // 35 seconds
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: campaignPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    const text = result.text.trim();

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
