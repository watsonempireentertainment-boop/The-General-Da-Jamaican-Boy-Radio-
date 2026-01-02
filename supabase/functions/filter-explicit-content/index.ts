import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common explicit words and phrases to detect
const explicitPatterns = [
  // Profanity patterns
  /\bf+u+c+k+/gi,
  /\bs+h+i+t+/gi,
  /\bb+i+t+c+h+/gi,
  /\ba+s+s+(?:hole)?/gi,
  /\bd+a+m+n+/gi,
  /\bh+e+l+l+/gi,
  /\bn+i+g+g+a+/gi,
  /\bp+u+s+s+y+/gi,
  /\bd+i+c+k+/gi,
  /\bc+o+c+k+/gi,
  /\bwh+o+r+e+/gi,
  /\bsl+u+t+/gi,
  // Drug references
  /\bweed\b/gi,
  /\bganja\b/gi,
  /\bblunt\b/gi,
  /\bcocaine\b/gi,
  /\bheroin\b/gi,
  // Violence
  /\bkill(?:ing|ed)?\b/gi,
  /\bmurder/gi,
  /\bgun\b/gi,
  /\bshoot(?:ing|er)?\b/gi,
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const { action, trackId, text } = await req.json();

    if (action === 'scan_all') {
      // Fetch all tracks that haven't been scanned yet
      const { data: tracks, error } = await supabaseClient
        .from('media')
        .select('id, title, description')
        .eq('media_type', 'track');

      if (error) throw error;

      const results = [];

      for (const track of tracks || []) {
        const textToScan = `${track.title} ${track.description || ''}`.toLowerCase();
        const isExplicit = explicitPatterns.some(pattern => pattern.test(textToScan));

        if (isExplicit) {
          // Update the track as explicit
          await supabaseClient
            .from('media')
            .update({ is_explicit: true })
            .eq('id', track.id);

          results.push({ id: track.id, title: track.title, marked: true });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          scanned: tracks?.length || 0,
          markedExplicit: results.length,
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'analyze_lyrics' && LOVABLE_API_KEY) {
      // Use AI to analyze lyrics for explicit content
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: 'You are a content filter that analyzes song titles and lyrics for explicit content. Respond with JSON only: { "isExplicit": boolean, "reason": "brief reason if explicit" }' 
            },
            { 
              role: 'user', 
              content: `Analyze this for explicit content (profanity, drug references, violence, sexual content): "${text}"` 
            }
          ],
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('AI analysis failed');
      }

      const aiData = await aiResponse.json();
      const analysisText = aiData.choices[0]?.message?.content || '{}';
      
      // Parse the AI response
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch {
        // Fallback to pattern matching
        const isExplicit = explicitPatterns.some(pattern => pattern.test(text));
        analysis = { isExplicit, reason: isExplicit ? 'Matched explicit pattern' : 'No explicit content detected' };
      }

      // Update the track if trackId provided
      if (trackId && analysis.isExplicit) {
        await supabaseClient
          .from('media')
          .update({ is_explicit: true })
          .eq('id', trackId);
      }

      return new Response(
        JSON.stringify(analysis),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scan_single' && trackId) {
      const { data: track, error } = await supabaseClient
        .from('media')
        .select('id, title, description')
        .eq('id', trackId)
        .single();

      if (error) throw error;

      const textToScan = `${track.title} ${track.description || ''}`.toLowerCase();
      const isExplicit = explicitPatterns.some(pattern => pattern.test(textToScan));

      if (isExplicit) {
        await supabaseClient
          .from('media')
          .update({ is_explicit: true })
          .eq('id', trackId);
      }

      return new Response(
        JSON.stringify({ 
          id: track.id, 
          title: track.title, 
          isExplicit,
          updated: isExplicit 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: unknown) {
    console.error('Error in filter-explicit-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
