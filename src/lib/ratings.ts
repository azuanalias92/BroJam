import { supabase } from './supabase';
import { Database } from './supabase';

type Rating = Database['public']['Tables']['ratings']['Row'];
type RatingInsert = Database['public']['Tables']['ratings']['Insert'];
type RatingUpdate = Database['public']['Tables']['ratings']['Update'];

export interface RatingWithDetails extends Rating {
  rater: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  rated_user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  borrow_requests: {
    id: string;
    items: {
      title: string;
    };
  };
}

export interface PendingRating {
  request_id: string;
  other_user_id: string;
  other_user_name: string | null;
  item_title: string;
  completed_date: string;
}

/**
 * Create a new rating for a completed borrow request
 */
export async function createRating({
  requestId,
  ratedUserId,
  rating,
  review
}: {
  requestId: string;
  ratedUserId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('ratings')
    .insert({
      request_id: requestId,
      rater_id: user.id,
      rated_user_id: ratedUserId,
      rating: rating.toString() as '1' | '2' | '3' | '4' | '5',
      review: review || null
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update an existing rating
 */
export async function updateRating({
  ratingId,
  rating,
  review
}: {
  ratingId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review?: string;
}) {
  const { data, error } = await supabase
    .from('ratings')
    .update({
      rating: rating.toString() as '1' | '2' | '3' | '4' | '5',
      review: review || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', ratingId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get ratings for a specific user (ratings they received)
 */
export async function getUserRatings(userId: string) {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      rater:rater_id(
        id,
        full_name,
        avatar_url
      ),
      rated_user:rated_user_id(
        id,
        full_name,
        avatar_url
      ),
      borrow_requests:request_id(
        id,
        items:item_id(
          title
        )
      )
    `)
    .eq('rated_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as RatingWithDetails[];
}

/**
 * Get ratings given by a specific user
 */
export async function getRatingsGivenByUser(userId: string) {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      rater:rater_id(
        id,
        full_name,
        avatar_url
      ),
      rated_user:rated_user_id(
        id,
        full_name,
        avatar_url
      ),
      borrow_requests:request_id(
        id,
        items:item_id(
          title
        )
      )
    `)
    .eq('rater_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as RatingWithDetails[];
}

/**
 * Get ratings for a specific request
 */
export async function getRequestRatings(requestId: string) {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      rater:rater_id(
        id,
        full_name,
        avatar_url
      ),
      rated_user:rated_user_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as RatingWithDetails[];
}

/**
 * Check if a user has already rated another user for a specific request
 */
export async function hasUserRated(requestId: string, raterId: string) {
  const { data, error } = await supabase
    .from('ratings')
    .select('id')
    .eq('request_id', requestId)
    .eq('rater_id', raterId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw error;
  }

  return !!data;
}

/**
 * Get pending ratings for the current user (completed requests they haven't rated yet)
 */
export async function getPendingRatings() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .rpc('get_pending_ratings', { user_uuid: user.id });

  if (error) {
    throw error;
  }

  return data as PendingRating[];
}

/**
 * Check if both parties have rated each other for a request
 */
export async function haveBothPartiesRated(requestId: string) {
  const { data, error } = await supabase
    .rpc('both_parties_rated', { request_uuid: requestId });

  if (error) {
    throw error;
  }

  return data as boolean;
}

/**
 * Get user's rating statistics
 */
export async function getUserRatingStats(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('average_rating, total_ratings')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    averageRating: data.average_rating || 0,
    totalRatings: data.total_ratings || 0
  };
}

/**
 * Delete a rating
 */
export async function deleteRating(ratingId: string) {
  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('id', ratingId);

  if (error) {
    throw error;
  }

  return true;
}