// functions/api/auth/google/callback.js
// FINAL FIX - Proper 302 redirect

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
  
  // Validate state
  const cookies = request.headers.get('Cookie') || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
  const savedState = stateCookie?.split('=')[1];
  
  if (!savedState || savedState !== state) {
    return Response.redirect(`${SITE_URL}/?auth_error=invalid_state`, 302);
  }
  
  try {
    // Exchange code for token
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
      return Response.redirect(`${SITE_URL}/?auth_error=token_failed`, 302);
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
    
    // Store user in database
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO users (id, email, name, avatar, provider, last_login)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          userInfo.id,
          userInfo.email,
          userInfo.name,
          userInfo.picture,
          'google'
        ).run();
      } catch (dbError) {
        console.error('DB error:', dbError);
      }
    }
    
    // Create session
    const sessionToken = crypto.randomUUID();
    const sessionData = {
      userId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture,
      provider: 'google'
    };
    
    // Store in KV if available
    if (env.SESSIONS) {
      try {
        await env.SESSIONS.put(sessionToken, JSON.stringify(sessionData), { 
          expirationTtl: 604800 
        });
      } catch (e) {
        console.error('KV error:', e);
      }
    }
    
    // Build redirect URL
    const redirectUrl = new URL(SITE_URL);
    redirectUrl.searchParams.set('auth_success', '1');
    
    // Create redirect response
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString()
      }
    });
    
    // Set multiple cookies
    const cookieOptions = 'Path=/; Secure; SameSite=Lax; Max-Age=604800';
    response.headers.append('Set-Cookie', `session=${sessionToken}; ${cookieOptions}; HttpOnly`);
    response.headers.append('Set-Cookie', `user_data=${encodeURIComponent(JSON.stringify(sessionData))}; ${cookieOptions}`);
    response.headers.append('Set-Cookie', `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    
    return response;
    
  } catch (error) {
    console.error('Callback error:', error);
    return Response.redirect(`${SITE_URL}/?auth_error=server_error`, 302);
  }
}
