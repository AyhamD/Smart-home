// Vercel serverless function to proxy Hue OAuth token exchange
// This is needed because Hue's token endpoint doesn't support CORS

export const config = {
  runtime: 'edge',
};

const HUE_TOKEN_URL = "https://api.meethue.com/v2/oauth2/token";

export default async function handler(request) {
  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { code, redirect_uri, grant_type, refresh_token } = body;

    // Get credentials from environment
    const clientId = process.env.VITE_HUE_CLIENT_ID;
    const clientSecret = process.env.VITE_HUE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'Hue credentials not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build request body based on grant type
    const params = new URLSearchParams();
    params.append('grant_type', grant_type || 'authorization_code');
    
    if (grant_type === 'refresh_token' && refresh_token) {
      params.append('refresh_token', refresh_token);
    } else if (code) {
      params.append('code', code);
      if (redirect_uri) {
        params.append('redirect_uri', redirect_uri);
      }
    }

    // Basic auth header
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Call Hue API
    const response = await fetch(HUE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    // Return response with CORS headers
    return new Response(JSON.stringify(data), {
      status: response.ok ? 200 : response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Token proxy error:', error);
    return new Response(JSON.stringify({ error: 'Token exchange failed', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
