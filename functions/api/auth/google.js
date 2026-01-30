// functions/api/auth/google.js
// All-in-one Google OAuth handler (no separate callback file needed)

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const SITE_URL = env.SITE_URL || url.origin;
  
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  console.log('🔐 Google OAuth - Has code:', !!code);
  
  // Handle OAuth error from Google
  if (error) {
    console.error('❌ OAuth error:', error);
    return Response.redirect(`${SITE_URL}/?auth_error=${encodeURIComponent(error)}`, 302);
  }
  
  // STEP 1: No code = Initiate OAuth flow
  if (!code) {
    const stateToken = crypto.randomUUID();
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${SITE_URL}/api/auth/google`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', stateToken);
    authUrl.searchParams.set('access_type', 'online');
    
    console.log('➡️  Redirecting to Google');
    
    const response = Response.redirect(authUrl.toString(), 302);
    response.headers.set('Set-Cookie', `oauth_state=${stateToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
    return response;
  }
  
  // STEP 2: Validate state token (CSRF protection)
  const cookies = request.headers.get('Cookie') || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
  const savedState = stateCookie?.split('=')[1];
  
  if (!savedState || savedState !== state) {
    console.error('❌ State mismatch');
    return Response.redirect(`${SITE_URL}/?auth_error=invalid_state`, 302);
  }
  
  // STEP 3: Exchange code for access token
  try {
    console.log('🔄 Exchanging code for token');
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${SITE_URL}/api/auth/google`,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      return Response.redirect(`${SITE_URL}/?auth_error=token_failed`, 302);
    }
    
    const tokens = await tokenResponse.json();
    console.log('✅ Token received');
    
    // STEP 4: Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    if (!userResponse.ok) {
      console.error('❌ Failed to get user info');
      return Response.redirect(`${SITE_URL}/?auth_error=userinfo_failed`, 302);
    }
    
    const userInfo = await userResponse.json();
    console.log('✅ User authenticated:', userInfo.email);
    
    // STEP 5: Save user to database
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
        
        console.log('✅ User saved to database');
      } catch (dbError) {
        console.error('⚠️  Database error (non-critical):', dbError);
      }
    }
    
    // STEP 6: Create session
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
          expirationTtl: 604800  // 7 days
        });
        console.log('✅ Session stored in KV');
      } catch (kvError) {
        console.error('⚠️  KV error (non-critical):', kvError);
      }
    }
    
    // STEP 7: Redirect to homepage with session cookies
    console.log('➡️  Redirecting to homepage');
    
    const redirectUrl = `${SITE_URL}/?auth_success=1`;
    const response = new Response(null, {
      status: 302,
      headers: { 'Location': redirectUrl }
    });
    
    // Set cookies
    const cookieOpts = 'Path=/; Secure; SameSite=Lax; Max-Age=604800';  // 7 days
    response.headers.append('Set-Cookie', `session=${sessionToken}; ${cookieOpts}; HttpOnly`);
    response.headers.append('Set-Cookie', `user_data=${encodeURIComponent(JSON.stringify(sessionData))}; ${cookieOpts}`);
    response.headers.append('Set-Cookie', `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    
    return response;
    
  } catch (error) {
    console.error('❌ OAuth error:', error);
    return Response.redirect(`${SITE_URL}/?auth_error=server_error`, 302);
  }
}
