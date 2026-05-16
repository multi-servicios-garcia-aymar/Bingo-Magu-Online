import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { AuthService } from '../services/authService';

export function useBingoAuth(gameMode: string | null) {
  const [user, setUser] = useState<{ id: string; name: string; avatarUrl?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const ADMIN_IDS = useMemo(() => import.meta.env.VITE_ADMIN_IDS?.split(',') || [], []);

  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('[Auth] Session error:', sessionError.message);
          // If refresh token is missing or invalid, we must clear EVERYTHING
          if (sessionError.message.includes('Refresh Token Not Found') || sessionError.message.includes('Invalid Refresh Token')) {
            localStorage.clear(); // Clear all local storage to be sure
            await supabase.auth.signOut();
            window.location.reload(); // Force reload to start fresh
            return;
          }
        }
        
        const processProfile = async (authSession: any) => {
        if (!authSession?.user) return;
        
        try {
          const { data: profile } = await AuthService.getProfile(authSession.user.id);
          
          if (profile?.is_banned) {
            await supabase.auth.signOut();
            setUser(null);
            return;
          }

          setUser({ 
            id: authSession.user.id, 
            name: profile?.username || authSession.user.user_metadata?.username || authSession.user.email?.split('@')[0] || 'Jugador',
            avatarUrl: profile?.avatar_url || authSession.user.user_metadata?.avatar_url
          });

          const isUserSuperAdmin = !!profile?.is_super_admin;
          const isUserAdmin = isUserSuperAdmin || !!profile?.is_admin || ADMIN_IDS.includes(authSession.user.id);
          
          setIsSuperAdmin(isUserSuperAdmin);
          setIsAdmin(isUserAdmin);
        } catch (e) {
          console.error('[Auth] Profile fetch error:', e);
        }
      };

      if (session) {
        await processProfile(session);
      }

      // Telegram integration
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        // Hide standard Mini App vertical swiping to prevent accidental closing on iOS
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('7.7')) {
          try {
            tg.requestFullscreen?.();
          } catch(e) {}
        }
      }

      supabase.auth.onAuthStateChange(async (event, newSession) => {
        const authEvent = event as string;
        if (authEvent === 'SIGNED_OUT' || authEvent === 'USER_DELETED' || authEvent === 'TOKEN_REFRESH_FAILED') {
          console.warn('[Auth] Auth event:', authEvent);
          if (authEvent === 'TOKEN_REFRESH_FAILED') {
            localStorage.clear();
            await supabase.auth.signOut();
            window.location.reload();
            return;
          }
          
          setUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          return;
        }

        if (newSession) {
          await processProfile(newSession);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      });
      } catch (err: any) {
        console.error('[Auth] Initialization error:', err);
        if (err.message?.includes('Refresh Token Not Found')) {
          localStorage.clear();
          await supabase.auth.signOut().catch(() => {});
          window.location.reload();
        }
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, [ADMIN_IDS, gameMode]);

  useEffect(() => {
    if (!user) return;
    
    AuthService.updateLastSeen(user.id);
    const interval = setInterval(() => {
      AuthService.updateLastSeen(user.id);
    }, 180000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    user,
    setUser,
    isAdmin,
    setIsAdmin,
    isSuperAdmin,
    setIsSuperAdmin,
    isAuthLoading
  };
}
