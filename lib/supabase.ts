import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://adfbqwhartvqutumwfsj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_mJCM5HoHaB4huAl9X_FrnQ_h5mavCSs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handleSupabaseError = (error: any, defaultMessage: string) => {
  console.error('Supabase Error Details:', {
    message: error?.message || String(error),
    status: error?.status,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    raw: JSON.stringify(error, Object.getOwnPropertyNames(error || {}))
  });
  throw new Error(error?.message || defaultMessage);
};