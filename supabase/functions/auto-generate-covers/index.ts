import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Artist reference image for consistent cover art style
const ARTIST_REFERENCE_URL = "https://oqxfqkwxelcwqndenyzx.supabase.co/storage/v1/object/public/artist-uploads/artist-photo-reference.jpg";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) {
      throw new Error("Required environment variables not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get optional parameters from request
    let specificMediaId: string | null = null;
    let limit = 5;
    
    try {
      const body = await req.json();
      specificMediaId = body.mediaId || null;
      limit = body.limit || 5;
    } catch {
      // No body provided, process all songs without covers
    }

    console.log("Starting auto-cover generation...");

    // Find tracks without thumbnail_url
    let query = supabase
      .from('media')
      .select('id, title, thumbnail_url')
      .eq('media_type', 'track')
      .or('thumbnail_url.is.null,thumbnail_url.eq.');
    
    if (specificMediaId) {
      query = supabase
        .from('media')
        .select('id, title, thumbnail_url')
        .eq('id', specificMediaId);
    } else {
      query = query.limit(limit);
    }

    const { data: tracksWithoutCovers, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching tracks:", fetchError);
      throw fetchError;
    }

    if (!tracksWithoutCovers || tracksWithoutCovers.length === 0) {
      console.log("No tracks without covers found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No tracks need cover generation",
        processed: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${tracksWithoutCovers.length} tracks without covers`);

    const results: { id: string; title: string; success: boolean; coverUrl?: string; error?: string }[] = [];

    for (const track of tracksWithoutCovers) {
      try {
        console.log(`Generating cover for: ${track.title}`);

        // Generate cover art using AI
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
                content: `Create a professional reggae album cover art for a song called "${track.title}" by The General Da Jamaican Boy.

The cover should be:
- A stylized artistic reggae/dancehall album cover
- Include Jamaican cultural elements (rasta colors: red, gold, green)
- Professional music industry quality aesthetic
- The vibe should match the song title "${track.title}"
- Make it look like a real music industry album cover
- Include subtle musical elements like vinyl records, sound waves, or speakers
- Use dramatic lighting and vibrant colors

Style: Modern reggae/dancehall album art, professional quality.`
              }
            ],
            modalities: ["image", "text"]
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log("Rate limited, stopping batch processing");
            results.push({ id: track.id, title: track.title, success: false, error: "Rate limited" });
            break;
          }
          if (response.status === 402) {
            console.log("AI usage limit reached");
            results.push({ id: track.id, title: track.title, success: false, error: "Usage limit" });
            break;
          }
          throw new Error(`AI error: ${response.status}`);
        }

        const data = await response.json();
        const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          results.push({ id: track.id, title: track.title, success: false, error: "No image generated" });
          continue;
        }

        // Convert base64 to blob and upload to storage
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const sanitizedTitle = track.title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
        const fileName = `auto-generated/${sanitizedTitle}-${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, binaryData, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          results.push({ id: track.id, title: track.title, success: false, error: uploadError.message });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);

        // Update the track with the new cover URL
        const { error: updateError } = await supabase
          .from('media')
          .update({ thumbnail_url: publicUrl })
          .eq('id', track.id);

        if (updateError) {
          console.error("Update error:", updateError);
          results.push({ id: track.id, title: track.title, success: false, error: updateError.message });
          continue;
        }

        console.log(`Cover generated for: ${track.title} -> ${publicUrl}`);
        results.push({ id: track.id, title: track.title, success: true, coverUrl: publicUrl });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (trackError) {
        console.error(`Error processing ${track.title}:`, trackError);
        results.push({ 
          id: track.id, 
          title: track.title, 
          success: false, 
          error: trackError instanceof Error ? trackError.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Completed: ${successCount}/${results.length} covers generated`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Generated ${successCount} covers`,
      processed: results.length,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Auto-cover generation error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
