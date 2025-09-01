"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "@/contexts/TranslationContext";

export function HomeClient() {
  const { user } = useAuth();
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {user ? (
        <>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href={`/${locale}/marketplace`}>
              {t("hero.browseMarketplace")} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href={`/${locale}/dashboard`}>{t("hero.myDashboard")}</Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href={`/${locale}/auth`}>
              {t("hero.getStarted")} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href={`/${locale}/marketplace`}>{t("hero.exploreItems")}</Link>
          </Button>
        </>
      )}
    </div>
  );
}
