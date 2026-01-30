// functions/api/auth/google/callback.js
// SIMPLIFIED - Guaranteed redirect version

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  console.log('🔄 Callback received');
  
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  // Handle OAuth errors
  if (error) {
    console.error('❌ OAuth error:', error);
    return Response.redirect(`${SITE_URL}?auth_error=${encodeURIComponent(error)}`, 302);
  }
  
  if (!code) {
    console.error('❌ No code received');
    return Response.redirect(`${SITE_URL}?auth_error=no_code`, 302);
  }
  
  // Validate state (CSRF protection)
  const cookies = request.headers.get('Cookie') || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
  const savedState = stateCookie?.split('=')[1];
  
  if (!savedState || savedState !== state) {
    console.error('❌ State mismatch');
    return Response.redirect(`${SITE_URL}?auth_error=invalid_state`, 302);
  }
  
  try {
    console.log('🔄 Exchanging code for token');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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
      console.error('❌ Token exchange failed:', errorText);
      return Response.redirect(`${SITE_URL}?auth_error=token_failed`, 302);
    }
    
    const tokens = await tokenResponse.json();
    console.log('✅ Token received');
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    if (!userResponse.ok) {
      console.error('❌ Failed to get user info');
      return Response.redirect(`${SITE_URL}?auth_error=userinfo_failed`, 302);
    }
    
    const userInfo = await userResponse.json();
    console.log('✅ User info received:', userInfo.email);
    
    // Store user in database if available
    if (env.DB) {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            avatar TEXT,
            provider TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        
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
        
        console.log('✅ User saved to database');
      } catch (dbError) {
        console.error('⚠️ Database error (non-critical):', dbError);
      }
    }
    
    // Create session
    const sessionToken = crypto.randomUUID();
    const sessionData = JSON.stringify({
      userId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture,
      provider: 'google'
    });
    
    // Store in KV if available
    if (env.SESSIONS) {
      try {
        await env.SESSIONS.put(sessionToken, sessionData, { expirationTtl: 86400 * 7 });
        console.log('✅ Session stored in KV');
      } catch (kvError) {
        console.error('⚠️ KV error (non-critical):', kvError);
      }
    }
    
    console.log('➡️ Redirecting to:', SITE_URL);
    
    // Create redirect response with cookies
    const redirectUrl = `${SITE_URL}?auth_success=1`;
    const response = Response.redirect(redirectUrl, 302);
    
    // Set cookies
    response.headers.append('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`);
    response.headers.append('Set-Cookie', `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    response.headers.append('Set-Cookie', `user_data=${encodeURIComponent(sessionData)}; Path=/; Secure; SameSite=Lax; Max-Age=${86400 * 7}`);
    
    return response;
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return Response.redirect(`${SITE_URL}?auth_error=server_error`, 302);
  }
}
