// functions/api/auth/github.js
// FIXED GitHub OAuth Handler - Redirects to homepage properly

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    
    // Get the base site URL (homepage)
    const siteUrl = env.SITE_URL || url.origin;
    
    console.log('🔐 GitHub OAuth - URL:', url.pathname);
    
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    // Handle error from GitHub
    if (error) {
        console.error('❌ GitHub Error:', error);
        return Response.redirect(`${siteUrl}?auth=error&message=${error}`, 302);
    }
    
    // If no code, redirect to GitHub
    if (!code) {
        const clientId = env.GITHUB_CLIENT_ID;
        if (!clientId) {
            console.error('❌ GITHUB_CLIENT_ID not set');
            return Response.redirect(`${siteUrl}?auth=error&message=GitHub+not+configured`, 302);
        }
        
        const redirectUri = `${siteUrl}/api/auth/github`;
        const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
        githubAuthUrl.searchParams.set('client_id', clientId);
        githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
        githubAuthUrl.searchParams.set('scope', 'read:user user:email');
        
        console.log('➡️  Redirecting to GitHub');
        console.log('   Redirect URI:', redirectUri);
        return Response.redirect(githubAuthUrl.toString(), 302);
    }
    
    // Exchange code for token
    console.log('🔄 Processing callback with code');
    
    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.error('❌ GitHub credentials not configured');
        return Response.redirect(`${siteUrl}?auth=error&message=Server+configuration+error`, 302);
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
                client_id: clientId,
                client_secret: clientSecret,
                code: code
            })
        });
        
        if (!tokenResponse.ok) {
            throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            console.error('❌ Token error:', tokenData.error_description);
            return Response.redirect(`${siteUrl}?auth=error&message=${encodeURIComponent(tokenData.error_description)}`, 302);
        }
        
        // Get user info
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Q-OTS-Website'
            }
        });
        
        if (!userResponse.ok) {
            throw new Error('Failed to get user info');
        }
        
        const userData = await userResponse.json();
        
        // Get email if not public
        let email = userData.email || '';
        if (!email) {
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
        
        // Redirect to HOMEPAGE (not to /api/auth/github/callback!)
        const successUrl = new URL(siteUrl); // This is just the homepage!
        successUrl.searchParams.set('auth', 'success');
        successUrl.searchParams.set('name', userData.name || userData.login);
        successUrl.searchParams.set('email', email);
        successUrl.searchParams.set('avatar', userData.avatar_url || '');
        
        console.log('➡️  Redirecting to homepage:', successUrl.toString());
        return Response.redirect(successUrl.toString(), 302);
        
    } catch (error) {
        console.error('❌ OAuth error:', error);
        return Response.redirect(`${siteUrl}?auth=error&message=Authentication+failed`, 302);
    }
}
