-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE item_tier AS ENUM ('basic', 'premium', 'luxury', 'exclusive');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  tier user_tier DEFAULT 'bronze',
  items_lent INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  tier item_tier DEFAULT 'basic',
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Borrow requests table
CREATE TABLE public.borrow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  borrower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status request_status DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically set item tier based on purchase price
CREATE OR REPLACE FUNCTION set_item_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.purchase_price < 100 THEN
    NEW.tier = 'basic';
  ELSIF NEW.purchase_price < 500 THEN
    NEW.tier = 'premium';
  ELSIF NEW.purchase_price < 2000 THEN
    NEW.tier = 'luxury';
  ELSE
    NEW.tier = 'exclusive';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user tier based on lending activity
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
DECLARE
  completed_loans INTEGER;
BEGIN
  -- Count completed borrow requests where user was the lender
  SELECT COUNT(*) INTO completed_loans
  FROM borrow_requests
  WHERE owner_id = NEW.owner_id AND status = 'completed';
  
  -- Update user's items_lent count
  UPDATE users 
  SET items_lent = completed_loans,
      updated_at = NOW()
  WHERE id = NEW.owner_id;
  
  -- Update user tier based on lending activity
  UPDATE users 
  SET tier = CASE
    WHEN completed_loans >= 50 THEN 'platinum'
    WHEN completed_loans >= 20 THEN 'gold'
    WHEN completed_loans >= 5 THEN 'silver'
    ELSE 'bronze'
  END,
  updated_at = NOW()
  WHERE id = NEW.owner_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER set_item_tier_trigger
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION set_item_tier();

CREATE TRIGGER update_user_tier_trigger
  AFTER UPDATE ON borrow_requests
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_user_tier();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Items policies
CREATE POLICY "Anyone can view available items" ON public.items
  FOR SELECT USING (is_available = true);

CREATE POLICY "Users can view their own items" ON public.items
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own items" ON public.items
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own items" ON public.items
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own items" ON public.items
  FOR DELETE USING (auth.uid() = owner_id);

-- Borrow requests policies
CREATE POLICY "Users can view requests involving them" ON public.borrow_requests
  FOR SELECT USING (auth.uid() = borrower_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create borrow requests" ON public.borrow_requests
  FOR INSERT WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Owners can update request status" ON public.borrow_requests
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = borrower_id);

-- Indexes for better performance
CREATE INDEX idx_items_owner_id ON items(owner_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_tier ON items(tier);
CREATE INDEX idx_items_available ON items(is_available);
CREATE INDEX idx_borrow_requests_borrower_id ON borrow_requests(borrower_id);
CREATE INDEX idx_borrow_requests_owner_id ON borrow_requests(owner_id);
CREATE INDEX idx_borrow_requests_item_id ON borrow_requests(item_id);
CREATE INDEX idx_borrow_requests_status ON borrow_requests(status);