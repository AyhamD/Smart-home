// Vercel serverless function to proxy Hue API requests
// This is needed because Hue's API doesn't support CORS for browser requests

export const config = {
  runtime: 'edge',
};

const HUE_API_BASE = "https://api.meethue.com/route/api/0";

export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get the path from URL - handle both /api/hue/lights and /api/hue/lights/ etc.
    const url = new URL(request.url);
    // Remove /api/hue prefix to get the actual path
    let apiPath = url.pathname.replace(/^\/api\/hue\/?/, '');
    
    console.log('[Hue Proxy] Request URL:', request.url);
    console.log('[Hue Proxy] API Path:', apiPath);

    if (!apiPath) {
      return new Response(JSON.stringify({ error: 'Missing API path', url: request.url }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get authorization header from request
    const authHeader = request.headers.get('Authorization');
    console.log('[Hue Proxy] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Build target URL
    const targetUrl = `${HUE_API_BASE}/${apiPath}`;
    console.log('[Hue Proxy] Target URL:', targetUrl);
    
    // Forward the request to Hue API
    const fetchOptions = {
      method: request.method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    };

    // Include body for POST/PUT requests
    if (request.method === 'POST' || request.method === 'PUT') {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    console.log('[Hue Proxy] Fetching from Hue API...');
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    
    console.log('[Hue Proxy] Response status:', response.status);
    console.log('[Hue Proxy] Response preview:', data.substring(0, 200));

    return new Response(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('[Hue Proxy] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Proxy request failed', 
      details: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
