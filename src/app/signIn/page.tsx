"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GlassPanel from "@/components/GlassPanel";
import { AuthFlow, useApplySession } from "@/features/auth";

function SignInContent() {
  const code = useSearchParams().get("token") || "NoCode";
  const router = useRouter();
  const applySession = useApplySession();

  return (
    <GlassPanel showTitle>
      <div className="min-h-full flex items-center justify-center">
        <AuthFlow
          code={code}
          tenantCode="urup"
          lang="en"
          onSignInSuccess={(data) => {
            applySession(data);
            router.push("/admin/home");
          }}
          onSignInError={() => {
            router.push("/");
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
