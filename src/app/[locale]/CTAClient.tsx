'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function CTAClient() {
  const { user } = useAuth()
  const t = useTranslations()

  return (
    <>
      {!user && (
        <Button asChild size="lg" className="text-lg px-8">
          <Link href="/auth">
            {t('home.cta.joinToday')} <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      )}
    </>
  )
}