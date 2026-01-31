// functions/api/chat.js
// DeepSeek AI Chat with complete QSort.pdf knowledge

export async function onRequestPost({ request, env }) {
  try {
    const { message } = await request.json();
    
    if (!message || message.trim() === '') {
      return jsonResponse({ 
        error: 'Message is required',
        response: 'Please provide a message.' 
      }, 400);
    }

    // Check if DeepSeek API key is configured
    if (!env.DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY not configured');
      return jsonResponse({ 
        error: 'API not configured',
        response: 'Sorry, the AI service is not configured. Please contact the administrator.' 
      }, 500);
    }

    // Complete QSort knowledge system prompt
    const SYSTEM_PROMPT = `You are an expert AI assistant specializing in Q-OTS (Quantum-Oriented Tracking System), also known as QSort. You have complete knowledge of the QSort research paper.

KEY CONCEPTS:

1. QPand State Vector (17 Dimensions):
   - Position (x, y): 2D location
   - Velocity (vx, vy): Motion speed and direction
   - Acceleration (ax, ay): Rate of velocity change
   - Jerk (jx, jy): Rate of acceleration change  
   - Curvature (κx, κy): Path bending
   - Directional orientation (θx, θy, θz): 3D angles
   - Aspect ratio (w/h): Bounding box shape
   Total: 17 dimensions capturing complete motion state

2. Boltzmann Motion Field:
   - Uses statistical mechanics
   - Energy-based probability: P(state) ∝ exp(-E/kT)
   - Temperature T controls uncertainty
   - Energy function based on motion coherence
   - Robust tracking under occlusions

3. Bloch Sphere Representation:
   - Quantum-inspired state encoding
   - Maps motion regimes to Bloch sphere points
   - θ (polar): Motion smoothness
   - φ (azimuthal): Direction changes
   - Multi-regime motion modeling

4. Wavepacket Dynamics:
   - Probability distributions that spread over time
   - Gaussian wavepackets: ψ(x,t) = exp(-(x-x₀)²/2σ²(t))
   - Uncertainty grows during occlusions: σ²(t) = σ₀² + (ħt/2m)²
   - Interference for multi-hypothesis tracking

5. Neural ODEs:
   - Physics-informed neural networks
   - Learn dynamics: dx/dt = f(x, t; θ)
   - Continuous-time modeling
   - Captures nonlinear motion

6. Quantum Attention:
   - Phase-modulated attention weights
   - Combines softmax with quantum interference
   - Attention(Q,K,V) = softmax(QK^T/√d + φ)V

7. Architecture:
   Input: YOLO/Faster R-CNN detections
   → QPand Encoder: Extract 17-dim features
   → Boltzmann Field: Energy-based probabilities
   → Bloch-Wavepacket: Quantum encoding
   → Association: Hungarian + Interference
   Output: Tracked object IDs

8. Advantages:
   - Handles nonlinear biological motion
   - Robust to long occlusions
   - Multi-regime motion representation
   - Physics-constrained predictions
   - Uncertainty quantification

9. Comparisons:
   - SORT: Basic Kalman, linear motion only
   - DeepSORT: Adds appearance, still linear
   - ByteTrack: Better occlusion, no physics
   - Q-OTS: Physics-grounded, all motion regimes

10. Math Foundations:
    - Hamiltonian mechanics: H = T + V
    - Schrödinger equation: iħ∂ψ/∂t = Hψ  
    - Boltzmann distribution: P = exp(-βE)/Z
    - Neural ODE: dx/dt = NeuralNet(x, t)

Answer questions about Q-OTS/QSort using this knowledge. Be precise, technical, and reference specific concepts. Use LaTeX-style notation for math when appropriate.`;

    // Call DeepSeek API
    console.log('Calling DeepSeek API...');
    
    const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        stream: false
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('DeepSeek API error:', apiResponse.status, errorText);
      throw new Error(`DeepSeek API error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid DeepSeek response:', data);
      throw new Error('Invalid response from DeepSeek API');
    }

    const aiResponse = data.choices[0].message.content;

    return jsonResponse({ 
      success: true,
      response: aiResponse 
    }, 200);

  } catch (error) {
    console.error('Chat API error:', error);
    return jsonResponse({ 
      error: 'Failed to get AI response',
      response: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
      details: error.message 
    }, 500);
  }
}

// Handle CORS preflight
export async function onRequestOptions({ request, env }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env)
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    }
  });
}

function corsHeaders(request, env) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
