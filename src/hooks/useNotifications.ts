import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function useNotifications(userId: string | undefined) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = useCallback(async () => {
    if (!userId || !VAPID_PUBLIC_KEY) return;
    
    setLoading(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Notificaciones no soportadas en este navegador');
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save to server/DB
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          subscription: subscription.toJSON()
        });

      if (error) throw error;
      
      setIsEnabled(true);
    } catch (err) {
      console.error('Error al suscribirse a notificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const checkStatus = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;
    
    const subscription = await registration.pushManager.getSubscription();
    setIsEnabled(!!subscription);
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    isEnabled,
    loading,
    subscribe
  };
}
