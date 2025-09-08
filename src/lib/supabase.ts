import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client with real-time enabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

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
          average_rating: number | null
          total_ratings: number
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
          average_rating?: number | null
          total_ratings?: number
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
          average_rating?: number | null
          total_ratings?: number
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
      ratings: {
        Row: {
          id: string
          request_id: string
          rater_id: string
          rated_user_id: string
          rating: number
          review: string | null
          rating_type: 'borrower_to_lender' | 'lender_to_borrower'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id: string
          rater_id: string
          rated_user_id: string
          rating: number
          review?: string | null
          rating_type: 'borrower_to_lender' | 'lender_to_borrower'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          rater_id?: string
          rated_user_id?: string
          rating?: number
          review?: string | null
          rating_type?: 'borrower_to_lender' | 'lender_to_borrower'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}