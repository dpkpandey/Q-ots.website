// functions/api/auth/google.js
// Fixed Google OAuth implementation for Cloudflare Pages

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  // OAuth configuration
  const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = `${SITE_URL}/api/auth/google/callback`;
  
  if (!GOOGLE_CLIENT_ID) {
    return new Response('Google OAuth not configured', { status: 500 });
  }
  
  // Generate state token for CSRF protection
  const state = crypto.randomUUID();
  
  // Build Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  
  // Store state in cookie for validation
  const response = Response.redirect(authUrl.toString(), 302);
  response.headers.set('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  
  return response;
}
