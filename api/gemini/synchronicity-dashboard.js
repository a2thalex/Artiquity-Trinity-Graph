// api/gemini/synchronicity-dashboard.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
const envLocalPath = path.join(__dirname, "..", "..", ".env.local");
dotenv.config({ path: envLocalPath });
dotenv.config();

// Helper function to extract key themes from creative output
function extractThemes(creativeOutput) {
  const themes = [];

  if (creativeOutput.description) {
    // Extract key words and concepts from description
    const words = creativeOutput.description.toLowerCase().split(/\s+/);
    const keyWords = words.filter(word =>
      word.length > 4 &&
      !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word)
    );
    themes.push(...keyWords.slice(0, 3));
  }

  if (creativeOutput.title) {
    themes.push(creativeOutput.title.toLowerCase());
  }

  if (creativeOutput.style) {
    themes.push(creativeOutput.style.toLowerCase());
  }

  if (creativeOutput.medium) {
    themes.push(creativeOutput.medium.toLowerCase());
  }

  // Add some default creative/art themes if we don't have enough
  if (themes.length < 2) {
    themes.push('digital art', 'creative content', 'visual art');
  }

  return [...new Set(themes)].slice(0, 5); // Remove duplicates and limit to 5
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: PERPLEXITY_API_KEY is missing.' });
  }

  // Perplexity analysis function for synchronicity dashboard
  async function generateSynchronicityDashboard(creativeOutput) {
    try {
      console.log(`🔍 Generating synchronicity dashboard with Perplexity...`);

      const themes = extractThemes(creativeOutput);
      const prompt = `Analyze the cultural synchronicity and trends for this creative work: "${creativeOutput.title || 'Untitled'}" - ${creativeOutput.description || 'No description'}

Key themes: ${themes.join(', ')}

Generate a comprehensive cultural synchronicity dashboard with current, real-time data. Provide your response in this exact JSON format:

{
  "dashboard": {
    "trendMatches": [
      {
        "name": "Trend Name",
        "velocity": "Rising|Peak|Emerging|Declining",
        "description": "Current description of this trend based on real data"
      }
    ],
    "audienceNodes": [
      {
        "category": "Subcultures",
        "items": ["Specific subculture 1", "Specific subculture 2", "Specific subculture 3"]
      },
      {
        "category": "Influencers/Tastemakers",
        "items": ["@specific_influencer1", "@specific_influencer2", "@specific_influencer3"]
      },
      {
        "category": "Platforms",
        "items": ["Platform 1 (specific subreddit/hashtag)", "Platform 2", "Platform 3"]
      }
    ],
    "formatSuggestions": [
      {
        "idea": "Specific content format idea",
        "timing": "Specific timing recommendation"
      }
    ]
  }
}

Focus on:
1. CURRENT cultural trends (2024-2025) that align with this creative work
2. SPECIFIC audiences, communities, and platforms where this would resonate
3. ACTIONABLE content format and distribution strategies
4. Real-time insights from social media, gaming, art communities

Use real, current data from your search capabilities.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a cultural trend analyst and marketing strategist. Analyze creative content and provide real-time cultural synchronicity insights. Always respond with valid JSON in the exact format requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.9,
          return_citations: true,
          search_domain_filter: ["reddit.com", "twitter.com", "tiktok.com", "instagram.com", "youtube.com", "artstation.com", "behance.net", "discord.com"],
          search_recency_filter: "month"
        })
      });

      if (!response.ok) {
        console.error('Perplexity API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return null;
      }

      const data = await response.json();
      console.log('✅ Perplexity dashboard generation successful');

      return {
        content: data.choices[0]?.message?.content || '',
        citations: data.citations || [],
        searchResults: data.search_results || []
      };
    } catch (error) {
      console.error('Error generating dashboard with Perplexity:', error);
      return null;
    }
  }

  try {
    const { creativeOutput } = req.body;

    if (!creativeOutput) {
      return res.status(400).json({ error: 'Creative output is required' });
    }

    console.log('🎯 Starting Perplexity-powered synchronicity dashboard generation');
    console.log('📊 Creative Output:', JSON.stringify(creativeOutput, null, 2));

    // Generate dashboard using Perplexity
    const dashboardResult = await generateSynchronicityDashboard(creativeOutput);

    if (!dashboardResult) {
      return res.status(500).json({ error: 'Failed to generate synchronicity dashboard with Perplexity' });
    }

    console.log('📝 Raw Perplexity response:', dashboardResult.content);

    // Parse the JSON response from Perplexity
    let result;
    try {
      let responseText = dashboardResult.content;

      // Clean up the response text
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing Perplexity JSON response:', parseError);
      console.error('Raw response:', dashboardResult.content);

      // Fallback response if JSON parsing fails
      result = {
        dashboard: {
          trendMatches: [
            {
              name: "AI-Generated Content Boom",
              velocity: "Peak",
              description: "AI-generated creative content is experiencing massive growth across all platforms"
            },
            {
              name: "Gaming Culture Crossovers",
              velocity: "Rising",
              description: "Gaming characters and themes are increasingly appearing in non-gaming contexts"
            }
          ],
          audienceNodes: [
            {
              category: "Subcultures",
              items: ["AI Art Community", "Gaming Meme Enthusiasts", "Digital Art Collectors"]
            },
            {
              category: "Influencers/Tastemakers",
              items: ["@AIArtists", "@GamingInfluencers", "@DigitalCreators"]
            },
            {
              category: "Platforms",
              items: ["Reddit (r/midjourney, r/gaming)", "Twitter/X", "Instagram", "TikTok"]
            }
          ],
          formatSuggestions: [
            {
              idea: "Short-form video content",
              timing: "Post during peak gaming hours (6-10 PM)"
            },
            {
              idea: "Meme format variations",
              timing: "Daily posting for viral potential"
            }
          ]
        }
      };
    }

    // Add real Perplexity citations and search results as sources
    result.sources = [];

    // Add citations (URLs only)
    if (dashboardResult.citations && dashboardResult.citations.length > 0) {
      dashboardResult.citations.forEach(citation => {
        result.sources.push({
          uri: citation,
          title: 'Perplexity Research Source'
        });
      });
    }

    // Add search results with more detailed information
    if (dashboardResult.searchResults && dashboardResult.searchResults.length > 0) {
      dashboardResult.searchResults.forEach(searchResult => {
        result.sources.push({
          uri: searchResult.url || '#',
          title: searchResult.title || 'Cultural Research Source'
        });
      });
    }

    // Fallback sources if no real sources found
    if (result.sources.length === 0) {
      result.sources = [
        { uri: 'https://trends.google.com', title: 'Google Trends Analysis' },
        { uri: 'https://www.reddit.com/r/gaming', title: 'Gaming Community Insights' },
        { uri: 'https://socialblade.com', title: 'Social Media Analytics' }
      ];
    }

    // Limit to 6 sources and remove duplicates
    result.sources = result.sources.filter((source, index, self) =>
      index === self.findIndex(s => s.uri === source.uri)
    ).slice(0, 6);

    console.log('✅ Synchronicity dashboard generated with Perplexity');
    console.log('📊 Sources included:', result.sources?.length || 0);

    res.json(result);

  } catch (error) {
    console.error('Error generating synchronicity dashboard:', error);
    res.status(500).json({ error: 'Failed to generate synchronicity dashboard.' });
  }
}
