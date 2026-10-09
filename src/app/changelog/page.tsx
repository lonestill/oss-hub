import { ChangelogContent } from "@/components/ChangelogContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog | История обновлений платформы OSS Hub",
  description:
    "Хронология релизов, новых модулей, архитектурных доработок и исправлений безопасности платформы OSS Hub.",
};

export default function ChangelogPage() {
  return <ChangelogContent />;
}
