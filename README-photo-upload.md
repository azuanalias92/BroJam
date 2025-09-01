# Photo Upload Feature Implementation

This document describes the implementation of multiple photo upload functionality for items.

## Database Migration Required

Before using the photo upload feature, you need to run the database migration to create the `item_photos` table and related functions.

### Steps to Apply Migration:

1. **Run the migration SQL**:
   Execute the SQL commands in `supabase-photos-migration.sql` in your Supabase SQL editor or via CLI:
   ```bash
   supabase db reset --linked
   # or apply the migration file directly
   ```

2. **Create Storage Bucket**:
   In your Supabase dashboard, create a storage bucket named `item-photos`:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `item-photos`
   - Set it to public (or configure appropriate policies)

3. **Configure Storage Policies** (if needed):
   ```sql
   -- Allow authenticated users to upload photos
   CREATE POLICY "Users can upload item photos" ON storage.objects
     FOR INSERT WITH CHECK (
       bucket_id = 'item-photos' AND 
       auth.role() = 'authenticated'
     );

   -- Allow public access to view photos
   CREATE POLICY "Anyone can view item photos" ON storage.objects
     FOR SELECT USING (bucket_id = 'item-photos');

   -- Allow users to delete their own photos
   CREATE POLICY "Users can delete their own photos" ON storage.objects
     FOR DELETE USING (
       bucket_id = 'item-photos' AND 
       auth.role() = 'authenticated'
     );
   ```

## Features Implemented

### 1. Multiple Photo Upload
- Users can upload up to 5 photos per item
- Drag and drop support
- File type validation (PNG, JPG)
- File size limit (10MB per photo)
- Real-time preview of selected photos

### 2. Photo Management
- View existing photos when editing items
- Remove individual photos
- Automatic reordering based on upload sequence
- Backward compatibility with existing `image_url` field

### 3. Database Structure
- New `item_photos` table for storing multiple photos
- Maintains `image_url` field in `items` table for backward compatibility
- Automatic photo ordering system
- Proper RLS policies for security

## File Changes Made

### New Files:
- `src/lib/photo-upload.ts` - Photo upload utilities
- `src/components/ui/photo-upload.tsx` - Photo upload component
- `supabase-photos-migration.sql` - Database migration

### Modified Files:
- `src/app/[locale]/my-items/page.tsx` - Integrated photo upload in add/edit forms

## Usage

### Adding Photos to New Items:
1. Click "Add Item" button
2. Fill in item details
3. Use the photo upload area to add photos (drag & drop or click to select)
4. Submit the form

### Managing Photos in Existing Items:
1. Click "Edit" on an existing item
2. Existing photos will be displayed with remove buttons
3. Add new photos using the upload area
4. Remove unwanted photos by clicking the X button
5. Save changes

## Technical Notes

- Photos are stored in Supabase Storage bucket `item-photos`
- Photo metadata is stored in `item_photos` table
- First photo URL is automatically set as `image_url` for backward compatibility
- All photo operations include proper error handling
- RLS policies ensure users can only manage their own item photos