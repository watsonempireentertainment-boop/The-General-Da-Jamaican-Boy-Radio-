import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      if (user) {
        fetchFavorites(user.id);
      } else {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
      if (session?.user) {
        fetchFavorites(session.user.id);
      } else {
        setFavorites(new Set());
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchFavorites = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select('track_id')
      .eq('user_id', uid);

    if (data) {
      setFavorites(new Set(data.map(f => f.track_id)));
    }
    setLoading(false);
  };

  const toggleFavorite = useCallback(async (trackId: string, trackTitle?: string) => {
    if (!userId) {
      toast.error('Please sign in to add favorites');
      return false;
    }

    const isFavorite = favorites.has(trackId);

    if (isFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('track_id', trackId);

      if (error) {
        toast.error('Failed to remove from favorites');
        return false;
      }

      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      toast.success(trackTitle ? `Removed "${trackTitle}" from favorites` : 'Removed from favorites');
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          track_id: trackId
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in favorites');
        } else {
          toast.error('Failed to add to favorites');
        }
        return false;
      }

      setFavorites(prev => new Set(prev).add(trackId));
      toast.success(trackTitle ? `Added "${trackTitle}" to favorites` : 'Added to favorites');
    }

    return true;
  }, [userId, favorites]);

  const isFavorite = useCallback((trackId: string) => {
    return favorites.has(trackId);
  }, [favorites]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    isLoggedIn: !!userId
  };
};

export default useFavorites;