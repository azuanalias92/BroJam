'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from '@/contexts/TranslationContext'

export function HomeClient() {
  const { user } = useAuth()
  const { t } = useTranslations('home')

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {user ? (
        <>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/marketplace">
              {t('hero.browseMarketplace')} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/dashboard">
              {t('hero.myDashboard')}
            </Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/auth">
              {t('hero.getStarted')} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/marketplace">
              {t('hero.exploreItems')}
            </Link>
          </Button>
        </>
      )}
    </div>
  )
}