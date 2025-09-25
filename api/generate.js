// api/generate.js

// Access the API Key securely from Vercel's environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

// The handler function for the Vercel Serverless Function
export default async function handler(req, res) {
  // Check that the function is a POST request (standard for sending data)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ensure the secret key is available
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
  }

  // Extract the prompt or data sent from your frontend
  // NOTE: You may need to adapt this depending on how your frontend sends data
  const { prompt } = req.body; 

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body.' });
  }

  try {
    // Call the external Gemini API securely from the server
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass the API Key in the x-goog-api-key header for Gemini API
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        // Structure the request body as required by the Gemini API
        contents: [{ 
          role: "user", 
          parts: [{ text: prompt }] 
        }]
      })
    });

    // Handle non-successful API responses
    if (!response.ok) {
        // Read error details from Gemini API response
        const errorDetails = await response.text();
        return res.status(response.status).json({ 
          error: 'External API call failed.', 
          details: errorDetails 
        });
    }

    // Pass the successful response back to the frontend
    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy Function Error:', error);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
}
