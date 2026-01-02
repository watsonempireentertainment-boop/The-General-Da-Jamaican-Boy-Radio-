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
    const { artistName } = body;

    if (!artistName || typeof artistName !== 'string') {
      return new Response(JSON.stringify({ error: 'Artist name is required' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (artistName.length > 100) {
      return new Response(JSON.stringify({ error: 'Artist name too long (max 100 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize input - allow letters, numbers, spaces, and common punctuation
    const sanitizedName = artistName.replace(/[^a-zA-Z0-9\s\-'.,&]/g, '').trim();
    if (!sanitizedName) {
      return new Response(JSON.stringify({ error: 'Invalid artist name' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`User ${user.id} discovering music for artist: ${sanitizedName}`);

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
            content: `You are a music research assistant. Search for information about the reggae/dancehall artist "${sanitizedName}" from Jamaica. Find their music, albums, songs, collaborations, and any relevant links. Return the data in JSON format with the following structure:
{
  "songs": [{"title": "...", "year": "...", "album": "..."}],
  "albums": [{"title": "...", "year": "...", "tracks": [...]}],
  "collaborations": [{"title": "...", "artist": "...", "year": "..."}],
  "streaming_links": {"spotify": "...", "youtube": "...", "soundcloud": "..."},
  "bio_summary": "...",
  "social_media": {"instagram": "...", "facebook": "...", "twitter": "..."}
}`
          },
          {
            role: "user",
            content: `Find all available music and information about ${sanitizedName}. Include any known songs, albums, collaborations with other artists, and streaming platform links.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_music_data",
              description: "Return discovered music data for the artist",
              parameters: {
                type: "object",
                properties: {
                  songs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        year: { type: "string" },
                        album: { type: "string" }
                      }
                    }
                  },
                  albums: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        year: { type: "string" },
                        tracks: { type: "array", items: { type: "string" } }
                      }
                    }
                  },
                  collaborations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        artist: { type: "string" },
                        year: { type: "string" }
                      }
                    }
                  },
                  streaming_links: {
                    type: "object",
                    properties: {
                      spotify: { type: "string" },
                      youtube: { type: "string" },
                      soundcloud: { type: "string" }
                    }
                  },
                  bio_summary: { type: "string" },
                  social_media: {
                    type: "object",
                    properties: {
                      instagram: { type: "string" },
                      facebook: { type: "string" },
                      twitter: { type: "string" }
                    }
                  }
                },
                required: ["songs", "bio_summary"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_music_data" } }
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
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to discover music");
    }

    const data = await response.json();
    console.log("AI response received for user:", user.id);
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const musicData = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ success: true, data: musicData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "No music data found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Music discovery error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
