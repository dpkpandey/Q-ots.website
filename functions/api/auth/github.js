// functions/api/auth/github.js
// Fixed GitHub OAuth implementation

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  // OAuth configuration
  const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID;
  const REDIRECT_URI = `${SITE_URL}/api/auth/github/callback`;
  
  if (!GITHUB_CLIENT_ID) {
    return new Response('GitHub OAuth not configured', { status: 500 });
  }
  
  // Generate state token for CSRF protection
  const state = crypto.randomUUID();
  
  // Build GitHub OAuth URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'user:email');
  authUrl.searchParams.set('state', state);
  
  // Store state in cookie for validation
  const response = Response.redirect(authUrl.toString(), 302);
  response.headers.set('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  
  return response;
}
