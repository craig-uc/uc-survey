"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function AdminLayout({
                                       children,
                                     }: {
  children: React.ReactNode;
}) {
  const { user, isHydrated } = useGlobalState();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/");
    }
  }, [user, isHydrated, router]);

  // Prevent flashing of protected content while checking authentication
  if (!isHydrated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="grow">
        {children}
      </main>
      <Footer />
    </>
  );
}
