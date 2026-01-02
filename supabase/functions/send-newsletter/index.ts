import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch latest content from the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [tracksResult, albumsResult, videosResult, subscribersResult] = await Promise.all([
      supabaseClient
        .from('media')
        .select('title, thumbnail_url, created_at')
        .eq('media_type', 'track')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5),
      supabaseClient
        .from('albums')
        .select('title, cover_url, album_type, created_at')
        .eq('is_published', true)
        .gte('created_at', oneWeekAgo.toISOString())
        .limit(3),
      supabaseClient
        .from('media')
        .select('title, thumbnail_url, created_at')
        .eq('media_type', 'video')
        .gte('created_at', oneWeekAgo.toISOString())
        .limit(3),
      supabaseClient
        .from('newsletter_subscribers')
        .select('email')
        .eq('is_active', true)
    ]);

    const tracks = tracksResult.data || [];
    const albums = albumsResult.data || [];
    const videos = videosResult.data || [];
    const subscribers = subscribersResult.data || [];

    if (subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscribers to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate newsletter content using AI
    const contentPrompt = `Generate a weekly newsletter for "The General Da Jamaican Boy" music site. 
    
New content this week:
- New Tracks: ${tracks.map(t => t.title).join(', ') || 'None'}
- New Albums/Mixtapes: ${albums.map(a => `${a.title} (${a.album_type})`).join(', ') || 'None'}  
- New Videos: ${videos.map(v => v.title).join(', ') || 'None'}

Write a brief, engaging newsletter (200-300 words) that:
1. Opens with a warm reggae/dancehall greeting
2. Highlights the new content
3. Encourages readers to check out the music
4. Ends with a positive message about unity and music

Keep the tone authentic, warm, and Caribbean. Use "One Love" as the sign-off.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a newsletter writer for a reggae/dancehall artist. Write engaging, authentic content with Caribbean vibes.' },
          { role: 'user', content: contentPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to generate newsletter content');
    }

    const aiData = await aiResponse.json();
    const newsletterContent = aiData.choices[0]?.message?.content || 'Check out new music from The General Da Jamaican Boy!';

    // Store the newsletter for reference
    const { data: newsletter, error: insertError } = await supabaseClient
      .from('news')
      .insert({
        title: `Weekly Update - ${new Date().toLocaleDateString()}`,
        content: newsletterContent,
        excerpt: newsletterContent.substring(0, 150) + '...',
        category: 'Newsletter',
        is_published: false // Keep as draft for review
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store newsletter:', insertError);
    }

    // In production, you would integrate with an email service here
    // For now, we log the newsletter and return success
    console.log(`Newsletter generated for ${subscribers.length} subscribers`);
    console.log('Content:', newsletterContent);

    return new Response(
      JSON.stringify({ 
        success: true,
        subscriberCount: subscribers.length,
        contentPreview: newsletterContent.substring(0, 200),
        newTracks: tracks.length,
        newAlbums: albums.length,
        newVideos: videos.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in send-newsletter function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
