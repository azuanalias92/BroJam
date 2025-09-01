-- Migration to add support for multiple photos per item

-- Create item_photos table
CREATE TABLE public.item_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_item_photos_item_id ON item_photos(item_id);
CREATE INDEX idx_item_photos_display_order ON item_photos(item_id, display_order);

-- Enable RLS
ALTER TABLE public.item_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_photos
CREATE POLICY "Anyone can view photos of available items" ON public.item_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = item_photos.item_id 
      AND items.is_available = true
    )
  );

CREATE POLICY "Users can view photos of their own items" ON public.item_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = item_photos.item_id 
      AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos for their own items" ON public.item_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = item_photos.item_id 
      AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update photos of their own items" ON public.item_photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = item_photos.item_id 
      AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of their own items" ON public.item_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = item_photos.item_id 
      AND items.owner_id = auth.uid()
    )
  );

-- Function to get the first photo URL for backward compatibility
CREATE OR REPLACE FUNCTION get_item_first_photo(item_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  first_photo_url TEXT;
BEGIN
  SELECT photo_url INTO first_photo_url
  FROM item_photos
  WHERE item_id = item_uuid
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  RETURN first_photo_url;
END;
$$ LANGUAGE plpgsql;

-- Create a view that includes the first photo for backward compatibility
CREATE OR REPLACE VIEW items_with_photo AS
SELECT 
  i.*,
  get_item_first_photo(i.id) as first_photo_url,
  (
    SELECT json_agg(
      json_build_object(
        'id', ip.id,
        'photo_url', ip.photo_url,
        'display_order', ip.display_order
      ) ORDER BY ip.display_order ASC, ip.created_at ASC
    )
    FROM item_photos ip
    WHERE ip.item_id = i.id
  ) as photos
FROM items i;