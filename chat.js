// chat.js - Q-OTS AI Assistant (Client-side)
// API calls go through Cloudflare Workers (secure)

// ============================================
// QSORT KNOWLEDGE BASE (Embedded from QSort.pdf)
// ============================================

const QSORT_KNOWLEDGE = {
    concepts: {
        "quantum attention": "Custom PyTorch attention with phase modulation: x * exp(i*φ). Creates interference patterns for multi-hypothesis motion tracking similar to quantum superposition.",
        
        "bloch sphere": "Geometric representation using qubit formalism |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩. Three spheres encode: Direction (heading φ_A=atan2(vy,vx)), Turning (curvature), Speed (stop/glide/burst regimes).",
        
        "neural ode": "Continuous-time dynamics using torchdiffeq. Solves dz/dt = f(z,t,θ) with automatic differentiation for smooth trajectory prediction with physics constraints.",
        
        "wavepacket": "Gaussian probability: Ψ(r,t) = A*exp(-(r-μ)²/4σ²)*exp(i*p·r). Uncertainty spreads: σ(t+Δt) = √(σ² + D*Δt). Momentum-phase coupling encodes direction and speed.",
        
        "boltzmann field": "Energy-based spatial probability: P(r) ∝ exp(-E(r)/kT). Displacement energy: E = ||Δr||²/2σ² + β||Δv|| + α||Δa|| + γ|Δκ|. Lower energy = higher probability of future position.",
        
        "qpcmsv": "QPand Classical Motion State Vector - 16-dimensional: [x, y, vx, vy, ax, ay, jx, jy, κ, s, m, px, py, σp, σθ, R]. Captures position, velocity, acceleration, jerk, curvature, speed, mass, momentum, uncertainties, reliability.",
        
        "polynomial regression": "Nonlinear trajectory: x(t) = Σ(ai*t^i). Degree n=3-5 captures curved biological motion, burst-coast patterns. Fits to recent history window (5-12 frames).",
        
        "gnn": "Graph Neural Network for associations. Nodes=detections, edges=similarity scores. Message passing with GATConv updates node features for robust identity matching.",
        
        "multi-qubit tensor": "Product state |Ψ⟩ = |ψ_A⟩⊗|ψ_B⟩⊗|ψ_C⟩ creates 8-dimensional regime space. Coupling coefficients c_ijk = α_ijk*f(κ,s,a,j,σ,R) model classical entanglement-like correlations."
    },
    
    formulas: {
        "curvature": "κ = |vx*ay - vy*ax| / (vx² + vy²)^(3/2)",
        "boltzmann probability": "P(r) = (1/Z) * exp(-E(r)/(kT))",
        "displacement energy": "E = ||r-μ||²/2σp² + β||Δv|| + α||Δa|| + γ|Δκ|",
        "wavepacket": "Ψ(r,t) = (1/2πσ²)*exp(-(r-μ)²/2σ²)*exp(i(px*x+py*y))",
        "bloch direction": "φ_A = atan2(vy, vx), θ_A = 1 - exp(-s/τ)",
        "uncertainty growth": "σ(t+Δt) = √(σ(t)² + D*Δt)",
        "polynomial fit": "x(t) = a₀ + a₁t + a₂t² + ... + aₙtⁿ"
    },
    
    implementation: {
        "pytorch": "Built with nn.Module. Uses torch-geometric (GNN), torchdiffeq (Neural ODE), custom CUDA kernels for Boltzmann field evaluation.",
        "training": "AdamW optimizer, cosine annealing + warm restarts, mixed precision FP16/BF16, gradient accumulation (effective batch=128).",
        "loss": "Multi-task: L = λ_det*L_det + λ_track*L_track + λ_physics*L_physics + λ_kl*KL(q||p)",
        "deployment": "TensorRT optimization, custom CUDA kernels, 120+ FPS target on RTX 4090. Efficient memory with gradient checkpointing.",
        "architecture": "Vision Encoder (ViT/ResNet) → FPN → Quantum Attention → GNN → Neural ODE → Normalizing Flow → Detection Head"
    },
    
    comparisons: {
        "vs yolo": "YOLO: detection only. Q-OTS: unified detection + tracking + trajectory prediction with physics-informed learning.",
        "vs deepsort": "DeepSORT: Kalman filter (linear motion). Q-OTS: polynomial + wavepacket + Bloch spheres (handles nonlinear curved paths).",
        "vs sort": "SORT: constant velocity assumption. Q-OTS: multi-derivative (v,a,j) + curvature + multi-regime switching.",
        "vs bytetrack": "ByteTrack: better association heuristics. Q-OTS: superior motion model with uncertainty quantification and physics constraints."
    }
};

// ============================================
// CHAT STATE MANAGEMENT
// ============================================

let chatHistory = [];
let isProcessing = false;

// ============================================
// INITIALIZE CHAT
// ============================================

function initializeChat() {
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    
    if (!chatToggle || !chatWindow) return;
    
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.add('active');
        chatInput?.focus();
    });
    
    chatClose?.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });
    
    chatSend?.addEventListener('click', handleSendMessage);
    
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
}

// ============================================
// MESSAGE HANDLING
// ============================================

async function handleSendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    
    const message = chatInput.value.trim();
    if (!message || isProcessing) return;
    
    // Add user message
    addChatMessage('user', message);
    chatInput.value = '';
    
    // Disable input while processing
    isProcessing = true;
    chatSend.disabled = true;
    chatSend.textContent = '⏳';
    
    // Add typing indicator
    const typingId = addTypingIndicator();
    
    try {
        // Get AI response
        const response = await getAIResponse(message);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add AI response
        addChatMessage('bot', response);
        
        // Update chat history
        chatHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: response }
        );
        
        // Keep history manageable (last 10 exchanges)
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }
        
    } catch (error) {
        removeTypingIndicator(typingId);
        addChatMessage('bot', 'Sorry, I encountered an error. Please try again.');
        console.error('Chat error:', error);
    } finally {
        isProcessing = false;
        chatSend.disabled = false;
        chatSend.textContent = 'Send';
    }
}

// ============================================
// AI RESPONSE GENERATION
// ============================================

async function getAIResponse(userMessage) {
    // First, try local knowledge (instant, free)
    const localResponse = getLocalKnowledgeResponse(userMessage);
    if (localResponse) {
        return localResponse;
    }
    
    // If no local match, call Cloudflare Worker API
    try {
        return await callCloudflareAPI(userMessage);
    } catch (error) {
        console.error('API call failed:', error);
        return getFallbackResponse(userMessage);
    }
}

// ============================================
// LOCAL KNOWLEDGE MATCHING (80% of queries)
// ============================================

function getLocalKnowledgeResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for concept matches
    for (const [concept, explanation] of Object.entries(QSORT_KNOWLEDGE.concepts)) {
        if (lowerMessage.includes(concept.toLowerCase().replace(/ /g, ''))) {
            return `**${concept.charAt(0).toUpperCase() + concept.slice(1)}:**\n\n${explanation}`;
        }
    }
    
    // Check for formula requests
    if (lowerMessage.includes('formula') || lowerMessage.includes('equation')) {
        for (const [name, formula] of Object.entries(QSORT_KNOWLEDGE.formulas)) {
            if (lowerMessage.includes(name.toLowerCase().replace(/ /g, ''))) {
                return `**${name} formula:**\n\n\`${formula}\``;
            }
        }
        // Return all formulas if no specific match
        return "**Key QSort Formulas:**\n\n" + 
               Object.entries(QSORT_KNOWLEDGE.formulas)
               .map(([name, formula]) => `• ${name}: \`${formula}\``)
               .join('\n');
    }
    
    // Check for implementation questions
    if (lowerMessage.includes('implement') || lowerMessage.includes('code') || lowerMessage.includes('pytorch')) {
        for (const [topic, info] of Object.entries(QSORT_KNOWLEDGE.implementation)) {
            if (lowerMessage.includes(topic.toLowerCase())) {
                return `**${topic} implementation:**\n\n${info}`;
            }
        }
    }
    
    // Check for comparisons
    if (lowerMessage.includes('vs') || lowerMessage.includes('compare') || lowerMessage.includes('difference')) {
        for (const [comparison, explanation] of Object.entries(QSORT_KNOWLEDGE.comparisons)) {
            const method = comparison.split(' ')[1];
            if (lowerMessage.includes(method)) {
                return `**Q-OTS ${comparison}:**\n\n${explanation}`;
            }
        }
    }
    
    return null; // No local match, use API
}

// ============================================
// CLOUDFLARE WORKER API CALL
// ============================================

async function callCloudflareAPI(userMessage) {
    // Call Cloudflare Worker endpoint (no API key in client code!)
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: userMessage,
            history: chatHistory
        })
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response;
}

// ============================================
// FALLBACK RESPONSES (No API needed)
// ============================================

function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    const fallbacks = {
        'hello': 'Hello! I\'m the Q-OTS AI assistant. Ask me about quantum tracking, neural architectures, or PyTorch implementation!',
        'help': 'I can explain:\n• Quantum attention mechanisms\n• Bloch sphere encoding\n• Neural ODEs\n• Wavepacket dynamics\n• Boltzmann fields\n• PyTorch implementation\n• Comparisons with YOLO/DeepSORT\n\nWhat interests you?',
        'what': 'Q-OTS is a hybrid quantum-inspired + classical tracking framework built in PyTorch. It combines Neural ODEs, Graph Neural Networks, and quantum geometric encodings for robust multi-object tracking.',
        'github': 'Check out the code: https://github.com/dpkpandey/QSort',
        'paper': 'The research monograph covers mathematical foundations, PyTorch architecture, and benchmarks. Contact dpkarcai@protonmail.com for details.',
        'default': 'Interesting question! Try asking about specific topics:\n• "Explain quantum attention"\n• "Show me formulas"\n• "How does it compare to YOLO?"\n• "PyTorch implementation"\n• "What is the Bloch sphere?"'
    };
    
    for (const [key, response] of Object.entries(fallbacks)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return fallbacks.default;
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function addChatMessage(type, text) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    // Format markdown-style text
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = formattedText;
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return null;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    typingDiv.id = 'typing-' + Date.now();
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return typingDiv.id;
}

function removeTypingIndicator(id) {
    const typingDiv = document.getElementById(id);
    if (typingDiv) {
        typingDiv.remove();
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChat);
    } else {
        initializeChat();
    }
}// chat.js - Q-OTS AI Assistant with QSort.pdf Knowledge
// Uses DeepSeek API (Free tier: 50M tokens/month)

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // DeepSeek API (Free & Fast)
    DEEPSEEK_API_KEY: 'sk-your-deepseek-api-key-here', // Get from: https://platform.deepseek.com
    DEEPSEEK_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions',
    MODEL: 'deepseek-chat', // Free tier model
    
    // Fallback to Hugging Face (if DeepSeek fails)
    HF_API_KEY: 'hf_your-huggingface-token-here', // Get from: https://huggingface.co/settings/tokens
    HF_ENDPOINT: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
    
    // System prompt with QSort knowledge embedded
    SYSTEM_PROMPT: `You are the Q-OTS AI Assistant, an expert in the Quantum-Oriented Tracking System (QSort).

# YOUR KNOWLEDGE BASE:

## QSort Overview
QuantumSort (QSort) is a hybrid classical-quantum tracking framework that combines:
- Classical mechanics (polynomial regression, QPCMSV state vectors)
- Statistical mechanics (Boltzmann probability fields)
- Quantum-inspired dynamics (wavepacket evolution, Bloch sphere encoding)
- PyTorch implementation with Neural ODEs, Graph Neural Networks, and Transformers

## Core Components:

1. QPand Classical Motion State Vector (QPCMSV):
   - 16-dimensional state: [x, y, vx, vy, ax, ay, jx, jy, κ, s, m, px, py, σp, σθ, R]
   - Captures position, velocity, acceleration, jerk, curvature, momentum, uncertainty

2. Polynomial Regression:
   - Nonlinear trajectory modeling (degree n=3-5)
   - Fits curved paths, burst-coast patterns
   - x(t) = Σ(ai*t^i), handles biological motion

3. Boltzmann Spatial Probability Field:
   - Energy-based prediction: P(r) ∝ exp(-E(r)/(kT))
   - Displacement energy: E = ||Δr||²/2σ² + β||Δv|| + α||Δa|| + γ|Δκ|
   - Temperature T models uncertainty growth

4. Quantum Wavepacket Dynamics:
   - Ψ(r,t) = A(t)exp(-(r-μ)²/4σ²)exp(i(px*x + py*y))
   - Uncertainty spreading: σ(t+Δt) = √(σ² + D*Δt)
   - Momentum-phase coupling for directional prediction

5. Bloch-Sphere Motion Encoding:
   - Three qubits: Direction (A), Turning (B), Speed (C)
   - |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
   - Sphere A: φ_A = atan2(vy,vx), θ_A = 1-exp(-s/τ)
   - Sphere B: turning curvature encoding
   - Sphere C: speed regime (stop/glide/burst)

6. Multi-Qubit Tensor:
   - |Ψ_motion⟩ = |ψ_A⟩ ⊗ |ψ_B⟩ ⊗ |ψ_C⟩
   - 8-dimensional regime space
   - Classical entanglement-like coupling: c_ijk = α_ijk*f(κ,s,a,j,σ,R)

7. PyTorch Architecture:
   - Vision Encoder (ViT/ResNet) → Feature Pyramid Network
   - Quantum Attention (multi-head with phase modulation)
   - Graph Neural Network (message passing for associations)
   - Neural ODE (continuous trajectory dynamics)
   - Normalizing Flow (uncertainty quantification)

## Key Advantages over YOLO/DeepSORT:
- Handles nonlinear curved trajectories (fish, particles, drones)
- Better occlusion recovery (50+ frames)
- Multi-regime switching detection
- Uncertainty-aware predictions
- Physics-informed learning

## Applications:
- Aquaculture (fish tracking in turbulent water)
- Molecular dynamics (protein conformational changes)
- Autonomous vehicles (trajectory prediction)
- Sports analytics (player tracking)
- Robotics (multi-agent coordination)

## Technical Details:
- Training: AdamW optimizer, cosine annealing, mixed precision (FP16/BF16)
- Loss: Multi-task (detection + tracking + physics + KL divergence)
- Deployment: Custom CUDA kernels, 120+ FPS on RTX 4090
- Target metrics: MOTA >0.90, IDF1 >0.95, ID switches <200

## Implementation (PyTorch):
\`\`\`python
import torch
import torch.nn as nn
from torchdiffeq import odeint

class QuantumAttention(nn.Module):
    def __init__(self, dim, heads=8):
        super().__init__()
        self.attention = nn.MultiheadAttention(dim, heads)
        self.quantum_phase = nn.Parameter(torch.randn(dim))
    
    def forward(self, x):
        x = x * torch.exp(1j * self.quantum_phase)
        return self.attention(x, x, x)[0].real

class QOTS(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = VisionTransformer()
        self.quantum_attn = QuantumAttention(512)
        self.gnn = GATConv(512, 256)
        self.ode_func = ODEFunc(256)
\`\`\`

Answer questions about QSort concepts, implementation, theory, comparisons, or applications. Be technical but clear. Cite specific formulas when relevant.`
};

// ============================================
// QSORT KNOWLEDGE EXTRACTION (Embedded)
// ============================================

const QSORT_KNOWLEDGE = {
    concepts: {
        "quantum attention": "Custom PyTorch attention with phase modulation: x * exp(i*φ). Creates interference patterns for multi-hypothesis motion tracking.",
        "bloch sphere": "Geometric representation of motion regimes. Three spheres encode: Direction (heading), Turning (curvature), Speed (stop/glide/burst). Uses qubit formalism: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩",
        "neural ode": "Continuous-time dynamics using torchdiffeq. Solves dz/dt = f(z,t,θ) with automatic differentiation for smooth trajectories.",
        "wavepacket": "Gaussian probability distribution: Ψ(r,t) = A*exp(-(r-μ)²/4σ²)*exp(i*p·r). Spreads over time: σ_new = √(σ² + D*Δt)",
        "boltzmann field": "Energy-based spatial probability: P(r) ∝ exp(-E(r)/kT). Lower energy = higher probability. Temperature T controls uncertainty.",
        "qpcmsv": "16-dim state vector: position, velocity, acceleration, jerk, curvature, speed, mass, momentum, uncertainties, reliability.",
        "polynomial regression": "Nonlinear trajectory fit: x(t) = Σ a_i*t^i. Degree n=3-5 captures curved biological motion.",
        "gnn": "Graph Neural Network for multi-object associations. Nodes=detections, edges=similarities. Message passing updates states.",
        "multi-qubit tensor": "Product state |Ψ⟩ = |ψ_A⟩⊗|ψ_B⟩⊗|ψ_C⟩. 8-dimensional space with coupled coefficients c_ijk."
    },
    
    formulas: {
        "curvature": "κ = |v_x*a_y - v_y*a_x| / (v_x² + v_y²)^(3/2)",
        "boltzmann": "P(r) = (1/Z) * exp(-E(r)/(kT)) where E = ||Δr||²/2σ² + β||Δv|| + α||Δa|| + γ|Δκ|",
        "wavepacket": "Ψ(r,t) = (1/2πσ²) * exp(-(r-μ)²/2σ²) * exp(i(p_x*x + p_y*y))",
        "bloch direction": "φ_A = atan2(v_y, v_x), θ_A = 1 - exp(-s/τ)",
        "uncertainty growth": "σ(t+Δt) = √(σ(t)² + D*Δt)",
        "energy displacement": "E(r) = ||r-μ||²/2σ_p² + β||Δv|| + α||Δa|| + γ|Δκ|"
    },
    
    implementation: {
        "pytorch": "Built with nn.Module, uses torch-geometric for GNN, torchdiffeq for ODEs",
        "training": "AdamW optimizer, cosine annealing schedule, mixed precision FP16/BF16, gradient accumulation",
        "loss": "Multi-task: L = λ_det*L_det + λ_track*L_track + λ_physics*L_physics + λ_kl*KL(q||p)",
        "deployment": "Custom CUDA kernels, TensorRT optimization, 120+ FPS target on RTX 4090",
        "data": "QPCMSV history buffer, polynomial coefficients, wavepacket state, Bloch angles, tensor coupling"
    },
    
    comparisons: {
        "vs yolo": "YOLO: detection only. QSort: detection + tracking + trajectory prediction with physics constraints",
        "vs deepsort": "DeepSORT: Kalman filter (linear). QSort: polynomial + wavepacket + Bloch spheres (nonlinear)",
        "vs sort": "SORT: constant velocity. QSort: multi-derivative (v,a,j) + curvature + regime switching",
        "vs bytetrack": "ByteTrack: better association. QSort: better motion model + uncertainty + physics-informed"
    }
};

// ============================================
// CHAT STATE MANAGEMENT
// ============================================

let chatHistory = [];
let isProcessing = false;

// ============================================
// INITIALIZE CHAT
// ============================================

function initializeChat() {
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    
    if (!chatToggle || !chatWindow) return;
    
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.add('active');
        chatInput?.focus();
    });
    
    chatClose?.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });
    
    chatSend?.addEventListener('click', handleSendMessage);
    
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Add initial greeting
    addChatMessage('bot', CONFIG.SYSTEM_PROMPT.split('\n\n')[0]);
}

// ============================================
// MESSAGE HANDLING
// ============================================

async function handleSendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    
    const message = chatInput.value.trim();
    if (!message || isProcessing) return;
    
    // Add user message
    addChatMessage('user', message);
    chatInput.value = '';
    
    // Disable input while processing
    isProcessing = true;
    chatSend.disabled = true;
    chatSend.textContent = '⏳';
    
    // Add typing indicator
    const typingId = addTypingIndicator();
    
    try {
        // Get AI response
        const response = await getAIResponse(message);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add AI response
        addChatMessage('bot', response);
        
        // Update chat history
        chatHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: response }
        );
        
        // Keep history manageable (last 10 exchanges)
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }
        
    } catch (error) {
        removeTypingIndicator(typingId);
        addChatMessage('bot', 'Sorry, I encountered an error. Please try again or check your API configuration.');
        console.error('Chat error:', error);
    } finally {
        isProcessing = false;
        chatSend.disabled = false;
        chatSend.textContent = 'Send';
    }
}

// ============================================
// AI RESPONSE GENERATION
// ============================================

async function getAIResponse(userMessage) {
    // First, try to match with local knowledge
    const localResponse = getLocalKnowledgeResponse(userMessage);
    if (localResponse) {
        return localResponse;
    }
    
    // If no local match, use AI API
    try {
        // Try DeepSeek first (faster, more generous free tier)
        return await callDeepSeekAPI(userMessage);
    } catch (error) {
        console.warn('DeepSeek failed, trying Hugging Face:', error);
        try {
            return await callHuggingFaceAPI(userMessage);
        } catch (hfError) {
            console.error('All APIs failed:', hfError);
            return getFallbackResponse(userMessage);
        }
    }
}

// ============================================
// LOCAL KNOWLEDGE MATCHING
// ============================================

function getLocalKnowledgeResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for concept matches
    for (const [concept, explanation] of Object.entries(QSORT_KNOWLEDGE.concepts)) {
        if (lowerMessage.includes(concept.toLowerCase())) {
            return `**${concept.charAt(0).toUpperCase() + concept.slice(1)}:**\n\n${explanation}`;
        }
    }
    
    // Check for formula requests
    if (lowerMessage.includes('formula') || lowerMessage.includes('equation')) {
        for (const [name, formula] of Object.entries(QSORT_KNOWLEDGE.formulas)) {
            if (lowerMessage.includes(name.toLowerCase())) {
                return `**${name} formula:**\n\n\`${formula}\``;
            }
        }
    }
    
    // Check for implementation questions
    if (lowerMessage.includes('implement') || lowerMessage.includes('code') || lowerMessage.includes('pytorch')) {
        for (const [topic, info] of Object.entries(QSORT_KNOWLEDGE.implementation)) {
            if (lowerMessage.includes(topic.toLowerCase())) {
                return `**${topic} implementation:**\n\n${info}`;
            }
        }
    }
    
    // Check for comparisons
    if (lowerMessage.includes('vs') || lowerMessage.includes('compare') || lowerMessage.includes('difference')) {
        for (const [comparison, explanation] of Object.entries(QSORT_KNOWLEDGE.comparisons)) {
            if (lowerMessage.includes(comparison.split(' ')[1])) {
                return `**Comparison - ${comparison}:**\n\n${explanation}`;
            }
        }
    }
    
    return null; // No local match, use API
}

// ============================================
// DEEPSEEK API CALL
// ============================================

async function callDeepSeekAPI(userMessage) {
    const response = await fetch(CONFIG.DEEPSEEK_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: CONFIG.MODEL,
            messages: [
                { role: 'system', content: CONFIG.SYSTEM_PROMPT },
                ...chatHistory,
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 800,
            stream: false
        })
    });
    
    if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// ============================================
// HUGGING FACE API CALL (Fallback)
// ============================================

async function callHuggingFaceAPI(userMessage) {
    const prompt = `${CONFIG.SYSTEM_PROMPT}\n\nUser: ${userMessage}\n\nAssistant:`;
    
    const response = await fetch(CONFIG.HF_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.HF_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                max_new_tokens: 500,
                temperature: 0.7,
                top_p: 0.9,
                return_full_text: false
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data[0].generated_text;
}

// ============================================
// FALLBACK RESPONSES (No API needed)
// ============================================

function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    const fallbacks = {
        'hello': 'Hello! I\'m the Q-OTS AI assistant. Ask me about quantum tracking, neural architectures, or PyTorch implementation!',
        'help': 'I can help with:\n• Quantum attention mechanisms\n• Bloch sphere encoding\n• Neural ODEs\n• PyTorch implementation\n• Comparisons with YOLO/DeepSORT\n• Formulas and equations\n\nWhat would you like to know?',
        'what is qsort': 'Q-OTS (QuantumSort) is a hybrid tracking framework combining classical mechanics, quantum-inspired dynamics, and deep learning for robust multi-object tracking.',
        'github': 'Check out the code at: https://github.com/dpkpandey/QSort',
        'paper': 'The full research paper details the mathematical foundations, PyTorch implementation, and benchmarks against YOLO/DeepSORT.',
        'default': 'That\'s interesting! QSort combines quantum-inspired architectures with PyTorch for advanced tracking. Could you ask more specifically about: quantum attention, Bloch spheres, neural ODEs, or implementation details?'
    };
    
    for (const [key, response] of Object.entries(fallbacks)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return fallbacks.default;
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function addChatMessage(type, text) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    // Format markdown-style text
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = formattedText;
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return null;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing-indicator';
    typingDiv.innerHTML = '<span>●</span><span>●</span><span>●</span>';
    typingDiv.id = 'typing-' + Date.now();
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return typingDiv.id;
}

function removeTypingIndicator(id) {
    const typingDiv = document.getElementById(id);
    if (typingDiv) {
        typingDiv.remove();
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChat);
    } else {
        initializeChat();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeChat, getAIResponse };
}
