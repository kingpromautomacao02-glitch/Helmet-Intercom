import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProjectVersion {
  id: string;
  version: string;
  description: string;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  version_id: string;
  file_path: string;
  file_name: string;
  language: string;
  content: string;
  created_at: string;
}
