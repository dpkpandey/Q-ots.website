// functions/api/auth/github.js
// ALL-IN-ONE OAuth handler

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  console.log('GitHub OAuth Handler - Has code:', !!code);
  
  if (error) {
    return Response.redirect(`${SITE_URL}/?auth_error=${encodeURIComponent(error)}`, 302);
  }
  
  // If no code, initiate OAuth
  if (!code) {
    const stateToken = crypto.randomUUID();
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${SITE_URL}/api/auth/github`);
    authUrl.searchParams.set('scope', 'read:user user:email');
    authUrl.searchParams.set('state', stateToken);
    
    const response = Response.redirect(authUrl.toString(), 302);
    response.headers.set('Set-Cookie', `oauth_state=${stateToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
    return response;
  }
  
  // Validate state
  const cookies = request.headers.get('Cookie') || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
  const savedState = stateCookie?.split('=')[1];
  
  if (!savedState || savedState !== state) {
    return Response.redirect(`${SITE_URL}/?auth_error=invalid_state`, 302);
  }
  
  try {
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
        redirect_uri: `${SITE_URL}/api/auth/github`
      })
    });
    
    if (!tokenResponse.ok) {
      return Response.redirect(`${SITE_URL}/?auth_error=token_failed`, 302);
    }
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      return Response.redirect(`${SITE_URL}/?auth_error=${encodeURIComponent(tokens.error)}`, 302);
    }
    
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
    
    console.log('User authenticated:', userInfo.login);
    
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO users (id, email, name, avatar, provider, last_login)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          String(userInfo.id),
          email || `${userInfo.login}@github.user`,
          userInfo.name || userInfo.login,
          userInfo.avatar_url,
          'github'
        ).run();
      } catch (dbError) {
        console.error('DB error:', dbError);
      }
    }
    
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
    
    const redirectUrl = `${SITE_URL}/?auth_success=1`;
    const response = new Response(null, {
      status: 302,
      headers: { 'Location': redirectUrl }
    });
    
    const cookieOpts = 'Path=/; Secure; SameSite=Lax; Max-Age=604800';
    response.headers.append('Set-Cookie', `session=${sessionToken}; ${cookieOpts}; HttpOnly`);
    response.headers.append('Set-Cookie', `user_data=${encodeURIComponent(JSON.stringify(sessionData))}; ${cookieOpts}`);
    response.headers.append('Set-Cookie', `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    
    console.log('Redirecting to:', redirectUrl);
    return response;
    
  } catch (error) {
    console.error('OAuth error:', error);
    return Response.redirect(`${SITE_URL}/?auth_error=server_error`, 302);
  }
}
