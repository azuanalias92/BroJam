-- Ratings Migration
-- This migration adds a ratings table to allow borrowers and lenders to rate each other

-- Create rating type enum
CREATE TYPE rating_value AS ENUM ('1', '2', '3', '4', '5');

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.borrow_requests(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rated_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating rating_value NOT NULL,
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only rate once per request
  UNIQUE(request_id, rater_id),
  
  -- Ensure users can't rate themselves
  CHECK (rater_id != rated_user_id)
);

-- Add average_rating and total_ratings to users table
ALTER TABLE public.users 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN total_ratings INTEGER DEFAULT 0;

-- Function to update user's average rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  rating_count INTEGER;
BEGIN
  -- Calculate new average rating for the rated user
  SELECT 
    COALESCE(AVG(rating::INTEGER), 0.0),
    COUNT(*)
  INTO avg_rating, rating_count
  FROM ratings 
  WHERE rated_user_id = COALESCE(NEW.rated_user_id, OLD.rated_user_id);
  
  -- Update user's rating statistics
  UPDATE users 
  SET 
    average_rating = avg_rating,
    total_ratings = rating_count,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.rated_user_id, OLD.rated_user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user rating when ratings are inserted, updated, or deleted
CREATE TRIGGER update_user_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Enable RLS on ratings table
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ratings
CREATE POLICY "Users can view ratings for requests they're involved in" ON public.ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM borrow_requests br 
      WHERE br.id = ratings.request_id 
      AND (br.borrower_id = auth.uid() OR br.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can view ratings they gave" ON public.ratings
  FOR SELECT USING (auth.uid() = rater_id);

CREATE POLICY "Users can view ratings they received" ON public.ratings
  FOR SELECT USING (auth.uid() = rated_user_id);

CREATE POLICY "Users can create ratings for completed requests" ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM borrow_requests br 
      WHERE br.id = request_id 
      AND br.status = 'completed'
      AND (br.borrower_id = auth.uid() OR br.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own ratings" ON public.ratings
  FOR UPDATE USING (auth.uid() = rater_id);

CREATE POLICY "Users can delete their own ratings" ON public.ratings
  FOR DELETE USING (auth.uid() = rater_id);

-- Indexes for better performance
CREATE INDEX idx_ratings_request_id ON ratings(request_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_rated_user_id ON ratings(rated_user_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);
CREATE INDEX idx_users_average_rating ON users(average_rating);

-- Function to check if both parties have rated each other for a request
CREATE OR REPLACE FUNCTION both_parties_rated(request_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  borrower_uuid UUID;
  owner_uuid UUID;
  borrower_rated BOOLEAN := FALSE;
  owner_rated BOOLEAN := FALSE;
BEGIN
  -- Get borrower and owner IDs
  SELECT borrower_id, owner_id INTO borrower_uuid, owner_uuid
  FROM borrow_requests WHERE id = request_uuid;
  
  -- Check if borrower has rated the owner
  SELECT EXISTS(
    SELECT 1 FROM ratings 
    WHERE request_id = request_uuid 
    AND rater_id = borrower_uuid 
    AND rated_user_id = owner_uuid
  ) INTO borrower_rated;
  
  -- Check if owner has rated the borrower
  SELECT EXISTS(
    SELECT 1 FROM ratings 
    WHERE request_id = request_uuid 
    AND rater_id = owner_uuid 
    AND rated_user_id = borrower_uuid
  ) INTO owner_rated;
  
  RETURN borrower_rated AND owner_rated;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending ratings for a user
CREATE OR REPLACE FUNCTION get_pending_ratings(user_uuid UUID)
RETURNS TABLE(
  request_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  item_title TEXT,
  completed_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    br.id,
    CASE 
      WHEN br.borrower_id = user_uuid THEN br.owner_id
      ELSE br.borrower_id
    END,
    CASE 
      WHEN br.borrower_id = user_uuid THEN owner.full_name
      ELSE borrower.full_name
    END,
    i.title,
    br.updated_at
  FROM borrow_requests br
  JOIN items i ON br.item_id = i.id
  JOIN users borrower ON br.borrower_id = borrower.id
  JOIN users owner ON br.owner_id = owner.id
  WHERE br.status = 'completed'
    AND (br.borrower_id = user_uuid OR br.owner_id = user_uuid)
    AND NOT EXISTS (
      SELECT 1 FROM ratings r
      WHERE r.request_id = br.id
        AND r.rater_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql;