// chat.js - Q-OTS Frontend Logic (FIXED VERSION)

const API_BASE = '/api';
let currentUser = null;
let currentSort = 'recent'; // recent, likes, responses

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Q-OTS Frontend initialized');
    
    // Check authentication
    checkAuth();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize community tabs
    initCommunityTabs();
    
    // Initialize sorting
    initSorting();
    
    // Load initial community posts
    if (window.location.hash === '#community' || getCurrentPage() === 'community') {
        loadCommunityPosts('discussions');
    }
    
    // Check for auth success/error in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success')) {
        showToast('Successfully logged in!', 'success');
        window.history.replaceState({}, '', window.location.pathname);
        checkAuth(); // Refresh auth state
    } else if (urlParams.get('auth_error')) {
        showToast('Authentication failed. Please try again.', 'error');
        window.history.replaceState({}, '', window.location.pathname);
    }
});

// Check authentication status
function checkAuth() {
    const cookies = document.cookie.split(';');
    const userDataCookie = cookies.find(c => c.trim().startsWith('user_data='));
    
    if (userDataCookie) {
        try {
            const userData = JSON.parse(decodeURIComponent(userDataCookie.split('=')[1]));
            currentUser = userData;
            console.log('✅ User logged in:', userData.email);
            updateUIForAuth(userData);
        } catch (e) {
            console.error('Failed to parse user data:', e);
            currentUser = null;
            updateUIForNoAuth();
        }
    } else {
        currentUser = null;
        updateUIForNoAuth();
    }
}

function updateUIForAuth(userData) {
    // Hide auth prompt, show create post forms
    const authPrompt = document.getElementById('communityAuthPrompt');
    if (authPrompt) authPrompt.style.display = 'none';
    
    document.getElementById('createDiscussion').style.display = 'block';
    document.getElementById('createQuestion').style.display = 'block';
    document.getElementById('createShowcase').style.display = 'block';
    
    // Update nav
    const authBtn = document.getElementById('authBtn');
    const userProfile = document.getElementById('userProfile');
    
    if (authBtn) authBtn.style.display = 'none';
    if (userProfile) {
        userProfile.style.display = 'block';
        
        const avatarImg = document.getElementById('userAvatarImg');
        const initial = document.getElementById('userInitial');
        
        if (userData.avatar && avatarImg) {
            avatarImg.src = userData.avatar;
            avatarImg.style.display = 'block';
            if (initial) initial.style.display = 'none';
        } else if (initial) {
            initial.textContent = (userData.name || userData.email || 'U')[0].toUpperCase();
            initial.style.display = 'block';
            if (avatarImg) avatarImg.style.display = 'none';
        }
    }
}

function updateUIForNoAuth() {
    // Show auth prompt, hide create post forms
    const authPrompt = document.getElementById('communityAuthPrompt');
    if (authPrompt) authPrompt.style.display = 'block';
    
    const createDiscussion = document.getElementById('createDiscussion');
    const createQuestion = document.getElementById('createQuestion');
    const createShowcase = document.getElementById('createShowcase');
    
    if (createDiscussion) createDiscussion.style.display = 'none';
    if (createQuestion) createQuestion.style.display = 'none';
    if (createShowcase) createShowcase.style.display = 'none';
    
    // Update nav
    const authBtn = document.getElementById('authBtn');
    const userProfile = document.getElementById('userProfile');
    
    if (authBtn) authBtn.style.display = 'inline-flex';
    if (userProfile) userProfile.style.display = 'none';
}

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });
}

function getCurrentPage() {
    const activeLink = document.querySelector('.nav-link.active');
    return activeLink ? activeLink.dataset.page : 'home';
}

function navigateTo(page, section = null) {
    console.log('📍 Navigating to:', page, section);
    
    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    
    // Update pages
    document.querySelectorAll('.page-container').forEach(container => {
        container.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Load content if needed
    if (page === 'community') {
        const activeTab = section || 'discussions';
        showCommunitySection(activeTab);
        loadCommunityPosts(activeTab);
    }
    
    // Update URL
    window.history.pushState({}, '', `#${page}`);
}

// Community Tabs
function initCommunityTabs() {
    const tabs = document.querySelectorAll('.community-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const section = tab.dataset.section;
            showCommunitySection(section);
        });
    });
}

function showCommunitySection(section) {
    // Update tabs
    document.querySelectorAll('.community-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.section === section);
    });
    
    // Update sections
    document.querySelectorAll('.community-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`section-${section}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Load posts
    loadCommunityPosts(section);
}

// Sorting
function initSorting() {
    const sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sort = btn.dataset.sort;
            changeSortOrder(sort);
        });
    });
}

function changeSortOrder(sort) {
    currentSort = sort;
    
    // Update buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sort);
    });
    
    // Reload posts with new sort
    const activeTab = document.querySelector('.community-tab.active');
    if (activeTab) {
        const section = activeTab.dataset.section;
        loadCommunityPosts(section);
    }
}

// Load Community Posts (FIXED!)
async function loadCommunityPosts(type) {
    const typeMap = {
        'discussions': 'discussion',
        'qa': 'question',
        'showcase': 'showcase'
    };
    
    const postType = typeMap[type] || 'discussion';
    const listId = type === 'discussions' ? 'discussionsList' : 
                   type === 'qa' ? 'questionsList' : 'showcaseList';
    
    const listEl = document.getElementById(listId);
    if (!listEl) return;
    
    // Show loading
    listEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`${API_BASE}/community/posts?type=${postType}&sort=${currentSort}&limit=20`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Received posts data:', data);
        
        // FIXED: Access data.posts instead of just data
        const posts = data.posts || [];
        
        if (posts.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No ${postType}s yet</h3>
                    <p>Be the first to contribute!</p>
                </div>
            `;
            return;
        }
        
        // FIXED: Use correct field names from API
        listEl.innerHTML = posts.map(post => `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-avatar">
                        ${post.author_avatar ? 
                            `<img src="${post.author_avatar}" alt="${post.author_name || 'User'}">` : 
                            (post.author_name || 'A')[0].toUpperCase()
                        }
                    </div>
                    <div class="post-meta">
                        <h4>${post.author_name || 'Anonymous'}</h4>
                        <span>${formatTime(post.created_at)}</span>
                    </div>
                </div>
                <div class="post-content">
                    <h3>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(post.content)}</p>
                    ${post.url ? `<a href="${escapeHtml(post.url)}" target="_blank" class="post-link">🔗 View Project</a>` : ''}
                </div>
                <div class="post-footer">
                    <button class="post-action ${isPostLiked(post.id) ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                        ❤️ <span id="likes-${post.id}">${post.likes || 0}</span>
                    </button>
                    <button class="post-action">
                        💬 ${post.responses || 0}
                    </button>
                    ${post.category ? `<span class="post-category">${post.category}</span>` : ''}
                </div>
            </div>
        `).join('');
        
        console.log(`✅ Loaded ${posts.length} posts`);
        
    } catch (error) {
        console.error('❌ Failed to load posts:', error);
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Failed to load posts</h3>
                <p>${error.message}</p>
                <button class="btn btn-secondary" onclick="loadCommunityPosts('${type}')">Retry</button>
            </div>
        `;
    }
}

// Helper functions
function formatTime(timestamp) {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isPostLiked(postId) {
    // Check localStorage for liked posts
    const liked = localStorage.getItem(`liked_${postId}`);
    return liked === 'true';
}

// Create Post (FIXED!)
async function createPost(type, event) {
    event.preventDefault();
    
    if (!currentUser) {
        showToast('Please sign in to create a post', 'error');
        return;
    }
    
    const formData = {
        type: type
    };
    
    if (type === 'discussion') {
        formData.title = document.getElementById('discussionTitle').value.trim();
        formData.content = document.getElementById('discussionContent').value.trim();
        formData.category = document.getElementById('discussionCategory').value;
    } else if (type === 'question') {
        formData.title = document.getElementById('questionTitle').value.trim();
        formData.content = document.getElementById('questionContent').value.trim();
        formData.tags = document.getElementById('questionTags').value.trim();
    } else if (type === 'showcase') {
        formData.title = document.getElementById('showcaseTitle').value.trim();
        formData.content = document.getElementById('showcaseContent').value.trim();
        formData.url = document.getElementById('showcaseUrl').value.trim();
    }
    
    if (!formData.title || !formData.content) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/community/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.ok) {
            throw new Error(data.error || 'Failed to create post');
        }
        
        showToast('Post created successfully!', 'success');
        
        // Clear form
        event.target.reset();
        
        // Reload posts
        const section = type === 'question' ? 'qa' : type === 'showcase' ? 'showcase' : 'discussions';
        loadCommunityPosts(section);
        
    } catch (error) {
        console.error('❌ Failed to create post:', error);
        showToast(error.message || 'Failed to create post', 'error');
    }
}

// Like/Unlike Post (FIXED!)
async function toggleLike(postId) {
    if (!currentUser) {
        showToast('Please sign in to like posts', 'error');
        return;
    }
    
    const isLiked = isPostLiked(postId);
    const action = isLiked ? 'unlike' : 'like';
    
    try {
        const response = await fetch(`${API_BASE}/community/posts?postId=${postId}&action=${action}`, {
            method: 'PUT',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.ok) {
            throw new Error(data.error || 'Failed to update like');
        }
        
        // Update UI
        const likesSpan = document.getElementById(`likes-${postId}`);
        if (likesSpan) {
            likesSpan.textContent = data.likes || 0;
        }
        
        const button = document.querySelector(`button[onclick="toggleLike('${postId}')"]`);
        if (button) {
            button.classList.toggle('liked');
        }
        
        // Update localStorage
        localStorage.setItem(`liked_${postId}`, !isLiked);
        
    } catch (error) {
        console.error('❌ Failed to toggle like:', error);
        showToast('Failed to update like', 'error');
    }
}

// Chat functionality
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
    
    const messagesContainer = document.getElementById('chatMessages');
    const sendButton = document.getElementById('chatSend');
    
    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    
    // Disable send button
    sendButton.disabled = true;
    
    // Add typing indicator
    addTypingIndicator();
    
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        if (!response.ok || !data.response) {
            throw new Error(data.error || 'Failed to get response');
        }
        
        // Add bot response
        addChatMessage(data.response, 'bot');
        
    } catch (error) {
        console.error('❌ Chat error:', error);
        removeTypingIndicator();
        addChatMessage('Sorry, I\'m having trouble connecting right now. Please try again later.', 'bot');
    } finally {
        sendButton.disabled = false;
    }
}

function addChatMessage(text, type) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Authentication
function signInWithGoogle() {
    window.location.href = `${API_BASE}/auth/google`;
}

function signInWithGitHub() {
    window.location.href = `${API_BASE}/auth/github`;
}

function showAuthModal() {
    // For now, just redirect to Google auth
    // In future, can show a modal with options
    signInWithGoogle();
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
}

function logout() {
    // Clear cookies
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user_data=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Clear user state
    currentUser = null;
    
    // Update UI
    updateUIForNoAuth();
    
    showToast('Logged out successfully', 'success');
    
    // Reload page
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Contact Form
async function submitContactForm(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('contactSubmitBtn');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    const formData = {
        name: document.getElementById('contactName').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value.trim()
    };
    
    try {
        const response = await fetch(`${API_BASE}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to send message');
        }
        
        showToast('Message sent successfully!', 'success');
        event.target.reset();
        
    } catch (error) {
        console.error('❌ Contact form error:', error);
        showToast('Failed to send message. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Toast notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '⚠️'}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Mobile menu
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Make functions global
window.navigateTo = navigateTo;
window.showCommunitySection = showCommunitySection;
window.changeSortOrder = changeSortOrder;
window.createPost = createPost;
window.toggleLike = toggleLike;
window.toggleChat = toggleChat;
window.handleChatKeypress = handleChatKeypress;
window.sendMessage = sendMessage;
window.signInWithGoogle = signInWithGoogle;
window.signInWithGitHub = signInWithGitHub;
window.showAuthModal = showAuthModal;
window.toggleUserDropdown = toggleUserDropdown;
window.logout = logout;
window.submitContactForm = submitContactForm;
window.toggleMobileMenu = toggleMobileMenu;
window.loadCommunityPosts = loadCommunityPosts;
