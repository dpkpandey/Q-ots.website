// functions/api/auth/github/callback.js
// Fixed GitHub OAuth callback handler

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
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${SITE_URL}/api/auth/github/callback`
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return Response.redirect(`${SITE_URL}/?auth_error=token_exchange_failed`, 302);
    }
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('Token error:', tokens.error);
      return Response.redirect(`${SITE_URL}/?auth_error=${encodeURIComponent(tokens.error)}`, 302);
    }
    
    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Q-OTS-Website'
      }
    });
    
    if (!userResponse.ok) {
      return Response.redirect(`${SITE_URL}/?auth_error=userinfo_failed`, 302);
    }
    
    const userInfo = await userResponse.json();
    
    // Get user email if not public
    let email = userInfo.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Q-OTS-Website'
        }
      });
      
      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(e => e.primary) || emails[0];
        email = primaryEmail?.email;
      }
    }
    
    // Store user in D1 database
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO users (id, email, name, avatar, provider, created_at, last_login)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          String(userInfo.id),
          email || `${userInfo.login}@github.user`,
          userInfo.name || userInfo.login,
          userInfo.avatar_url,
          'github'
        ).run();
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue anyway - don't block login
      }
    }
    
    // Create session token
    const sessionToken = crypto.randomUUID();
    const sessionData = JSON.stringify({
      userId: String(userInfo.id),
      email: email || `${userInfo.login}@github.user`,
      name: userInfo.name || userInfo.login,
      avatar: userInfo.avatar_url,
      provider: 'github',
      username: userInfo.login
    });
    
    // Store session in KV (if available)
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
