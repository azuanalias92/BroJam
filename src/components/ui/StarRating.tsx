'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating?: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export function StarRating({
  rating = 0,
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [currentRating, setCurrentRating] = useState(rating)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleStarClick = (starRating: number) => {
    if (readonly) return
    setCurrentRating(starRating)
    onRatingChange?.(starRating)
  }

  const handleStarHover = (starRating: number) => {
    if (readonly) return
    setHoverRating(starRating)
  }

  const handleMouseLeave = () => {
    if (readonly) return
    setHoverRating(0)
  }

  const displayRating = hoverRating || currentRating

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div 
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              className={cn(
                'transition-colors duration-150',
                !readonly && 'hover:scale-110 cursor-pointer',
                readonly && 'cursor-default'
              )}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200',
                  !readonly && 'hover:fill-yellow-300 hover:text-yellow-300'
                )}
              />
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {displayRating > 0 ? displayRating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  )
}

// Display-only star rating for showing average ratings
export function StarDisplay({ rating, size = 'sm', showValue = true, className }: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}) {
  return (
    <StarRating
      rating={rating}
      readonly
      size={size}
      showValue={showValue}
      className={className}
    />
  )
}