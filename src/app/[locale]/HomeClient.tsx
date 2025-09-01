'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function HomeClient() {
  const { user } = useAuth()
  const t = useTranslations()

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {user ? (
        <>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/marketplace">
              {t('home.hero.browseMarketplace')} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/dashboard">
              {t('home.hero.myDashboard')}
            </Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/auth">
              {t('home.hero.getStarted')} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/marketplace">
              {t('home.hero.exploreItems')}
            </Link>
          </Button>
        </>
      )}
    </div>
  )
}