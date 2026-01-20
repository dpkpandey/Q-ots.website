// ============================================
// Q-OTS CHAT API - Cloudflare Worker
// DeepSeek API Integration with QSort Knowledge
// ============================================

// Complete QSort PDF Knowledge Base
const QSORT_PDF_KNOWLEDGE = `
# QSORT: QUANTUM-ORIENTED TRACKING SYSTEM
## Complete Knowledge Base from Qsort.pdf

### CHAPTER 1: INTRODUCTION
Q-OTS (Quantum-Oriented Tracking System) is a revolutionary multi-object tracking framework that unifies:
- Classical mechanics (Newtonian dynamics)
- Statistical mechanics (Boltzmann distributions)
- Quantum mechanics (wavepackets, Bloch spheres)

Key Innovation: Unlike traditional trackers (SORT, DeepSORT, ByteTrack) that use linear Kalman filters, Q-OTS employs physics-grounded neural architectures.

### CHAPTER 2: BACKGROUND
**Classical Trackers:**
- SORT: Kalman filter + Hungarian algorithm, 4-8 dim state
- DeepSORT: SORT + deep appearance features (ReID)
- ByteTrack: Two-stage association using low-confidence detections

**Limitations of Linear Models:**
- Assume straight-line motion (constant velocity)
- Gaussian noise assumption fails for biological motion
- Cannot handle turns, acceleration changes, or complex trajectories

### CHAPTER 3: LIMITATIONS OF CLASSICAL TRACKERS
1. Linear dynamics assumption (x = Fx + w)
2. Gaussian noise assumption (inappropriate for biological motion)
3. Limited state dimensionality (4-8 dims)
4. No curvature encoding
5. No directional/heading information
6. Drift in long-term predictions
7. Failure during extended occlusions
8. Single motion regime assumption

### CHAPTER 4: MOTIVATION FOR QSORT
**Why Q-OTS?**
- Biological motion is inherently nonlinear
- Cells, animals, pedestrians exhibit complex trajectories
- Need probabilistic motion fields, not deterministic predictions
- Quantum analogies provide elegant uncertainty handling
- Multi-regime motion (walk/run/turn/stop) needs encoding

### CHAPTER 5: THE QPAND STATE VECTOR
QPand = Quantum-enhanced Position and Dynamics
17-dimensional state vector:
- Position: (x, y)
- Velocity: (vx, vy)  
- Acceleration: (ax, ay)
- Curvature: κ = |v × a| / |v|³
- Jerk: (jx, jy) - rate of acceleration change
- Heading: θ = atan2(vy, vx)
- Angular velocity: ω = dθ/dt
- Scale: (w, h)
- Aspect ratio: r
- Confidence: c

### CHAPTER 6: BOLTZMANN MOTION FIELD
Energy-based probabilistic motion:
P(x) = (1/Z) × exp(-E(x)/kT)

Where:
- E(x) = kinetic + potential + constraint energy
- T = temperature (increases during occlusion)
- Z = partition function
- k = Boltzmann constant

Temperature dynamics:
- T_normal = 1.0
- T_occluded = T × (1 + 0.1 × occlusion_time)
- Higher T = broader probability spread

### CHAPTER 7: BLOCH SPHERE REPRESENTATION
Quantum state on unit sphere:
|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩

Mapping:
- θ (polar) → motion intensity (stopped=0 to fast=π)
- φ (azimuthal) → motion regime (walk/run/turn)
- Bloch vector: (sinθcosφ, sinθsinφ, cosθ)

Benefits:
- Natural multi-regime encoding
- Phase encodes temporal information
- Interference enables association matching

### CHAPTER 8: WAVEPACKET DYNAMICS
Gaussian wavepacket:
ψ(x,t) = A × exp(-(x-x₀)²/4σ² + ikx - iωt)

Spreading:
σ(t) = σ₀ × √(1 + (ℏt/2mσ₀²)²)

During occlusion:
- Wavepacket spreads naturally
- Represents increasing position uncertainty
- Maintains multiple hypotheses

On re-detection:
- "Collapse" to localized state
- σ_new = σ_t × 0.1

### CHAPTER 9: NEURAL ODEs
Physics-informed dynamics learning:
dx/dt = f_θ(x, t)

Architecture:
- Input: QPand state + time
- Hidden layers: 128-256 units
- Output: state derivatives
- Solved via torchdiffeq

Physics constraints:
- Energy conservation loss
- Smoothness regularization
- Maximum speed/acceleration limits

### CHAPTER 10: QUANTUM ATTENTION
Phase-modulated attention:
Attention(Q,K,V) = softmax(QK^T × e^(iΦ) / √d) × V

Phase matrix Φ creates:
- Constructive interference for matching
- Destructive interference for non-matches
- Better crowd disambiguation

### CHAPTER 11: ASSOCIATION
Hybrid association combining:
1. Hungarian algorithm (global optimal assignment)
2. IoU-based matching
3. Quantum interference scores
4. Motion prediction gating

Cost matrix:
C_ij = α×(1-IoU) + β×motion_dist + γ×(1-interference)

### CHAPTER 12: OCCLUSION HANDLING
Multi-strategy approach:
1. Wavepacket spreading for uncertainty
2. Boltzmann temperature elevation
3. Track state buffering
4. Re-identification via Bloch similarity

Track lifecycle:
- Tentative → Confirmed → Occluded → Lost

### CHAPTER 13: IMPLEMENTATION
PyTorch architecture:
- QPandEncoder: detections → 17-dim state
- BoltzmannField: state → probability
- BlochEncoder: state → Bloch vector
- MotionODE: state → trajectory
- QuantumAttention: features → association

Training:
- MOT17/MOT20 datasets
- AdamW optimizer
- Cosine annealing LR
- Multi-task loss

### CHAPTER 14: EXPERIMENTS
Benchmarks:
- MOT17: 65.2 MOTA, 63.8 IDF1
- MOT20: 58.4 MOTA, 57.1 IDF1
- Significant improvement over SORT/DeepSORT/ByteTrack

Ablation studies show each component contributes:
- QPand: +3.2 MOTA
- Boltzmann: +2.1 MOTA
- Bloch/Wavepacket: +4.5 MOTA
- Neural ODE: +2.8 MOTA

### CHAPTER 15: COMPARISON WITH OTHER METHODS
| Method | State Dim | Dynamics | Uncertainty | Multi-Regime |
|--------|-----------|----------|-------------|--------------|
| SORT | 4-8 | Linear | Gaussian | No |
| DeepSORT | 4-8 | Linear | Gaussian | No |
| ByteTrack | 4-8 | Linear | Gaussian | No |
| Q-OTS | 17 | Neural ODE | Boltzmann | Bloch |

### APPLICATIONS
1. Video surveillance
2. Autonomous driving
3. Sports analytics
4. Cell biology / microscopy
5. Molecular dynamics
6. Pedestrian tracking
7. Animal behavior
8. Robotics

### KEY FORMULAS
- Curvature: κ = |v × a| / |v|³
- Boltzmann: P(x) = (1/Z) × exp(-E(x)/kT)
- Bloch: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
- Wavepacket: ψ(x,t) = A × exp(-(x-x₀)²/4σ² + ikx - iωt)
- Spreading: σ(t) = σ₀√(1 + (ℏt/2mσ₀²)²)
- Neural ODE: dx/dt = f_θ(x,t)
- Quantum Attention: softmax(QK^T × e^(iΦ) / √d) × V

### FUTURE WORK
- dpkAI v0.1 model under development
- Real-time optimization
- 3D tracking extension
- Multi-camera fusion
- Self-supervised learning
`;

const SYSTEM_PROMPT = `You are the Q-OTS Assistant, an expert AI trained on the complete QSort research paper.

${QSORT_PDF_KNOWLEDGE}

# YOUR ROLE:
You are a helpful, knowledgeable assistant that answers questions about Q-OTS (Quantum-Oriented Tracking System).

# INSTRUCTIONS:
1. Use the QSort knowledge above to answer questions accurately
2. Cite specific chapters and formulas when relevant
3. Be technically precise but explain clearly
4. Compare with SORT/DeepSORT/ByteTrack when asked
5. Provide PyTorch code examples when relevant
6. Explain the physics intuition behind concepts
7. Be concise but comprehensive
8. Use markdown formatting for clarity

# PERSONALITY:
- Enthusiastic about physics-grounded AI
- Patient with beginners
- Technical with experts
- Always helpful and encouraging

Remember: You have complete knowledge of QSort.pdf. Answer confidently based on this knowledge.`;

// Helper function for JSON responses
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

export async function onRequest(context) {
    // Handle CORS preflight
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    if (context.request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
        const { message, history = [] } = await context.request.json();

        if (!message || typeof message !== 'string') {
            return jsonResponse({ error: 'Valid message required' }, 400);
        }

        // Get API key from environment
        const DEEPSEEK_API_KEY = context.env.DEEPSEEK_API_KEY;

        if (!DEEPSEEK_API_KEY) {
            console.error('DEEPSEEK_API_KEY not configured');
            return jsonResponse({
                response: generateFallbackResponse(message),
                source: 'local'
            });
        }

        // Build messages array
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10),
            { role: 'user', content: message }
        ];

        // Call DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                max_tokens: 2000,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('DeepSeek API error:', error);
            return jsonResponse({
                response: generateFallbackResponse(message),
                source: 'fallback'
            });
        }

        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message?.content;

        if (!assistantMessage) {
            return jsonResponse({
                response: generateFallbackResponse(message),
                source: 'fallback'
            });
        }

        return jsonResponse({
            response: assistantMessage,
            source: 'deepseek'
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return jsonResponse({
            response: generateFallbackResponse(''),
            source: 'error'
        });
    }
}

// Fallback response generator
function generateFallbackResponse(message) {
    const q = message.toLowerCase();
    
    if (q.includes('qpand') || q.includes('state vector')) {
        return `**QPand (Quantum-enhanced Position and Dynamics)** is Q-OTS's 17-dimensional state vector:

- Position: (x, y)
- Velocity: (vx, vy)
- Acceleration: (ax, ay)
- Curvature: κ = |v × a| / |v|³
- Jerk: (jx, jy)
- Heading: θ, Angular velocity: ω
- Scale: (w, h), Confidence

This extended state captures trajectory shape (curvature), acceleration changes (jerk), and direction - enabling Q-OTS to handle complex nonlinear motion unlike traditional 4-8 dim Kalman states.`;
    }
    
    if (q.includes('boltzmann') || q.includes('temperature') || q.includes('energy')) {
        return `**Boltzmann Motion Field** uses statistical mechanics:

\`P(x) = (1/Z) × exp(-E(x)/kT)\`

- E(x) = motion energy (kinetic + potential + constraints)
- T = temperature (increases during occlusion)
- Z = partition function

During occlusions, temperature rises, spreading the probability distribution to maintain multiple hypotheses about object location.`;
    }
    
    if (q.includes('bloch') || q.includes('sphere') || q.includes('quantum')) {
        return `**Bloch Sphere Representation** encodes motion states:

\`|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩\`

- θ (polar) → motion intensity (stopped to fast)
- φ (azimuthal) → motion regime (walk/run/turn)
- Phase enables interference-based association matching

This quantum-inspired encoding naturally handles multi-regime motion that classical trackers cannot represent.`;
    }
    
    if (q.includes('wavepacket') || q.includes('spreading') || q.includes('occlusion')) {
        return `**Wavepacket Dynamics** for uncertainty:

\`ψ(x,t) = A × exp(-(x-x₀)²/4σ² + ikx - iωt)\`

Spreading: \`σ(t) = σ₀√(1 + (ℏt/2mσ₀²)²)\`

During occlusions, wavepackets spread naturally, representing increasing uncertainty. Re-detection "collapses" them back to localized states - elegantly handling the occlusion problem.`;
    }
    
    if (q.includes('neural') || q.includes('ode')) {
        return `**Neural ODEs** learn dynamics:

\`dx/dt = f_θ(x, t)\`

A neural network f_θ predicts state derivatives, enabling:
- Learning nonlinear motion patterns from data
- Physics constraint enforcement
- Continuous-time trajectory modeling
- Handling variable time steps

Implemented with torchdiffeq for differentiable ODE solving.`;
    }
    
    if (q.includes('sort') || q.includes('deepsort') || q.includes('bytetrack') || q.includes('compare')) {
        return `**Q-OTS vs Classical Trackers:**

| Feature | SORT | DeepSORT | ByteTrack | Q-OTS |
|---------|------|----------|-----------|-------|
| State Dim | 4-8 | 4-8 | 4-8 | **17** |
| Dynamics | Linear | Linear | Linear | **Neural ODE** |
| Uncertainty | Gaussian | Gaussian | Gaussian | **Boltzmann** |
| Multi-Regime | ❌ | ❌ | ❌ | **Bloch** |

Q-OTS provides fundamentally better motion modeling through physics-grounded components.`;
    }
    
    return `I'm the **Q-OTS Assistant**, here to help with quantum-inspired tracking!

Ask me about:
- **QPand** - 17-dimensional state vector
- **Boltzmann Field** - energy-based motion probability  
- **Bloch Sphere** - quantum motion encoding
- **Wavepackets** - uncertainty dynamics
- **Neural ODEs** - physics-informed learning
- **Comparisons** - Q-OTS vs SORT/DeepSORT/ByteTrack

What would you like to know?`;
}
