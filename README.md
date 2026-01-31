# 📋 QUICK FILE REFERENCE

## 📥 4 Files to Upload

| Downloaded File | Upload To | Action |
|----------------|-----------|--------|
| `index-UPDATED.html` | `index.html` (root) | **Replace** |
| `chat-api.js` | `functions/api/chat.js` | **Create new** |
| `posts-UPDATED.js` | `functions/api/community/posts.js` | **Replace** |
| `contact-UPDATED.js` | `functions/api/contact.js` | **Replace** |

## ✅ Keep These Files (No Changes)

- ✅ `chat.js` (root) - Already works with new API
- ✅ `_redirects` (root) - Still correct
- ✅ `wrangler.toml` (root) - Still correct
- ✅ `functions/api/auth/google.js` - Working
- ✅ `functions/api/auth/github.js` - Working
- ✅ `functions/api/auth/google/callback.js` - Working
- ✅ `functions/api/auth/github/callback.js` - Working
- ✅ `Qsort.pdf` - Don't touch
- ✅ `static/qots.png` - Don't touch

## 🎯 What Changes:

### **index.html:**
- ✅ Added sorting controls (Recent, Most Liked, Most Responded)
- ✅ Updated contact email to `dpkai@protonmail.com`
- ✅ Updated chatbot header to show "Powered by DeepSeek + QSort Knowledge"
- ✅ Added empty state handling for posts
- ✅ Added like button styling

### **functions/api/chat.js (NEW):**
- ✅ DeepSeek API integration
- ✅ Complete QSort.pdf knowledge in system prompt
- ✅ Answers questions about quantum-inspired tracking
- ✅ Temperature 0.7 for balanced responses
- ✅ Max 1000 tokens per response

### **functions/api/community/posts.js:**
- ✅ Real D1 database storage (not fake data)
- ✅ Sorting: `?sort=recent|likes|responses`
- ✅ Like/unlike functionality
- ✅ Response counting
- ✅ Auto-creates database tables
- ✅ User attribution from session

### **functions/api/contact.js:**
- ✅ Saves to D1 database
- ✅ Email updated to `dpkai@protonmail.com`
- ✅ Ready for email service integration
- ✅ CORS enabled

## 🚀 Upload Order (Recommended)

1. **First:** `chat-api.js` (new file)
2. **Second:** `posts-UPDATED.js` (replace existing)
3. **Third:** `contact-UPDATED.js` (replace existing)
4. **Fourth:** `index-UPDATED.html` (replace index.html)
5. **Wait:** For Cloudflare deployment
6. **Test:** All new features!

## 🧪 Quick Test Checklist

- [ ] Chatbot responds to questions
- [ ] Can create community post
- [ ] Post appears in list
- [ ] Can like/unlike post
- [ ] Sorting buttons work
- [ ] Contact form submits successfully
- [ ] Email is dpkai@protonmail.com

## 💡 Notes

**chat.js (existing file):**
- Already has `sendMessage()` function
- Already calls `/api/chat` endpoint
- No changes needed!
- Will work with new `chat-api.js` backend

**Database:**
- Tables auto-created on first API call
- No manual D1 setup needed
- Check logs if issues occur

**DeepSeek API:**
- Make sure `DEEPSEEK_API_KEY` is set in Cloudflare
- Check at: Dashboard → Pages → Settings → Environment variables
- Without this, chatbot won't work

## 🔗 File Structure After Upload

```
Q-ots.website/
├── index.html                        ← UPDATED
├── chat.js                           ← KEEP (no changes)
├── _redirects                        ← KEEP
├── wrangler.toml                     ← KEEP
├── Qsort.pdf                         ← KEEP
├── static/
│   └── qots.png                      ← KEEP
└── functions/
    └── api/
        ├── chat.js                   ← NEW! (Upload chat-api.js here)
        ├── auth/
        │   ├── google.js             ← KEEP
        │   ├── github.js             ← KEEP
        │   ├── google/
        │   │   └── callback.js       ← KEEP
        │   └── github/
        │       └── callback.js       ← KEEP
        ├── community/
        │   └── posts.js              ← UPDATED (Replace with posts-UPDATED.js)
        └── contact.js                ← UPDATED (Replace with contact-UPDATED.js)
```

---

**Read UPGRADE-GUIDE.md for detailed explanations!**
