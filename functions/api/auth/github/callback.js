// functions/api/auth/github/callback.js
// WORKING callback with proper redirect

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  console.log('🔄 GitHub callback received');
  
  if (error) {
    console.error('❌ OAuth error:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${SITE_URL}/?auth_error=${error}` }
    });
  }
  
  if (!code) {
    console.error('❌ No code');
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${SITE_URL}/?auth_error=no_code` }
    });
  }
  
  // Validate state
  const cookies = request.headers.get('Cookie') || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
  const savedState = stateCookie?.split('=')[1];
  
  if (!savedState || savedState !== state) {
    console.error('❌ State mismatch');
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${SITE_URL}/?auth_error=invalid_state` }
    });
  }
  
  try {
    // Exchange code for token
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
      console.error('❌ Token failed');
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${SITE_URL}/?auth_error=token_failed` }
      });
    }
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('❌ Token error:', tokens.error);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${SITE_URL}/?auth_error=${tokens.error}` }
      });
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
      console.error('❌ User info failed');
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${SITE_URL}/?auth_error=userinfo_failed` }
      });
    }
    
    const userInfo = await userResponse.json();
    
    // Get email
    let email = userInfo.email;
    if (!email) {
      try {
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
      } catch (e) {
        console.error('Email fetch error:', e);
      }
    }
    
    console.log('✅ User:', userInfo.login);
    
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
          String(userInfo.id),
          email || `${userInfo.login}@github.user`,
          userInfo.name || userInfo.login,
          userInfo.avatar_url,
          'github'
        ).run();
      } catch (e) {
        console.error('DB error:', e);
      }
    }
    
    // Create session
    const sessionToken = crypto.randomUUID();
    const sessionData = {
      userId: String(userInfo.id),
      email: email || `${userInfo.login}@github.user`,
      name: userInfo.name || userInfo.login,
      avatar: userInfo.avatar_url,
      provider: 'github',
      username: userInfo.login
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
    
    console.log('➡️ Redirecting to homepage');
    
    // CREATE PROPER REDIRECT RESPONSE
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': `${SITE_URL}/?auth_success=1`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    // Set cookies
    const cookieAge = 604800; // 7 days
    response.headers.append('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${cookieAge}`);
    response.headers.append('Set-Cookie', `user_data=${encodeURIComponent(JSON.stringify(sessionData))}; Path=/; Secure; SameSite=Lax; Max-Age=${cookieAge}`);
    response.headers.append('Set-Cookie', `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    
    return response;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${SITE_URL}/?auth_error=server_error` }
    });
  }
}
