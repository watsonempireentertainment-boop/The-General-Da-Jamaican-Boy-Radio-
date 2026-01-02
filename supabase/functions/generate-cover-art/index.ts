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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Use anon key with user's auth header for authentication check
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
    const { songTitle, referenceImageUrl } = body;

    if (!songTitle || typeof songTitle !== 'string') {
      return new Response(JSON.stringify({ error: 'Song title is required' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (songTitle.length > 150) {
      return new Response(JSON.stringify({ error: 'Song title too long (max 150 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!referenceImageUrl || typeof referenceImageUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'Reference image URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL format
    try {
      new URL(referenceImageUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid reference image URL' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize song title
    const sanitizedTitle = songTitle.replace(/[<>{}]/g, '').trim();
    if (!sanitizedTitle) {
      return new Response(JSON.stringify({ error: 'Invalid song title' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use service role for storage operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`User ${user.id} generating cover art for: ${sanitizedTitle}`);
    console.log(`Reference image: ${referenceImageUrl}`);

    // Generate cover art using the reference image
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Create a professional reggae album cover art for a song called "${sanitizedTitle}" by The General Da Jamaican Boy. 
                
The cover should feature this Jamaican reggae artist (shown in the reference image) in a stylized, artistic way. Include:
- The artist's likeness styled artistically
- Reggae/Jamaican cultural elements (rasta colors: red, gold, green)
- Professional album cover aesthetic
- The vibe should match the song title "${sanitizedTitle}"
- Make it look like a real music industry album cover

Keep the artist recognizable but make it artistic and professional.`
              },
              {
                type: "image_url",
                image_url: {
                  url: referenceImageUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      throw new Error("No image generated");
    }

    console.log("Cover art generated successfully for user:", user.id);

    // Convert base64 to blob and upload to storage
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `covers/${sanitizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('covers')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('covers')
      .getPublicUrl(fileName);

    console.log("Cover uploaded:", publicUrl);

    return new Response(JSON.stringify({ 
      success: true, 
      coverUrl: publicUrl,
      message: "Cover art generated and uploaded"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Cover generation error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
