"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TIER_COLORS, TIER_BENEFITS } from "@/lib/tiers";
import { LogIn, UserPlus, User, Settings, LogOut, Store, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale, useTranslations } from "@/contexts/TranslationContext";
import { useState } from "react";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const locale = useLocale();
  const { t } = useTranslations();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={`/${locale}`} className="flex-shrink-0 flex items-center space-x-2">
              <Store className="h-8 w-8 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-primary">BroJam</h1>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link href={`/${locale}/marketplace`} className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                  {t('nav.marketplace')}
                </Link>
                <Link href={`/${locale}/my-items`} className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                  {t('nav.myItems')}
                </Link>
                <Link href={`/${locale}/requests`} className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                  {t('nav.requests')}
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            {user ? (
              <>
                {profile && <Badge className={TIER_COLORS[profile.tier]}>{TIER_BENEFITS[profile.tier].name}</Badge>}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                        <AvatarFallback>{profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/dashboard`} className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {t('nav.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/profile`} className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        {t('nav.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('nav.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild size="sm">
                  <Link href={`/${locale}/auth`}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('nav.signIn')}
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/${locale}/auth`}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('nav.getStarted')}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-3 py-3 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {profile?.full_name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {profile && (
                        <Badge className={`${TIER_COLORS[profile.tier]} text-xs mt-1`}>
                          {TIER_BENEFITS[profile.tier].name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <Link
                    href={`/${locale}/marketplace`}
                    className="block px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.marketplace')}
                  </Link>
                  <Link
                    href={`/${locale}/my-items`}
                    className="block px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.myItems')}
                  </Link>
                  <Link
                    href={`/${locale}/requests`}
                    className="block px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.requests')}
                  </Link>
                  <Link
                    href={`/${locale}/dashboard`}
                    className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="mr-3 h-5 w-5" />
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    href={`/${locale}/profile`}
                    className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    {t('nav.profile')}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    {t('nav.signOut')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/auth`}
                    className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="mr-3 h-5 w-5" />
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    href={`/${locale}/auth`}
                    className="flex items-center px-3 py-3 text-base font-medium text-primary hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserPlus className="mr-3 h-5 w-5" />
                    {t('nav.getStarted')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
