import { Badge } from '@/components/ui/badge'
import { TIER_COLORS, ITEM_TIER_INFO, ItemTier } from '@/lib/tiers'

interface ItemTierBadgeProps {
  tier: ItemTier
  className?: string
}

export function ItemTierBadge({ tier, className }: ItemTierBadgeProps) {
  const tierInfo = ITEM_TIER_INFO[tier]
  
  return (
    <Badge 
      className={`${TIER_COLORS[tier]} ${className}`}
      title={tierInfo.description}
    >
      {tierInfo.name}
    </Badge>
  )
}