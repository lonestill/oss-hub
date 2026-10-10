import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    role?: string;
    lang?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function ContributorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const targetTab = params.tab === "projects" ? "looking" : "devs";
  const searchParamsObj = new URLSearchParams();
  searchParamsObj.set("tab", targetTab);
  if (params.role) searchParamsObj.set("role", params.role);
  if (params.lang) searchParamsObj.set("lang", params.lang);
  if (params.status) searchParamsObj.set("status", params.status);
  if (params.search) searchParamsObj.set("search", params.search);

  redirect(`/?${searchParamsObj.toString()}`);
}
