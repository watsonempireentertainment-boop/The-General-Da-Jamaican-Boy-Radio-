import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Track play after 30 seconds of listening (industry standard)
const PLAY_THRESHOLD_SECONDS = 30;

export const usePlayCountTracker = () => {
  const trackedPlays = useRef<Set<string>>(new Set());
  const playStartTimes = useRef<Map<string, number>>(new Map());

  const startTracking = useCallback((trackId: string) => {
    if (!trackId) return;
    
    // Record when this track started playing
    playStartTimes.current.set(trackId, Date.now());
  }, []);

  const checkAndRecordPlay = useCallback(async (trackId: string, currentTime: number) => {
    if (!trackId) return;
    
    // Skip if already tracked in this session
    if (trackedPlays.current.has(trackId)) return;
    
    // Check if user has listened for at least 30 seconds
    if (currentTime >= PLAY_THRESHOLD_SECONDS) {
      trackedPlays.current.add(trackId);
      
      try {
        // Get current play count first
        const { data: mediaData } = await supabase
          .from('media')
          .select('play_count')
          .eq('id', trackId)
          .maybeSingle();
        
        const currentCount = mediaData?.play_count || 0;
        
        // Increment play count
        const { error } = await supabase
          .from('media')
          .update({ play_count: currentCount + 1 })
          .eq('id', trackId);
        
        if (error) {
          console.error('Failed to update play count:', error);
        } else {
          console.log(`Play recorded for track: ${trackId}, new count: ${currentCount + 1}`);
        }
      } catch (err) {
        console.error('Failed to record play count:', err);
      }
    }
  }, []);

  const stopTracking = useCallback((trackId: string) => {
    if (!trackId) return;
    playStartTimes.current.delete(trackId);
  }, []);

  const resetSession = useCallback(() => {
    // Reset tracked plays for new session
    trackedPlays.current.clear();
    playStartTimes.current.clear();
  }, []);

  return {
    startTracking,
    checkAndRecordPlay,
    stopTracking,
    resetSession,
  };
};
