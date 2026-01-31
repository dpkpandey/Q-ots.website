// functions/api/chat.js
// AI Chat API using DeepSeek with complete QSort.pdf knowledge

export async function onRequestPost({ request, env }) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Complete QSort.pdf knowledge for system prompt
    const QSORT_KNOWLEDGE = `You are an expert AI assistant specializing in the Q-OTS (Quantum-Oriented Tracking System) research paper. You have complete knowledge of the QSort.pdf document.

KEY CONCEPTS FROM QSORT.PDF:

1. QPAND STATE VECTOR (17-DIMENSIONAL):
- Position (x, y): 2D coordinates
- Velocity (vx, vy): Motion direction and speed
- Acceleration (ax, ay): Rate of velocity change
- Jerk (jx, jy): Rate of acceleration change
- Curvature (κx, κy): Path curvature
- Directional orientation (θx, θy, θz): 3D orientation angles
- Aspect ratio (w/h): Bounding box shape
- Total: 17 dimensions capturing complete motion state

2. BOLTZMANN MOTION FIELD:
- Uses statistical mechanics principles
- Energy-based probability distribution: P(state) ∝ exp(-E/kT)
- Temperature parameter T controls uncertainty
- Energy function based on motion coherence
- Enables robust tracking under occlusions

3. BLOCH SPHERE REPRESENTATION:
- Quantum-inspired state encoding
- Maps motion regimes to points on Bloch sphere
- θ (polar angle): Motion smoothness
- φ (azimuthal angle): Direction changes
- Enables multi-regime motion modeling

4. WAVEPACKET DYNAMICS:
- Probability distributions that spread over time
- Gaussian wavepackets: ψ(x,t) = exp(-(x-x₀)²/2σ²(t))
- Uncertainty grows during occlusions: σ²(t) = σ₀² + (ħt/2m)²
- Interference patterns for multi-hypothesis tracking

5. NEURAL ODES (ORDINARY DIFFERENTIAL EQUATIONS):
- Physics-informed neural networks
- Learn dynamics: dx/dt = f(x, t; θ)
- Continuous-time modeling
- Captures nonlinear motion patterns

6. QUANTUM ATTENTION MECHANISM:
- Phase-modulated attention weights
- Combines classical softmax with quantum interference
- Attention(Q,K,V) = softmax(QK^T/√d + φ)V
- φ represents quantum phase

7. ARCHITECTURE PIPELINE:
- Input: Detections from YOLO/Faster R-CNN
- QPand Encoder: Extract 17-dim features
- Boltzmann Field: Compute energy-based probabilities
- Bloch-Wavepacket: Encode quantum-inspired states
- Association: Hungarian algorithm + interference
- Output: Tracked object IDs

8. ADVANTAGES OVER TRADITIONAL METHODS:
- Handles nonlinear biological motion (insects, cells, animals)
- Robust to long occlusions (wavepacket spreading)
- Multi-regime motion (Bloch sphere encoding)
- Physics-constrained predictions (energy minimization)
- Uncertainty quantification (Boltzmann statistics)

9. COMPARISONS:
- SORT: Basic Kalman filter, linear motion only
- DeepSORT: Adds appearance, still assumes linear motion
- ByteTrack: Better occlusion handling, no physics constraints
- Q-OTS: Physics-grounded, handles all motion regimes

10. MATHEMATICAL FOUNDATIONS:
- Hamiltonian mechanics: H = T + V
- Schrödinger equation: iħ∂ψ/∂t = Hψ
- Boltzmann distribution: P = exp(-βE)/Z
- Neural ODE: dx/dt = NeuralNet(x, t)

Answer questions about Q-OTS using this knowledge. Be precise, technical, and reference specific concepts from the paper.`;

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: QSORT_KNOWLEDGE
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get AI response',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
