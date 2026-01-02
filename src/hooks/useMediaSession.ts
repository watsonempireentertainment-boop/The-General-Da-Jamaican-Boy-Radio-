import { useEffect, useCallback } from 'react';

interface MediaSessionTrack {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
}

interface MediaSessionOptions {
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeek?: (time: number) => void;
}

export const useMediaSession = (
  track: MediaSessionTrack | null,
  isPlaying: boolean,
  options: MediaSessionOptions = {}
) => {
  const { onPlay, onPause, onNext, onPrevious, onSeek } = options;

  // Update media session metadata when track changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;

    const artworkSizes = ['96x96', '128x128', '192x192', '256x256', '384x384', '512x512'];
    const artwork = track.artwork 
      ? artworkSizes.map(size => ({
          src: track.artwork!,
          sizes: size,
          type: 'image/jpeg',
        }))
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'T.G.D.J.B Music',
      artwork,
    });
  }, [track]);

  // Update playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Set up action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlers: Record<string, () => void> = {};

    if (onPlay) {
      handlers.play = onPlay;
      navigator.mediaSession.setActionHandler('play', onPlay);
    }

    if (onPause) {
      handlers.pause = onPause;
      navigator.mediaSession.setActionHandler('pause', onPause);
    }

    if (onNext) {
      handlers.nexttrack = onNext;
      navigator.mediaSession.setActionHandler('nexttrack', onNext);
    }

    if (onPrevious) {
      handlers.previoustrack = onPrevious;
      navigator.mediaSession.setActionHandler('previoustrack', onPrevious);
    }

    if (onSeek) {
      const seekHandler = (details: MediaSessionActionDetails) => {
        if (details.seekTime !== undefined) {
          onSeek(details.seekTime);
        }
      };
      navigator.mediaSession.setActionHandler('seekto', seekHandler);
    }

    // Cleanup
    return () => {
      if (!('mediaSession' in navigator)) return;
      
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [onPlay, onPause, onNext, onPrevious, onSeek]);

  // Update position state for seek bar on lock screen
  const updatePositionState = useCallback((
    position: number,
    duration: number,
    playbackRate: number = 1
  ) => {
    if (!('mediaSession' in navigator)) return;
    
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate,
        position,
      });
    } catch (error) {
      // Position state may not be supported on all devices
      console.debug('Position state not supported:', error);
    }
  }, []);

  return { updatePositionState };
};
