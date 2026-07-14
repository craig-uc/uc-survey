import { Suspense } from "react";
import TenantInitializer from "./TenantInitializer";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return (
    <>
      <Suspense fallback={null}>
        <TenantInitializer tenant={tenant} />
      </Suspense>
      {children}
    </>
  );
}

export async function generateStaticParams() {
  return [{tenant: "dpw-gbl", lang: "en"}]
}
