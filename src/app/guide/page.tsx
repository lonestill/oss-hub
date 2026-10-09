import { GuideContent } from "@/components/GuideContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Руководство пользователя и мейнтейнера | OSS Hub",
  description:
    "Полное руководство по платформе OSS Hub: как находить открытые проекты, брать задачи в работу, запускать репозитории в 1 клик и управлять воронкой в Maintainer CRM.",
};

interface PageProps {
  searchParams: Promise<{
    tab?: "contributors" | "maintainers" | "faq";
  }>;
}

export default async function GuidePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialTab =
    params.tab === "maintainers" || params.tab === "faq"
      ? params.tab
      : "contributors";

  return <GuideContent initialTab={initialTab} />;
}
