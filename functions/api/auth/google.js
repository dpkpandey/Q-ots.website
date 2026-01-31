// functions/api/auth/google.js
// OAuth initiator - redirects to Google

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  console.log('🔐 Google OAuth initiator');
  
  // Create state token for CSRF protection
  const stateToken = crypto.randomUUID();
  
  // Build Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', `${SITE_URL}/api/auth/google/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', stateToken);
  authUrl.searchParams.set('access_type', 'online');
  
  console.log('➡️ Redirecting to Google');
  console.log('   Redirect URI:', `${SITE_URL}/api/auth/google/callback`);
  
  // Create redirect response
  const response = new Response(null, {
    status: 302,
    headers: { 'Location': authUrl.toString() }
  });
  
  // Set state cookie
  response.headers.set('Set-Cookie', `oauth_state=${stateToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  
  return response;
}
