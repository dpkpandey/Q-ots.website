// functions/api/chat.js
// Enhanced Cloudflare Worker with QSort.pdf knowledge integration

// ============================================
// QSORT.PDF COMPLETE KNOWLEDGE BASE
// ============================================

const QSORT_PDF_KNOWLEDGE = `
# COMPLETE QSORT KNOWLEDGE FROM PDF

## CHAPTER 1: INTRODUCTION

QuantumSort (QSort) is a novel hybrid classical-quantum-inspired tracking algorithm designed to model nonlinear, multi-regime motion in biological, physical, and computational systems.

### Core Problem
Traditional tracking algorithms (Kalman Filter, SORT, DeepSORT, ByteTrack) fail under:
- Nonlinear curved trajectories
- Turbulent environments
- Rapid directional changes
- Long occlusions (50+ frames)
- Multi-regime behavior (burst-glide-turn)

### QSort Solution
Integrates six theoretical layers:
1. Classical mechanics (QPCMSV state vector)
2. Polynomial nonlinear regression
3. Boltzmann spatial probability fields
4. Quantum-inspired wavepacket dynamics
5. Bloch-sphere motion encoding
6. Multi-qubit tensor fusion

---

## CHAPTER 5: QPCMSV (QPand Classical Motion State Vector)

### Definition
16-dimensional state vector at time t:

c(t) = [x, y, vx, vy, ax, ay, jx, jy, κ, s, m, px, py, σp, σθ, R]ᵀ

### Components Explained:

1. **Position (x, y)**: Object centroid from detection (YOLO)

2. **Velocity (vx, vy)**:
   vx = (x(t) - x(t-Δt)) / Δt
   vy = (y(t) - y(t-Δt)) / Δt

3. **Acceleration (ax, ay)**:
   ax = (vx(t) - vx(t-Δt)) / Δt
   ay = (vy(t) - vy(t-Δt)) / Δt

4. **Jerk (jx, jy)**: Rate of acceleration change
   jx = (ax(t) - ax(t-Δt)) / Δt

5. **Curvature (κ)**: Path curvature
   κ = |vx·ay - vy·ax| / (vx² + vy²)^(3/2) + ε

6. **Speed (s)**:
   s = √(vx² + vy²)

7. **Effective Mass (m)**: Behavioral inertia proxy
   m = f(reliability, confidence, scale)

8. **Momentum (px, py)**:
   px = m·vx
   py = m·vy

9. **Positional Uncertainty (σp)**: Prediction spread
   σp(t+Δt) = σp(t) + α·Δt

10. **Directional Uncertainty (σθ)**: Heading variance
    σθ = √Var(φdir)

11. **Reliability Score (R)**: Track confidence [0,1]

---

## CHAPTER 6: POLYNOMIAL REGRESSION

### Motivation
Linear models fail for curved biological motion. Polynomial regression captures:
- Fish burst-coast swimming
- Curved trajectories
- Acceleration and jerk dynamics

### Mathematical Formulation

For k observations (x₁,t₁), (x₂,t₂), ..., (xₖ,tₖ):

x(tᵢ) = a₀ + a₁tᵢ + a₂tᵢ² + ... + aₙtᵢⁿ + εᵢ

Matrix form: x = Ta + ε

Solution via least squares:
a = (TᵀT)⁻¹Tᵀx

### Choosing Degree n
- n=1-2: Straight/slight curves
- n=3-4: Biological motion (RECOMMENDED)
- n=5-6: Turbulent/chaotic paths

### Regularization
Tikhonov regularization to prevent overfitting:
a = (TᵀT + λI)⁻¹Tᵀx

where λ is tuned based on uncertainty.

---

## CHAPTER 7: BOLTZMANN SPATIAL PROBABILITY FIELD

### Motivation
Classical Gaussian noise assumptions fail for:
- Heavy-tailed turbulence
- Multimodal uncertainty
- Energy-dependent behavior

### Displacement Energy Function

E(x,y) = ||Δr||² / (2σp²) + β||Δv|| + α||Δa|| + γ|Δκ|

Where:
- ||Δr||²: Positional deviation
- ||Δv||: Directional deviation
- ||Δa||: Acceleration mismatch
- |Δκ|: Curvature mismatch

### Boltzmann Probability

P(x,y) = (1/Z) · exp(-E(x,y)/(kT))

Where:
- k: Boltzmann constant
- T: Effective temperature (uncertainty scale)
- Z: Partition function (normalization)

### Temperature Dynamics
T(t+Δt) = T(t) + η·Δt

Temperature grows during occlusion, representing increasing uncertainty.

### Most Likely Position
(x*, y*) = argmin E(x,y) = argmax P(x,y)

---

## CHAPTER 8: QUANTUM-INSPIRED WAVEPACKET DYNAMICS

### Wavepacket Formulation

Ψ(r,t) = A(t) · exp(-(r-μ(t))²/(4σ(t)²)) · exp(i(px·x + py·y))

### Components:
- μ(t): Expected position (from polynomial)
- σ(t): Position uncertainty (spreads over time)
- p(t): Momentum expectation (m·v)
- A(t): Normalization constant = 1/(2πσ²)

### Uncertainty Spreading

σ(t+Δt) = √(σ(t)² + D·Δt)

Where D is diffusion coefficient:
D = f(R, σθ, κ)

### Probability Density

|Ψ(r,t)|² = (1/(2πσ²)) · exp(-||r-μ||²/(2σ²))

### Measurement Collapse
Upon detection at rₘₑₐₛ:
- σ(t) → σₘᵢₙ
- μ(t) → rₘₑₐₛ
- p(t) → pₙₑw

---

## CHAPTER 9: BLOCH-SPHERE MOTION ENCODING

### Bloch Sphere Mathematics

General qubit state:
|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩

Geometric coordinates:
x = sin(θ)cos(φ)
y = sin(θ)sin(φ)
z = cos(θ)

### Three Motion Qubits

**Sphere A: Direction Qubit**
- φA = atan2(vy, vx)  [heading angle]
- θA = 1 - exp(-s/τ)   [directional confidence]

**Sphere B: Turning Qubit**
- φB = sgn(κ)·π/2      [left/right turn]
- θB = |κ|/(|κ| + K)   [turning intensity]

**Sphere C: Speed-Regime Qubit**
- θC ∈ {0, π/2, π}     [stop/glide/burst]
- φC = phase of acceleration

### Regime Interpretation
- North pole (θ=0): Uncertain/inactive
- Equator (θ=π/2): Moderate regime
- South pole (θ=π): Strong/active regime

---

## CHAPTER 10: MULTI-QUBIT TENSOR

### Tensor Product State

|Ψₘₒₜᵢₒₙ⟩ = |ψA⟩ ⊗ |ψB⟩ ⊗ |ψC⟩

Expansion:
|Ψₘₒₜᵢₒₙ⟩ = Σᵢ,ⱼ,ₖ cᵢⱼₖ |i⟩A|j⟩B|k⟩C

Creates 8-dimensional regime space:
- |000⟩: Uncertain, no turn, stationary
- |010⟩: Active turn, low speed
- |111⟩: Burst + stable direction + turning

### Coupling Coefficients

cᵢⱼₖ = αᵢⱼₖ · f(κ, s, a, j, σp, R)

Classical entanglement-like coupling:
- High curvature → strong A-B coupling
- High acceleration → strong B-C coupling
- High uncertainty → all couplings weaken

---

## CHAPTER 11: MEASUREMENT & COLLAPSE

### Update Algorithm

Upon detection z(t) = (xₘ, yₘ):

1. **Collapse QPCMSV**:
   - x ← xₘ, y ← yₘ
   - Recompute v, a, j, κ
   - σp → σₘᵢₙ, σθ → σθ,ₘᵢₙ
   - R ← R + δR

2. **Collapse Wavepacket**:
   - μ ← (xₘ, yₘ)
   - σ → σₘᵢₙ
   - Update p = m·v

3. **Collapse Boltzmann Field**:
   - E(xₘ,yₘ) = 0
   - T → Tₘᵢₙ

4. **Update Bloch Spheres**:
   - Recompute (θA,φA), (θB,φB), (θC,φC)

5. **Update Tensor**:
   - Recalculate cᵢⱼₖ

---

## CHAPTER 12: FULL QSORT PIPELINE

### Stage-by-Stage Architecture

**Stage 1: Classical Evolution (QPCMSV)**
- Update position, velocity, acceleration, jerk
- Compute curvature, speed, momentum

**Stage 2: Polynomial Prediction**
- Fit degree-n polynomial to history
- Predict future x(t+Δt), y(t+Δt)
- Derive v, a, j from polynomial

**Stage 3: Wavepacket Uncertainty**
- Spread σ via diffusion
- Update momentum-phase encoding

**Stage 4: Boltzmann Spatial Field**
- Compute energy landscape E(r)
- Calculate probability P(r) ∝ exp(-E/kT)

**Stage 5: Bloch-Sphere Encoding**
- Map motion to three qubits
- Encode direction, turning, speed

**Stage 6: Multi-Qubit Tensor**
- Fuse qubits into product state
- Compute coupling coefficients

**Final Prediction**:
PQSort(r) ∝ |Ψ(r)|² · exp(-E(r)/kT) · G(θ,φ)

---

## CHAPTER 13: PYTORCH IMPLEMENTATION

### Core Architecture

\`\`\`python
import torch
import torch.nn as nn
from torch_geometric.nn import GATConv
from torchdiffeq import odeint

class QuantumAttention(nn.Module):
    def __init__(self, dim, heads=8):
        super().__init__()
        self.attention = nn.MultiheadAttention(dim, heads)
        self.quantum_phase = nn.Parameter(torch.randn(dim))
    
    def forward(self, x):
        # Phase modulation
        x = x * torch.exp(1j * self.quantum_phase)
        attn_out, _ = self.attention(x, x, x)
        return attn_out.real

class QOTS(nn.Module):
    def __init__(self, num_classes=80):
        super().__init__()
        self.backbone = VisionTransformer(img_size=640)
        self.fpn = FeaturePyramidNetwork()
        self.quantum_attn = QuantumAttention(512)
        self.gnn = GATConv(512, 256, heads=4)
        self.ode_func = ODEFunc(256)
        self.normalizing_flow = NormalizingFlow(256)
        self.detection_head = DetectionHead(256, num_classes)
    
    def forward(self, x, t_span):
        features = self.backbone(x)
        features = self.fpn(features)
        features = self.quantum_attn(features)
        
        # GNN for association
        edge_index = build_graph(features)
        features = self.gnn(features, edge_index)
        
        # Neural ODE for trajectory
        trajectories = odeint(self.ode_func, features, t_span)
        
        # Uncertainty via normalizing flow
        uncertainty = self.normalizing_flow(trajectories[-1])
        
        detections = self.detection_head(trajectories[-1])
        return detections, uncertainty
\`\`\`

### Training Configuration

**Optimizer**: AdamW
- Learning rate: 1e-4
- Weight decay: 0.01
- Betas: (0.9, 0.999)

**Scheduler**: Cosine annealing with warm restarts
- T_0: 10 epochs
- T_mult: 2
- eta_min: 1e-6

**Loss Function**:
L = λdet·Ldet + λtrack·Ltrack + λphysics·Lphysics + λKL·KL(q||p)

**Mixed Precision**: FP16/BF16
- Gradient scaling
- Dynamic loss scaling

---

## CHAPTER 14: DEPLOYMENT

### Hardware Requirements
- **Training**: 4x RTX 4090 (96GB VRAM)
- **Inference**: 1x RTX 4090 or A100
- **Target FPS**: 120+ on RTX 4090

### Optimization Techniques
1. TensorRT conversion
2. Custom CUDA kernels for Boltzmann field
3. Gradient checkpointing
4. Mixed precision (FP16/BF16)
5. Dynamic batching

---

## CHAPTER 15: PERFORMANCE METRICS

### Target Metrics (Development Goals)
- **MOTA**: >0.90
- **IDF1**: >0.95  
- **ID Switches**: <200 (vs SORT: 1342)
- **FPS**: 120+ on RTX 4090

### Benchmark Datasets
- HDB-FishSet (aquaculture)
- MOT17 (pedestrians)
- DanceTrack (dance)
- Synthetic-FishSim

---

## KEY FORMULAS REFERENCE

1. **Curvature**: κ = |vx·ay - vy·ax| / (vx² + vy²)^(3/2)

2. **Boltzmann**: P(r) = (1/Z)·exp(-E(r)/(kT))

3. **Energy**: E = ||Δr||²/(2σp²) + β||Δv|| + α||Δa|| + γ|Δκ|

4. **Wavepacket**: Ψ = (1/2πσ²)·exp(-(r-μ)²/2σ²)·exp(i·p·r)

5. **Uncertainty**: σ(t+Δt) = √(σ² + D·Δt)

6. **Bloch Direction**: φA = atan2(vy,vx), θA = 1-exp(-s/τ)

7. **Polynomial**: x(t) = Σ(aᵢ·tⁱ) for i=0 to n

---

## APPLICATIONS

1. **Aquaculture**: Fish tracking in turbulent tanks
2. **Molecular Dynamics**: Protein conformational tracking
3. **Autonomous Vehicles**: Trajectory prediction
4. **Sports Analytics**: Player tracking
5. **Robotics**: Multi-agent coordination
6. **Surveillance**: Crowded scene tracking

---

## ADVANTAGES OVER EXISTING METHODS

**vs YOLO**:
- YOLO: Detection only
- QSort: Detection + Tracking + Trajectory Prediction

**vs DeepSORT**:
- DeepSORT: Linear Kalman filter
- QSort: Nonlinear polynomial + wavepacket + Bloch spheres

**vs SORT**:
- SORT: Constant velocity
- QSort: Multi-derivative (v,a,j) + curvature + regime switching

**vs ByteTrack**:
- ByteTrack: Better association
- QSort: Superior motion model + physics constraints
`;

// ============================================
// ENHANCED SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are the Q-OTS AI Assistant with complete access to the QSort research monograph.

${QSORT_PDF_KNOWLEDGE}

# INSTRUCTIONS:
1. Answer questions using EXACT information from the QSort.pdf knowledge above
2. Cite specific chapters, formulas, and equations when relevant
3. Be technically precise but explain clearly
4. Use LaTeX notation for complex formulas when needed
5. Compare with YOLO/DeepSORT when asked
6. Provide PyTorch code examples when relevant
7. Explain biological/physical interpretations
8. Be concise but comprehensive

When users ask about:
- Concepts: Reference specific chapter and explain thoroughly
- Formulas: Provide exact equation from knowledge base
- Implementation: Give PyTorch code examples
- Comparisons: Use information from Chapter 15
- Applications: Reference Chapter "APPLICATIONS"

Always ground your answers in the provided QSort.pdf knowledge.`;

// ============================================
// CLOUDFLARE WORKER HANDLER
// ============================================

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
                error: 'API not configured',
                response: 'The AI service is not properly configured. Please contact the administrator.'
            }, 500);
        }

        // Build conversation with QSort knowledge
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10), // Last 10 messages for context
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
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000, // Increased for detailed responses
                top_p: 0.95,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('DeepSeek API Error:', response.status, errorData);
            
            return jsonResponse({
                error: 'AI service error',
                response: 'The AI service encountered an error. Please try asking about specific QSort topics like "quantum attention", "Bloch spheres", or "polynomial regression".',
                details: errorData.error?.message || 'Unknown error'
            }, 500);
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('No response from AI');
        }

        // Return successful response
        return jsonResponse({
            response: aiResponse,
            model: 'deepseek-chat',
            usage: {
                prompt_tokens: data.usage?.prompt_tokens || 0,
                completion_tokens: data.usage?.completion_tokens || 0,
                total_tokens: data.usage?.total_tokens || 0
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Worker Error:', error.message, error.stack);
        
        return jsonResponse({
            error: 'Internal error',
            response: 'An unexpected error occurred. The system is referencing the complete QSort research monograph. Try asking: "Explain QPCMSV state vector", "Show Boltzmann field formula", or "Compare QSort with DeepSORT".',
            details: error.message
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
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache'
        }
    });
}
