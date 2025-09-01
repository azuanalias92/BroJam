'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TIER_COLORS, TIER_BENEFITS, getUserTierProgress } from '@/lib/tiers'
import { Database } from '@/lib/supabase'
import { useTranslations } from '@/contexts/TranslationContext'

type UserProfile = Database['public']['Tables']['users']['Row']

interface UserTierCardProps {
  profile: UserProfile
}

export function UserTierCard({ profile }: UserTierCardProps) {
  const t = useTranslations();
  const tierProgress = getUserTierProgress(profile.items_lent)
  const currentTierInfo = TIER_BENEFITS[profile.tier]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('tiers.yourTierStatus')}</CardTitle>
          <Badge className={TIER_COLORS[profile.tier]}>
            {t(`tiers.${profile.tier.toLowerCase()}`)}
          </Badge>
        </div>
        <CardDescription>{t(`tiers.${profile.tier.toLowerCase()}Description`)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('tiers.itemsLent')}: {profile.items_lent}</span>
            {tierProgress.nextTier && (
              <span>
                {t('tiers.next')}: {t(`tiers.${tierProgress.nextTier.toLowerCase()}`)} ({tierProgress.nextTierThreshold} {t('tiers.items')})
              </span>
            )}
          </div>
          {tierProgress.nextTier && (
            <Progress value={tierProgress.progress} className="h-2" />
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">{t('tiers.currentBenefits')}:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {currentTierInfo.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {tierProgress.nextTier && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              {t('tiers.unlockAt')} {t(`tiers.${tierProgress.nextTier.toLowerCase()}`)}:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {TIER_BENEFITS[tierProgress.nextTier].benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-gray-300 rounded-full mr-2" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {t('tiers.reputationScore')}: <span className="font-medium">{profile.reputation_score}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}