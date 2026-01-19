// GitHub OAuth Handler
// Path: functions/api/auth/github.js

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const env = context.env;
    
    const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET;
    const SITE_URL = env.SITE_URL || url.origin;

    // Show setup page if not configured
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>GitHub OAuth Setup Required</title>
    <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; background: #0a0a0f; color: #fff; }
        h1 { color: #00f5d4; }
        code { background: #1a1a25; padding: 2px 8px; border-radius: 4px; color: #00f5d4; }
        a { color: #00f5d4; }
        ol, ul { line-height: 2; }
        .box { background: #12121a; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #333; }
    </style>
</head>
<body>
    <h1>⚠️ GitHub OAuth Not Configured</h1>
    <div class="box">
        <p>Add these environment variables in <strong>Cloudflare Dashboard</strong>:</p>
        <ul>
            <li><code>GITHUB_CLIENT_ID</code> - Your GitHub OAuth Client ID</li>
            <li><code>GITHUB_CLIENT_SECRET</code> - Your GitHub OAuth Client Secret</li>
            <li><code>SITE_URL</code> = <code>${url.origin}</code></li>
        </ul>
    </div>
    
    <h2>📋 Setup Instructions:</h2>
    <ol>
        <li>Go to <a href="https://github.com/settings/developers" target="_blank">GitHub Developer Settings</a></li>
        <li>Click <strong>"OAuth Apps"</strong> → <strong>"New OAuth App"</strong></li>
        <li>Fill in:
            <ul>
                <li>Application name: <code>Q-OTS</code></li>
                <li>Homepage URL: <code>${url.origin}</code></li>
                <li>Authorization callback URL: <code>${url.origin}/api/auth/github/callback</code></li>
            </ul>
        </li>
        <li>Click <strong>"Register application"</strong></li>
        <li>Copy the <strong>Client ID</strong></li>
        <li>Click <strong>"Generate a new client secret"</strong> and copy it</li>
        <li>Add both to Cloudflare: Pages → Your Project → Settings → Environment Variables</li>
        <li>Redeploy your site</li>
    </ol>
    
    <p><a href="/">← Back to Home</a></p>
</body>
</html>
        `, { headers: { 'Content-Type': 'text/html' } });
    }

    const REDIRECT_URI = `${SITE_URL}/api/auth/github/callback`;

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'read:user user:email');
    authUrl.searchParams.set('state', crypto.randomUUID());

    return Response.redirect(authUrl.toString(), 302);
}
