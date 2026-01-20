// functions/api/auth/google.js
// FIXED Google OAuth Handler - Redirects to homepage properly

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    
    // Get the base site URL (homepage)
    const siteUrl = env.SITE_URL || url.origin;
    
    console.log('🔐 Google OAuth - URL:', url.pathname);
    
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    // Handle error from Google
    if (error) {
        console.error('❌ Google Error:', error);
        return Response.redirect(`${siteUrl}?auth=error&message=${error}`, 302);
    }
    
    // If no code, redirect to Google
    if (!code) {
        const clientId = env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.error('❌ GOOGLE_CLIENT_ID not set');
            return Response.redirect(`${siteUrl}?auth=error&message=Google+not+configured`, 302);
        }
        
        const redirectUri = `${siteUrl}/api/auth/google`;
        const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        googleAuthUrl.searchParams.set('client_id', clientId);
        googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
        googleAuthUrl.searchParams.set('response_type', 'code');
        googleAuthUrl.searchParams.set('scope', 'openid email profile');
        googleAuthUrl.searchParams.set('access_type', 'online');
        
        console.log('➡️  Redirecting to Google');
        console.log('   Client ID:', clientId.substring(0, 20) + '...');
        console.log('   Redirect URI:', redirectUri);
        return Response.redirect(googleAuthUrl.toString(), 302);
    }
    
    // Exchange code for token
    console.log('🔄 Processing callback with code');
    
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.error('❌ Google credentials not configured');
        return Response.redirect(`${siteUrl}?auth=error&message=Server+configuration+error`, 302);
    }
    
    try {
        const redirectUri = `${siteUrl}/api/auth/google`;
        
        // Exchange code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Token exchange failed:', errorText);
            return Response.redirect(`${siteUrl}?auth=error&message=Failed+to+authenticate`, 302);
        }
        
        const tokenData = await tokenResponse.json();
        
        // Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });
        
        if (!userResponse.ok) {
            console.error('❌ Failed to get user info');
            return Response.redirect(`${siteUrl}?auth=error&message=Failed+to+get+user+info`, 302);
        }
        
        const userData = await userResponse.json();
        console.log('✅ User authenticated:', userData.email);
        
        // Redirect to HOMEPAGE (not to /api/auth/google/callback!)
        const successUrl = new URL(siteUrl); // This is just the homepage!
        successUrl.searchParams.set('auth', 'success');
        successUrl.searchParams.set('name', userData.name || userData.email);
        successUrl.searchParams.set('email', userData.email);
        successUrl.searchParams.set('avatar', userData.picture || '');
        
        console.log('➡️  Redirecting to homepage:', successUrl.toString());
        return Response.redirect(successUrl.toString(), 302);
        
    } catch (error) {
        console.error('❌ OAuth error:', error);
        return Response.redirect(`${siteUrl}?auth=error&message=Authentication+failed`, 302);
    }
}
