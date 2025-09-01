'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ItemTierBadge } from '@/components/tiers/ItemTierBadge'
import { TIER_COLORS } from '@/lib/tiers'
import { Database } from '@/lib/supabase'
import { BorrowRequestDialog } from './BorrowRequestDialog'
import { HandHeart, Lock, User } from 'lucide-react'
import { useTranslations } from '@/contexts/TranslationContext';

type Item = Database['public']['Tables']['items']['Row']
type User = Database['public']['Tables']['users']['Row']

interface ItemCardProps {
  item: Item
  owner: User
  canBorrow: boolean
  currentUserId?: string
}

export function ItemCard({ item, owner, canBorrow, currentUserId }: ItemCardProps) {
  const [showBorrowDialog, setShowBorrowDialog] = useState(false)
  const isOwner = currentUserId === item.owner_id
  const { t } = useTranslations()

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="p-0">
          <div className="relative h-40 sm:h-48 bg-gray-200">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span className="text-3xl sm:text-4xl">📦</span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <ItemTierBadge tier={item.tier} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-base sm:text-lg line-clamp-2 leading-tight">{item.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">{item.description}</p>
            
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="text-xs px-2 py-1 truncate flex-shrink-0">{t(`categories.${item.category.toLowerCase()}`)}</Badge>
              <span className="text-base sm:text-lg font-bold text-right">${item.purchase_price}</span>
            </div>
            
            <div className="flex items-center space-x-2 min-w-0">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
                <AvatarImage src={owner.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {owner.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm text-gray-600 truncate flex-1">{owner.full_name}</span>
              <Badge className={`${TIER_COLORS[owner.tier]} text-xs px-1.5 py-0.5 flex-shrink-0`}>
                {t(`tiers.${owner.tier.toLowerCase()}`)}
              </Badge>
            </div>
            
            <div className="text-xs text-gray-500 truncate">
              📍 {item.location}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-3 sm:p-4 pt-0">
          {isOwner ? (
            <Button variant="outline" className="w-full h-10 sm:h-9 text-sm touch-manipulation" disabled>
              <User className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t('marketplace.yourItem')}</span>
              <span className="sm:hidden">{t('marketplace.yours')}</span>
            </Button>
          ) : canBorrow ? (
            <Button 
              className="w-full h-10 sm:h-9 text-sm touch-manipulation" 
              onClick={() => setShowBorrowDialog(true)}
            >
              <HandHeart className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t('marketplace.requestToBorrow')}</span>
              <span className="sm:hidden">{t('marketplace.request')}</span>
            </Button>
          ) : (
            <Button variant="outline" className="w-full h-10 sm:h-9 text-sm touch-manipulation" disabled>
              <Lock className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t('marketplace.tierRequired')}: {item.tier}</span>
              <span className="sm:hidden">{t('marketplace.tier')}: {item.tier}</span>
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {showBorrowDialog && (
        <BorrowRequestDialog
          item={item}
          owner={owner}
          open={showBorrowDialog}
          onOpenChange={setShowBorrowDialog}
        />
      )}
    </>
  )
}