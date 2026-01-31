// chat.js - Complete Frontend Logic for Q-OTS

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE = '/api';
const DEEPSEEK_API_URL = `${API_BASE}/chat`;

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

let currentUser = null;
let chatMessages = [];
let currentPage = 'home';

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Q-OTS Frontend initialized');
  
  // Check authentication status
  checkAuthStatus();
  
  // Handle OAuth callback
  handleOAuthCallback();
  
  // Initialize navigation
  initializeNavigation();
  
  // Load community posts
  loadCommunityPosts();
  
  // Initialize chat
  initializeChat();
});

// =============================================================================
// AUTHENTICATION
// =============================================================================

function checkAuthStatus() {
  // Check for user_data cookie
  const cookies = document.cookie.split(';');
  const userDataCookie = cookies.find(c => c.trim().startsWith('user_data='));
  
  if (userDataCookie) {
    try {
      const userData = JSON.parse(decodeURIComponent(userDataCookie.split('=')[1]));
      currentUser = userData;
      updateAuthUI(userData);
      console.log('✅ User logged in:', userData.email);
    } catch (error) {
      console.error('❌ Failed to parse user data:', error);
    }
  } else {
    console.log('ℹ️ No user logged in');
  }
}

function updateAuthUI(userData) {
  // Hide auth button
  const authBtn = document.getElementById('authBtn');
  if (authBtn) authBtn.style.display = 'none';
  
  // Show user profile
  const userProfile = document.getElementById('userProfile');
  if (userProfile) {
    userProfile.style.display = 'block';
    
    // Set avatar
    const avatarImg = document.getElementById('userAvatarImg');
    const userInitial = document.getElementById('userInitial');
    
    if (userData.avatar) {
      avatarImg.src = userData.avatar;
      avatarImg.style.display = 'block';
      userInitial.style.display = 'none';
    } else {
      userInitial.textContent = userData.name ? userData.name[0].toUpperCase() : 'U';
      avatarImg.style.display = 'none';
      userInitial.style.display = 'block';
    }
  }
  
  // Show create post forms in community
  const createForms = ['createDiscussion', 'createQuestion', 'createShowcase'];
  createForms.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.style.display = 'block';
  });
  
  // Hide auth prompts
  const authPrompt = document.getElementById('communityAuthPrompt');
  if (authPrompt) authPrompt.style.display = 'none';
}

function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.has('auth_success')) {
    showToast('Successfully signed in!', 'success');
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    // Reload to update UI
    setTimeout(() => window.location.reload(), 1000);
  }
  
  if (urlParams.has('auth_error')) {
    const error = urlParams.get('auth_error');
    showToast(`Authentication failed: ${error}`, 'error');
    window.history.replaceState({}, '', window.location.pathname);
  }
}

function signInWithGoogle() {
  window.location.href = '/api/auth/google';
}

function signInWithGitHub() {
  window.location.href = '/api/auth/github';
}

function showAuthModal() {
  // For now, just redirect to community page with auth prompt
  navigateTo('community');
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

function logout() {
  // Clear cookies
  document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.cookie = 'user_data=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  
  currentUser = null;
  showToast('Signed out successfully', 'success');
  
  setTimeout(() => window.location.reload(), 500);
}

// =============================================================================
// NAVIGATION
// =============================================================================

function initializeNavigation() {
  // Update active nav link based on current page
  updateActiveNavLink(currentPage);
}

function navigateTo(page, section = null) {
  console.log('📍 Navigating to:', page, section);
  
  // Hide all pages
  document.querySelectorAll('.page-container').forEach(p => {
    p.classList.remove('active');
  });
  
  // Show target page
  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) {
    targetPage.classList.add('active');
    currentPage = page;
  }
  
  // Update nav links
  updateActiveNavLink(page);
  
  // Update breadcrumb
  updateBreadcrumb(page);
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Handle section-specific logic
  if (page === 'features' && section) {
    showFeatureDetail(section);
  }
  
  if (page === 'community') {
    if (section) {
      showCommunitySection(section);
    }
    loadCommunityPosts();
  }
}

function updateActiveNavLink(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === page) {
      link.classList.add('active');
    }
  });
}

function updateBreadcrumb(page) {
  const breadcrumb = document.getElementById('breadcrumb');
  const breadcrumbContent = document.getElementById('breadcrumbContent');
  
  if (page === 'home') {
    breadcrumb.classList.remove('visible');
    return;
  }
  
  breadcrumb.classList.add('visible');
  
  const pageNames = {
    features: 'Features',
    community: 'Community',
    contact: 'Contact',
    profile: 'Profile'
  };
  
  breadcrumbContent.innerHTML = `
    <a href="#" class="breadcrumb-item" onclick="navigateTo('home'); return false;">Home</a>
    <span class="breadcrumb-separator">/</span>
    <span class="breadcrumb-item current">${pageNames[page] || page}</span>
  `;
}

function toggleMobileMenu() {
  // Mobile menu toggle (implement if needed)
  alert('Mobile menu - implement if needed');
}

// =============================================================================
// FEATURES PAGE
// =============================================================================

function showFeatureDetail(section) {
  const featureDetail = document.getElementById('featureDetail');
  
  const features = {
    qpand: {
      title: 'QPand State Vector',
      icon: '🎯',
      content: `
        <div class="feature-section">
          <h3>17-Dimensional Extended State</h3>
          <p>The QPand state vector captures comprehensive motion information:</p>
          <ul class="arch-list">
            <li>Position (x, y)</li>
            <li>Velocity (vx, vy)</li>
            <li>Acceleration (ax, ay)</li>
            <li>Curvature (κ)</li>
            <li>Jerk (jx, jy)</li>
            <li>Directional orientation (θ)</li>
          </ul>
          <div class="code-block">
            <pre>QPand = [x, y, vx, vy, ax, ay, κ, jx, jy, θ, ...]</pre>
          </div>
        </div>
      `
    },
    boltzmann: {
      title: 'Boltzmann Field',
      icon: '🌡️',
      content: `
        <div class="feature-section">
          <h3>Energy-Based Probability Fields</h3>
          <p>Statistical mechanics approach to motion modeling using Boltzmann distribution:</p>
          <div class="code-block">
            <pre>P(state) ∝ exp(-E(state) / kT)</pre>
          </div>
          <p>Provides robust uncertainty quantification and handles multi-modal distributions.</p>
        </div>
      `
    },
    bloch: {
      title: 'Bloch Representation',
      icon: '🔮',
      content: `
        <div class="feature-section">
          <h3>Quantum-Inspired Phase Encoding</h3>
          <p>Motion states mapped onto Bloch sphere for multi-regime modeling:</p>
          <ul class="arch-list">
            <li>Phase coherence for similar motion patterns</li>
            <li>Superposition of multiple motion regimes</li>
            <li>Quantum interference for association</li>
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
          <p>Gaussian wavepackets that spread during occlusions and interfere during re-identification.</p>
          <p>Enables robust tracking through extended occlusions.</p>
        </div>
      `
    },
    neuralode: {
      title: 'Neural ODEs',
      icon: '🧠',
      content: `
        <div class="feature-section">
          <h3>Physics-Informed Learning</h3>
          <p>Continuous-time dynamics modeling using Neural Ordinary Differential Equations.</p>
          <p>Learns complex nonlinear motion patterns while respecting physical constraints.</p>
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
          <p>Improves association accuracy by leveraging phase relationships.</p>
        </div>
      `
    }
  };
  
  const feature = features[section] || features.qpand;
  
  featureDetail.innerHTML = `
    <div class="feature-section">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
        <div class="feature-icon" style="margin: 0;">${feature.icon}</div>
        <h2 style="margin: 0;">${feature.title}</h2>
      </div>
      ${feature.content}
    </div>
  `;
}

// =============================================================================
// COMMUNITY
// =============================================================================

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
  
  // Load posts for this section
  loadCommunityPosts(section);
}

async function loadCommunityPosts(type = 'discussions') {
  const typeMap = {
    discussions: 'discussion',
    qa: 'question',
    showcase: 'showcase'
  };
  
  const postType = typeMap[type] || 'discussion';
  const listId = type === 'discussions' ? 'discussionsList' : 
                 type === 'qa' ? 'questionsList' : 'showcaseList';
  
  const listEl = document.getElementById(listId);
  if (!listEl) return;
  
  try {
    const response = await fetch(`${API_BASE}/community/posts?type=${postType}`);
    const data =await res.json().catch(() => ({}));
    const posts = Array.isArray(data.posts) ? data.posts : [];
    
    if (posts.length === 0) {
      listEl.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">No posts yet. Be the first to contribute!</div>';
      return;
    }
    
    listEl.innerHTML = posts.map(post => `
      <div class="post-card">
        <div class="post-header">
          <div class="post-avatar">
            ${post.avatar ? `<img src="${post.avatar}" alt="${post.author}">` : post.author[0]}
          </div>
          <div class="post-meta">
            <h4>${post.author || 'Anonymous'}</h4>
            <span>${post.time || 'Just now'}</span>
          </div>
        </div>
        <div class="post-content">
          <h3>${post.title}</h3>
          <p>${post.content}</p>
        </div>
        <div class="post-footer">
          <button class="post-action" onclick="likePost(${post.id})">
            ❤️ ${post.likes || 0}
          </button>
          <button class="post-action">
            💬 ${post.comments || 0}
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('❌ Failed to load posts:', error);
    listEl.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">Failed to load posts</div>';
  }
}

async function createPost(type, event) {
  event.preventDefault();
  
  if (!currentUser) {
    showToast('Please sign in to create posts', 'error');
    return;
  }
  
  const formData = {
    type,
    title: document.getElementById(`${type}Title`).value,
    content: document.getElementById(`${type}Content`).value
  };
  
  if (type === 'discussion') {
    formData.category = document.getElementById('discussionCategory').value;
  } else if (type === 'question') {
    formData.tags = document.getElementById('questionTags').value;
  } else if (type === 'showcase') {
    formData.url = document.getElementById('showcaseUrl').value;
  }
  
  try {
    const response = await fetch(`${API_BASE}/community/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      showToast('Post created successfully!', 'success');
      event.target.reset();
      loadCommunityPosts(type === 'discussion' ? 'discussions' : type === 'question' ? 'qa' : 'showcase');
    } else {
      throw new Error('Failed to create post');
    }
  } catch (error) {
    console.error('❌ Failed to create post:', error);
    showToast('Failed to create post', 'error');
  }
}

function likePost(postId) {
  if (!currentUser) {
    showToast('Please sign in to like posts', 'error');
    return;
  }
  
  // Implement like functionality
  showToast('Like functionality coming soon!', 'success');
}

// =============================================================================
// CONTACT FORM
// =============================================================================

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
    const response = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      showToast('Message sent successfully!', 'success');
      event.target.reset();
    } else {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    showToast('Failed to send message. Please try again.', 'error');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// =============================================================================
// CHAT WIDGET
// =============================================================================

function initializeChat() {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', handleChatKeypress);
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
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

async function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const chatSend = document.getElementById('chatSend');
  
  if (!chatInput || !chatMessages) return;
  
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Add user message
  const userMessage = document.createElement('div');
  userMessage.className = 'chat-message user';
  userMessage.textContent = message;
  chatMessages.appendChild(userMessage);
  
  // Clear input
  chatInput.value = '';
  
  // Show typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'chat-message bot typing';
  typingIndicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  chatMessages.appendChild(typingIndicator);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Disable send button
  if (chatSend) chatSend.disabled = true;
  
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    // Remove typing indicator
    typingIndicator.remove();
    
    if (response.ok) {
      const data = await response.json();
      
      // Add bot response
      const botMessage = document.createElement('div');
      botMessage.className = 'chat-message bot';
      botMessage.textContent = data.response || 'Sorry, I didn\'t understand that.';
      chatMessages.appendChild(botMessage);
    } else {
      throw new Error('Failed to get response');
    }
  } catch (error) {
    console.error('❌ Chat error:', error);
    
    // Remove typing indicator
    typingIndicator.remove();
    
    // Add error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'chat-message bot';
    errorMessage.textContent = 'Sorry, I\'m having trouble connecting right now. Please try again later.';
    chatMessages.appendChild(errorMessage);
  } finally {
    // Re-enable send button
    if (chatSend) chatSend.disabled = false;
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '❌'}</span>
    <span>${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =============================================================================
// GLOBAL EXPORTS
// =============================================================================

window.navigateTo = navigateTo;
window.signInWithGoogle = signInWithGoogle;
window.signInWithGitHub = signInWithGitHub;
window.showAuthModal = showAuthModal;
window.toggleUserDropdown = toggleUserDropdown;
window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;
window.showCommunitySection = showCommunitySection;
window.createPost = createPost;
window.submitContactForm = submitContactForm;
window.toggleChat = toggleChat;
window.handleChatKeypress = handleChatKeypress;
window.sendMessage = sendMessage;
