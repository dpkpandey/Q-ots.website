// functions/api/chat.js
// DeepSeek AI Chatbot with Complete Qsort.pdf Knowledge

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { message } = await request.json();
        
        if (!message) {
            return jsonResponse({ error: 'Message is required' }, 400);
        }
        
        console.log('💬 Chat request:', message.substring(0, 50) + '...');
        
        // Check if DeepSeek API key is configured
        if (!env.DEEPSEEK_API_KEY) {
            console.error('❌ DEEPSEEK_API_KEY not configured');
            return jsonResponse({
                response: 'Sorry, the chatbot is not configured. Please contact the administrator.'
            });
        }
        
        // System prompt with complete Qsort.pdf knowledge
        const systemPrompt = `You are dpkAI, an AI assistant specialized in the Q-OTS (Quantum-Inspired Object Tracking System). You have complete knowledge of the Qsort research paper.

## Your Knowledge Base:

### 1. QPand State Vector (17-Dimensional)
Position (x,y), Velocity (vx,vy), Acceleration (ax,ay), Curvature (κx,κy), Jerk (jx,jy), Direction (θ), Angular velocity (ω), Arc length (s), Temporal momentum (pt), Energy density (ρE), Mean (μ), Spread (σ)

### 2. Boltzmann Motion Field
Energy-based probability: P(q) ∝ exp(-E(q)/T)
Temperature T controls uncertainty/exploration

### 3. Bloch Sphere Representation
Maps 2D motion to 3D quantum states
Polar angle θ = speed, Azimuthal φ = direction

### 4. Wavepacket Dynamics
Gaussian wavepackets: Ψ(x,t) with spreading during occlusions
Schrödinger-inspired evolution

### 5. Neural ODEs
Continuous-time dynamics: dq/dt = f_θ(q,t)
Physics-informed learning

### 6. Comparisons
- vs SORT: Linear Kalman vs 17-D nonlinear QPand
- vs DeepSORT: Adds appearance but simpler dynamics
- vs ByteTrack: Two-step association vs unified energy landscape

### 7. Applications
Autonomous driving, surveillance, sports analytics, robotics, cell tracking

Be concise, technically accurate, and helpful. Use equations when relevant.`;
        
        // Call DeepSeek API
        console.log('🔄 Calling DeepSeek API...');
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
                        content: systemPrompt
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
        
        if (!deepseekResponse.ok) {
            const errorText = await deepseekResponse.text();
            console.error('❌ DeepSeek API error:', deepseekResponse.status, errorText);
            
            return jsonResponse({
                response: 'Sorry, I encountered an error processing your request. Please try again.'
            });
        }
        
        const data = await deepseekResponse.json();
        const aiResponse = data.choices[0]?.message?.content || 'Sorry, I received an empty response.';
        
        console.log('✅ DeepSeek response received');
        
        return jsonResponse({ response: aiResponse });
        
    } catch (error) {
        console.error('❌ Chat error:', error);
        return jsonResponse({
            response: 'Sorry, an unexpected error occurred. Please try again.'
        }, 500);
    }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

// Helper function for JSON responses
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
