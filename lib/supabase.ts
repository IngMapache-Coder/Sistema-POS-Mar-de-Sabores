import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://adfbqwhartvqutumwfsj.supabase.co';
const supabaseAnonKey = 'sb_publishable_mJCM5HoHaB4huAl9X_FrnQ_h5mavCSs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para manejar errores
export const handleSupabaseError = (error: any, defaultMessage: string) => {
  console.error('Supabase Error:', error);
  throw new Error(error?.message || defaultMessage);
};