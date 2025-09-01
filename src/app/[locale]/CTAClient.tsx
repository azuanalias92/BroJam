"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "@/contexts/TranslationContext";
import { useLocale } from "@/contexts/TranslationContext";

export function CTAClient() {
  const { user } = useAuth();
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <>
      {!user && (
        <Button asChild size="lg" className="text-lg px-8">
          <Link href={`/${locale}/auth`}>
            {t("cta.joinToday")} <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      )}
    </>
  );
}
