import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Browser client for SSR
export const createSupabaseBrowserClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          tier: 'bronze' | 'silver' | 'gold' | 'platinum'
          items_lent: number
          reputation_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          items_lent?: number
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          items_lent?: number
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string
          category: string
          purchase_price: number
          tier: 'basic' | 'premium' | 'luxury' | 'exclusive'
          image_url: string | null
          is_available: boolean
          location: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description: string
          category: string
          purchase_price: number
          tier?: 'basic' | 'premium' | 'luxury' | 'exclusive'
          image_url?: string | null
          is_available?: boolean
          location: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string
          category?: string
          purchase_price?: number
          tier?: 'basic' | 'premium' | 'luxury' | 'exclusive'
          image_url?: string | null
          is_available?: boolean
          location?: string
          created_at?: string
          updated_at?: string
        }
      }
      borrow_requests: {
        Row: {
          id: string
          item_id: string
          borrower_id: string
          owner_id: string
          status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled'
          start_date: string
          end_date: string
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          borrower_id: string
          owner_id: string
          status?: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled'
          start_date: string
          end_date: string
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          borrower_id?: string
          owner_id?: string
          status?: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled'
          start_date?: string
          end_date?: string
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}