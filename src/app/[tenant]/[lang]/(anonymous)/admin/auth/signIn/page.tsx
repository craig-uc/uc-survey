"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import GlassPanel from "@/components/GlassPanel";
import { AuthFlow, useApplySession } from "@/features/auth";

function SignInContent() {
  const code = useSearchParams().get("token") || "NoCode";
  const router = useRouter();
  const { tenant, lang } = useParams<{ tenant: string; lang: string }>();
  const applySession = useApplySession();

  return (
    <GlassPanel showTitle>
      <div className="min-h-full flex items-center justify-center">
        <AuthFlow
          code={code}
          tenantCode={tenant}
          lang={lang}
          onSignInSuccess={(data) => {
            applySession(data);
            router.push(`/${tenant}/${lang}/home`);
          }}
          onSignInError={() => {
            router.push(`/${tenant}/${lang}/admin/auth`);
          }}
        />
      </div>
    </GlassPanel>
  );
}

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Suspense>
        <SignInContent />
      </Suspense>
    </div>
  );
}
