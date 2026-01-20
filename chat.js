// chat.js - Complete Frontend Logic for Q-OTS Website
// Works perfectly with your existing index.html
// Version: 1.0 - Production Ready

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_BASE: '/api',
    ENDPOINTS: {
        chat: '/api/chat',
        contact: '/api/contact',
        posts: '/api/community/posts',
        googleAuth: '/api/auth/google',
        githubAuth: '/api/auth/github'
    }
};

// ============================================
// GLOBAL STATE
// ============================================
let state = {
    currentUser: null,
    navigationHistory: [],
    currentPage: 'home',
    chatMessages: [],
    communityPosts: []
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Q-OTS Website Initializing...');
    
    initAuth();
    initNavigation();
    initChat();
    initCommunity();
    initContactForm();
    loadFeatureContent();
    
    // Check for OAuth callback
    checkOAuthCallback();
    
    console.log('✅ Q-OTS Website Initialized');
});

// ============================================
// AUTHENTICATION
// ============================================
function initAuth() {
    // Check localStorage for existing session
    const userStr = localStorage.getItem('qots_user');
    if (userStr) {
        try {
            state.currentUser = JSON.parse(userStr);
            updateUIForLoggedInUser();
            console.log('✅ User logged in:', state.currentUser.name);
        } catch (e) {
            console.error('❌ Error parsing user data:', e);
            localStorage.removeItem('qots_user');
        }
    }
}

function checkOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('auth') === 'success') {
        const userData = {
            name: urlParams.get('name') || 'User',
            email: urlParams.get('email') || '',
            avatar: urlParams.get('avatar') || ''
        };
        
        // Save to localStorage
        localStorage.setItem('qots_user', JSON.stringify(userData));
        state.currentUser = userData;
        
        // Update UI
        updateUIForLoggedInUser();
        
        // Clean URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Show success message
        showToast('Successfully signed in! Welcome ' + userData.name, 'success');
        
        console.log('✅ OAuth callback successful:', userData);
    } else if (urlParams.get('auth') === 'error') {
        const error = urlParams.get('message') || 'Authentication failed';
        showToast('Sign in failed: ' + error, 'error');
        
        // Clean URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

function updateUIForLoggedInUser() {
    // Hide Sign In button
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.style.display = 'none';
    }
    
    // Show user profile
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.style.display = 'block';
        
        const userInitial = document.getElementById('userInitial');
        const userAvatarImg = document.getElementById('userAvatarImg');
        
        if (state.currentUser.avatar) {
            userAvatarImg.src = state.currentUser.avatar;
            userAvatarImg.style.display = 'block';
            if (userInitial) userInitial.style.display = 'none';
        } else if (userInitial) {
            userInitial.textContent = state.currentUser.name ? state.currentUser.name[0].toUpperCase() : 'U';
        }
    }
    
    // Hide auth prompt in community
    const authPrompt = document.getElementById('communityAuthPrompt');
    if (authPrompt) {
        authPrompt.style.display = 'none';
    }
    
    // Show create post forms
    const createForms = document.querySelectorAll('.create-post');
    createForms.forEach(form => {
        form.style.display = 'block';
    });
}

function showAuthModal() {
    // Scroll to auth prompt in community
    navigateTo('community');
    setTimeout(() => {
        const authPrompt = document.getElementById('communityAuthPrompt');
        if (authPrompt) {
            authPrompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 300);
}

function signInWithGoogle() {
    console.log('🔐 Redirecting to Google OAuth...');
    window.location.href = CONFIG.ENDPOINTS.googleAuth;
}

function signInWithGitHub() {
    console.log('🔐 Redirecting to GitHub OAuth...');
    window.location.href = CONFIG.ENDPOINTS.githubAuth;
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function logout() {
    console.log('👋 Logging out...');
    localStorage.removeItem('qots_user');
    state.currentUser = null;
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    // Set initial page
    state.currentPage = 'home';
    updateBreadcrumb();
}

function navigateTo(page, section) {
    console.log(`📍 Navigating to: ${page}${section ? '/' + section : ''}`);
    
    // Hide all pages
    document.querySelectorAll('.page-container').forEach(container => {
        container.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = page;
    } else {
        console.warn('⚠️ Page not found:', page);
        return;
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // Handle sections (like feature details)
    if (section) {
        if (page === 'features') {
            loadFeatureSection(section);
        }
    }
    
    // Update navigation history
    state.navigationHistory.push({ page, section, timestamp: Date.now() });
    updateBreadcrumb();
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    const breadcrumbContent = document.getElementById('breadcrumbContent');
    
    if (!breadcrumb || !breadcrumbContent) return;
    
    if (state.navigationHistory.length > 0) {
        breadcrumb.classList.add('visible');
        
        let html = '<a href="#" class="breadcrumb-item" onclick="navigateTo(\'home\'); return false;">Home</a>';
        
        const lastNav = state.navigationHistory[state.navigationHistory.length - 1];
        if (lastNav.page !== 'home') {
            html += ' <span class="breadcrumb-separator">/</span> ';
            html += `<span class="breadcrumb-item current">${capitalize(lastNav.page)}</span>`;
        }
        
        breadcrumbContent.innerHTML = html;
    } else {
        breadcrumb.classList.remove('visible');
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function toggleMobileMenu() {
    // Mobile menu toggle (if needed)
    console.log('📱 Mobile menu toggle');
    showToast('Mobile menu - coming soon!', 'success');
}

// ============================================
// CHAT / CHATBOT
// ============================================
function initChat() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatToggle = document.getElementById('chatToggle');
    
    if (chatWindow && chatToggle) {
        const isActive = chatWindow.classList.contains('active');
        
        if (isActive) {
            chatWindow.classList.remove('active');
            chatToggle.classList.remove('active');
        } else {
            chatWindow.classList.add('active');
            chatToggle.classList.add('active');
            
            // Focus input
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                setTimeout(() => chatInput.focus(), 100);
            }
        }
    }
}

function handleChatKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatSend = document.getElementById('chatSend');
    
    if (!chatInput || !chatMessages || !chatSend) {
        console.error('❌ Chat elements not found');
        return;
    }
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    console.log('💬 Sending message:', message);
    
    // Add user message to UI
    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = 'chat-message user';
    userMsgDiv.textContent = message;
    chatMessages.appendChild(userMsgDiv);
    
    // Clear input
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Disable send button
    chatSend.disabled = true;
    
    try {
        const response = await fetch(CONFIG.ENDPOINTS.chat, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Chat response received');
        
        // Remove typing indicator
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
        
        // Add bot response
        const botMsgDiv = document.createElement('div');
        botMsgDiv.className = 'chat-message bot';
        botMsgDiv.textContent = data.response || 'Sorry, I received an empty response.';
        chatMessages.appendChild(botMsgDiv);
        
        // Save to state
        state.chatMessages.push({ user: message, bot: data.response, timestamp: Date.now() });
        
    } catch (error) {
        console.error('❌ Chat error:', error);
        
        // Remove typing indicator
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-message bot';
        errorDiv.textContent = '❌ Sorry, I encountered an error. Please try again or contact support.';
        chatMessages.appendChild(errorDiv);
    } finally {
        chatSend.disabled = false;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// ============================================
// FEATURES PAGE
// ============================================
function loadFeatureContent() {
    // Feature content data
    window.featuresData = {
        qpand: {
            title: 'QPand State Vector',
            icon: '🎯',
            content: `
                <div class="feature-section">
                    <h3>17-Dimensional Motion Representation</h3>
                    <p>The QPand state vector extends traditional tracking by capturing position, velocity, acceleration, curvature, jerk, orientation, and more.</p>
                    <ul class="arch-list">
                        <li>Position (x, y) - 2D coordinates</li>
                        <li>Velocity (vx, vy) - First derivatives</li>
                        <li>Acceleration (ax, ay) - Second derivatives</li>
                        <li>Curvature (κx, κy) - Path bending</li>
                        <li>Jerk (jx, jy) - Third derivatives</li>
                        <li>Direction (θ) - Orientation angle</li>
                        <li>Angular velocity (ω) - Rotation rate</li>
                        <li>Arc length (s) - Distance traveled</li>
                        <li>Temporal momentum (pt) - Motion persistence</li>
                        <li>Energy density (ρE) - Motion intensity</li>
                    </ul>
                </div>
            `
        },
        boltzmann: {
            title: 'Boltzmann Motion Field',
            icon: '🌡️',
            content: `
                <div class="feature-section">
                    <h3>Energy-Based Probability</h3>
                    <p>Statistical mechanics approach to motion uncertainty using Boltzmann distributions.</p>
                    <div class="code-block"><pre>P(q) ∝ exp(-E(q) / T)

Where:
- E(q): Total energy
- T: Temperature (uncertainty)
- Higher T → More exploration
- Lower T → More exploitation</pre></div>
                </div>
            `
        },
        bloch: {
            title: 'Bloch Sphere Representation',
            icon: '🔮',
            content: `
                <div class="feature-section">
                    <h3>Quantum-Inspired Encoding</h3>
                    <p>Maps 2D motion to 3D quantum states for multi-regime modeling.</p>
                </div>
            `
        },
        wavepacket: {
            title: 'Wavepacket Dynamics',
            icon: '〰️',
            content: `
                <div class="feature-section">
                    <h3>Localized Probability</h3>
                    <p>Gaussian wavepackets that spread during occlusions and collapse on detection.</p>
                </div>
            `
        },
        neuralode: {
            title: 'Neural ODEs',
            icon: '🧠',
            content: `
                <div class="feature-section">
                    <h3>Physics-Informed Learning</h3>
                    <p>Continuous-time dynamics learned with neural differential equations.</p>
                </div>
            `
        },
        attention: {
            title: 'Quantum Attention',
            icon: '⚡',
            content: `
                <div class="feature-section">
                    <h3>Phase-Modulated Attention</h3>
                    <p>Attention mechanisms inspired by quantum interference patterns.</p>
                </div>
            `
        }
    };
}

function loadFeatureSection(section) {
    const featureDetail = document.getElementById('featureDetail');
    const feature = window.featuresData[section];
    
    if (feature && featureDetail) {
        featureDetail.innerHTML = `
            <div class="feature-detail-header" style="text-align: center; margin-bottom: 2rem;">
                <div class="feature-icon" style="font-size: 4rem; margin-bottom: 1rem;">${feature.icon}</div>
                <h2 style="font-size: 2.5rem;">${feature.title}</h2>
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
    // Update tabs
    document.querySelectorAll('.community-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.section === section) {
            tab.classList.add('active');
        }
    });
    
    // Update sections
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
        const response = await fetch(CONFIG.ENDPOINTS.posts);
        
        if (response.ok) {
            const posts = await response.json();
            state.communityPosts = posts;
            renderCommunityPosts(posts);
            console.log('✅ Loaded', posts.length, 'community posts');
        } else {
            console.warn('⚠️ Failed to load posts:', response.status);
            renderEmptyState();
        }
    } catch (error) {
        console.error('❌ Error loading posts:', error);
        renderEmptyState();
    }
}

function renderCommunityPosts(posts) {
    const discussionsList = document.getElementById('discussionsList');
    const questionsList = document.getElementById('questionsList');
    const showcaseList = document.getElementById('showcaseList');
    
    if (!posts || posts.length === 0) {
        renderEmptyState();
        return;
    }
    
    // Clear loading spinners
    if (discussionsList) discussionsList.innerHTML = '';
    if (questionsList) questionsList.innerHTML = '';
    if (showcaseList) showcaseList.innerHTML = '';
    
    posts.forEach(post => {
        const postHTML = createPostHTML(post);
        
        if (post.type === 'discussion' && discussionsList) {
            discussionsList.innerHTML += postHTML;
        } else if (post.type === 'question' && questionsList) {
            questionsList.innerHTML += postHTML;
        } else if (post.type === 'showcase' && showcaseList) {
            showcaseList.innerHTML += postHTML;
        }
    });
}

function renderEmptyState() {
    const emptyHTML = '<div class="post-card"><p>No posts yet. Be the first to contribute!</p></div>';
    
    const discussionsList = document.getElementById('discussionsList');
    const questionsList = document.getElementById('questionsList');
    const showcaseList = document.getElementById('showcaseList');
    
    if (discussionsList) discussionsList.innerHTML = emptyHTML;
    if (questionsList) questionsList.innerHTML = emptyHTML;
    if (showcaseList) showcaseList.innerHTML = emptyHTML;
}

function createPostHTML(post) {
    const initial = post.author ? post.author[0].toUpperCase() : 'U';
    const date = new Date(post.created_at).toLocaleDateString();
    
    return `
        <div class="post-card">
            <div class="post-header">
                <div class="post-avatar">${initial}</div>
                <div class="post-meta">
                    <h4>${post.author || 'Anonymous'}</h4>
                    <span>${date}</span>
                </div>
            </div>
            <div class="post-content">
                <h3>${post.title || 'Untitled'}</h3>
                <p>${post.content || ''}</p>
            </div>
            <div class="post-footer">
                <button class="post-action">💬 ${post.replies || 0} replies</button>
                <button class="post-action">👍 ${post.likes || 0} likes</button>
            </div>
        </div>
    `;
}

async function createPost(type, event) {
    event.preventDefault();
    
    if (!state.currentUser) {
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
    
    if (!title || !content) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.ENDPOINTS.posts, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                title,
                content,
                author: state.currentUser.name,
                author_email: state.currentUser.email
            })
        });
        
        if (response.ok) {
            showToast('Posted successfully!', 'success');
            event.target.reset();
            loadCommunityPosts();
        } else {
            showToast('Failed to create post', 'error');
        }
    } catch (error) {
        console.error('❌ Error creating post:', error);
        showToast('Error creating post', 'error');
    }
}

// ============================================
// CONTACT FORM
// ============================================
function initContactForm() {
    // Contact form is initialized via HTML onsubmit
}

async function submitContactForm(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('contactSubmitBtn');
    if (!submitBtn) return;
    
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    const formData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value
    };
    
    try {
        const response = await fetch(CONFIG.ENDPOINTS.contact, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showToast('Message sent successfully!', 'success');
            event.target.reset();
        } else {
            showToast('Failed to send message', 'error');
        }
    } catch (error) {
        console.error('❌ Contact form error:', error);
        showToast('Error sending message', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('⚠️ Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : '✕'}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// GLOBAL EXPORTS
// ============================================
// Make functions available to HTML onclick handlers
window.navigateTo = navigateTo;
window.toggleMobileMenu = toggleMobileMenu;
window.showAuthModal = showAuthModal;
window.signInWithGoogle = signInWithGoogle;
window.signInWithGitHub = signInWithGitHub;
window.toggleUserDropdown = toggleUserDropdown;
window.logout = logout;
window.toggleChat = toggleChat;
window.handleChatKeypress = handleChatKeypress;
window.sendMessage = sendMessage;
window.showCommunitySection = showCommunitySection;
window.createPost = createPost;
window.submitContactForm = submitContactForm;

console.log('✅ chat.js loaded successfully');
