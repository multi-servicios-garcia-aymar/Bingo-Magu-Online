import { supabase } from '../lib/supabase';

export const AuthService = {
  async signIn(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    return { data, error };
  },

  async signUp(email: string, pass: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
    });
    // Triggers will usually create the profile, but we can do it manually if needed
    // In this app, we assume manual role assignment in profiles table as requested.
    return { data, error };
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getProfile(userId: string) {
    // Fetch profile from table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    // If no profile exists, try to create one from current auth user metadata
    if (!data) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Jugador',
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            last_seen_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();
        
        if (!createError && newProfile) return { data: newProfile, error: null };
      }
    }
    
    return { data, error };
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  async toggleAdmin(userId: string, status: boolean) {
    return await this.updateProfile(userId, { is_admin: status });
  },

  async toggleSuperAdmin(userId: string, status: boolean) {
    return await this.updateProfile(userId, { is_super_admin: status });
  },

  async banUser(userId: string, status: boolean) {
    return await this.updateProfile(userId, { is_banned: status });
  },

  async uploadAvatar(file: File, userId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    await this.updateProfile(userId, { avatar_url: publicUrl });
    return publicUrl;
  },

  async updateLastSeen(userId: string) {
    return await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);
  }
};

export const PublicityService = {
  async uploadMedia(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `publicity/${fileName}`;

    const { data, error } = await supabase.storage
      .from('assets')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async broadcast(title: string, message: string, mediaUrl: string | null = null, mediaType: 'image' | 'video' = 'image', targetUserIds: string[] | null = null, displaySettings: any = {}, externalUrl: string | null = null) {
    const { data, error } = await supabase
      .from('publicity')
      .insert({
        title,
        message,
        image_url: mediaUrl,
        media_type: mediaType,
        target_user_ids: targetUserIds,
        display_settings: displaySettings,
        external_url: externalUrl,
        is_active: true
      })
      .select()
      .single();
    return { data, error };
  },

  async getActive() {
    const { data, error } = await supabase
      .from('publicity')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getAll() {
    const { data, error } = await supabase
      .from('publicity')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async toggleActive(id: string, isActive: boolean) {
    return await supabase
      .from('publicity')
      .update({ is_active: isActive })
      .eq('id', id);
  },

  async update(id: string, updates: { 
    title?: string; 
    message?: string; 
    image_url?: string | null; 
    media_type?: 'image' | 'video'; 
    target_user_ids?: string[] | null; 
    display_settings?: any;
    external_url?: string | null;
    is_active?: boolean;
  }) {
    const { data, error } = await supabase
      .from('publicity')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    return await supabase
      .from('publicity')
      .delete()
      .eq('id', id);
  }
};
