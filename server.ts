import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import webpush from 'web-push';

dotenv.config();

// Push Notification Config
const vapidPublicKey = (process.env.VITE_VAPID_PUBLIC_KEY || '').trim();
const vapidPrivateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
const rawEmail = (process.env.VAPID_EMAIL || 'multiserviciosga.pb@gmail.com').trim();
const vapidEmail = rawEmail.startsWith('mailto:') || rawEmail.startsWith('http') 
  ? rawEmail 
  : `mailto:${rawEmail}`;

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    console.log('[Bingo Push] System enabled with VAPID keys.');
  } catch (err) {
    console.error('[Bingo Push] Error setting VAPID details:', err);
  }
} else {
  console.warn('[Bingo Push] System disabled: VAPID keys missing in environment.');
}

const getSupabaseConfig = () => {
  let url = (process.env.VITE_SUPABASE_URL || '').trim();
  url = url.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url, key };
};

let supabaseAdmin: any = null;
const getSupabaseAdmin = () => {
  if (supabaseAdmin) return supabaseAdmin;
  const { url, key } = getSupabaseConfig();
  if (!url || !key || !url.startsWith('http')) return null;
  supabaseAdmin = createClient(url, key);
  return supabaseAdmin;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Allow Telegram framing
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.google.com https://localhost.corp.google.com:26001 https://*.telegram.org https://web.telegram.org https://t.me;");
    res.removeHeader('X-Frame-Options');
    next();
  });

  console.log(`[Bingo System] Initializing automated game loop...`);

  // --- Push Notification API ---
  app.post("/api/push/subscribe", async (req, res) => {
    const { userId, subscription } = req.body;
    const admin = getSupabaseAdmin();
    if (!admin) return res.status(500).json({ error: 'DB not configured' });

    try {
      const { error } = await admin
        .from('push_subscriptions')
        .upsert({ user_id: userId, subscription }, { onConflict: 'user_id' });

      if (error) throw error;
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error saving subscription:', err);
      res.status(500).json({ error: 'Failed to save subscription' });
    }
  });

  // --- Helper to send notifications ---
  const sendPushToAll = async (title: string, body: string, url: string = '/') => {
    const admin = getSupabaseAdmin();
    if (!admin) return;

    try {
      const { data: subs, error } = await admin.from('push_subscriptions').select('subscription');
      if (error) throw error;

      const payload = JSON.stringify({ title, body, url });
      
      const notifications = (subs || []).map((sub: any) => 
        webpush.sendNotification(sub.subscription, payload).catch(err => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription expired or no longer valid
            // We should ideally remove it from DB
          }
          console.error('Push error:', err);
        })
      );

      await Promise.all(notifications);
    } catch (err) {
      console.error('Error broadcasting push:', err);
    }
  };

  // --- Realtime Listeners for Notifications ---
  const initListeners = () => {
    const admin = getSupabaseAdmin();
    if (!admin) return;

    admin
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions' }, async (payload: any) => {
        const oldGame = payload.old;
        const newGame = payload.new;

        // 1. Game Started
        if (oldGame.status === 'waiting' && newGame.status === 'playing') {
          await sendPushToAll('¡BINGO EN VIVO!', 'Un nuevo juego ha comenzado. ¡Entra ya!', '/');
        }

        // 2. Bingo Win
        if (oldGame.status !== 'finished' && newGame.status === 'finished' && newGame.winner_id) {
          // Fetch winner name
          const { data: winner } = await admin.from('profiles').select('username').eq('id', newGame.winner_id).maybeSingle();
          const winnerName = winner?.username || 'Alguien';
          await sendPushToAll('¡BINGO GANADO!', `¡${winnerName} ha cantado BINGO! Felicitaciones.`, '/');
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'publicity' }, async (payload: any) => {
         // 3. Admin Announcement (Publicity)
         const announcement = payload.new;
         if (announcement.is_active) {
           await sendPushToAll(announcement.title, announcement.message, '/');
         }
      })
      .subscribe();
  };

  initListeners();

  // Health check endpoint for enterprise monitoring
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  const runWorker = async () => {
    const admin = getSupabaseAdmin();
    if (!admin) {
      console.warn('[Bingo Worker] Supabase not yet configured. Retrying in 10s...');
      setTimeout(runWorker, 10000);
      return;
    }
    
    try {
      const now = new Date();
      // Umbral exacto de 30 segundos
      const threshold = new Date(now.getTime() - 30000).toISOString();

      const { data: activeGames, error: fetchError } = await admin
        .from('game_sessions')
        .select('id')
        .eq('status', 'playing')
        .eq('is_paused', false)
        .or(`last_ball_at.lt.${threshold},and(last_ball_at.is.null,created_at.lt.${threshold})`)
        .order('last_ball_at', { ascending: true, nullsFirst: true })
        .limit(10); 

      if (fetchError) {
        console.error('[Bingo Worker] Fetch Error:', fetchError.message);
        setTimeout(runWorker, 5000);
        return;
      }

      if (activeGames && activeGames.length > 0) {
        // Ejecutar sorteo atómico por cada juego
        await Promise.all(activeGames.map(async (game: any) => {
          const { data, error: rpcError } = await admin.rpc('draw_next_bingo_number', {
            target_game_id: game.id,
            draw_interval_seconds: 30
          });

          if (rpcError) {
            console.error(`[Bingo Worker] RPC Error (Game ${game.id}):`, rpcError.message);
          } else if (data?.success) {
            if (data.finished) {
              console.log(`[Bingo Worker] Game ${game.id} finalizado por sistema.`);
            } else {
              console.log(`[Bingo Worker] Juego ${game.id} -> Sorteo Atómico: ${data.number}`);
            }
          }
        }));
      }
    } catch (err) {
      console.error('[Bingo Worker] Unexpected Error:', err);
    }
    
    setTimeout(runWorker, 2000);
  };

  // Start the worker
  runWorker();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
