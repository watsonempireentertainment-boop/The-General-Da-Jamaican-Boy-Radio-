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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use service role for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // News topics to rotate through for variety
    const topics = [
      "New single release announcement with exclusive behind-the-scenes details",
      "The General's journey from St. Elizabeth to international recognition",
      "Upcoming live performances and tour dates",
      "Collaboration with other reggae artists",
      "The General's thoughts on keeping roots reggae alive",
      "Fan spotlight and community growth",
      "Music video production update",
      "The General's musical influences and creative process",
      "Reggae music industry news featuring The General",
      "Exclusive interview about upcoming projects"
    ];

    // Pick a random topic for variety
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    console.log(`User ${user.id} auto-generating news article about: ${randomTopic}`);

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
            content: `You are a music journalist specializing in reggae, dancehall, and Caribbean music. Write engaging, authentic news articles about "The General Da Jamaican Boy" - a rising reggae artist from St. Elizabeth, Jamaica known for his authentic vibes and positive messages.

His music includes tracks like:
- "Speakers Bumpin" - An energetic dancehall track
- "Let Me Tell You How It Is" - A conscious reggae anthem
- "Ganja Fi Burn" - Classic roots reggae vibes
- "Fake Friends" - A track about loyalty and trust
- "J.A. My Home Land" - A tribute to Jamaica
- "My Jamaican Dog" - A fun, lighthearted track
- "I Had To" - Personal storytelling through music
- "Do I Need To Tell Dem" - Powerful lyrical delivery

Your articles should:
- Be written in an engaging, professional music journalism style
- Highlight the artist's unique sound blending traditional reggae with modern elements
- Reference his actual songs when relevant
- Be SEO-friendly with relevant keywords
- Include realistic quotes from the artist
- Be between 300-500 words
- Feel fresh and current

Return JSON with: title, excerpt (2-3 sentences), content (full article in markdown), and category.`
          },
          {
            role: "user",
            content: `Write a news article about: ${randomTopic}`
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
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("AI usage limit reached");
        return new Response(JSON.stringify({ error: "AI usage limit reached" }), {
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
    if (!toolCall?.function?.arguments) {
      throw new Error("Failed to parse article from AI response");
    }

    const article = JSON.parse(toolCall.function.arguments);
    
    // Save the article to the database using admin client
    const { data: insertedNews, error: insertError } = await supabaseAdmin
      .from('news')
      .insert({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        is_published: true,
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving article:", insertError);
      throw new Error(`Failed to save article: ${insertError.message}`);
    }

    console.log("Article saved to database:", insertedNews.id);

    return new Response(JSON.stringify({ 
      success: true, 
      article: insertedNews,
      message: "Article generated and published successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Auto-generate news error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
