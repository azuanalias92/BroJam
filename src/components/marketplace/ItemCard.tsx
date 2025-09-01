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

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
            <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
            
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{item.category}</Badge>
              <span className="text-lg font-bold">${item.purchase_price}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={owner.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {owner.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">{owner.full_name}</span>
              <Badge className={`${TIER_COLORS[owner.tier]} text-xs`}>
                {owner.tier}
              </Badge>
            </div>
            
            <div className="text-xs text-gray-500">
              📍 {item.location}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          {isOwner ? (
            <Button variant="outline" className="w-full" disabled>
              Your Item
            </Button>
          ) : canBorrow ? (
            <Button 
              className="w-full" 
              onClick={() => setShowBorrowDialog(true)}
            >
              Request to Borrow
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Tier Required: {item.tier}
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