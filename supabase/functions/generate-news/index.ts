import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getAllowedOrigin = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN') || '',
    'http://localhost:5173',
    'http://localhost:8080',
  ].filter(Boolean);
  
  if (allowedOrigins.includes(origin) || 
      origin.endsWith('.lovable.app') || 
      origin.endsWith('.lovableproject.com')) {
    return origin;
  }
  return allowedOrigins[0] || 'http://localhost:5173';
};

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error("Role check failed:", roleError);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    const body = await req.json();
    const { topic } = body;

    // Validate topic if provided
    if (topic !== undefined && topic !== null) {
      if (typeof topic !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid topic format' }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (topic.length > 200) {
        return new Response(JSON.stringify({ error: 'Topic too long (max 200 characters)' }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Sanitize topic if provided
    const sanitizedTopic = topic ? topic.replace(/[<>{}]/g, '').trim() : null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`User ${user.id} generating news article about: ${sanitizedTopic || 'The General Da Jamaican Boy'}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a music journalist specializing in reggae, dancehall, and Caribbean music. Write engaging, authentic news articles about "The General Da Jamaican Boy" - a rising reggae artist from Jamaica known for his authentic vibes and positive messages. 

Your articles should:
- Be written in an engaging, professional music journalism style
- Highlight the artist's unique sound blending traditional reggae with modern elements
- Mention his connection to Jamaican culture and roots
- Be SEO-friendly with relevant keywords
- Include quotes (you can create realistic-sounding quotes from the artist)
- Be between 300-500 words

Return JSON with: title, excerpt (2-3 sentences), content (full article), and category (Music, Tour, Release, Interview, or News).`
          },
          {
            role: "user",
            content: sanitizedTopic 
              ? `Write a news article about: ${sanitizedTopic}` 
              : `Write a fresh, engaging news article about The General Da Jamaican Boy. Choose an interesting angle like: new music release, upcoming shows, artist spotlight, collaborations, or music industry news involving the artist.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_article",
              description: "Return the generated news article",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Catchy headline for the article" },
                  excerpt: { type: "string", description: "Brief 2-3 sentence summary" },
                  content: { type: "string", description: "Full article content in markdown" },
                  category: { type: "string", enum: ["Music", "Tour", "Release", "Interview", "News"] }
                },
                required: ["title", "excerpt", "content", "category"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_article" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate article");
    }

    const data = await response.json();
    console.log("AI article generated successfully for user:", user.id);
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const article = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ success: true, article }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Failed to generate article" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("News generation error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
