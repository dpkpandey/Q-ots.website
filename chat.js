// chat.js - FIXED VERSION
// Complete frontend JavaScript with OAuth handling

// ============================================================================
// NAVIGATION & ROUTING
// ============================================================================

let currentPage = 'home';
let navigationStack = ['home'];

function navigateTo(page, anchor = null) {
    // Hide all pages
    document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;
        
        // Update navigation stack
        if (navigationStack[navigationStack.length - 1] !== page) {
            navigationStack.push(page);
        }
        
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
        
        // Update breadcrumb
        updateBreadcrumb();
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Load page content if needed
        if (page === 'features' && anchor) {
            loadFeatureDetail(anchor);
        } else if (page === 'features') {
            loadAllFeatures();
        } else if (page === 'community') {
            loadCommunityContent();
        }
    }
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    const breadcrumbContent = document.getElementById('breadcrumbContent');
    
    if (navigationStack.length > 1) {
        breadcrumb.classList.add('visible');
        
        let html = '<a href="#" class="breadcrumb-item" onclick="navigateTo(\'home\'); return false;">Home</a>';
        
        for (let i = 1; i < navigationStack.length; i++) {
            const page = navigationStack[i];
            const isLast = i === navigationStack.length - 1;
            
            html += '<span class="breadcrumb-separator">›</span>';
            
            if (isLast) {
                html += `<span class="breadcrumb-item current">${capitalize(page)}</span>`;
            } else {
                html += `<a href="#" class="breadcrumb-item" onclick="navigateTo('${page}'); return false;">${capitalize(page)}</a>`;
            }
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
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
}

// ============================================================================
// AUTHENTICATION - FIXED
// ============================================================================

let currentUser = null;

// Check for existing session on page load
function checkAuthStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle auth success
    if (urlParams.get('auth_success') === '1') {
        // Load user from cookie
        loadUserFromCookie();
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success toast
        showToast('Successfully signed in!', 'success');
    }
    
    // Handle auth error
    if (urlParams.get('auth_error')) {
        const error = urlParams.get('auth_error');
        showToast(`Authentication failed: ${error}`, 'error');
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check for existing user session
    loadUserFromCookie();
}

function loadUserFromCookie() {
    try {
        const userDataCookie = document.cookie.split(';').find(c => c.trim().startsWith('user_data='));
        
        if (userDataCookie) {
            const userData = userDataCookie.split('=')[1];
            currentUser = JSON.parse(decodeURIComponent(userData));
            updateUIForUser(currentUser);
        }
    } catch (error) {
        console.error('Error loading user from cookie:', error);
    }
}

function updateUIForUser(user) {
    const authBtn = document.getElementById('authBtn');
    const userProfile = document.getElementById('userProfile');
    const userAvatarImg = document.getElementById('userAvatarImg');
    const userInitial = document.getElementById('userInitial');
    
    if (user) {
        // Hide sign in button
        authBtn.style.display = 'none';
        
        // Show user profile
        userProfile.style.display = 'block';
        
        // Set avatar
        if (user.avatar) {
            userAvatarImg.src = user.avatar;
            userAvatarImg.style.display = 'block';
            userInitial.style.display = 'none';
        } else {
            userInitial.textContent = user.name?.charAt(0).toUpperCase() || 'U';
            userAvatarImg.style.display = 'none';
            userInitial.style.display = 'block';
        }
        
        // Update community sections
        document.getElementById('communityAuthPrompt').style.display = 'none';
        document.getElementById('createDiscussion').style.display = 'block';
        document.getElementById('createQuestion').style.display = 'block';
        document.getElementById('createShowcase').style.display = 'block';
    } else {
        authBtn.style.display = 'inline-flex';
        userProfile.style.display = 'none';
        
        // Hide community create sections
        document.getElementById('communityAuthPrompt').style.display = 'block';
        document.getElementById('createDiscussion').style.display = 'none';
        document.getElementById('createQuestion').style.display = 'none';
        document.getElementById('createShowcase').style.display = 'none';
    }
}

function showAuthModal() {
    // For now, redirect to Google auth (can be expanded to show modal)
    window.location.href = '/api/auth/google';
}

function signInWithGoogle() {
    window.location.href = '/api/auth/google';
}

function signInWithGitHub() {
    window.location.href = '/api/auth/github';
}

function logout() {
    // Clear cookies
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user_data=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    currentUser = null;
    updateUIForUser(null);
    
    showToast('Signed out successfully', 'success');
    navigateTo('home');
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userProfile = document.getElementById('userProfile');
    const dropdown = document.getElementById('userDropdown');
    
    if (!userProfile?.contains(e.target)) {
        dropdown?.classList.remove('active');
    }
});

// ============================================================================
// CHAT WIDGET
// ============================================================================

let chatMessages = [];

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatToggle = document.getElementById('chatToggle');
    
    chatWindow.classList.toggle('active');
    chatToggle.classList.toggle('active');
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    const typingMsg = addChatMessage('', 'bot', true);
    
    try {
        // Call chat API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        // Remove typing indicator
        typingMsg.remove();
        
        if (!response.ok) {
            throw new Error('Chat API failed');
        }
        
        const data = await response.json();
        addChatMessage(data.response, 'bot');
        
    } catch (error) {
        typingMsg.remove();
        addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
        console.error('Chat error:', error);
    }
}

function addChatMessage(text, type, isTyping = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    if (isTyping) {
        messageDiv.classList.add('typing');
        messageDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    } else {
        messageDiv.textContent = text;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
}

// ============================================================================
// FEATURES PAGE
// ============================================================================

const featureDetails = {
    qpand: {
        title: 'QPand State Vector',
        icon: '🎯',
        content: `
            <p>The QPand (Quantum-Pandimensional) state vector is a 17-dimensional representation capturing:</p>
            <ul class="arch-list">
                <li>Position (x, y)</li>
                <li>Velocity (vx, vy)</li>
                <li>Acceleration (ax, ay)</li>
                <li>Jerk (jx, jy)</li>
                <li>Curvature (κ)</li>
                <li>Torsion (τ)</li>
                <li>Directional orientation (θ)</li>
                <li>Angular velocity (ω)</li>
                <li>Scale (s)</li>
                <li>Aspect ratio (α)</li>
                <li>Temporal coherence (φ)</li>
            </ul>
            <div class="code-block">
                <pre>qpand = [x, y, vx, vy, ax, ay, jx, jy, κ, τ, θ, ω, s, α, φ, ψ, Δt]</pre>
            </div>
            <p>This extended state representation enables the capture of complex nonlinear motion patterns typical in biological systems.</p>
        `
    },
    boltzmann: {
        title: 'Boltzmann Motion Field',
        icon: '🌡️',
        content: `
            <p>Energy-based probabilistic motion modeling using statistical mechanics principles:</p>
            <div class="code-block">
                <pre>P(s) = (1/Z) * exp(-E(s) / kT)

where:
- E(s) = motion energy
- Z = partition function
- kT = thermal "temperature" parameter</pre>
            </div>
            <p>The Boltzmann field provides robust uncertainty quantification by treating motion prediction as a thermodynamic system.</p>
        `
    },
    bloch: {
        title: 'Bloch Sphere Representation',
        icon: '🔮',
        content: `
            <p>Quantum-inspired phase encoding maps motion states onto the Bloch sphere:</p>
            <div class="code-block">
                <pre>|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)|sin(θ/2)|1⟩

Mapping:
- θ: motion regime (ballistic ↔ diffusive)
- φ: directional phase</pre>
            </div>
            <p>This enables seamless transitions between multiple motion regimes and handles state superpositions during occlusions.</p>
        `
    },
    wavepacket: {
        title: 'Wavepacket Dynamics',
        icon: '〰️',
        content: `
            <p>Localized probability distributions that evolve according to:</p>
            <div class="code-block">
                <pre>iℏ ∂ψ/∂t = Ĥψ

where Ĥ is the motion Hamiltonian</pre>
            </div>
            <p>During occlusions, wavepackets spread naturally, representing increasing uncertainty. Upon reappearance, measurement collapses the wavepacket.</p>
        `
    },
    neuralode: {
        title: 'Neural ODEs',
        icon: '🧠',
        content: `
            <p>Physics-informed neural differential equations learn complex dynamics:</p>
            <div class="code-block">
                <pre>dx/dt = f_θ(x, t)

where f_θ is a neural network</pre>
            </div>
            <p>Trained with physics constraints to ensure learned dynamics respect conservation laws and known motion properties.</p>
        `
    },
    attention: {
        title: 'Quantum Attention',
        icon: '⚡',
        content: `
            <p>Phase-modulated attention mechanisms inspired by quantum interference:</p>
            <div class="code-block">
                <pre>Attention(Q,K,V) = softmax((QK^T + Φ)/√d)V

where Φ encodes quantum phase relationships</pre>
            </div>
            <p>Enables the model to capture long-range correlations and interference patterns in multi-object scenarios.</p>
        `
    }
};

function loadFeatureDetail(featureId) {
    const container = document.getElementById('featureDetail');
    const feature = featureDetails[featureId];
    
    if (!feature) {
        loadAllFeatures();
        return;
    }
    
    container.innerHTML = `
        <div class="feature-section">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                <div class="feature-icon" style="margin: 0;">${feature.icon}</div>
                <h2>${feature.title}</h2>
            </div>
            ${feature.content}
        </div>
    `;
}

function loadAllFeatures() {
    const container = document.getElementById('featureDetail');
    
    let html = '';
    for (const [id, feature] of Object.entries(featureDetails)) {
        html += `
            <div class="feature-section">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div class="feature-icon" style="margin: 0;">${feature.icon}</div>
                    <h3>${feature.title}</h3>
                </div>
                ${feature.content}
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ============================================================================
// COMMUNITY
// ============================================================================

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
    
    document.getElementById(`section-${section}`).classList.add('active');
    
    // Load content
    loadCommunityContent(section);
}

async function loadCommunityContent(section = 'discussions') {
    // Placeholder - will connect to actual API
    const mockPosts = [
        {
            id: 1,
            author: 'Alice Chen',
            avatar: '',
            time: '2 hours ago',
            title: 'Question about Boltzmann Field implementation',
            content: 'Has anyone implemented the Boltzmann motion field? I\'m curious about the temperature parameter tuning...',
            likes: 12,
            comments: 5
        },
        {
            id: 2,
            author: 'Bob Smith',
            avatar: '',
            time: '5 hours ago',
            title: 'QPand state normalization best practices',
            content: 'What are the recommended approaches for normalizing the 17-dimensional QPand vector?',
            likes: 8,
            comments: 3
        }
    ];
    
    const listId = `${section}List`;
    const container = document.getElementById(listId);
    
    if (!container) return;
    
    container.innerHTML = mockPosts.map(post => `
        <div class="post-card">
            <div class="post-header">
                <div class="post-avatar">${post.author.charAt(0)}</div>
                <div class="post-meta">
                    <h4>${post.author}</h4>
                    <span>${post.time}</span>
                </div>
            </div>
            <div class="post-content">
                <h3>${post.title}</h3>
                <p>${post.content}</p>
            </div>
            <div class="post-footer">
                <button class="post-action">👍 ${post.likes}</button>
                <button class="post-action">💬 ${post.comments}</button>
                <button class="post-action">🔗 Share</button>
            </div>
        </div>
    `).join('');
}

async function createPost(type, event) {
    event.preventDefault();
    
    if (!currentUser) {
        showToast('Please sign in to post', 'error');
        return;
    }
    
    showToast('Post created successfully!', 'success');
    
    // Reset form
    event.target.reset();
}

// ============================================================================
// CONTACT FORM
// ============================================================================

async function submitContactForm(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('contactSubmitBtn');
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
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        
        showToast('Message sent successfully!', 'success');
        event.target.reset();
        
    } catch (error) {
        console.error('Contact form error:', error);
        showToast('Failed to send message. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    
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

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadAllFeatures();
});
