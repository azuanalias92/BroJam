"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface PhotoData {
  id: string
  photo_url: string
  display_order: number
}

interface PhotoUploadProps {
  photos: File[]
  onPhotosChange: (photos: File[]) => void
  existingPhotos?: PhotoData[]
  onExistingPhotoRemove?: (photoId: string, photoUrl: string) => void
  maxPhotos?: number
  className?: string
}

export function PhotoUpload({ 
  photos, 
  onPhotosChange, 
  existingPhotos = [], 
  onExistingPhotoRemove,
  maxPhotos = 5, 
  className 
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const totalPhotos = photos.length + existingPhotos.length

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      // Only allow image files
      return file.type.startsWith('image/')
    })

    const totalPhotos = photos.length + existingPhotos.length
    const remainingSlots = maxPhotos - totalPhotos
    const filesToAdd = newFiles.slice(0, remainingSlots)
    
    onPhotosChange([...photos, ...filesToAdd])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <Label className="text-sm font-medium">Photos (Optional)</Label>
      
      {/* Photo Grid */}
      {(photos.length > 0 || existingPhotos.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {/* Existing photos */}
          {existingPhotos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={photo.photo_url}
                  alt={`Existing photo`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              {onExistingPhotoRemove && (
                <button
                  type="button"
                  onClick={() => onExistingPhotoRemove(photo.id, photo.photo_url)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          
          {/* New photos */}
          {photos.map((photo, index) => (
            <div key={`new-${index}`} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={URL.createObjectURL(photo)}
                  alt={`Photo ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {totalPhotos < maxPhotos && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <div className="space-y-2">
            <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
            <div className="text-sm text-gray-600">
              <p>Drag and drop photos here, or</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openFileDialog}
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Photos
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {totalPhotos}/{maxPhotos} photos • PNG, JPG up to 10MB each
            </p>
          </div>
        </div>
      )}
    </div>
  )
}