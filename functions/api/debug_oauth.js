// functions/api/debug-oauth.js
// OAuth Configuration Diagnostic Tool

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    
    // Get configuration
    const siteUrl = env.SITE_URL || url.origin;
    const googleClientId = env.GOOGLE_CLIENT_ID || 'NOT SET';
    const googleSecretSet = env.GOOGLE_CLIENT_SECRET ? 'SET ✅' : 'NOT SET ❌';
    const githubClientId = env.GITHUB_CLIENT_ID || 'NOT SET';
    const githubSecretSet = env.GITHUB_CLIENT_SECRET ? 'SET ✅' : 'NOT SET ❌';
    const deepseekKeySet = env.DEEPSEEK_API_KEY ? 'SET ✅' : 'NOT SET ❌';
    
    // Expected redirect URIs
    const googleRedirect = `${siteUrl}/api/auth/google`;
    const githubRedirect = `${siteUrl}/api/auth/github`;
    
    // Check if secrets are actually the right format
    let googleSecretFormat = 'Unknown';
    if (env.GOOGLE_CLIENT_SECRET) {
        if (env.GOOGLE_CLIENT_SECRET.startsWith('GOCSPX-')) {
            googleSecretFormat = 'Correct format ✅';
        } else if (env.GOOGLE_CLIENT_SECRET.includes('*****')) {
            googleSecretFormat = 'MASKED VALUE - WRONG! ❌';
        } else {
            googleSecretFormat = 'Unknown format ⚠️';
        }
    }
    
    let githubSecretFormat = 'Unknown';
    if (env.GITHUB_CLIENT_SECRET) {
        if (env.GITHUB_CLIENT_SECRET.includes('*****')) {
            githubSecretFormat = 'MASKED VALUE - WRONG! ❌';
        } else if (env.GITHUB_CLIENT_SECRET.length > 30) {
            githubSecretFormat = 'Correct format ✅';
        } else {
            githubSecretFormat = 'Too short - might be wrong ⚠️';
        }
    }
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Q-OTS OAuth Diagnostics</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: #0a0a0f;
            color: #fff;
            padding: 2rem;
            line-height: 1.6;
        }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { color: #00f5d4; margin-bottom: 1rem; font-size: 2rem; }
        h2 { color: #7209b7; margin: 2rem 0 1rem; font-size: 1.5rem; }
        .card {
            background: #1a1a25;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
        }
        .success { color: #22c55e; }
        .error { color: #ef4444; }
        .warning { color: #f59e0b; }
        .info { color: #3b82f6; }
        code {
            background: #0a0a0f;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.9rem;
            display: inline-block;
            margin: 0.2rem 0;
        }
        .status-line {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #333;
        }
        .status-line:last-child { border-bottom: none; }
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            margin: 0.5rem 0.5rem 0.5rem 0;
            background: #7209b7;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn:hover { background: #9333ea; transform: translateY(-2px); }
        .btn-success { background: #22c55e; }
        .btn-success:hover { background: #16a34a; }
        .copy-btn {
            background: #3b82f6;
            border: none;
            color: white;
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            margin-left: 0.5rem;
        }
        .copy-btn:hover { background: #2563eb; }
        pre {
            background: #0a0a0f;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            margin: 1rem 0;
        }
        .alert {
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            border-left: 4px solid;
        }
        .alert-error { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
        .alert-warning { background: rgba(245, 158, 11, 0.1); border-color: #f59e0b; }
        .alert-success { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Q-OTS OAuth Diagnostics</h1>
        <p style="color: #888; margin-bottom: 2rem;">Real-time configuration check</p>

        <div class="card">
            <h2>📊 Environment Variables Status</h2>
            <div class="status-line">
                <span>SITE_URL</span>
                <span><code>${siteUrl}</code></span>
            </div>
            <div class="status-line">
                <span>GOOGLE_CLIENT_ID</span>
                <span><code>${googleClientId.substring(0, 30)}...</code></span>
            </div>
            <div class="status-line">
                <span>GOOGLE_CLIENT_SECRET</span>
                <span class="${googleSecretSet.includes('✅') ? 'success' : 'error'}">${googleSecretSet}</span>
            </div>
            <div class="status-line">
                <span>Google Secret Format</span>
                <span class="${googleSecretFormat.includes('✅') ? 'success' : 'error'}">${googleSecretFormat}</span>
            </div>
            <div class="status-line">
                <span>GITHUB_CLIENT_ID</span>
                <span><code>${githubClientId}</code></span>
            </div>
            <div class="status-line">
                <span>GITHUB_CLIENT_SECRET</span>
                <span class="${githubSecretSet.includes('✅') ? 'success' : 'error'}">${githubSecretSet}</span>
            </div>
            <div class="status-line">
                <span>GitHub Secret Format</span>
                <span class="${githubSecretFormat.includes('✅') ? 'success' : 'error'}">${githubSecretFormat}</span>
            </div>
            <div class="status-line">
                <span>DEEPSEEK_API_KEY</span>
                <span class="${deepseekKeySet.includes('✅') ? 'success' : 'error'}">${deepseekKeySet}</span>
            </div>
        </div>

        ${googleSecretFormat.includes('MASKED') ? `
        <div class="alert alert-error">
            <strong>❌ CRITICAL ERROR: Google Client Secret is MASKED</strong>
            <p style="margin-top: 0.5rem;">You're using the masked value like <code>*****51c01465</code>. This will NOT work!</p>
            <p style="margin-top: 0.5rem;"><strong>Fix:</strong> Go to Google Cloud Console, generate a NEW client secret, and copy the FULL value that appears (starts with GOCSPX-).</p>
        </div>
        ` : ''}

        ${githubSecretFormat.includes('MASKED') ? `
        <div class="alert alert-error">
            <strong>❌ CRITICAL ERROR: GitHub Client Secret is MASKED</strong>
            <p style="margin-top: 0.5rem;">You're using the masked value like <code>*****51c01465</code>. This will NOT work!</p>
            <p style="margin-top: 0.5rem;"><strong>Fix:</strong> Go to GitHub OAuth App settings, generate a NEW client secret, and copy the FULL value that appears.</p>
        </div>
        ` : ''}

        <div class="card">
            <h2>🔗 Required Redirect URIs</h2>
            <p style="margin-bottom: 1rem; color: #888;">Copy these EXACT values to your OAuth apps</p>
            
            <h3 style="color: #00f5d4; margin-top: 1.5rem;">Google Cloud Console</h3>
            <p style="color: #888; font-size: 0.9rem;">Add this to "Authorized redirect URIs":</p>
            <div style="display: flex; align-items: center;">
                <code id="googleUri" style="flex: 1;">${googleRedirect}</code>
                <button class="copy-btn" onclick="copyText('googleUri')">Copy</button>
            </div>
            
            <h3 style="color: #00f5d4; margin-top: 1.5rem;">GitHub OAuth App</h3>
            <p style="color: #888; font-size: 0.9rem;">Set this as "Authorization callback URL":</p>
            <div style="display: flex; align-items: center;">
                <code id="githubUri" style="flex: 1;">${githubRedirect}</code>
                <button class="copy-btn" onclick="copyText('githubUri')">Copy</button>
            </div>
        </div>

        <div class="card">
            <h2>🧪 Test OAuth Flow</h2>
            <p style="margin-bottom: 1rem; color: #888;">Click to test each OAuth provider</p>
            
            <a href="/api/auth/google" class="btn">🔐 Test Google OAuth</a>
            <a href="/api/auth/github" class="btn">🔐 Test GitHub OAuth</a>
            <a href="/" class="btn btn-success">← Back to Home</a>
        </div>

        <div class="card">
            <h2>📋 Troubleshooting Checklist</h2>
            <pre style="color: #888;">
${googleSecretSet.includes('❌') ? '❌' : '✅'} Google Client Secret is set
${googleSecretFormat.includes('✅') ? '✅' : '❌'} Google Client Secret has correct format
${githubSecretSet.includes('❌') ? '❌' : '✅'} GitHub Client Secret is set
${githubSecretFormat.includes('✅') ? '✅' : '❌'} GitHub Client Secret has correct format
${deepseekKeySet.includes('❌') ? '❌' : '✅'} DeepSeek API Key is set

Next steps:
1. Copy redirect URIs above to OAuth apps
2. Make sure secrets are NOT masked values
3. Wait 2-3 minutes after changes
4. Test in incognito mode
            </pre>
        </div>

        <div class="card">
            <h2>🔍 Common Issues & Fixes</h2>
            
            <h3 style="color: #f59e0b; margin-top: 1rem;">Issue: "redirect_uri_mismatch"</h3>
            <p style="color: #888;">The redirect URI in Google Cloud Console doesn't match exactly.</p>
            <p><strong>Fix:</strong> Copy the Google URI above and paste it EXACTLY in Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs</p>
            
            <h3 style="color: #f59e0b; margin-top: 1rem;">Issue: "Error 401: invalid_client"</h3>
            <p style="color: #888;">Client ID or Secret is wrong.</p>
            <p><strong>Fix:</strong> Generate NEW secrets in both Google and GitHub, copy FULL values (not *****)</p>
            
            <h3 style="color: #f59e0b; margin-top: 1rem;">Issue: OAuth works but styling breaks</h3>
            <p style="color: #888;">CSS not loading after redirect.</p>
            <p><strong>Fix:</strong> Make sure _routes.json file exists with correct configuration</p>
        </div>
    </div>

    <script>
        function copyText(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const btn = element.nextElementSibling;
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            });
        }
    </script>
</body>
</html>
    `;
    
    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8'
        }
    });
}
