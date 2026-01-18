// ============================================
// Q-OTS WEBSITE - MAIN JAVASCRIPT
// Complete QSort Knowledge + Navigation + Community
// ============================================

// QSORT KNOWLEDGE BASE
const QSORT_KNOWLEDGE = {
    concepts: {
        "qpand": {
            definition: "QPand (Quantum-enhanced Position and Dynamics) is a 17-dimensional extended state vector capturing position (x,y), velocity (vx,vy), acceleration (ax,ay), curvature (κ), jerk (jx,jy), heading angle (θ), angular velocity (ω), scale (w,h), aspect ratio, and confidence score.",
            formula: "QPand = [x, y, vx, vy, ax, ay, κ, jx, jy, θ, ω, w, h, r, c]",
            importance: "Unlike the traditional Kalman filter's 4-8 dimensional state, QPand captures curvature for trajectory shape, jerk for acceleration changes, and heading for directional encoding."
        },
        "curvature": {
            definition: "Curvature (κ) measures how sharply a trajectory bends. Computed as κ = |v × a| / |v|³",
            formula: "κ = |v × a| / |v|³",
            importance: "Enables the tracker to predict and handle turns, unlike linear Kalman filters."
        },
        "boltzmann": {
            definition: "The Boltzmann Motion Field uses statistical mechanics to model motion probability: P(x) = (1/Z) × exp(-E(x)/kT)",
            formula: "P(x) = (1/Z) × exp(-E(x)/kT)",
            importance: "Provides principled uncertainty quantification with temperature T increasing during occlusions."
        },
        "bloch": {
            definition: "The Bloch sphere represents motion states as points on a unit sphere: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩",
            formula: "|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩",
            importance: "Enables multi-regime motion encoding (walking, running, turning) and interference-based matching."
        },
        "wavepacket": {
            definition: "Wavepackets are localized probability distributions: ψ(x,t) = A × exp(-(x-x₀)²/4σ² + ikx - iωt)",
            formula: "ψ(x,t) = A × exp(-(x-x₀)²/4σ² + ikx - iωt)",
            importance: "During occlusions, wavepackets spread naturally. Re-detection 'collapses' them back."
        },
        "neural ode": {
            definition: "Neural ODEs learn dynamics as dx/dt = f_θ(x,t) where f_θ is a neural network.",
            formula: "dx/dt = f_θ(x,t)",
            importance: "Learns complex nonlinear dynamics from data with physics constraints."
        },
        "quantum attention": {
            definition: "Phase-modulated attention: Attention(Q,K,V) = softmax(QK^T × e^(iΦ) / √d) × V",
            formula: "Attention(Q,K,V) = softmax(QK^T × e^(iΦ) / √d) × V",
            importance: "Creates interference patterns for better feature matching in crowds."
        },
        "kalman": {
            definition: "The Kalman filter is a recursive estimator assuming linear dynamics and Gaussian noise.",
            formula: "x_t = Fx_{t-1} + w",
            importance: "Foundation of SORT tracker but limited by linear assumptions."
        },
        "sort": {
            definition: "SORT uses Kalman filtering for motion prediction and Hungarian algorithm for association.",
            importance: "Baseline tracker that Q-OTS improves upon."
        },
        "deepsort": {
            definition: "DeepSORT extends SORT with deep appearance features (ReID) for better association.",
            importance: "Adds appearance but still uses linear Kalman motion."
        },
        "bytetrack": {
            definition: "ByteTrack uses both high and low confidence detections in two-stage association.",
            importance: "Improves detection utilization but doesn't fix motion modeling."
        }
    },
    comparisons: {
        "qsort_vs_sort": "SORT uses 4-8 dim Kalman state with linear dynamics. Q-OTS uses 17-dim QPand with nonlinear Neural ODEs, Boltzmann fields, and quantum representations.",
        "qsort_vs_deepsort": "DeepSORT adds appearance but keeps linear motion. Q-OTS provides superior motion modeling through physics-grounded components.",
        "qsort_vs_bytetrack": "ByteTrack improves detection usage but not motion modeling. Q-OTS addresses fundamental linear dynamics limitations."
    },
    formulas: {
        "curvature": "κ = |v × a| / |v|³",
        "boltzmann": "P(x) = (1/Z) × exp(-E(x)/kT)",
        "bloch": "|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩",
        "wavepacket": "ψ(x,t) = A × exp(-(x-x₀)²/4σ² + ikx - iωt)",
        "neural_ode": "dx/dt = f_θ(x,t)",
        "spreading": "σ(t) = σ₀√(1 + (ℏt/2mσ₀²)²)"
    }
};

// FEATURE CONTENT
const FEATURE_CONTENT = {
    qpand: {
        title: "🎯 The QPand State Vector",
        content: `<p><strong>17-Dimensional State:</strong> Position (x,y), Velocity (vx,vy), Acceleration (ax,ay), Curvature κ, Jerk (jx,jy), Heading θ, Angular velocity ω, Scale (w,h), Confidence.</p>`,
        code: `class QPandState:
    def __init__(self, det):
        self.position = det[:2]
        self.velocity = np.zeros(2)
        self.acceleration = np.zeros(2)
        self.curvature = 0.0
        self.jerk = np.zeros(2)
        self.heading = 0.0
        self.angular_vel = 0.0`
    },
    boltzmann: {
        title: "🌡️ Boltzmann Motion Field",
        content: `<p><strong>P(x) = (1/Z) × exp(-E(x)/kT)</strong> - Energy-based probability with temperature increasing during occlusions.</p>`,
        code: `def boltzmann_probability(state, T):
    E = compute_energy(state)
    prob = torch.exp(-E / T)
    return prob / prob.sum()`
    },
    bloch: {
        title: "🔮 Bloch Sphere Representation",
        content: `<p><strong>|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩</strong> - Motion regime in θ, temporal phase in φ.</p>`,
        code: `def bloch_encode(motion):
    theta = intensity_to_angle(motion.speed)
    phi = regime_to_phase(motion.type)
    return [sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta)]`
    },
    wavepacket: {
        title: "〰️ Wavepacket Dynamics",
        content: `<p><strong>ψ(x,t) = A × exp(-(x-x₀)²/4σ² + ikx - iωt)</strong> - Spreads during occlusion, collapses on detection.</p>`,
        code: `def evolve_wavepacket(sigma0, dt, mass=1.0):
    spread = (hbar * dt) / (2 * mass * sigma0**2)
    return sigma0 * sqrt(1 + spread**2)`
    },
    neuralode: {
        title: "🧠 Neural ODEs",
        content: `<p><strong>dx/dt = f_θ(x,t)</strong> - Physics-informed neural network learns nonlinear dynamics.</p>`,
        code: `class MotionODE(nn.Module):
    def forward(self, t, state):
        return self.net(torch.cat([state, t], dim=-1))`
    },
    attention: {
        title: "⚡ Quantum Attention",
        content: `<p><strong>Attention = softmax(QK^T × e^(iΦ) / √d) × V</strong> - Phase modulation for interference-based matching.</p>`,
        code: `def quantum_attention(q, k, v, phase):
    scores = torch.matmul(q, k.T) / sqrt(d)
    interference = torch.cos(phase)
    return softmax(scores * interference) @ v`
    }
};

// NAVIGATION
const navigationStack = ['home'];
let currentUser = null;

function navigateTo(page, section = null) {
    if (navigationStack[navigationStack.length - 1] !== page) {
        navigationStack.push(page);
    }
    
    document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) link.classList.add('active');
    });
    
    updateBreadcrumb();
    
    if (section && page === 'features') loadFeatureContent(section);
    if (page === 'features' && !section) loadFeatureContent();
    if (page === 'community') loadCommunityData();
    
    window.history.pushState({ page, section }, '', page === 'home' ? '/' : `/${page}`);
    window.scrollTo(0, 0);
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    const content = document.getElementById('breadcrumbContent');
    
    if (navigationStack.length <= 1) {
        breadcrumb.classList.remove('visible');
        return;
    }
    
    breadcrumb.classList.add('visible');
    content.innerHTML = navigationStack.map((page, i) => {
        const isLast = i === navigationStack.length - 1;
        const name = page.charAt(0).toUpperCase() + page.slice(1);
        if (isLast) return `<span class="breadcrumb-item current">${name}</span>`;
        return `<a href="#" class="breadcrumb-item" onclick="goBackTo(${i}); return false;">${name}</a><span class="breadcrumb-separator">›</span>`;
    }).join('');
}

function goBackTo(index) {
    const page = navigationStack[index];
    navigationStack.length = index + 1;
    navigateTo(page);
}

function loadFeatureContent(section) {
    const container = document.getElementById('featureDetail');
    if (!container) return;
    
    if (!section) {
        container.innerHTML = Object.values(FEATURE_CONTENT).map(f => `
            <div class="feature-section">
                <h3>${f.title}</h3>
                ${f.content}
                <div class="code-block"><pre>${f.code}</pre></div>
            </div>
        `).join('');
        return;
    }
    
    const content = FEATURE_CONTENT[section];
    if (content) {
        container.innerHTML = `
            <div class="feature-section">
                <h3>${content.title}</h3>
                ${content.content}
                <div class="code-block"><pre>${content.code}</pre></div>
            </div>
        `;
    }
}

window.addEventListener('popstate', (e) => {
    if (e.state?.page) navigateTo(e.state.page, e.state.section);
});

// CHAT
let chatHistory = [];

function toggleChat() {
    document.getElementById('chatToggle').classList.toggle('active');
    document.getElementById('chatWindow').classList.toggle('active');
}

function handleChatKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    chatHistory.push({ role: 'user', content: message });
    showTyping();
    
    try {
        const localResponse = searchLocalKnowledge(message);
        
        if (localResponse.confidence > 0.6) {
            hideTyping();
            addChatMessage(localResponse.answer, 'bot');
            chatHistory.push({ role: 'assistant', content: localResponse.answer });
            return;
        }
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history: chatHistory.slice(-10) })
        });
        
        const data = await response.json();
        hideTyping();
        
        const reply = data.response || localResponse.answer || "I can help with Q-OTS questions!";
        addChatMessage(reply, 'bot');
        chatHistory.push({ role: 'assistant', content: reply });
    } catch (error) {
        hideTyping();
        const fallback = searchLocalKnowledge(message);
        addChatMessage(fallback.answer, 'bot');
    }
}

function searchLocalKnowledge(query) {
    const q = query.toLowerCase();
    let best = { answer: null, confidence: 0 };
    
    for (const [key, concept] of Object.entries(QSORT_KNOWLEDGE.concepts)) {
        if (q.includes(key) || q.includes(key.replace('_', ' '))) {
            return {
                answer: `**${concept.definition}**\n\n${concept.formula ? `Formula: \`${concept.formula}\`\n\n` : ''}${concept.importance}`,
                confidence: 0.9
            };
        }
    }
    
    for (const [key, comparison] of Object.entries(QSORT_KNOWLEDGE.comparisons)) {
        if (q.includes('vs') || q.includes('compare') || q.includes('difference')) {
            const parts = key.split('_vs_');
            if (parts.some(p => q.includes(p))) {
                return { answer: comparison, confidence: 0.85 };
            }
        }
    }
    
    if (q.includes('formula') || q.includes('equation')) {
        for (const [name, formula] of Object.entries(QSORT_KNOWLEDGE.formulas)) {
            if (q.includes(name.replace('_', ' '))) {
                return { answer: `The formula for ${name.replace('_', ' ')} is:\n\n\`${formula}\``, confidence: 0.9 };
            }
        }
    }
    
    return {
        answer: "I can help with Q-OTS! Ask about:\n• **QPand** - 17-dim state vector\n• **Boltzmann Field** - energy-based probability\n• **Bloch Sphere** - quantum motion encoding\n• **Wavepackets** - uncertainty dynamics\n• **Neural ODEs** - physics-informed learning\n• Compare Q-OTS vs SORT/DeepSORT/ByteTrack",
        confidence: 0.3
    };
}

function addChatMessage(text, type) {
    const container = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = `chat-message ${type}`;
    msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = document.getElementById('chatMessages');
    const typing = document.createElement('div');
    typing.className = 'chat-message bot typing';
    typing.id = 'typingIndicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    document.getElementById('typingIndicator')?.remove();
}

// COMMUNITY
function showCommunitySection(section) {
    document.querySelectorAll('.community-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.section === section));
    document.querySelectorAll('.community-section').forEach(sec => sec.classList.toggle('active', sec.id === `section-${section}`));
}

async function loadCommunityData() {
    try {
        const [discussions, questions, showcase] = await Promise.all([
            fetch('/api/community/posts?type=discussion').then(r => r.json()).catch(() => ({ posts: [] })),
            fetch('/api/community/posts?type=question').then(r => r.json()).catch(() => ({ posts: [] })),
            fetch('/api/community/posts?type=showcase').then(r => r.json()).catch(() => ({ posts: [] }))
        ]);
        
        renderPosts(discussions.posts || [], 'discussionsList');
        renderPosts(questions.posts || [], 'questionsList');
        renderPosts(showcase.posts || [], 'showcaseList');
    } catch (e) {
        renderSampleData();
    }
}

function renderPosts(posts, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-dim);padding:2rem;">No posts yet. Be the first!</p>';
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="post-card">
            <div class="post-header">
                <div class="post-avatar">${post.author_avatar ? `<img src="${post.author_avatar}">` : (post.author_name?.charAt(0) || 'U')}</div>
                <div class="post-meta"><h4>${post.author_name || 'Anonymous'}</h4><span>${formatDate(post.created_at)}</span></div>
            </div>
            <div class="post-content"><h3>${post.title}</h3><p>${(post.content || '').substring(0, 200)}${post.content?.length > 200 ? '...' : ''}</p></div>
            <div class="post-footer">
                <button class="post-action">❤️ ${post.likes || 0}</button>
                <button class="post-action">💬 ${post.comments || 0}</button>
            </div>
        </div>
    `).join('');
}

function renderSampleData() {
    const sample = [
        { id: '1', title: 'Welcome to Q-OTS Community!', content: 'Share ideas, ask questions, collaborate on quantum-inspired tracking!', author_name: 'Q-OTS Team', created_at: new Date().toISOString(), likes: 42, comments: 12 },
        { id: '2', title: 'Neural ODE Training Tips', content: 'Cosine annealing learning rate works best for motion ODE...', author_name: 'Researcher', created_at: new Date(Date.now() - 86400000).toISOString(), likes: 18, comments: 7 }
    ];
    renderPosts(sample, 'discussionsList');
    renderPosts([{ id: '3', title: 'How to handle fast-moving objects?', content: 'Tips for sports tracking with Q-OTS?', author_name: 'Developer', created_at: new Date().toISOString(), likes: 8, comments: 5 }], 'questionsList');
    renderPosts([{ id: '4', title: 'Q-OTS Cell Tracker', content: 'Applied to microscopy - wavepackets help during mitosis!', author_name: 'BioResearcher', created_at: new Date().toISOString(), likes: 31, comments: 9 }], 'showcaseList');
}

async function createPost(type, event) {
    event.preventDefault();
    if (!currentUser) { showToast('Please sign in', 'error'); return; }
    
    const ids = { discussion: ['discussionTitle', 'discussionContent'], question: ['questionTitle', 'questionContent'], showcase: ['showcaseTitle', 'showcaseContent'] };
    const [titleId, contentId] = ids[type];
    
    try {
        await fetch('/api/community/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                title: document.getElementById(titleId).value,
                content: document.getElementById(contentId).value,
                author_id: currentUser.id,
                author_name: currentUser.name,
                author_avatar: currentUser.avatar
            })
        });
        showToast('Posted!', 'success');
        loadCommunityData();
        document.getElementById(titleId).value = '';
        document.getElementById(contentId).value = '';
    } catch (e) {
        showToast('Error posting', 'error');
    }
}

function formatDate(d) {
    const diff = Date.now() - new Date(d);
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    return `${Math.floor(diff/86400000)}d ago`;
}

// AUTH
function showAuthModal() { navigateTo('community'); }
function signInWithGoogle() { window.location.href = '/api/auth/google'; }
function signInWithGitHub() { window.location.href = '/api/auth/github'; }

function logout() {
    currentUser = null;
    localStorage.removeItem('qots_user');
    updateAuthUI();
    showToast('Signed out', 'success');
}

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const userProfile = document.getElementById('userProfile');
    const authPrompt = document.getElementById('communityAuthPrompt');
    
    if (currentUser) {
        authBtn.style.display = 'none';
        userProfile.style.display = 'block';
        const avatarImg = document.getElementById('userAvatarImg');
        const userInitial = document.getElementById('userInitial');
        if (currentUser.avatar) {
            avatarImg.src = currentUser.avatar;
            avatarImg.style.display = 'block';
            userInitial.style.display = 'none';
        } else {
            userInitial.textContent = currentUser.name?.charAt(0) || 'U';
        }
        if (authPrompt) authPrompt.style.display = 'none';
        document.querySelectorAll('.create-post').forEach(el => el.style.display = 'block');
    } else {
        authBtn.style.display = 'block';
        userProfile.style.display = 'none';
        if (authPrompt) authPrompt.style.display = 'block';
        document.querySelectorAll('.create-post').forEach(el => el.style.display = 'none');
    }
}

function toggleUserDropdown() {
    document.getElementById('userDropdown')?.classList.toggle('active');
}

// CONTACT
async function submitContactForm(event) {
    event.preventDefault();
    const btn = document.getElementById('contactSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    
    try {
        await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                subject: document.getElementById('contactSubject').value,
                message: document.getElementById('contactMessage').value
            })
        });
        showToast('Message sent!', 'success');
        ['contactName', 'contactEmail', 'contactSubject', 'contactMessage'].forEach(id => document.getElementById(id).value = '');
    } catch (e) {
        showToast('Error sending', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = 'Send Message →';
}

// UTILS
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${type === 'success' ? '✓' : '✕'} ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('qots_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('auth_success')) {
        const userData = urlParams.get('user');
        if (userData) {
            currentUser = JSON.parse(decodeURIComponent(userData));
            localStorage.setItem('qots_user', JSON.stringify(currentUser));
            updateAuthUI();
            showToast('Signed in!', 'success');
        }
        window.history.replaceState({}, '', window.location.pathname);
    }
    
    const path = window.location.pathname.slice(1);
    if (path && ['features', 'community', 'contact'].includes(path)) {
        navigateTo(path);
    }
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-profile')) {
            document.getElementById('userDropdown')?.classList.remove('active');
        }
    });
});
