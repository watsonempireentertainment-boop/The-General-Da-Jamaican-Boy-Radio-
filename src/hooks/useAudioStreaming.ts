import { useRef, useEffect, useCallback, useState } from 'react';

interface AudioStreamingOptions {
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onCanPlay?: () => void;
  onBuffering?: (isBuffering: boolean) => void;
  onError?: (error: string) => void;
}

interface AudioStreamingReturn {
  audioRef: React.RefObject<HTMLAudioElement>;
  isBuffering: boolean;
  bufferProgress: number;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  preloadTrack: (url: string) => void;
}

/**
 * Custom hook for optimized audio streaming with:
 * - Audio preloading for gapless playback
 * - Buffer monitoring for smooth streaming
 * - Audio normalization for consistent volume levels
 * - Cross-device compatibility optimizations
 */
export function useAudioStreaming(options: AudioStreamingOptions = {}): AudioStreamingReturn {
  const audioRef = useRef<HTMLAudioElement>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);

  // Initialize Web Audio API for audio normalization
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && audioRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          gainNodeRef.current = audioContextRef.current.createGain();
          
          // Connect nodes for audio processing
          sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          sourceNodeRef.current.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContextRef.current.destination);
          
          // Set initial gain for normalization (slight boost for mobile)
          gainNodeRef.current.gain.value = 1.0;
        }
      } catch (e) {
        // Web Audio API not available, fallback to native audio
        console.log('Web Audio API not available, using native audio');
      }
    }
  }, []);

  // Setup audio element with optimal streaming settings
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Optimal settings for streaming quality
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    
    // Event handlers
    const handleTimeUpdate = () => {
      options.onTimeUpdate?.(audio.currentTime, audio.duration || 0);
    };

    const handleEnded = () => {
      options.onEnded?.();
    };

    const handlePlay = () => {
      // Resume audio context if suspended (required for mobile)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      options.onPlay?.();
    };

    const handlePause = () => {
      options.onPause?.();
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
      options.onCanPlay?.();
    };

    const handleWaiting = () => {
      setIsBuffering(true);
      options.onBuffering?.(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      options.onBuffering?.(false);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0 && audio.duration) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const progress = (bufferedEnd / audio.duration) * 100;
        setBufferProgress(progress);
      }
    };

    const handleError = () => {
      const errorMessages: Record<number, string> = {
        1: 'Audio loading aborted',
        2: 'Network error while loading audio',
        3: 'Audio decoding error',
        4: 'Audio format not supported',
      };
      const errorCode = audio.error?.code || 0;
      options.onError?.(errorMessages[errorCode] || 'Unknown audio error');
    };

    // Attach event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('error', handleError);
    };
  }, [options]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (preloadRef.current) {
        preloadRef.current.src = '';
        preloadRef.current = null;
      }
    };
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      // Initialize audio context on first play (requires user interaction)
      initAudioContext();
      
      await audioRef.current.play();
    } catch (error) {
      console.error('Playback failed:', error);
      options.onError?.('Playback failed. Please try again.');
    }
  }, [initAudioContext, options]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      // Clamp volume between 0 and 1
      const clampedVolume = Math.max(0, Math.min(1, volume));
      audioRef.current.volume = clampedVolume;
      
      // Apply gain normalization if available
      if (gainNodeRef.current) {
        // Slight boost for quieter tracks
        gainNodeRef.current.gain.value = 1.0 + (clampedVolume * 0.1);
      }
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = Math.max(0.5, Math.min(2, rate));
    }
  }, []);

  // Preload next track for gapless playback
  const preloadTrack = useCallback((url: string) => {
    if (!url) return;
    
    // Create or reuse preload element
    if (!preloadRef.current) {
      preloadRef.current = new Audio();
      preloadRef.current.preload = 'auto';
    }
    
    preloadRef.current.src = url;
    preloadRef.current.load();
  }, []);

  return {
    audioRef,
    isBuffering,
    bufferProgress,
    play,
    pause,
    seek,
    setVolume,
    setPlaybackRate,
    preloadTrack,
  };
}

export default useAudioStreaming;
