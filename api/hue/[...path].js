// Vercel serverless function to proxy Hue API requests
// This is needed because Hue's API doesn't support CORS for browser requests

export const config = {
  runtime: 'edge',
};

const HUE_API_BASE = "https://api.meethue.com/route/api/0";

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Get the path from URL
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/\/api\/hue\/(.+)/);
    const apiPath = pathMatch ? pathMatch[1] : '';

    if (!apiPath) {
      return new Response(JSON.stringify({ error: 'Missing API path' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get authorization header from request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Build target URL
    const targetUrl = `${HUE_API_BASE}/${apiPath}`;
    
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

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Hue API proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy request failed', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
