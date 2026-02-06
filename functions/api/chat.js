// functions/api/chat.js
// DeepSeek AI Chatbot - FIXED VERSION with error handling

export async function onRequestPost(context) {
    const { request, env } = context;
    
    // Add CORS headers
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    try {
        console.log('💬 Chat request received');
        
        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error('❌ Invalid JSON in request');
            return new Response(JSON.stringify({
                response: 'Invalid request format.'
            }), {
                status: 400,
                headers: corsHeaders
            });
        }
        
        const { message } = body;
        
        if (!message) {
            console.error('❌ No message provided');
            return new Response(JSON.stringify({
                response: 'Please provide a message.'
            }), {
                status: 400,
                headers: corsHeaders
            });
        }
        
        console.log('💬 Message:', message.substring(0, 50) + '...');
        
        // Check if DeepSeek API key is configured
        if (!env.DEEPSEEK_API_KEY) {
            console.error('❌ DEEPSEEK_API_KEY not configured');
            return new Response(JSON.stringify({
                response: 'The chatbot is not configured yet. Please contact the administrator to set up the DeepSeek API key.'
            }), {
                status: 200,
                headers: corsHeaders
            });
        }
        
        // System prompt with Qsort.pdf knowledge
        const systemPrompt = `You are dpkAI, an AI assistant specialized in Q-OTS (Quantum-Inspired Object Tracking System). You have complete knowledge of the Qsort research paper.

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
        
        console.log('🔄 Calling DeepSeek API...');
        
        // Call DeepSeek API
        let deepseekResponse;
        try {
            deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
        } catch (fetchError) {
            console.error('❌ Network error calling DeepSeek:', fetchError);
            return new Response(JSON.stringify({
                response: 'Unable to reach the AI service. Please check your internet connection and try again.'
            }), {
                status: 200,
                headers: corsHeaders
            });
        }
        
        if (!deepseekResponse.ok) {
            const errorText = await deepseekResponse.text();
            console.error('❌ DeepSeek API error:', deepseekResponse.status, errorText);
            
            // Check for common errors
            if (deepseekResponse.status === 401) {
                return new Response(JSON.stringify({
                    response: 'API authentication failed. Please contact the administrator.'
                }), {
                    status: 200,
                    headers: corsHeaders
                });
            } else if (deepseekResponse.status === 429) {
                return new Response(JSON.stringify({
                    response: 'Too many requests. Please wait a moment and try again.'
                }), {
                    status: 200,
                    headers: corsHeaders
                });
            } else {
                return new Response(JSON.stringify({
                    response: 'The AI service is temporarily unavailable. Please try again in a moment.'
                }), {
                    status: 200,
                    headers: corsHeaders
                });
            }
        }
        
        let data;
        try {
            data = await deepseekResponse.json();
        } catch (parseError) {
            console.error('❌ Error parsing DeepSeek response:', parseError);
            return new Response(JSON.stringify({
                response: 'Received an invalid response from the AI service. Please try again.'
            }), {
                status: 200,
                headers: corsHeaders
            });
        }
        
        const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I received an empty response.';
        
        console.log('✅ DeepSeek response received');
        
        return new Response(JSON.stringify({ 
            response: aiResponse 
        }), {
            status: 200,
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('❌ Unexpected chat error:', error);
        return new Response(JSON.stringify({
            response: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}
