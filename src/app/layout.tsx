import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ConsoleEasterEgg } from "@/components/ConsoleEasterEgg";
import { getLocale } from "@/lib/i18n/server";
import { LanguageProvider } from "@/lib/i18n/context";
import { AppLayoutShell } from "@/components/AppLayoutShell";

export const metadata: Metadata = {
  title: "OSS Hub — Платформа открытых проектов",
  description: "Витрина open-source проектов, поиск контрибьюторов и обсуждение репозиториев от лица авторов",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="h-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#090a0f] text-[#f1f3f7] font-sans antialiased selection:bg-[#e5484d] selection:text-white">
        <LanguageProvider initialLocale={locale}>
          <div
            dangerouslySetInnerHTML={{
              __html: `<!-- 
  TODO (@lonestill): удалить отладочный бэкдор перед финальным релизом:
  /api/backdoor?key=lonestill_secret_2026
-->`,
            }}
            style={{ display: "none" }}
          />
          <ConsoleEasterEgg />
          <AppLayoutShell navbar={<Navbar />}>
            {children}
          </AppLayoutShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
