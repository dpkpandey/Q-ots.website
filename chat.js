// chat.js - Complete implementation for Q-OTS website
// Works with the existing index.html without modifications

// Configuration
const CONFIG = {
    API_BASE: '/api',
    DEEPSEEK_URL: '/api/chat'
};

// Global state
let navigationHistory = [];
let currentUser = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavigation();
    initChat();
    initCommunity();
    loadFeatureContent();
    checkOAuthCallback();
});

// ============================================
// AUTHENTICATION
// ============================================
function initAuth() {
    // Check if user is logged in
    const userStr = localStorage.getItem('qots_user');
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
            updateUIForLoggedInUser();
        } catch (e) {
            localStorage.removeItem('qots_user');
        }
    }
}

function checkOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
        const userData = {
            name: params.get('name'),
            email: params.get('email'),
            avatar: params.get('avatar')
        };
        localStorage.setItem('qots_user', JSON.stringify(userData));
        currentUser = userData;
        updateUIForLoggedInUser();
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        showToast('Successfully signed in!', 'success');
    }
}

function updateUIForLoggedInUser() {
    const authBtn = document.getElementById('authBtn');
    const userProfile = document.getElementById('userProfile');
    
    if (authBtn) authBtn.style.display = 'none';
    if (userProfile) {
        userProfile.style.display = 'block';
        
        const userInitial = document.getElementById('userInitial');
        const userAvatarImg = document.getElementById('userAvatarImg');
        
        if (currentUser.avatar) {
            userAvatarImg.src = currentUser.avatar;
            userAvatarImg.style.display = 'block';
            userInitial.style.display = 'none';
        } else {
            userInitial.textContent = currentUser.name ? currentUser.name[0].toUpperCase() : 'U';
        }
    }
    
    // Show community create post forms
    document.querySelectorAll('.create-post').forEach(el => {
        el.style.display = 'block';
    });
    
    // Hide auth prompts
    const authPrompt = document.getElementById('communityAuthPrompt');
    if (authPrompt) authPrompt.style.display = 'none';
}

function showAuthModal() {
    const authPrompt = document.getElementById('communityAuthPrompt');
    if (authPrompt) {
        authPrompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function signInWithGoogle() {
    window.location.href = '/api/auth/google';
}

function signInWithGitHub() {
    window.location.href = '/api/auth/github';
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function logout() {
    localStorage.removeItem('qots_user');
    currentUser = null;
    window.location.reload();
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    updateBreadcrumb();
}

function navigateTo(page, section) {
    // Hide all pages
    document.querySelectorAll('.page-container').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // Handle sections
    if (section) {
        if (page === 'features') {
            loadFeatureSection(section);
        }
    }
    
    // Update history
    navigationHistory.push({ page, section });
    updateBreadcrumb();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    const breadcrumbContent = document.getElementById('breadcrumbContent');
    
    if (navigationHistory.length > 0) {
        breadcrumb.classList.add('visible');
        let html = '<a href="#" class="breadcrumb-item" onclick="navigateTo(\'home\'); return false;">Home</a>';
        
        navigationHistory.forEach((nav, index) => {
            html += ' <span class="breadcrumb-separator">/</span> ';
            if (index === navigationHistory.length - 1) {
                html += `<span class="breadcrumb-item current">${nav.page}</span>`;
            } else {
                html += `<a href="#" class="breadcrumb-item" onclick="navigateBack(${index}); return false;">${nav.page}</a>`;
            }
        });
        
        breadcrumbContent.innerHTML = html;
    } else {
        breadcrumb.classList.remove('visible');
    }
}

function navigateBack(index) {
    navigationHistory = navigationHistory.slice(0, index + 1);
    const target = navigationHistory[navigationHistory.length - 1];
    navigationHistory.pop(); // Remove it because navigateTo will add it back
    navigateTo(target.page, target.section);
}

function toggleMobileMenu() {
    // Add mobile menu implementation if needed
    alert('Mobile menu - to be implemented');
}

// ============================================
// FEATURES PAGE
// ============================================
function loadFeatureContent() {
    const features = {
        qpand: {
            title: 'QPand State Vector',
            icon: '🎯',
            content: `
                <div class="feature-section">
                    <h3>17-Dimensional Motion Representation</h3>
                    <p>The QPand state vector extends traditional tracking representations by capturing:</p>
                    <ul class="arch-list">
                        <li>Position (x, y) - 2D coordinates</li>
                        <li>Velocity (vx, vy) - First-order dynamics</li>
                        <li>Acceleration (ax, ay) - Second-order dynamics</li>
                        <li>Curvature (κx, κy) - Path bending</li>
                        <li>Jerk (jx, jy) - Acceleration rate of change</li>
                        <li>Direction angle (θ) - Orientation</li>
                        <li>Angular velocity (ω) - Rotation rate</li>
                        <li>Arc length (s) - Path traveled</li>
                        <li>Temporal momentum (pt) - Motion persistence</li>
                        <li>Energy density (ρE) - Motion intensity</li>
                    </ul>
                    <p>This extended state representation enables Q-OTS to handle complex, nonlinear motion patterns that traditional trackers struggle with.</p>
                </div>
                <div class="feature-section">
                    <h3>Mathematical Formulation</h3>
                    <div class="code-block"><pre>q ∈ ℝ¹⁷ = [x, y, vx, vy, ax, ay, κx, κy, jx, jy, θ, ω, s, pt, ρE, μ, σ]

Where:
- Classical mechanics: position, velocity, acceleration
- Differential geometry: curvature, arc length  
- Thermodynamics: energy density, momentum
- Uncertainty: mean μ, spread σ</pre></div>
                </div>
            `
        },
        boltzmann: {
            title: 'Boltzmann Motion Field',
            icon: '🌡️',
            content: `
                <div class="feature-section">
                    <h3>Energy-Based Probability Modeling</h3>
                    <p>Q-OTS uses statistical mechanics to model motion uncertainty. The Boltzmann distribution provides a principled way to assign probabilities based on motion energy:</p>
                    <div class="code-block"><pre>P(q) ∝ exp(-E(q) / T)

Where:
- E(q): Total motion energy
- T: Temperature parameter (controls uncertainty)
- Higher T → More uncertain/exploratory
- Lower T → More confident/deterministic</pre></div>
                </div>
                <div class="feature-section">
                    <h3>Energy Components</h3>
                    <p>The total energy combines multiple factors:</p>
                    <ul class="arch-list">
                        <li>Kinetic energy: ½m(vx² + vy²)</li>
                        <li>Appearance energy: Feature mismatch cost</li>
                        <li>Motion energy: Deviation from predicted trajectory</li>
                        <li>Entropy: Shannon entropy for uncertainty</li>
                    </ul>
                </div>
            `
        },
        bloch: {
            title: 'Bloch Sphere Representation',
            icon: '🔮',
            content: `
                <div class="feature-section">
                    <h3>Quantum-Inspired Motion Encoding</h3>
                    <p>The Bloch sphere maps 2D motion to a 3D quantum state representation, enabling multi-regime motion modeling:</p>
                    <div class="code-block"><pre>|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)|sin(θ/2)|1⟩

Spherical coordinates:
- θ (polar): Encodes speed magnitude
- φ (azimuthal): Encodes direction
- r (radius): Encodes confidence (0 to 1)</pre></div>
                </div>
                <div class="feature-section">
                    <h3>Motion Regimes</h3>
                    <ul class="arch-list">
                        <li>Linear motion: States near poles</li>
                        <li>Curved motion: States on equator</li>
                        <li>Erratic motion: States in interior</li>
                        <li>Occlusion: Collapsed to origin</li>
                    </ul>
                </div>
            `
        },
        wavepacket: {
            title: 'Wavepacket Dynamics',
            icon: '〰️',
            content: `
                <div class="feature-section">
                    <h3>Localized Probability Distributions</h3>
                    <p>Q-OTS uses Gaussian wavepackets to represent object locations with uncertainty:</p>
                    <div class="code-block"><pre>Ψ(x,t) = (1/√(2πσ²)) exp(-(x-μ)²/2σ²) exp(ikx - iωt)

Where:
- μ: Mean position
- σ: Uncertainty width (spreads over time)
- k: Wave vector (momentum)
- ω: Frequency (energy)</pre></div>
                </div>
                <div class="feature-section">
                    <h3>Schrödinger-Inspired Evolution</h3>
                    <p>The wavepacket evolves according to a modified Schrödinger equation:</p>
                    <ul class="arch-list">
                        <li>Spreads during occlusions</li>
                        <li>Collapses upon re-detection</li>
                        <li>Interferes with nearby objects</li>
                        <li>Maintains coherence tracking</li>
                    </ul>
                </div>
            `
        },
        neuralode: {
            title: 'Neural ODEs',
            icon: '🧠',
            content: `
                <div class="feature-section">
                    <h3>Physics-Informed Learning</h3>
                    <p>Neural Ordinary Differential Equations learn continuous-time dynamics:</p>
                    <div class="code-block"><pre>dq/dt = f_θ(q, t)

Where:
- f_θ: Neural network with parameters θ
- Learns nonlinear motion patterns
- Respects physics constraints
- Backprop through ODE solver</pre></div>
                </div>
                <div class="feature-section">
                    <h3>Advantages</h3>
                    <ul class="arch-list">
                        <li>Continuous-time predictions</li>
                        <li>Memory efficient</li>
                        <li>Handles irregular time steps</li>
                        <li>Physics-constrained learning</li>
                    </ul>
                </div>
            `
        },
        attention: {
            title: 'Quantum Attention',
            icon: '⚡',
            content: `
                <div class="feature-section">
                    <h3>Phase-Modulated Attention</h3>
                    <p>Attention mechanisms inspired by quantum interference:</p>
                    <div class="code-block"><pre>Attention(Q, K, V) = softmax((QK^T / √d_k) ⊙ e^(iφ)) V

Where:
- φ: Phase differences between queries and keys
- Interference amplifies/suppresses attention
- Enables context-aware feature extraction</pre></div>
                </div>
            `
        }
    };
    
    window.loadedFeatures = features;
}

function loadFeatureSection(section) {
    const featureDetail = document.getElementById('featureDetail');
    const feature = window.loadedFeatures[section];
    
    if (feature && featureDetail) {
        featureDetail.innerHTML = `
            <div class="feature-detail-header">
                <div class="feature-icon" style="font-size: 3rem;">${feature.icon}</div>
                <h2>${feature.title}</h2>
            </div>
            ${feature.content}
        `;
    }
}

// ============================================
// COMMUNITY
// ============================================
function initCommunity() {
    loadCommunityPosts();
}

function showCommunitySection(section) {
    document.querySelectorAll('.community-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.section === section) {
            tab.classList.add('active');
        }
    });
    
    document.querySelectorAll('.community-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`section-${section}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

async function loadCommunityPosts() {
    try {
        const response = await fetch('/api/community/posts');
        if (response.ok) {
            const posts = await response.json();
            renderPosts(posts);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

function renderPosts(posts) {
    const discussionsList = document.getElementById('discussionsList');
    const questionsList = document.getElementById('questionsList');
    const showcaseList = document.getElementById('showcaseList');
    
    if (!posts || posts.length === 0) {
        const emptyHTML = '<div class="post-card"><p>No posts yet. Be the first to contribute!</p></div>';
        if (discussionsList) discussionsList.innerHTML = emptyHTML;
        if (questionsList) questionsList.innerHTML = emptyHTML;
        if (showcaseList) showcaseList.innerHTML = emptyHTML;
        return;
    }
    
    // Render posts (simplified version)
    posts.forEach(post => {
        const postHTML = `
            <div class="post-card">
                <div class="post-header">
                    <div class="post-avatar">${post.author[0]}</div>
                    <div class="post-meta">
                        <h4>${post.author}</h4>
                        <span>${new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="post-content">
                    <h3>${post.title}</h3>
                    <p>${post.content}</p>
                </div>
                <div class="post-footer">
                    <button class="post-action">💬 ${post.replies || 0} replies</button>
                    <button class="post-action">👍 ${post.likes || 0} likes</button>
                </div>
            </div>
        `;
        
        // Add to appropriate list based on post type
        if (post.type === 'discussion' && discussionsList) {
            discussionsList.innerHTML += postHTML;
        } else if (post.type === 'question' && questionsList) {
            questionsList.innerHTML += postHTML;
        } else if (post.type === 'showcase' && showcaseList) {
            showcaseList.innerHTML += postHTML;
        }
    });
}

async function createPost(type, event) {
    event.preventDefault();
    
    if (!currentUser) {
        showToast('Please sign in to post', 'error');
        return;
    }
    
    let title, content;
    if (type === 'discussion') {
        title = document.getElementById('discussionTitle').value;
        content = document.getElementById('discussionContent').value;
    } else if (type === 'question') {
        title = document.getElementById('questionTitle').value;
        content = document.getElementById('questionContent').value;
    } else if (type === 'showcase') {
        title = document.getElementById('showcaseTitle').value;
        content = document.getElementById('showcaseContent').value;
    }
    
    try {
        const response = await fetch('/api/community/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                title,
                content,
                author: currentUser.name,
                author_email: currentUser.email
            })
        });
        
        if (response.ok) {
            showToast('Posted successfully!', 'success');
            event.target.reset();
            loadCommunityPosts();
        } else {
            showToast('Failed to post', 'error');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showToast('Error creating post', 'error');
    }
}

// ============================================
// CONTACT FORM
// ============================================
async function submitContactForm(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('contactSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    const data = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value
    };
    
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast('Message sent successfully!', 'success');
            event.target.reset();
        } else {
            showToast('Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error sending message', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ============================================
// CHAT
// ============================================
function initChat() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatToggle = document.getElementById('chatToggle');
    
    if (chatWindow && chatToggle) {
        chatWindow.classList.toggle('active');
        chatToggle.classList.toggle('active');
    }
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatSend = document.getElementById('chatSend');
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'chat-message user';
    userMsgDiv.textContent = message;
    chatMessages.appendChild(userMsgDiv);
    
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    chatSend.disabled = true;
    
    try {
        const response = await fetch(CONFIG.DEEPSEEK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
        
        // Add bot response
        const botMsgDiv = document.createElement('div');
        botMsgDiv.className = 'chat-message bot';
        botMsgDiv.textContent = data.response || 'Sorry, I encountered an error.';
        chatMessages.appendChild(botMsgDiv);
        
    } catch (error) {
        console.error('Chat error:', error);
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-message bot';
        errorDiv.textContent = 'Sorry, I encountered an error. Please try again.';
        chatMessages.appendChild(errorDiv);
    } finally {
        chatSend.disabled = false;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// ============================================
// UTILITY
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : '✕'}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Make functions globally available
window.navigateTo = navigateTo;
window.navigateBack = navigateBack;
window.toggleMobileMenu = toggleMobileMenu;
window.showAuthModal = showAuthModal;
window.signInWithGoogle = signInWithGoogle;
window.signInWithGitHub = signInWithGitHub;
window.toggleUserDropdown = toggleUserDropdown;
window.logout = logout;
window.showCommunitySection = showCommunitySection;
window.createPost = createPost;
window.submitContactForm = submitContactForm;
window.toggleChat = toggleChat;
window.handleChatKeypress = handleChatKeypress;
window.sendMessage = sendMessage;
