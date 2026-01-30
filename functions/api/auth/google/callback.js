// functions/api/auth/google/callback.js
// Fixed Google OAuth callback handler

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  // Handle OAuth errors
  if (error) {
    return Response.redirect(`${SITE_URL}/?auth_error=${encodeURIComponent(error)}`, 302);
  }
  
  if (!code) {
    return Response.redirect(`${SITE_URL}/?auth_error=no_code`, 302);
  }
  
  // Validate state (CSRF protection)
  const cookies = request.headers.get('Cookie') || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
  const savedState = stateCookie?.split('=')[1];
  
  if (!savedState || savedState !== state) {
    return Response.redirect(`${SITE_URL}/?auth_error=invalid_state`, 302);
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${SITE_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return Response.redirect(`${SITE_URL}/?auth_error=token_exchange_failed`, 302);
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    if (!userResponse.ok) {
      return Response.redirect(`${SITE_URL}/?auth_error=userinfo_failed`, 302);
    }
    
    const userInfo = await userResponse.json();
    
    // Store user in D1 database
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO users (id, email, name, avatar, provider, created_at, last_login)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          userInfo.id,
          userInfo.email,
          userInfo.name,
          userInfo.picture,
          'google'
        ).run();
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue anyway - don't block login
      }
    }
    
    // Create session token
    const sessionToken = crypto.randomUUID();
    const sessionData = JSON.stringify({
      userId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture,
      provider: 'google'
    });
    
    // Store session in KV (if available) or cookie
    if (env.SESSIONS) {
      await env.SESSIONS.put(sessionToken, sessionData, { expirationTtl: 86400 * 7 }); // 7 days
    }
    
    // Set session cookie
    const response = Response.redirect(`${SITE_URL}/?auth_success=1`, 302);
    response.headers.set('Set-Cookie', [
      `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`,
      `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`, // Clear state cookie
      `user_data=${encodeURIComponent(sessionData)}; Path=/; Secure; SameSite=Lax; Max-Age=${86400 * 7}` // Non-HttpOnly for JS access
    ].join(', '));
    
    return response;
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(`${SITE_URL}/?auth_error=server_error`, 302);
  }
}
