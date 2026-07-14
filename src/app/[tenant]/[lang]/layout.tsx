import { Suspense } from "react";
import LangInitializer from "./LangInitializer";
import LangGuard from "./LangGuard";

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string; lang: string }>;
}) {
  const { tenant, lang } = await params;
  return (
    <>
      <Suspense fallback={null}>
        <LangInitializer lang={lang} />
      </Suspense>
      <Suspense fallback={null}>
        <LangGuard tenant={tenant} urlLang={lang} />
      </Suspense>
      {children}
    </>
  );
}
