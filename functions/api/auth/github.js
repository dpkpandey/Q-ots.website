// functions/api/auth/github.js
// GitHub OAuth Handler for Q-OTS
// Handles both redirect to GitHub and callback from GitHub

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    
    console.log('🔐 GitHub OAuth Request:', url.pathname);
    
    // Check if this is a callback from GitHub (has 'code' parameter)
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    // Handle error from GitHub
    if (error) {
        console.error('❌ GitHub OAuth Error:', error);
        const redirectUrl = new URL(env.SITE_URL || url.origin);
        redirectUrl.searchParams.set('auth', 'error');
        redirectUrl.searchParams.set('message', error);
        return Response.redirect(redirectUrl.toString(), 302);
    }
    
    // If no code, redirect to GitHub OAuth
    if (!code) {
        return redirectToGitHub(env, url);
    }
    
    // If we have code, exchange it for tokens
    return handleCallback(env, code, url);
}

// Redirect user to GitHub OAuth authorization
function redirectToGitHub(env, originalUrl) {
    const clientId = env.GITHUB_CLIENT_ID;
    const siteUrl = env.SITE_URL || originalUrl.origin;
    const redirectUri = `${siteUrl}/api/auth/github`;
    
    if (!clientId) {
        console.error('❌ GITHUB_CLIENT_ID not set in environment');
        const errorUrl = new URL(siteUrl);
        errorUrl.searchParams.set('auth', 'error');
        errorUrl.searchParams.set('message', 'GitHub OAuth not configured');
        return Response.redirect(errorUrl.toString(), 302);
    }
    
    // Build GitHub OAuth URL
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.set('scope', 'read:user user:email');
    githubAuthUrl.searchParams.set('allow_signup', 'true');
    
    console.log('➡️  Redirecting to GitHub OAuth');
    console.log('   Client ID:', clientId);
    console.log('   Redirect URI:', redirectUri);
    
    return Response.redirect(githubAuthUrl.toString(), 302);
}

// Handle callback from GitHub
async function handleCallback(env, code, originalUrl) {
    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;
    const siteUrl = env.SITE_URL || originalUrl.origin;
    const redirectUri = `${siteUrl}/api/auth/github`;
    
    console.log('🔄 Processing GitHub OAuth callback');
    
    if (!clientId || !clientSecret) {
        console.error('❌ GitHub OAuth credentials not configured');
        const errorUrl = new URL(siteUrl);
        errorUrl.searchParams.set('auth', 'error');
        errorUrl.searchParams.set('message', 'Server configuration error');
        return Response.redirect(errorUrl.toString(), 302);
    }
    
    try {
        // Exchange code for access token
        console.log('🔄 Exchanging code for token...');
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: redirectUri
            })
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
            
            const errorUrl = new URL(siteUrl);
            errorUrl.searchParams.set('auth', 'error');
            errorUrl.searchParams.set('message', 'Failed to authenticate with GitHub');
            return Response.redirect(errorUrl.toString(), 302);
        }
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            console.error('❌ GitHub returned error:', tokenData.error_description);
            
            const errorUrl = new URL(siteUrl);
            errorUrl.searchParams.set('auth', 'error');
            errorUrl.searchParams.set('message', tokenData.error_description || 'GitHub authentication failed');
            return Response.redirect(errorUrl.toString(), 302);
        }
        
        console.log('✅ Token received');
        
        // Get user info from GitHub
        console.log('🔄 Fetching user info...');
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Q-OTS-Website'
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
        
        // Get user email if not public
        let email = userData.email;
        if (!email) {
            console.log('🔄 Fetching user email...');
            const emailResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Q-OTS-Website'
                }
            });
            
            if (emailResponse.ok) {
                const emails = await emailResponse.json();
                const primaryEmail = emails.find(e => e.primary) || emails[0];
                email = primaryEmail?.email || '';
            }
        }
        
        console.log('✅ User authenticated:', userData.login);
        
        // Redirect back to site with user data
        const successUrl = new URL(siteUrl);
        successUrl.searchParams.set('auth', 'success');
        successUrl.searchParams.set('name', userData.name || userData.login);
        successUrl.searchParams.set('email', email || '');
        successUrl.searchParams.set('avatar', userData.avatar_url || '');
        
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
