import { notFound } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import fs from 'fs';
import path from 'path';

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

async function getMessages(locale: string) {
  try {
    const messagesPath = path.join(process.cwd(), 'src', 'messages', `${locale}.json`);
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    return messages;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    return {};
  }
}

export default async function LocaleLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  const locales = ["en", "ms"];
  if (!locales.includes(locale)) {
    notFound();
  }

  // Load messages for the locale
  const messages = await getMessages(locale);

  return (
    <ThemeProvider>
      <TranslationProvider locale={locale} translations={messages}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </TranslationProvider>
    </ThemeProvider>
  );
}
