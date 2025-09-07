'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations } from '@/contexts/TranslationContext'
import { supabase } from '@/lib/supabase'
import { uploadMultiplePhotos, getItemPhotos, deletePhoto, PhotoData } from '@/lib/photo-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ItemTierBadge } from '@/components/tiers/ItemTierBadge'
import { calculateItemTier } from '@/lib/tiers'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Database } from '@/lib/supabase'
import Image from 'next/image'
import { PhotoUpload } from '@/components/ui/photo-upload'

type Item = Database['public']['Tables']['items']['Row']

const CATEGORIES = [
  'Electronics',
  'Tools',
  'Sports',
  'Books',
  'Clothing',
  'Home & Garden',
  'Automotive',
  'Music',
  'Art',
  'Other'
]

export default function MyItemsPage() {
  const { user, loading: authLoading } = useAuth()
  const t = useTranslations();
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    purchase_price: '',
    location: ''
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<PhotoData[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchItems()
    }
  }, [user])

  const fetchItems = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      purchase_price: '',
      location: ''
    })
    setPhotos([])
    setExistingPhotos([])
    setEditingItem(null)
  }

  const handleAddItem = () => {
    resetForm()
    setShowAddDialog(true)
  }

  const handleEditItem = async (item: Item) => {
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category,
      purchase_price: item.purchase_price.toString(),
      location: item.location
    })
    setPhotos([])
    
    // Load existing photos
    const photoResult = await getItemPhotos(item.id)
    if (photoResult.success && photoResult.photos) {
      setExistingPhotos(photoResult.photos)
    } else {
      setExistingPhotos([])
    }
    
    setEditingItem(item)
    setShowAddDialog(true)
  }

  const handleRemoveExistingPhoto = async (photoId: string, photoUrl: string) => {
    try {
      const result = await deletePhoto(photoId, photoUrl)
      if (result.success) {
        // Remove from local state
        setExistingPhotos(prev => prev.filter(photo => photo.id !== photoId))
      } else {
        console.error('Failed to delete photo:', result.error)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setIsUploading(true)
    try {
      const purchasePrice = parseFloat(formData.purchase_price)
      const tier = calculateItemTier(purchasePrice)

      const itemData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        purchase_price: purchasePrice,
        location: formData.location,
        image_url: null, // Will be populated from first photo
        tier,
        owner_id: user.id
      }

      if (editingItem) {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', editingItem.id)

        if (error) throw error

        // Upload new photos if any
        if (photos.length > 0) {
          const photoResult = await uploadMultiplePhotos(photos, editingItem.id)
          if (!photoResult.success) {
            console.error('Photo upload failed:', photoResult.error)
          }
        }
        
        // Update item with first available photo URL for backward compatibility
        const allPhotosResult = await getItemPhotos(editingItem.id)
        if (allPhotosResult.success && allPhotosResult.photos && allPhotosResult.photos.length > 0) {
          await supabase
            .from('items')
            .update({ image_url: allPhotosResult.photos[0].photo_url })
            .eq('id', editingItem.id)
        } else {
          // No photos left, clear image_url
          await supabase
            .from('items')
            .update({ image_url: null })
            .eq('id', editingItem.id)
        }
      } else {
        const { data, error } = await supabase
          .from('items')
          .insert([itemData])
          .select()

        if (error) throw error

        const newItem = data[0]

        // Upload photos if any
        if (photos.length > 0) {
          const photoResult = await uploadMultiplePhotos(photos, newItem.id)
          if (!photoResult.success) {
            console.error('Photo upload failed:', photoResult.error)
          } else {
            // Update item with first photo URL for backward compatibility
            if (photoResult.photos && photoResult.photos.length > 0) {
              await supabase
                .from('items')
                .update({ image_url: photoResult.photos[0].photo_url })
                .eq('id', newItem.id)
            }
          }
        }
      }

      fetchItems()
      setShowAddDialog(false)
      resetForm()
    } catch (error: any) {
      console.error('Error saving item:', error)
      alert(t('myItems.failedToSave'))
    } finally {
      setSubmitting(false)
      setIsUploading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t('myItems.deleteConfirm'))) return

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      fetchItems()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      alert(t('myItems.failedToDelete'))
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>{t('myItems.loadingItems')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('myItems.pleaseSignIn')}</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('myItems.title')}</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              {t('myItems.addItem')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Purchase Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>
              
              <PhotoUpload
                photos={photos}
                onPhotosChange={setPhotos}
                existingPhotos={existingPhotos}
                onExistingPhotoRemove={handleRemoveExistingPhoto}
                maxPhotos={5}
                className="space-y-2"
              />
              
              {formData.purchase_price && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Item Tier:</span>
                  <ItemTierBadge tier={calculateItemTier(parseFloat(formData.purchase_price))} />
                </div>
              )}
              
              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || isUploading} className="flex-1">
                  {isUploading ? 'Uploading photos...' : submitting ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-4xl">📦</div>
              <h3 className="text-lg font-semibold">No items yet</h3>
              <p className="text-gray-600">Add your first item to start lending!</p>
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="relative h-48 bg-gray-200">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <ItemTierBadge tier={item.tier} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{item.category}</Badge>
                    <span className="font-bold">${item.purchase_price}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    📍 {item.location}
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditItem(item)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}