import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, trackUrl, trackUrls, platform } = await req.json();

    // SoundCloud oEmbed - works with individual track URLs
    if (action === 'fetch_track_info' && platform === 'soundcloud') {
      try {
        const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`;
        console.log('Fetching SoundCloud oEmbed:', oembedUrl);
        
        const response = await fetch(oembedUrl);
        if (!response.ok) {
          throw new Error('Could not fetch track info from SoundCloud');
        }
        
        const data = await response.json();
        console.log('SoundCloud oEmbed response:', data);
        
        // Extract duration from the HTML embed if possible
        let duration = '0:00';
        
        return new Response(
          JSON.stringify({
            track: {
              id: trackUrl,
              title: data.title || 'Unknown Track',
              author: data.author_name || 'Unknown Artist',
              thumbnail_url: data.thumbnail_url,
              permalink_url: trackUrl,
              duration: duration,
              playback_count: 0
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('SoundCloud oEmbed error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch track info. Make sure the URL is a valid SoundCloud track.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // YouTube video info fetch
    if (action === 'fetch_track_info' && platform === 'youtube') {
      try {
        // Extract video ID from various YouTube URL formats
        let videoId = '';
        const url = new URL(trackUrl);
        
        if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.slice(1);
        } else if (url.hostname.includes('youtube.com')) {
          videoId = url.searchParams.get('v') || '';
        }
        
        if (!videoId) {
          throw new Error('Could not extract video ID from URL');
        }

        // Use YouTube oEmbed (no API key required)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(trackUrl)}&format=json`;
        console.log('Fetching YouTube oEmbed:', oembedUrl);
        
        const response = await fetch(oembedUrl);
        if (!response.ok) {
          throw new Error('Could not fetch video info from YouTube');
        }
        
        const data = await response.json();
        console.log('YouTube oEmbed response:', data);
        
        return new Response(
          JSON.stringify({
            track: {
              id: videoId,
              title: data.title || 'Unknown Video',
              author: data.author_name || 'Unknown Channel',
              thumbnail_url: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              permalink_url: trackUrl,
              duration: '0:00',
              playback_count: 0,
              media_type: 'video'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('YouTube fetch error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch video info. Make sure the URL is a valid YouTube video.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Batch import multiple tracks/videos
    if (action === 'batch_import') {
      const { tracks, existingTitles } = await req.json();
      const results = [];

      for (const track of tracks) {
        const normalizedTitle = track.title.toLowerCase().trim();
        
        if (existingTitles?.includes(normalizedTitle)) {
          results.push({ status: 'duplicate', title: track.title });
          continue;
        }

        // Format duration if it's in milliseconds
        let formattedDuration = track.duration || '0:00';
        if (typeof track.duration === 'number') {
          const minutes = Math.floor(track.duration / 60000);
          const seconds = Math.floor((track.duration % 60000) / 1000);
          formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        const { data, error } = await supabaseClient
          .from('media')
          .insert({
            title: track.title,
            media_type: track.media_type || 'track',
            url: track.permalink_url,
            thumbnail_url: track.thumbnail_url,
            duration: formattedDuration,
            play_count: track.playback_count || 0,
            platform_links: {
              [track.platform || 'external']: track.permalink_url
            }
          })
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          results.push({ status: 'error', title: track.title, error: error.message });
        } else {
          results.push({ status: 'imported', title: track.title, data });
        }
      }

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Legacy profile-based fetch (keeping for backwards compatibility)
    if (action === 'fetch_tracks') {
      return new Response(
        JSON.stringify({ 
          error: 'Profile-based import is not available. Please use individual track URLs instead.',
          useTrackUrls: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: unknown) {
    console.error('Error in soundcloud-import function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
