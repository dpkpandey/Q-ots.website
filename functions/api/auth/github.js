// functions/api/auth/github.js
// OAuth initiator - redirects to GitHub

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  console.log('🔐 GitHub OAuth initiator');
  
  // Create state token for CSRF protection
  const stateToken = crypto.randomUUID();
  
  // Build GitHub OAuth URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', `${SITE_URL}/api/auth/github/callback`);
  authUrl.searchParams.set('scope', 'read:user user:email');
  authUrl.searchParams.set('state', stateToken);
  
  console.log('➡️ Redirecting to GitHub');
  console.log('   Redirect URI:', `${SITE_URL}/api/auth/github/callback`);
  
  // Create redirect response
  const response = new Response(null, {
    status: 302,
    headers: { 'Location': authUrl.toString() }
  });
  
  // Set state cookie
  response.headers.set('Set-Cookie', `oauth_state=${stateToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  
  return response;
}
