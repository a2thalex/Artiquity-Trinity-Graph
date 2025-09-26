// api/gemini/generate-contextual-campaign.js
// Enhanced context-aware campaign generation using specialized prompts

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
  }

  const { brandName, synchronicityDashboard, identityElements } = req.body;

  if (!brandName || !synchronicityDashboard) {
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

    console.log('Generating contextual campaign for:', brandName);
    console.log('Dashboard data:', JSON.stringify(synchronicityDashboard, null, 2));

    // Generate all campaign components in parallel
    const [adCopy, socialPlan, outreachTemplates, platformContent] = await Promise.all([
      generateAdCopy(model, brandName, synchronicityDashboard, identityElements),
      generateSocialPlan(model, brandName, synchronicityDashboard, identityElements),
      generateOutreachTemplates(model, brandName, synchronicityDashboard, identityElements),
      generatePlatformContent(model, brandName, synchronicityDashboard, identityElements)
    ]);

    const contextualCampaign = {
      success: true,
      brandName,
      generatedAt: new Date().toISOString(),
      campaign: {
        id: `contextual_campaign_${Date.now()}`,
        name: `${brandName} Contextual Campaign`,
        type: 'contextual_marketing',
        culturalContext: synchronicityDashboard.dashboard?.trendMatches || [],
        targetAudiences: synchronicityDashboard.dashboard?.audienceNodes || [],
        adCopy,
        socialPlan,
        outreachTemplates,
        platformContent,
        metadata: {
          identityElements: identityElements || [],
          generationMethod: 'context_aware_specialized_prompts',
          culturalAlignment: 'high'
        }
      }
    };

    console.log('Successfully generated contextual campaign');
    res.status(200).json(contextualCampaign);

  } catch (error) {
    console.error('Contextual Campaign Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate contextual campaign', 
      details: error.message 
    });
  }
}

// Generate targeted ad copy for each subculture
async function generateAdCopy(model, brandName, synchronicityDashboard, identityElements) {
  const audienceNodes = synchronicityDashboard.dashboard?.audienceNodes || [];
  const subcultures = audienceNodes.find(node => node.category === 'Subcultures')?.items || [];
  
  if (subcultures.length === 0) {
    return { note: 'No subcultures identified for targeted ad copy' };
  }

  const adCampaign = {};

  for (const subculture of subcultures.slice(0, 3)) { // Limit to 3 to avoid timeout
    try {
      const prompt = `
        **CONTEXT:**
        You are an expert copywriter for culturally-aware audiences. Here is the data for ${brandName}:
        ${JSON.stringify(synchronicityDashboard, null, 2)}
        
        Brand Identity Elements: ${identityElements?.join(', ') || 'Not specified'}

        **TASK:**
        Write 3 distinct ad copy variations specifically for the "${subculture}" subculture.
        The copy should be concise, powerful, and directly appeal to the values and interests of this group.
        Focus on the aspects of the brand/artwork they would find most compelling.
        
        **OUTPUT FORMAT (JSON only):**
        {
          "variation_1": { "headline": "...", "body": "...", "cta": "..." },
          "variation_2": { "headline": "...", "body": "...", "cta": "..." },
          "variation_3": { "headline": "...", "body": "...", "cta": "..." }
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Clean JSON response
      let cleanText = responseText;
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      adCampaign[subculture] = JSON.parse(cleanText);
    } catch (error) {
      console.error(`Error generating ad copy for ${subculture}:`, error);
      adCampaign[subculture] = {
        error: `Failed to generate ad copy for ${subculture}`,
        fallback: {
          variation_1: {
            headline: `${brandName} for ${subculture}`,
            body: `Discover authentic creative expression that resonates with your community.`,
            cta: `Explore Now`
          }
        }
      };
    }
  }

  return adCampaign;
}

// Generate social media content plan
async function generateSocialPlan(model, brandName, synchronicityDashboard, identityElements) {
  const prompt = `
    **CONTEXT:**
    You are a social media strategist specializing in art and culture. You have been given a full analysis of ${brandName}:
    ${JSON.stringify(synchronicityDashboard, null, 2)}
    
    Brand Identity Elements: ${identityElements?.join(', ') || 'Not specified'}

    **TASK:**
    Generate a 7-day social media content plan to launch this brand/artwork.
    - Use the "trendMatches" as thematic inspiration for the posts.
    - Use the "formatSuggestions" to guide the type of content for each day.
    - The plan should be engaging and build momentum.
    
    **OUTPUT FORMAT (JSON only):**
    [
      {
        "day": 1,
        "platform": "Instagram",
        "format": "Image Carousel",
        "theme": "Introduction & Cultural Context",
        "content_idea": "Detailed content description",
        "sample_caption": "Actual caption text with hashtags",
        "timing": "Best time to post"
      }
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    let cleanText = responseText;
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error generating social plan:', error);
    return {
      error: 'Failed to generate social media plan',
      fallback: [
        {
          day: 1,
          platform: 'Instagram',
          format: 'Image Post',
          theme: 'Brand Introduction',
          content_idea: `Introduce ${brandName} with key visual elements`,
          sample_caption: `Introducing ${brandName} - where authenticity meets innovation. #NewBrand #Authentic`,
          timing: '10:00 AM'
        }
      ]
    };
  }
}

// Generate influencer outreach templates
async function generateOutreachTemplates(model, brandName, synchronicityDashboard, identityElements) {
  const audienceNodes = synchronicityDashboard.dashboard?.audienceNodes || [];
  const influencers = audienceNodes.find(node => node.category === 'Influencers/Tastemakers')?.items || [];
  
  if (influencers.length === 0) {
    return { note: 'No influencers identified for outreach templates' };
  }

  const outreachCampaign = {};

  for (const influencer of influencers.slice(0, 3)) { // Limit to 3
    try {
      const prompt = `
        **CONTEXT:**
        You are a professional brand manager. Here is the data for ${brandName}:
        ${JSON.stringify(synchronicityDashboard, null, 2)}
        
        Brand Identity Elements: ${identityElements?.join(', ') || 'Not specified'}

        **TASK:**
        Write a personalized, concise, and authentic outreach message (DM/email) to the influencer: "${influencer}".

        The message must:
        1. Acknowledge their specific niche and content style.
        2. Briefly explain ${brandName} and why it aligns with their audience.
        3. Clearly state WHY their specific audience would be interested.
        4. Be respectful of their time and not sound like spam.
        5. End with a clear, low-pressure call to action.

        **OUTPUT FORMAT (JSON only):**
        {
          "subject": "Email subject line",
          "body": "Full message body",
          "follow_up": "Optional follow-up message if no response"
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      let cleanText = responseText;
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      outreachCampaign[influencer] = JSON.parse(cleanText);
    } catch (error) {
      console.error(`Error generating outreach for ${influencer}:`, error);
      outreachCampaign[influencer] = {
        error: `Failed to generate outreach for ${influencer}`,
        fallback: {
          subject: `Partnership opportunity with ${brandName}`,
          body: `Hi! I've been following your content and think ${brandName} would resonate with your audience. Would you be interested in learning more?`,
          follow_up: `Just wanted to follow up on my previous message about ${brandName}. No pressure, but happy to share more details if you're interested.`
        }
      };
    }
  }

  return outreachCampaign;
}

// Generate platform-specific content
async function generatePlatformContent(model, brandName, synchronicityDashboard, identityElements) {
  const platforms = synchronicityDashboard.dashboard?.audienceNodes?.find(node => node.category === 'Platforms')?.items || ['Instagram', 'TikTok', 'Website'];
  
  const prompt = `
    **CONTEXT:**
    You are a content strategist. Here is the data for ${brandName}:
    ${JSON.stringify(synchronicityDashboard, null, 2)}
    
    Brand Identity Elements: ${identityElements?.join(', ') || 'Not specified'}
    Target Platforms: ${platforms.join(', ')}

    **TASK:**
    Generate platform-specific content strategies for each platform.
    Consider the unique characteristics and audience behavior of each platform.
    
    **OUTPUT FORMAT (JSON only):**
    {
      "platform_name": {
        "content_strategy": "Overall approach for this platform",
        "content_types": ["type1", "type2", "type3"],
        "posting_frequency": "How often to post",
        "engagement_tactics": ["tactic1", "tactic2"],
        "success_metrics": ["metric1", "metric2"]
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    let cleanText = responseText;
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error generating platform content:', error);
    return {
      error: 'Failed to generate platform content',
      fallback: {
        Instagram: {
          content_strategy: 'Visual storytelling with high-quality imagery',
          content_types: ['Image posts', 'Stories', 'Reels'],
          posting_frequency: 'Daily',
          engagement_tactics: ['Hashtag strategy', 'Story interactions'],
          success_metrics: ['Engagement rate', 'Reach', 'Saves']
        }
      }
    };
  }
}
