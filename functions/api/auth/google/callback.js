// functions/api/auth/google/callback.js
// FINAL FIX - JavaScript redirect that Cloudflare can't block

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  if (error) {
    return createRedirectPage(`${SITE_URL}/?auth_error=${error}`);
  }
  
  if (!code) {
    return createRedirectPage(`${SITE_URL}/?auth_error=no_code`);
  }
  
  // Validate state
  const cookies = request.headers.get('Cookie') || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
  const savedState = stateCookie?.split('=')[1];
  
  if (!savedState || savedState !== state) {
    return createRedirectPage(`${SITE_URL}/?auth_error=invalid_state`);
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
      return createRedirectPage(`${SITE_URL}/?auth_error=token_failed`);
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    if (!userResponse.ok) {
      return createRedirectPage(`${SITE_URL}/?auth_error=userinfo_failed`);
    }
    
    const userInfo = await userResponse.json();
    
    // Save to database
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO users (id, email, name, avatar, provider, last_login)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            email = excluded.email,
            name = excluded.name,
            avatar = excluded.avatar,
            last_login = datetime('now')
        `).bind(
          userInfo.id,
          userInfo.email,
          userInfo.name,
          userInfo.picture,
          'google'
        ).run();
      } catch (e) {
        console.error('DB error:', e);
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
    
    if (env.SESSIONS) {
      try {
        await env.SESSIONS.put(sessionToken, JSON.stringify(sessionData), { 
          expirationTtl: 604800 
        });
      } catch (e) {
        console.error('KV error:', e);
      }
    }
    
    // Create redirect page with cookies
    const response = createRedirectPage(`${SITE_URL}/?auth_success=1`);
    
    // Set cookies
    const cookieAge = 604800;
    response.headers.append('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${cookieAge}`);
    response.headers.append('Set-Cookie', `user_data=${encodeURIComponent(JSON.stringify(sessionData))}; Path=/; Secure; SameSite=Lax; Max-Age=${cookieAge}`);
    response.headers.append('Set-Cookie', `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    
    return response;
    
  } catch (error) {
    console.error('Error:', error);
    return createRedirectPage(`${SITE_URL}/?auth_error=server_error`);
  }
}

function createRedirectPage(redirectUrl) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redirecting...</title>
  <script>
    // Immediate redirect
    window.location.replace("${redirectUrl}");
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  </noscript>
</head>
<body>
  <p>Redirecting to homepage...</p>
  <p>If not redirected, <a href="${redirectUrl}">click here</a>.</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
