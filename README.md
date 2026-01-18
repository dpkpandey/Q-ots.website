# Q-OTS Website

> Quantum-Oriented Tracking System - Research Website with AI Chatbot

![Q-OTS](https://img.shields.io/badge/Q--OTS-dpkAI%20v0.1-00f5d4?style=for-the-badge)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-f38020?style=for-the-badge)
![DeepSeek](https://img.shields.io/badge/DeepSeek-AI-7c3aed?style=for-the-badge)

## 🚀 Features

- **AI Chatbot** - Powered by DeepSeek API with complete QSort.pdf knowledge
- **Stack Navigation** - Click forward, breadcrumb back (like a tree structure)
- **Community Hub** - Discussions, Q&A, Project Showcase
- **OAuth Authentication** - Sign in with Google or GitHub
- **Contact Form** - Stored in D1 database, email notifications
- **Responsive Design** - Works on all devices

## 📁 Project Structure

```
q-ots-website/
├── index.html                 # Main website
├── styles.css                 # Complete styling
├── chat.js                    # Frontend JS + QSort knowledge
├── Qsort.pdf                  # Research paper (add manually)
├── wrangler.toml              # Cloudflare configuration
└── functions/
    └── api/
        ├── chat.js            # DeepSeek AI integration
        ├── contact.js         # Contact form handler
        ├── auth/
        │   ├── google.js      # Google OAuth
        │   └── github.js      # GitHub OAuth
        └── community/
            └── posts.js       # CRUD for discussions/Q&A
```

## 🔧 Setup Instructions

### 1. Clone and Add Your Files

```bash
git clone https://github.com/dpkpandey/Q-ots.website.git
cd Q-ots.website

# Copy your Qsort.pdf to the root directory
cp /path/to/Qsort.pdf .
```

### 2. Configure Environment Variables

In Cloudflare Dashboard → Pages → Settings → Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DEEPSEEK_API_KEY` | Your DeepSeek API key | ✅ Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | For Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | For Google login |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | For GitHub login |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | For GitHub login |
| `SITE_URL` | Your site URL | ✅ Yes |

### 3. Set Up DeepSeek API

1. Go to https://platform.deepseek.com
2. Create an account and generate API key
3. Add to Cloudflare environment as `DEEPSEEK_API_KEY`

### 4. Set Up D1 Database

Your database is already configured:
- **Database ID**: `0b3fdbe3-18aa-483c-86cf-8936334d6e83`

The tables are created automatically on first API call.

### 5. Set Up OAuth (Optional)

#### Google OAuth:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://q-ots-website.pages.dev/api/auth/google/callback`
4. Copy Client ID and Secret to Cloudflare

#### GitHub OAuth:
1. Go to https://github.com/settings/developers
2. Create new OAuth App
3. Set callback URL: `https://q-ots-website.pages.dev/api/auth/github/callback`
4. Copy Client ID and Secret to Cloudflare

### 6. Deploy

```bash
# Push to GitHub
git add .
git commit -m "Complete Q-OTS website with AI chatbot"
git push origin main

# Cloudflare will auto-deploy from GitHub
```

## 💬 Chatbot Features

The AI chatbot has complete knowledge of QSort.pdf including:

- **QPand State Vector** - 17-dimensional motion representation
- **Boltzmann Motion Field** - Energy-based probability
- **Bloch Sphere** - Quantum-inspired motion encoding
- **Wavepacket Dynamics** - Uncertainty handling
- **Neural ODEs** - Physics-informed learning
- **Comparisons** - Q-OTS vs SORT/DeepSORT/ByteTrack

### How It Works

1. User asks a question
2. First checks local knowledge base (instant, free)
3. If not found locally, calls DeepSeek API
4. DeepSeek has system prompt with complete QSort knowledge
5. Returns comprehensive, book-accurate answer

## 🎨 Customization

### Change Colors
Edit `styles.css`:
```css
:root {
    --accent-quantum: #00f5d4;  /* Main accent */
    --accent-energy: #f72585;   /* Secondary */
    --accent-wave: #7209b7;     /* Tertiary */
}
```

### Add More Knowledge
Edit `chat.js` → `QSORT_KNOWLEDGE` object

Edit `functions/api/chat.js` → `QSORT_PDF_KNOWLEDGE` string

## 📧 Contact

- **Email**: dpkarcai@protonmail.com
- **GitHub**: https://github.com/dpkpandey

## 📄 License

MIT License - See LICENSE file

---

**dpkAI v0.1** - Building the future of object tracking 🚀
