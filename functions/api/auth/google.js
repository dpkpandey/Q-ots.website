// functions/api/auth/google.js
// Google OAuth Handler for Q-OTS
// Handles both redirect to Google and callback from Google

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    
    console.log('🔐 Google OAuth Request:', url.pathname);
    
    // Check if this is a callback from Google (has 'code' parameter)
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    // Handle error from Google
    if (error) {
        console.error('❌ Google OAuth Error:', error);
        const redirectUrl = new URL(env.SITE_URL || url.origin);
        redirectUrl.searchParams.set('auth', 'error');
        redirectUrl.searchParams.set('message', error);
        return Response.redirect(redirectUrl.toString(), 302);
    }
    
    // If no code, redirect to Google OAuth
    if (!code) {
        return redirectToGoogle(env, url);
    }
    
    // If we have code, exchange it for tokens
    return handleCallback(env, code, url);
}

// Redirect user to Google OAuth consent screen
function redirectToGoogle(env, originalUrl) {
    const clientId = env.GOOGLE_CLIENT_ID;
    const siteUrl = env.SITE_URL || originalUrl.origin;
    const redirectUri = `${siteUrl}/api/auth/google`;
    
    if (!clientId) {
        console.error('❌ GOOGLE_CLIENT_ID not set in environment');
        const errorUrl = new URL(siteUrl);
        errorUrl.searchParams.set('auth', 'error');
        errorUrl.searchParams.set('message', 'Google OAuth not configured');
        return Response.redirect(errorUrl.toString(), 302);
    }
    
    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'online');
    
    console.log('➡️  Redirecting to Google OAuth');
    console.log('   Client ID:', clientId.substring(0, 20) + '...');
    console.log('   Redirect URI:', redirectUri);
    
    return Response.redirect(googleAuthUrl.toString(), 302);
}

// Handle callback from Google
async function handleCallback(env, code, originalUrl) {
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    const siteUrl = env.SITE_URL || originalUrl.origin;
    const redirectUri = `${siteUrl}/api/auth/google`;
    
    console.log('🔄 Processing Google OAuth callback');
    
    if (!clientId || !clientSecret) {
        console.error('❌ Google OAuth credentials not configured');
        const errorUrl = new URL(siteUrl);
        errorUrl.searchParams.set('auth', 'error');
        errorUrl.searchParams.set('message', 'Server configuration error');
        return Response.redirect(errorUrl.toString(), 302);
    }
    
    try {
        // Exchange code for access token
        console.log('🔄 Exchanging code for token...');
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
            console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
            
            const errorUrl = new URL(siteUrl);
            errorUrl.searchParams.set('auth', 'error');
            errorUrl.searchParams.set('message', 'Failed to authenticate with Google');
            return Response.redirect(errorUrl.toString(), 302);
        }
        
        const tokenData = await tokenResponse.json();
        console.log('✅ Token received');
        
        // Get user info from Google
        console.log('🔄 Fetching user info...');
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });
        
        if (!userResponse.ok) {
            console.error('❌ Failed to get user info:', userResponse.status);
            
            const errorUrl = new URL(siteUrl);
            errorUrl.searchParams.set('auth', 'error');
            errorUrl.searchParams.set('message', 'Failed to get user information');
            return Response.redirect(errorUrl.toString(), 302);
        }
        
        const userData = await userResponse.json();
        console.log('✅ User authenticated:', userData.email);
        
        // Redirect back to site with user data
        const successUrl = new URL(siteUrl);
        successUrl.searchParams.set('auth', 'success');
        successUrl.searchParams.set('name', userData.name || userData.email);
        successUrl.searchParams.set('email', userData.email);
        successUrl.searchParams.set('avatar', userData.picture || '');
        
        console.log('✅ Redirecting to site with user data');
        return Response.redirect(successUrl.toString(), 302);
        
    } catch (error) {
        console.error('❌ OAuth error:', error);
        
        const errorUrl = new URL(siteUrl);
        errorUrl.searchParams.set('auth', 'error');
        errorUrl.searchParams.set('message', 'Authentication failed');
        return Response.redirect(errorUrl.toString(), 302);
    }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
