"use client";

import { usePathname } from "next/navigation";
import React from "react";

export function AppLayoutShell({
  navbar,
  children,
}: {
  navbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCrm = Boolean(pathname?.includes("/crm"));

  if (isCrm) {
    return (
      <div className="min-h-screen w-full bg-[#090b10] flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <>
      {navbar}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </>
  );
}
