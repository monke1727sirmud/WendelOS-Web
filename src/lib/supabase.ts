import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type Database = {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          wallpaper: string;
          theme: 'dark' | 'light';
          accent_color: string;
          auto_lock_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          wallpaper?: string;
          theme?: 'dark' | 'light';
          accent_color?: string;
          auto_lock_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          wallpaper?: string;
          theme?: 'dark' | 'light';
          accent_color?: string;
          auto_lock_minutes?: number;
        };
      };
      files: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          type: 'file' | 'folder';
          content: string | null;
          mime_type: string;
          size_bytes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          parent_id?: string | null;
          type?: 'file' | 'folder';
          content?: string | null;
          mime_type?: string;
          size_bytes?: number;
        };
        Update: {
          name?: string;
          content?: string | null;
          size_bytes?: number;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          color: string;
          pos_x: number;
          pos_y: number;
          width: number;
          height: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          color?: string;
          pos_x?: number;
          pos_y?: number;
          width?: number;
          height?: number;
        };
        Update: {
          title?: string;
          content?: string;
          color?: string;
          pos_x?: number;
          pos_y?: number;
          width?: number;
          height?: number;
        };
      };
      desktop_windows: {
        Row: {
          id: string;
          user_id: string;
          app_id: string;
          title: string;
          pos_x: number;
          pos_y: number;
          width: number;
          height: number;
          z_index: number;
          is_minimized: boolean;
          is_maximized: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          app_id: string;
          title: string;
          pos_x?: number;
          pos_y?: number;
          width?: number;
          height?: number;
          z_index?: number;
          is_minimized?: boolean;
          is_maximized?: boolean;
        };
        Update: {
          title?: string;
          pos_x?: number;
          pos_y?: number;
          width?: number;
          height?: number;
          z_index?: number;
          is_minimized?: boolean;
          is_maximized?: boolean;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          location: string | null;
          start_at: string;
          end_at: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          start_at: string;
          end_at: string;
          color?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          location?: string | null;
          start_at?: string;
          end_at?: string;
          color?: string;
        };
      };
    };
  };
};
