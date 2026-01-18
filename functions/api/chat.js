// functions/api/chat.js
// Cloudflare Pages Function (Worker) for Q-OTS AI Chat
// API key stored securely in environment variables

// ============================================
// SYSTEM PROMPT WITH QSORT KNOWLEDGE
// ============================================

const SYSTEM_PROMPT = `You are the Q-OTS AI Assistant, an expert in the Quantum-Oriented Tracking System (QSort).

# CORE KNOWLEDGE:

## Q-OTS Overview
Quantum-Oriented Tracking System (QSort) is a hybrid classical-quantum-inspired framework combining:
- Classical mechanics (polynomial regression, QPCMSV state vectors)  
- Statistical mechanics (Boltzmann probability fields)
- Quantum-inspired dynamics (wavepacket evolution, Bloch sphere encoding)
- PyTorch deep learning (Neural ODEs, GNNs, Transformers)

## Key Components:

### 1. QPand Classical Motion State Vector (QPCMSV)
16-dimensional state: [x, y, vx, vy, ax, ay, jx, jy, κ, s, m, px, py, σp, σθ, R]
- Position, velocity, acceleration, jerk, curvature
- Speed, mass, momentum, uncertainties, reliability
- Captures multi-derivative nonlinear dynamics

### 2. Polynomial Regression
x(t) = Σ(ai*t^i) for i=0 to n
- Degree n=3-5 for biological motion
- Fits curved trajectories (burst-coast patterns)
- Better than Kalman's constant velocity

### 3. Boltzmann Spatial Field
P(r) = (1/Z) * exp(-E(r)/(kT))
E(r) = ||r-μ||²/2σ² + β||Δv|| + α||Δa|| + γ|Δκ|
- Energy-based spatial probability
- Low energy = high probability
- Temperature T models uncertainty

### 4. Quantum Wavepacket
Ψ(r,t) = A*exp(-(r-μ)²/4σ²)*exp(i*p·r)
σ(t+Δt) = √(σ² + D*Δt)
- Uncertainty spreads over time
- Momentum-phase coupling
- Collapses on measurement

### 5. Bloch Sphere Encoding
|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
- Sphere A: Direction (φ=atan2(vy,vx), θ=1-exp(-s/τ))
- Sphere B: Turning (curvature encoding)
- Sphere C: Speed regime (stop/glide/burst)

### 6. Multi-Qubit Tensor
|Ψ⟩ = |ψ_A⟩⊗|ψ_B⟩⊗|ψ_C⟩
c_ijk = α_ijk*f(κ,s,a,j,σ,R)
- 8-dimensional regime space
- Classical entanglement-like coupling

### 7. PyTorch Architecture
Vision Encoder → FPN → Quantum Attention → GNN → Neural ODE → Normalizing Flow → Detection Head
- Custom nn.Module implementations
- torch-geometric for GNN
- torchdiffeq for Neural ODE
- Custom CUDA kernels

## Formulas:
- Curvature: κ = |vx*ay - vy*ax| / (vx² + vy²)^(3/2)
- Boltzmann: P(r) = (1/Z) * exp(-E/(kT))
- Energy: E = ||Δr||²/2σ² + β||Δv|| + α||Δa|| + γ|Δκ|
- Wavepacket: Ψ = (1/2πσ²)*exp(-(r-μ)²/2σ²)*exp(i*p·r)
- Bloch: φ_A = atan2(vy,vx), θ_A = 1-exp(-s/τ)

## Advantages vs YOLO/DeepSORT:
- Handles nonlinear curved trajectories
- Better occlusion recovery (50+ frames)
- Multi-regime switching (turn/glide/burst)
- Physics-informed learning
- Uncertainty quantification

## Training:
- AdamW optimizer + cosine annealing
- Mixed precision FP16/BF16
- Multi-task loss: detection + tracking + physics + KL
- Target: 120+ FPS on RTX 4090

## Applications:
- Aquaculture (fish tracking in turbulence)
- Molecular dynamics (protein conformations)
- Autonomous vehicles (trajectory prediction)
- Sports analytics
- Robotics

Respond concisely but technically accurate. Use formulas when relevant. Be helpful and encouraging.`;

// ============================================
// CLOUDFLARE PAGES FUNCTION (API ENDPOINT)
// ============================================

export async function onRequest(context) {
    // Handle CORS
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    try {
        // Parse request
        const { message, history = [] } = await context.request.json();

        if (!message) {
            return jsonResponse({ error: 'Message is required' }, 400);
        }

        // Get API key from environment (SECURE!)
        const DEEPSEEK_API_KEY = context.env.DEEPSEEK_API_KEY;

        if (!DEEPSEEK_API_KEY) {
            console.error('DEEPSEEK_API_KEY not set in environment');
            return jsonResponse({ 
                error: 'API configuration error',
                response: 'Sorry, the AI service is not configured. Please contact the administrator.'
            }, 500);
        }

        // Build messages for DeepSeek
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10), // Last 10 messages for context
            { role: 'user', content: message }
        ];

        // Call DeepSeek API
        const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.7,
                max_tokens: 800,
                stream: false
            })
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error('DeepSeek API error:', aiResponse.status, errorText);
            
            return jsonResponse({
                error: 'AI service error',
                response: 'Sorry, the AI service is temporarily unavailable. Try asking about specific topics like "quantum attention" or "Bloch spheres".'
            }, 500);
        }

        const data = await aiResponse.json();
        const responseText = data.choices[0].message.content;

        // Return success response
        return jsonResponse({
            response: responseText,
            model: 'deepseek-chat',
            usage: data.usage
        });

    } catch (error) {
        console.error('Chat API error:', error);
        
        return jsonResponse({
            error: 'Internal server error',
            response: 'An error occurred. Please try again or ask about: quantum attention, Bloch spheres, neural ODEs, PyTorch implementation, or comparisons with YOLO.'
        }, 500);
    }
}

// ============================================
// HELPER FUNCTION
// ============================================

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
