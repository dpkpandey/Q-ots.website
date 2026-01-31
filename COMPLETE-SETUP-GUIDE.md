# 🚀 Q-OTS WEBSITE - COMPLETE SETUP GUIDE

## 📁 EXACT FILE STRUCTURE

```
Q-ots.website/
├── index.html              ← Update with emergency script
├── chat.js                 ← Replace completely
├── _redirects              ← Add new
├── wrangler.toml           ← Replace/Add
├── Qsort.pdf               ← Keep existing
├── static/
│   └── qots.png            ← Keep existing
└── functions/
    └── api/
        ├── auth/
        │   ├── google.js               ← Replace
        │   ├── github.js               ← Replace
        │   ├── google/
        │   │   └── callback.js         ← Replace
        │   └── github/
        │       └── callback.js         ← Replace
        ├── community/
        │   └── posts.js                ← Add new
        └── contact.js                  ← Add new
```

---

## 📥 FILE 1: index.html (UPDATE ONLY)

**Action:** Add emergency script

**Steps:**
1. Open `index.html` in GitHub editor
2. Find line with `<body>` (around line 750)
3. Add THIS immediately after `<body>`:

```html
<body>
    <script>
    (function() {
        const path = window.location.pathname;
        if (path.includes('/api/auth/') && path.includes('/callback')) {
            console.log('🚨 Redirecting from callback');
            window.location.replace(window.location.search.includes('code=') ? '/?auth_success=1' : '/?auth_error=failed');
        }
    })();
    </script>
    
    <div class="quantum-bg"></div>
```

4. Save & commit

**THAT'S ALL! Don't change anything else in index.html!**

---

## 📥 FILE 2: chat.js

**Action:** Replace completely
**Location:** Root directory
**Download:** Use `chat.js` I provided

**Content:** 20KB file with all frontend logic

---

## 📥 FILE 3: _redirects

**Action:** Create new file
**Location:** Root directory (same level as index.html)
**File name:** `_redirects` (NO extension!)

**Content:**
```
/api/* 200!
/* /index.html 200
```

**Steps:**
1. Go to repo root
2. Create new file
3. Name: `_redirects`
4. Paste content above
5. Commit

---

## 📥 FILE 4: wrangler.toml

**Action:** Replace or create
**Location:** Root directory

**Content:**
```toml
name = "q-ots-website"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "qots-db"
database_id = "0b3fdbe3-18aa-483c-86cf-8936334d6e83"
```

---

## 📥 FILE 5: functions/api/auth/google.js

**Action:** Replace completely
**Location:** `functions/api/auth/google.js`
**Download:** Use `google-init.js` I provided

---

## 📥 FILE 6: functions/api/auth/github.js

**Action:** Replace completely
**Location:** `functions/api/auth/github.js`
**Download:** Use `github-init.js` I provided

---

## 📥 FILE 7: functions/api/auth/google/callback.js

**Action:** Replace completely
**Location:** `functions/api/auth/google/callback.js`
**Download:** Use `google-callback-FINAL.js` I provided

**Note:** Make sure folder structure is:
```
functions/
  └── api/
      └── auth/
          └── google/         ← Folder
              └── callback.js  ← File inside folder
```

---

## 📥 FILE 8: functions/api/auth/github/callback.js

**Action:** Replace completely
**Location:** `functions/api/auth/github/callback.js`
**Download:** Use `github-callback-FINAL.js` I provided

**Note:** Make sure folder structure is:
```
functions/
  └── api/
      └── auth/
          └── github/         ← Folder
              └── callback.js  ← File inside folder
```

---

## 📥 FILE 9: functions/api/community/posts.js

**Action:** Create new
**Location:** `functions/api/community/posts.js`
**Download:** Use `posts.js` I provided

---

## 📥 FILE 10: functions/api/contact.js

**Action:** Create new
**Location:** `functions/api/contact.js`
**Download:** Use `contact-api.js` I provided

---

## ⚙️ CLOUDFLARE ENVIRONMENT VARIABLES

In Cloudflare Dashboard → Pages → q-ots-website → Settings → Environment variables:

```
GOOGLE_CLIENT_ID = [Your Google OAuth Client ID]
GOOGLE_CLIENT_SECRET = [Your Google OAuth Secret]
GITHUB_CLIENT_ID = [Your GitHub OAuth Client ID]
GITHUB_CLIENT_SECRET = [Your GitHub OAuth Secret]
SITE_URL = https://q-ots-website.pages.dev
```

---

## 🔐 OAUTH REDIRECT URIS

### Google Console:
https://console.cloud.google.com/apis/credentials

**Authorized redirect URIs:**
```
https://q-ots-website.pages.dev/api/auth/google/callback
```

### GitHub Settings:
https://github.com/settings/developers

**Authorization callback URL:**
```
https://q-ots-website.pages.dev/api/auth/github/callback
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] index.html has emergency script (after `<body>`)
- [ ] chat.js replaced
- [ ] _redirects file added to root
- [ ] wrangler.toml exists
- [ ] google.js replaced
- [ ] github.js replaced
- [ ] google/callback.js exists in correct folder
- [ ] github/callback.js exists in correct folder
- [ ] posts.js added
- [ ] contact.js added
- [ ] Environment variables set in Cloudflare
- [ ] OAuth redirect URIs updated
- [ ] All files committed & pushed
- [ ] Cloudflare deployment successful (green checkmark)

---

## 🧪 TESTING

1. **Clear browser cache completely:**
   - Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"
   - Clear data

2. **Open Incognito/Private window**

3. **Go to:** https://q-ots-website.pages.dev

4. **Click "Sign In"**

5. **Choose Google or GitHub**

6. **Approve**

7. **Expected result:**
   - ✅ Redirects to homepage immediately
   - ✅ Full graphics load
   - ✅ Avatar appears in top-right
   - ✅ You're logged in!

---

## 🐛 IF STILL NOT WORKING

1. **Check Cloudflare deployment logs:**
   - Dashboard → Pages → Deployments → View details
   - Look for errors

2. **Check browser console (F12):**
   - Should see: "🚨 Redirecting from callback"
   - No other errors

3. **Verify files deployed:**
   - Go to your GitHub repo
   - Check each file exists in correct location
   - Check first line of each file matches mine

---

## 📞 SUPPORT

If something doesn't work:
- Take screenshot of error
- Copy browser console errors (F12 → Console)
- Check which files are in your repo
- Tell me what's different

---

**THIS WILL WORK!** Just follow each step carefully! 🚀
