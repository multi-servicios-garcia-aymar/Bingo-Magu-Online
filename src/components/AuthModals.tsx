import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Megaphone, Send, Users, ShieldAlert, AlertCircle, Loader2, Eye, EyeOff, Image as ImageIcon, Video as VideoIcon, Activity, Trash2, Ban, Trophy, RotateCcw, Check, Play, Dice5 } from 'lucide-react';
import { AuthService, PublicityService } from '../services/authService';
import { RankingService, RankingEntry } from '../services/rankingService';
import { supabase } from '../lib/supabase';
import { GameMode } from '../types';

interface AdminModalsProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, profile: any) => void;
  title?: string;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, title }: AdminModalsProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    if (isRegister && password !== confirmPassword) {
      setErr('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

        try {
      if (isRegister) {
        const { data, error } = await AuthService.signUp(email, password);
        if (error) throw error;
        setErr('Cuenta creada. Ahora puedes iniciar sesión.');
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const { data, error } = await AuthService.signIn(email, password);
        if (error) throw error;
        
        // Fetch profile to check permissions
        const { data: profile } = await AuthService.getProfile(data.user!.id);
        
        if (profile?.is_banned) {
          await AuthService.signOut();
          setErr('Tu cuenta ha sido suspendida por un administrador.');
          setLoading(false);
          return;
        }

        onAuthSuccess(data.user, profile);
        onClose();
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
      >
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">
              {isRegister ? 'Crear Cuenta' : 'Ingresar'}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {isRegister ? 'Únete al Juego' : 'Acceso de Usuario'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors -mr-1">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {err && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${err.includes('creada') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase italic px-1">Correo Electrónico</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600"
              placeholder="admin@bingomaguonline.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase italic px-1">Contraseña</label>
            <div className="relative">
              <input 
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 pr-11 text-sm focus:ring-2 focus:ring-blue-600"
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase italic px-1">Confirmar Contraseña</label>
              <div className="relative">
                <input 
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 pr-11 text-sm focus:ring-2 focus:ring-blue-600"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-tighter transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
            {isRegister ? 'Crear Cuenta' : 'Autenticar'}
          </button>

          <button 
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErr(null);
            }}
            className="w-full text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 transition-colors"
          >
            {isRegister ? '¿Ya tienes cuenta? Ingresa aquí' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export function SuperAdminPanel({ isOpen, onClose, currentUserId }: { isOpen: boolean, onClose: () => void, currentUserId?: string }) {
  const [tab, setTab] = useState<'publicity' | 'users' | 'game'>('publicity');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [targetId, setTargetId] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User list state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');

  // Publicity list state
  const [ads, setAds] = useState<any[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [displaySettings, setDisplaySettings] = useState({
    show_on_open: true,
    show_in_lobby: false,
    show_in_game_side: false,
    private_game_frequency: 'none' as 'none' | 'start' | 'every_5'
  });

  const fetchProfiles = async () => {
    setProfilesLoading(true);
    const { data } = await AuthService.getAllProfiles();
    setProfiles(data || []);
    setProfilesLoading(false);
  };

  const fetchAds = async () => {
    setAdsLoading(true);
    const { data } = await PublicityService.getAll();
    setAds(data || []);
    setAdsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (tab === 'users') fetchProfiles();
      if (tab === 'publicity') fetchAds();
    }
  }, [isOpen, tab]);

  const handleToggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) return;
    await AuthService.toggleSuperAdmin(userId, !currentStatus);
    fetchProfiles();
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    await AuthService.toggleAdmin(userId, !currentStatus);
    fetchProfiles();
  };

  const handleBanUser = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) return;
    if (window.confirm(`¿Seguro que deseas ${currentStatus ? 'activar' : 'banear'} a este usuario?`)) {
      await AuthService.banUser(userId, !currentStatus);
      fetchProfiles();
    }
  };

  const handleSendPublicity = async () => {
    if (!title || !message) return;
    setLoading(true);
    try {
      let mediaUrl = existingMediaUrl;
      let mediaType: 'image' | 'video' = 'image';

      if (mediaFile) {
        mediaUrl = await PublicityService.uploadMedia(mediaFile);
        mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
      }

      const targets = targetId.trim() ? [targetId.trim()] : null;
      
      if (editingAdId) {
        await PublicityService.update(editingAdId, {
          title,
          message,
          image_url: mediaUrl,
          media_type: mediaType,
          target_user_ids: targets,
          display_settings: displaySettings,
          external_url: externalUrl.trim() || null
        });
      } else {
        await PublicityService.broadcast(title, message, mediaUrl, mediaType, targets, displaySettings, externalUrl.trim() || null);
      }
      
      setSuccess(true);
      clearForm();
      fetchAds();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setTitle('');
    setMessage('');
    setExternalUrl('');
    setTargetId('');
    setMediaFile(null);
    setEditingAdId(null);
    setExistingMediaUrl(null);
    setDisplaySettings({
      show_on_open: true,
      show_in_lobby: false,
      show_in_game_side: false,
      private_game_frequency: 'none'
    });
  };

  const handleEditAd = (ad: any) => {
    setEditingAdId(ad.id);
    setTitle(ad.title);
    setMessage(ad.message);
    setExternalUrl(ad.external_url || '');
    setTargetId(ad.target_user_ids?.join(', ') || '');
    setExistingMediaUrl(ad.image_url);
    setDisplaySettings(ad.display_settings || {
      show_on_open: true,
      show_in_lobby: false,
      show_in_game_side: false,
      private_game_frequency: 'none'
    });
    setTab('publicity');
    // Scroll to form
    const formElement = document.getElementById('ad-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteAd = async (id: string) => {
    if (window.confirm('¿Eliminar este anuncio?')) {
      await PublicityService.delete(id);
      fetchAds();
    }
  };

  const handleToggleAd = async (id: string, active: boolean) => {
    await PublicityService.toggleActive(id, !active);
    fetchAds();
  };

  const handleGlobalReset = async () => {
    if (!window.confirm('¡ATENCIÓN! Esto cerrará y borrará todos los juegos globales ACTIVOS y desconectará a los participantes. ¿Proceder?')) return;
    setLoading(true);
    try {
      // Logic for global reset: delete participants and game_sessions where type = 'global'
      await supabase.from('participants').delete().neq('user_id', '_none_'); 
      await supabase.from('game_sessions').delete().eq('type', 'global');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleForceStart = async () => {
    setLoading(true);
    try {
      const { data: games } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('type', 'global')
        .order('created_at', { ascending: false });
      
      const waitingGame = games?.find(g => g.status === 'waiting');
      
      if (waitingGame) {
        await supabase
          .from('game_sessions')
          .update({ status: 'playing', drawn_numbers: [] })
          .eq('id', waitingGame.id);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        if (window.confirm('No hay salas globales activas. ¿Deseas crear una sala global nueva ahora mismo?')) {
          const startAt = new Date();
          startAt.setMinutes(startAt.getMinutes() + 5); // 5 mins from now
          
          await supabase.from('game_sessions').insert({
            type: 'global',
            status: 'waiting',
            ball_limit: 75,
            winning_pattern: 'full_house',
            starts_at: startAt.toISOString(),
            drawn_numbers: [],
            is_paused: false
          });
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredProfiles = profiles.filter(p => 
    p.email?.toLowerCase().includes(userQuery.toLowerCase()) || 
    p.username?.toLowerCase().includes(userQuery.toLowerCase()) ||
    p.id.includes(userQuery)
  );

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col h-[85vh]"
      >
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 rotate-6">
                <ShieldAlert className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">Magu Online Control</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                 <Activity className="w-3 h-3 text-green-500" />
                 Estado Maestro: Activo
               </p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors active:scale-90">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
          <div className="flex p-1.5 bg-slate-100 rounded-[2rem] shrink-0">
            {[
              { id: 'publicity', icon: Megaphone, label: 'Anuncios' },
              { id: 'users', icon: Users, label: 'Jugadores' },
              { id: 'game', icon: Activity, label: 'Control Juego' }
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${tab === t.id ? 'bg-white shadow-lg text-blue-600 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'publicity' ? (
              <motion.div 
                key="pub"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                {/* Formulario Nueva Publicidad */}
                <div id="ad-form" className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 uppercase italic flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-600" />
                      {editingAdId ? 'Editar Anuncio' : 'Nuevo Broadcast Online'}
                    </h3>
                    <div className="flex gap-2">
                      {editingAdId && (
                        <button 
                          onClick={clearForm}
                          className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase hover:bg-slate-300 transition-all"
                        >
                          Cancelar Edición
                        </button>
                      )}
                      <button 
                        onClick={() => setShowPreview(!showPreview)}
                        className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-[9px] font-black uppercase ${showPreview ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:text-blue-600 border border-slate-200 shadow-sm'}`}
                      >
                        {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showPreview ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}
                      </button>
                    </div>
                  </div>

                  {showPreview && (
                    <div className="bg-slate-900/5 rounded-3xl p-4 border-2 border-dashed border-slate-300">
                      <p className="text-[10px] font-black text-slate-400 uppercase italic mb-3 text-center">Así se verá tu anuncio</p>
                      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 max-w-sm mx-auto">
                        {(mediaFile || existingMediaUrl) ? (
                          <div className="aspect-video bg-black flex items-center justify-center">
                            {mediaFile ? (
                              mediaFile.type.startsWith('video') ? (
                                <VideoIcon className="w-8 h-8 text-white/50" />
                              ) : (
                                <img src={URL.createObjectURL(mediaFile)} className="w-full h-full object-contain" />
                              )
                            ) : (
                              existingMediaUrl?.includes('.mp4') ? (
                                <VideoIcon className="w-8 h-8 text-white/50" />
                              ) : (
                                <img src={existingMediaUrl!} className="w-full h-full object-contain" />
                              )
                            )}
                          </div>
                        ) : null}
                        <div className="p-5 text-center space-y-2">
                          <h4 className="text-lg font-black text-slate-800 uppercase italic leading-none">{title || 'Título del anuncio'}</h4>
                          <p className="text-xs text-slate-500 font-medium">{message || 'Contenido del anuncio...'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase px-1">Título</label>
                      <input 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-white border-none rounded-2xl px-4 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-600 shadow-sm"
                        placeholder="Ej: ¡Nuevo Torneo Hoy!"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase px-1">Enlace Externo (Opcional)</label>
                      <input 
                        value={externalUrl}
                        onChange={e => setExternalUrl(e.target.value)}
                        className="w-full bg-white border-none rounded-2xl px-4 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-600 shadow-sm"
                        placeholder="https://t.me/TuCanal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase px-1">ID Target (Opcional)</label>
                      <input 
                        value={targetId}
                        onChange={e => setTargetId(e.target.value)}
                        className="w-full bg-white border-none rounded-2xl px-4 py-3.5 text-xs font-mono focus:ring-2 focus:ring-blue-600 shadow-sm"
                        placeholder="UUID especifíco..."
                      />
                    </div>
                  </div>

                  {/* Display Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/50 p-4 rounded-3xl border border-slate-200/50">
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-800 uppercase italic">Donde mostrar:</p>
                      <div className="space-y-2">
                        {[
                          { id: 'show_on_open', label: 'Al abrir la app' },
                          { id: 'show_in_lobby', label: 'Sala General (Si no hay juego)' },
                          { id: 'show_in_game_side', label: 'Espacios Laterales (Bingo)' }
                        ].map(s => (
                          <label key={s.id} className="flex items-center gap-3 cursor-pointer group">
                             <input 
                               type="checkbox"
                               checked={(displaySettings as any)[s.id]}
                               onChange={e => setDisplaySettings(prev => ({ ...prev, [s.id]: e.target.checked }))}
                               className="w-4 h-4 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
                             />
                             <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">{s.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-800 uppercase italic">Frecuencia en Juego Privado:</p>
                      <select 
                        value={displaySettings.private_game_frequency}
                        onChange={e => setDisplaySettings(prev => ({ ...prev, private_game_frequency: e.target.value as any }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase text-slate-600 focus:ring-2 focus:ring-blue-600 shadow-sm"
                      >
                        <option value="none">No mostrar</option>
                        <option value="start">Al iniciar juego</option>
                        <option value="every_5">Cada 5 balotas</option>
                      </select>
                      <p className="text-[8px] text-slate-400 font-medium">Solo aplica a partidas personalizadas/privadas.</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase px-1">Mensaje Principal</label>
                    <textarea 
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={2}
                      className="w-full bg-white border-none rounded-2xl px-4 py-3.5 text-xs font-medium focus:ring-2 focus:ring-blue-600 shadow-sm"
                      placeholder="Contenido del anuncio..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-3 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all group"
                    >
                      {mediaFile ? (
                        <div className="flex items-center gap-2 text-blue-600 font-black text-[9px] uppercase">
                          <Check className="w-4 h-4" /> {mediaFile.name.substring(0, 10)}...
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                          <span className="text-[9px] font-black text-slate-400 uppercase">Añadir Media</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleSendPublicity}
                      disabled={loading || !title || !message}
                      className={`flex-[2] py-3 rounded-2xl font-black uppercase text-[10px] transition-all shadow-xl flex items-center justify-center gap-3 ${success ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'} text-white disabled:opacity-50`}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (success ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
                      {success ? (editingAdId ? 'ACTUALIZADO' : 'LANZADO') : (editingAdId ? 'GUARDAR CAMBIOS' : 'BROADCAST ONLINE')}
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={e => setMediaFile(e.target.files?.[0] || null)} accept="image/*,video/*" className="hidden" />
                </div>

                {/* Listado de Anuncios */}
                <div className="space-y-4">
                   <h3 className="text-xs font-black text-slate-800 uppercase italic flex items-center gap-2 px-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    Historial de Emisiones ({ads.length})
                  </h3>
                  <div className="space-y-3">
                    {adsLoading ? (
                      <div className="py-10 flex flex-col items-center gap-3">
                         <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                         <span className="text-[9px] font-black text-slate-300 uppercase">Cargando anuncios...</span>
                      </div>
                    ) : ads.length === 0 ? (
                      <div className="py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-50">
                         <Megaphone className="w-8 h-8 text-slate-300 mb-2" />
                         <p className="text-[10px] font-black text-slate-400 uppercase">Sin historial de publicidad</p>
                      </div>
                    ) : (
                      ads.map(ad => (
                        <div key={ad.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all hover:border-blue-100">
                          <div className="flex items-center gap-4 flex-1">
                             <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-50">
                               {ad.image_url ? (
                                 ad.media_type === 'video' ? <VideoIcon className="w-5 h-5 text-slate-400" /> : <img src={ad.image_url} className="w-full h-full object-cover" alt="Media" />
                               ) : <Megaphone className="w-5 h-5 text-slate-300" />}
                             </div>
                             <div className="flex-1 min-w-0">
                               <h4 className="text-xs font-black text-slate-800 uppercase italic truncate">{ad.title}</h4>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[200px]">{ad.message}</p>
                               <div className="flex items-center gap-3 mt-1">
                                 <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase ${ad.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                   {ad.is_active ? '● Activo' : '○ Inactivo'}
                                 </span>
                                 <span className="text-[7px] font-bold text-slate-300 italic uppercase">
                                   {new Date(ad.created_at).toLocaleDateString()}
                                 </span>
                               </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => handleEditAd(ad)}
                               className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all hover:scale-110"
                               title="Editar"
                             >
                               <Activity className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleToggleAd(ad.id, ad.is_active)}
                               className={`p-2.5 rounded-xl transition-all ${ad.is_active ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'} hover:scale-110`}
                               title={ad.is_active ? "Desactivar" : "Activar"}
                             >
                               {ad.is_active ? <Ban className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                             </button>
                             <button 
                               onClick={() => handleDeleteAd(ad.id)}
                               className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all hover:scale-110"
                               title="Eliminar Permanente"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : tab === 'users' ? (
              <motion.div 
                key="usr"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {/* Stats & Search */}
                <div className="grid grid-cols-3 gap-3">
                   <div className="bg-blue-600 p-4 rounded-[2rem] text-white shadow-xl shadow-blue-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                      <Users className="w-12 h-12 absolute -bottom-2 -right-2 text-white/10 group-hover:scale-125 transition-transform" />
                      <div className="text-[9px] font-black uppercase tracking-widest opacity-80">Total Registrados</div>
                      <div className="text-3xl font-black italic">{profiles.length}</div>
                   </div>
                   <div className="bg-slate-900 p-4 rounded-[2rem] text-white flex flex-col justify-between h-32 relative overflow-hidden group">
                      <Activity className="w-12 h-12 absolute -bottom-2 -right-2 text-white/10 group-hover:scale-125 transition-transform" />
                      <div className="text-[9px] font-black uppercase tracking-widest opacity-80">Online 5m</div>
                      <div className="text-3xl font-black italic">
                        {profiles.filter(p => p.last_seen_at && (Date.now() - new Date(p.last_seen_at).getTime()) < 300000).length}
                      </div>
                   </div>
                   <div className="bg-red-50 p-4 rounded-[2rem] border border-red-100 flex flex-col justify-between h-32 text-red-600 relative overflow-hidden">
                      <div className="text-[9px] font-black uppercase tracking-widest opacity-80">Baneados</div>
                      <div className="text-3xl font-black italic">{profiles.filter(p => p.is_banned).length}</div>
                   </div>
                </div>

                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={userQuery}
                    onChange={e => setUserQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    placeholder="Buscar por email, nombre o ID..."
                  />
                </div>

                <div className="space-y-2">
                   {profilesLoading ? (
                     <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <span className="text-[10px] font-black text-slate-300 uppercase">Sincronizando Usuarios...</span>
                     </div>
                   ) : filteredProfiles.length === 0 ? (
                     <div className="py-20 text-center opacity-30 flex flex-col items-center">
                        <Users className="w-12 h-12 mb-2" />
                        <span className="text-xs font-black uppercase italic">No se encontraron resultados</span>
                     </div>
                   ) : (
                     filteredProfiles.map(profile => {
                        const isOnline = profile.last_seen_at && (Date.now() - new Date(profile.last_seen_at).getTime()) < 300000;
                        return (
                          <div key={profile.id} className={`bg-white p-4 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group transition-all hover:shadow-lg ${profile.is_banned ? 'opacity-60 grayscale' : ''}`}>
                             <div className="flex items-center gap-4">
                               <div className="relative">
                                  <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex items-center justify-center text-xs font-black uppercase italic ${profile.is_super_admin ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    {profile.avatar_url ? (
                                      <img src={profile.avatar_url} className="w-full h-full object-cover" referrerPolicy='no-referrer' />
                                    ) : (profile.username?.charAt(0) || profile.email?.charAt(0) || '?')}
                                  </div>
                                  {isOnline && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-white ring-1 ring-green-100 animate-pulse shadow-sm" />}
                               </div>
                               <div>
                                 <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-slate-800 italic uppercase truncate max-w-[150px]">{profile.username || profile.email?.split('@')[0]}</h4>
                                    {profile.is_super_admin && <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />}
                                    {profile.is_admin && !profile.is_super_admin && <Activity className="w-3.5 h-3.5 text-indigo-500" />}
                                 </div>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[180px]">{profile.email}</p>
                                 <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[7px] font-black text-slate-300 uppercase italic">ID: {profile.id.substring(0, 8)}...</span>
                                    {profile.is_banned && <span className="text-[7px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest">BANEADO</span>}
                                 </div>
                               </div>
                             </div>

                             <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleToggleAdmin(profile.id, profile.is_admin)}
                                  className={`p-2.5 rounded-xl transition-all ${profile.is_admin ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                                  title="Permisos de Admin"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleToggleSuperAdmin(profile.id, profile.is_super_admin)}
                                  className={`p-2.5 rounded-xl transition-all ${profile.is_super_admin ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`}
                                  title="Permisos Super Admin"
                                >
                                  <Trophy className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleBanUser(profile.id, profile.is_banned)}
                                  className={`p-2.5 rounded-xl transition-all ${profile.is_banned ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-slate-50 text-slate-300 hover:text-red-600 hover:bg-red-50'}`}
                                  title={profile.is_banned ? "Quitar Ban" : "Banear Usuario"}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </div>
                        );
                     })
                   )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="game"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8 py-4"
              >
                <div className="bg-red-50 p-8 rounded-[3rem] border-2 border-dashed border-red-200 text-center space-y-6">
                   <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-red-200 -rotate-6">
                      <RotateCcw className="w-10 h-10" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Purgado Total del Sistema</h3>
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest max-w-[250px] mx-auto">
                        Elimina todas las sesiones activas, participantes y limpia el tablero online.
                      </p>
                   </div>
                   <button 
                     onClick={handleGlobalReset}
                     disabled={loading}
                     className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-red-100 active:scale-95 transition-all disabled:opacity-50"
                   >
                     {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                     Ejecutar Reinicio Maestro
                   </button>
                   <p className="text-[8px] font-black text-slate-300 uppercase italic">Atención: Esta acción es irreversible y afecta a todos los usuarios</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div 
                     onClick={handleForceStart}
                     className="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 flex flex-col items-center text-center space-y-3 cursor-pointer hover:bg-blue-100 transition-all active:scale-95"
                   >
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                         <Play className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-[9px] font-black text-blue-700 uppercase italic">Iniciar Sala</div>
                      <p className="text-[8px] font-medium text-slate-500 uppercase tracking-tighter">Obligar Inicio de Partida en espera</p>
                   </div>
                   <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 flex flex-col items-center text-center space-y-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                         <Megaphone className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="text-[9px] font-black text-amber-700 uppercase italic">Anuncio Vocal</div>
                      <p className="text-[8px] font-medium text-slate-500 uppercase tracking-tighter">Enviar alerta sonora a todos</p>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-800 uppercase italic">Magu Online Admin v2.5.0</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">Security Level: Maximum</span>
              </div>
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
              >
                Cerrar Panel
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

export function RankingModal({ isOpen, onClose, mode = 'global' }: { isOpen: boolean; onClose: () => void; mode?: GameMode }) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchRanking = async () => {
        setLoading(true);
        const { data } = await RankingService.getTopWinners(mode);
        setRankings(data);
        setLoading(false);
      };
      fetchRanking();
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 flex flex-col h-[70vh]"
      >
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className={`w-9 h-9 ${mode === 'global' ? 'bg-blue-600' : 'bg-indigo-600'} rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-100`}>
                <Trophy className="w-4 h-4" />
             </div>
             <div>
               <h2 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter leading-none">Ranking {mode === 'global' ? 'Online' : 'Práctica'}</h2>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Mejores Jugadores</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-white">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
               <Loader2 className={`w-10 h-10 ${mode === 'global' ? 'text-blue-600' : 'text-indigo-600'} animate-spin`} />
               <p className="text-[10px] font-black text-slate-300 uppercase italic">Sincronizando Marcadores...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
               <Trophy className="w-12 h-12 text-slate-200" />
               <p className="text-xs font-bold text-slate-400 uppercase italic">No hay récords registrados</p>
            </div>
          ) : (
            rankings.map((entry, index) => (
              <motion.div 
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  index === 0 ? `${mode === 'global' ? 'bg-blue-600 border-blue-500 shadow-blue-200' : 'bg-indigo-600 border-indigo-500 shadow-indigo-200'} text-white shadow-lg scale-[1.02]` : 
                  index === 1 ? 'bg-slate-50 border-slate-200 text-slate-700' : 
                  'bg-white border-slate-100 text-slate-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs italic ${
                  index === 0 ? `bg-white ${mode === 'global' ? 'text-blue-600' : 'text-indigo-600'}` : 'bg-slate-200 text-slate-500'
                }`}>
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-black italic uppercase tracking-tight text-sm truncate max-w-[150px]">{entry.user_name}</div>
                  <div className={`text-[8px] font-bold uppercase tracking-widest ${index === 0 ? 'opacity-70' : 'text-slate-400'}`}>{mode === 'global' ? 'Estadísticas de Sala' : 'Récord Personal'}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black italic leading-none">{entry.wins}</div>
                  <div className={`text-[7px] font-bold uppercase ${index === 0 ? 'opacity-70' : 'text-slate-400'}`}>Victorias</div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            onClick={onClose}
            className={`w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest ${mode === 'global' ? 'hover:border-blue-500 hover:text-blue-600' : 'hover:border-indigo-500 hover:text-indigo-600'} transition-all active:scale-95 flex items-center justify-center gap-2`}
          >
            <RotateCcw className="w-4 h-4" />
            Cerrar Ranking
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ProfileSettingsModal({ isOpen, onClose, userId, onLogout, onUpdate, isSuperAdmin, onShowSuperAdmin }: { 
  isOpen: boolean, 
  onClose: () => void, 
  userId: string, 
  onLogout: () => void, 
  onUpdate: (data: { username?: string, avatarUrl?: string }) => void,
  isSuperAdmin?: boolean,
  onShowSuperAdmin?: () => void
}) {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<{ wins: number; total: number; winRate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchProfile = async () => {
        setLoading(true);
        const [{ data }, userStats] = await Promise.all([
          AuthService.getProfile(userId),
          RankingService.getUserStats(userId)
        ]);
        if (data) {
          setProfile(data);
          setNewUsername(data.username || '');
        }
        setStats(userStats);
        setLoading(false);
      };
      fetchProfile();
    }
  }, [isOpen, userId]);

  const handleAvatarUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const url = await AuthService.uploadAvatar(file, userId);
      setProfile((prev: any) => ({ ...prev, avatar_url: url }));
      onUpdate({ avatarUrl: url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleRandomAvatar = async () => {
    setUploading(true);
    const styles = ['adventurer', 'avataaars', 'bottts', 'pixel-art', 'lorelei'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    const seed = Math.random().toString(36).substring(7);
    const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
    
    try {
      await AuthService.updateProfile(userId, { avatar_url: url });
      setProfile((prev: any) => ({ ...prev, avatar_url: url }));
      onUpdate({ avatarUrl: url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!newUsername.trim()) return;
    setUpdating(true);
    try {
      await AuthService.updateProfile(userId, { username: newUsername.trim() });
      onUpdate({ username: newUsername.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200"
      >
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">Mi Perfil</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ajustes de cuenta</p>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button 
                onClick={() => {
                  onShowSuperAdmin?.();
                  onClose();
                }}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                title="Panel de Control Maestro"
              >
                <ShieldAlert className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col items-center space-y-6">
          {/* Avatar Section */}
          <div className="relative group">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-[2rem] bg-blue-50 border-4 border-white shadow-xl overflow-hidden cursor-pointer active:scale-95 transition-transform flex items-center justify-center"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="text-3xl font-black text-blue-200">{profile?.username?.charAt(0).toUpperCase() || '?'}</div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <button 
              onClick={handleRandomAvatar}
              className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg border-2 border-white hover:scale-110 active:scale-90 transition-all"
              title="Avatar Aleatorio"
            >
              <Dice5 className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="w-full grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase italic leading-none mb-1">Partidas</div>
                <div className="text-sm font-black text-slate-800 italic">{stats.total}</div>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl text-center border border-blue-100">
                <div className="text-[10px] font-black text-blue-400 uppercase italic leading-none mb-1">Victorias</div>
                <div className="text-sm font-black text-blue-700 italic">{stats.wins}</div>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl text-center border border-amber-100">
                <div className="text-[10px] font-black text-amber-400 uppercase italic leading-none mb-1">Win Rate</div>
                <div className="text-sm font-black text-amber-700 italic">{stats.winRate}%</div>
              </div>
            </div>
          )}

          <div className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase italic px-1">Nombre de Usuario</label>
              <input 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
                placeholder="Tu nombre..."
              />
            </div>

            <button 
              onClick={handleUpdateProfile}
              disabled={updating || !newUsername.trim()}
              className={`w-full py-4 rounded-2xl font-black uppercase text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${success ? 'bg-green-500 shadow-green-100' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'} text-white disabled:opacity-50`}
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : (success ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />)}
              {success ? 'GUARDADO' : 'Actualizar Perfil'}
            </button>

            {isSuperAdmin && (
              <button 
                onClick={() => {
                  onShowSuperAdmin?.();
                  onClose();
                }}
                className="w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 border border-blue-200 shadow-sm"
              >
                <ShieldAlert className="w-4 h-4" />
                Panel Súper Admin
              </button>
            )}

            <div className="h-px bg-slate-100 w-full" />

            <button 
              onClick={() => { onLogout(); onClose(); }}
              className="w-full py-4 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PublicityAlert({ ad, onClose }: { ad: any, onClose: () => void }) {
  const handleAction = () => {
    if (!ad.external_url) return;
    
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg?.initData) {
      tg.openLink(ad.external_url);
    } else {
      window.open(ad.external_url, '_blank', 'referrer');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md overflow-hidden"
      onClick={onClose}
    >
       <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] border border-white/20"
       >
         <button 
           onClick={onClose}
           className="absolute top-4 right-4 p-2.5 bg-black/10 hover:bg-black/20 rounded-xl transition-all z-20 backdrop-blur-sm"
         >
           <X className="w-6 h-6 text-white" />
         </button>

         <div className="flex-1 overflow-y-auto no-scrollbar">
           {ad.image_url && (
             <div className="w-full bg-slate-100 flex items-center justify-center min-h-[250px] relative">
                {ad.media_type === 'video' ? (
                  <video 
                    src={ad.image_url} 
                    className="w-full max-h-[45vh] object-contain"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img 
                    src={ad.image_url} 
                    alt={ad.title} 
                    className="w-full max-h-[45vh] object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
             </div>
           )}

           <div className="p-8 text-center space-y-6">
              {!ad.image_url && (
                <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-200 -rotate-6 animate-bounce-slow">
                   <Megaphone className="w-10 h-10" />
                </div>
              )}
              
              <div className="space-y-1">
                 <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-tight">{ad.title}</h3>
                 <div className="w-10 h-1 bg-blue-600 mx-auto rounded-full"></div>
              </div>

              <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-sm mx-auto">{ad.message}</p>

              <div className="flex flex-col gap-3 pt-2">
                {ad.external_url && (
                  <button 
                    onClick={handleAction}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Send className="w-5 h-5" />
                    VER MÁS AHORA
                  </button>
                )}
                
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                >
                  Continuar al Bingo
                </button>
              </div>
           </div>
         </div>
       </motion.div>
    </motion.div>
  );
}

export function SidebarAd({ ad }: { ad: any }) {
  if (!ad) return null;
  return (
    <div className="w-full h-full p-2 flex flex-col gap-2">
       {ad.image_url && (
         <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden shadow-inner border border-slate-200 relative group">
           {ad.media_type === 'video' ? (
             <video src={ad.image_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
           ) : (
             <img src={ad.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
             <p className="text-[10px] font-black text-white uppercase italic leading-none">{ad.title}</p>
           </div>
         </div>
       )}
    </div>
  );
}
