'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/ui/StarRating'
import { createRating } from '@/lib/ratings'
// Toast functionality to be implemented later
import { Loader2, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: string
  ratedUser: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  ratingType: 'borrower_to_lender' | 'lender_to_borrower'
  onRatingSubmitted?: () => void
}

export function RatingModal({
  isOpen,
  onClose,
  requestId,
  ratedUser,
  ratingType,
  onRatingSubmitted
}: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Toast functionality to be implemented later

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a star rating before submitting.')
      return
    }

    setIsSubmitting(true)
    try {
      await createRating({
        requestId: requestId,
        ratedUserId: ratedUser.id,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        review: review.trim() || undefined
      })

      alert('Rating submitted successfully!')

      onRatingSubmitted?.()
      handleClose()
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Failed to submit rating. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setReview('')
    onClose()
  }

  const getRatingTitle = () => {
    return ratingType === 'borrower_to_lender'
      ? 'Rate the Lender'
      : 'Rate the Borrower'
  }

  const getRatingDescription = () => {
    return ratingType === 'borrower_to_lender'
      ? 'How was your experience borrowing from this person?'
      : 'How was your experience lending to this person?'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{getRatingTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center justify-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={ratedUser.avatar_url || ''} />
              <AvatarFallback>
                {ratedUser.full_name ? (
                  ratedUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                ) : (
                  <User className="h-6 w-6" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-medium">{ratedUser.full_name || 'Anonymous User'}</p>
              <p className="text-sm text-gray-500">{getRatingDescription()}</p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-2">
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
              className="justify-center"
            />
            <p className="text-sm text-gray-500">
              {rating === 0 && 'Select a rating'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Review (Optional)</label>
            <Textarea
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {review.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Rating'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}