import { supabase } from './supabase'

export interface PhotoUploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface PhotoData {
  id: string
  photo_url: string
  display_order: number
}

/**
 * Upload a single photo to Supabase storage
 */
export async function uploadPhoto(
  file: File,
  itemId: string,
  displayOrder: number = 0
): Promise<PhotoUploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${itemId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('item-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('item-photos')
      .getPublicUrl(uploadData.path)

    return {
      success: true,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('Photo upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Upload multiple photos and save to database
 */
export async function uploadMultiplePhotos(
  files: File[],
  itemId: string
): Promise<{ success: boolean; photos?: PhotoData[]; error?: string }> {
  try {
    const uploadPromises = files.map((file, index) => 
      uploadPhoto(file, itemId, index)
    )

    const uploadResults = await Promise.all(uploadPromises)
    
    // Check if any uploads failed
    const failedUploads = uploadResults.filter(result => !result.success)
    if (failedUploads.length > 0) {
      return {
        success: false,
        error: `Failed to upload ${failedUploads.length} photo(s)`
      }
    }

    // Save photo records to database
    const photoRecords = uploadResults.map((result, index) => ({
      item_id: itemId,
      photo_url: result.url!,
      display_order: index
    }))

    const { data: photoData, error: dbError } = await supabase
      .from('item_photos')
      .insert(photoRecords)
      .select('id, photo_url, display_order')

    if (dbError) {
      console.error('Database error:', dbError)
      return { success: false, error: dbError.message }
    }

    return {
      success: true,
      photos: photoData
    }
  } catch (error) {
    console.error('Multiple photo upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Delete a photo from storage and database
 */
export async function deletePhoto(photoId: string, photoUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const urlParts = photoUrl.split('/item-photos/')
    if (urlParts.length !== 2) {
      return { success: false, error: 'Invalid photo URL format' }
    }
    const filePath = urlParts[1]

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('item-photos')
      .remove([filePath])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('item_photos')
      .delete()
      .eq('id', photoId)

    if (dbError) {
      console.error('Database deletion error:', dbError)
      return { success: false, error: dbError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Photo deletion error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Get all photos for an item
 */
export async function getItemPhotos(itemId: string): Promise<{ success: boolean; photos?: PhotoData[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('item_photos')
      .select('id, photo_url, display_order')
      .eq('item_id', itemId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Get photos error:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      photos: data
    }
  } catch (error) {
    console.error('Get item photos error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}