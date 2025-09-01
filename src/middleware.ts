import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ms'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Redirect to default locale when no locale is detected
  localeDetection: true,

  // Prefix strategy for locale routing
  localePrefix: 'always' // Always add locale prefix to URLs
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ms|en)/:path*']
};