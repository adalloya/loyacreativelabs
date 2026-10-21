// src/services/feedbackService.ts
'use client';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface FeedbackSubmission {
  rating: number; // 1 a 5 estrellas
  category: 'sugerencia' | 'falta_algo' | 'ajuste_tecnico' | 'opinion_general';
  message: string;
  name?: string;
  email?: string;
}

export interface FeedbackRecord extends FeedbackSubmission {
  id: string;
  created_at: string;
  user_agent?: string;
  source?: 'supabase' | 'local';
}

const LOCAL_FEEDBACK_KEY = 'apex_local_feedback_v1';

/**
 * Guarda el comentario del usuario en Supabase (tabla `apex_feedback`).
 * Si la tabla no está creada aún en Supabase o hay falla de red,
 * se almacena de forma segura en localStorage con fallback garantizado.
 */
export async function submitFeedback(data: FeedbackSubmission): Promise<{ success: boolean; id: string; error?: string }> {
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
  const fallbackId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: FeedbackRecord = {
    ...data,
    id: fallbackId,
    created_at: new Date().toISOString(),
    user_agent: userAgent,
    source: 'local'
  };

  // Guardar siempre una copia local de respaldo
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_FEEDBACK_KEY);
      const list: FeedbackRecord[] = stored ? JSON.parse(stored) : [];
      list.unshift(record);
      localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(list.slice(0, 50)));
    } catch {
      // Ignorar error de cuota local
    }
  }

  // Si Supabase está configurado, intentar guardarlo en la base de datos remota
  if (isSupabaseConfigured) {
    try {
      const { data: inserted, error } = await supabase
        .from('apex_feedback')
        .insert({
          rating: data.rating,
          category: data.category,
          message: data.message,
          name: data.name?.trim() || null,
          email: data.email?.trim() || null,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase feedback insert error, stored in local cache:', error.message);
        return { success: true, id: fallbackId };
      }

      return { success: true, id: inserted?.id || fallbackId };
    } catch (err: any) {
      console.warn('Network exception submitting feedback to Supabase, saved locally:', err);
      return { success: true, id: fallbackId };
    }
  }

  return { success: true, id: fallbackId };
}

/**
 * Consulta la lista de todos los comentarios recibidos desde Supabase y la caché local.
 */
export async function getFeedbackList(): Promise<FeedbackRecord[]> {
  let remoteRecords: FeedbackRecord[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('apex_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && Array.isArray(data)) {
        remoteRecords = data.map((item: any) => ({
          id: item.id || `remote_${Math.random()}`,
          rating: item.rating || 5,
          category: item.category || 'opinion_general',
          message: item.message || '',
          name: item.name || '',
          email: item.email || '',
          created_at: item.created_at || new Date().toISOString(),
          user_agent: item.user_agent || '',
          source: 'supabase'
        }));
      }
    } catch (err) {
      console.warn('Error fetching feedback from Supabase:', err);
    }
  }

  // Leer registros locales de respaldo
  let localRecords: FeedbackRecord[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_FEEDBACK_KEY);
      if (stored) {
        localRecords = JSON.parse(stored);
      }
    } catch {
      localRecords = [];
    }
  }

  // Combinar evitando duplicados si el remoto ya los contiene
  const remoteMessages = new Set(remoteRecords.map(r => `${r.message}_${r.created_at?.slice(0, 16)}`));
  const uniqueLocal = localRecords.filter(l => !remoteMessages.has(`${l.message}_${l.created_at?.slice(0, 16)}`));

  const all = [...remoteRecords, ...uniqueLocal];
  all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return all;
}
