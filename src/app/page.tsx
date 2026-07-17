"use client";

import { useRef, useState, Suspense } from "react";
import { IdentityInitializer } from "@/features/identity";
import GlassPanel from "@/components/GlassPanel";
import { AuthFlow, AuthFlowHandle, AuthStep } from "@/features/auth";

export default function RootPage() {
  const authRef = useRef<AuthFlowHandle>(null);
  const [step, setStep] = useState<AuthStep>("login");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Suspense fallback={null}>
        <IdentityInitializer />
      </Suspense>
      <GlassPanel
        showTitle
        navigation={{
          buttons: [
            {
              type: "submit",
              label: "Login",
              href: "#",
              show: step !== "sent",
              loading: submitting,
              onClick: () => authRef.current?.submitLogin(),
            },
          ],
        }}
      >
        <div className="min-h-full flex items-center justify-center">
          <AuthFlow
            ref={authRef}
            hideLoginButton
            onStepChange={setStep}
            onSubmittingChange={setSubmitting}
          />
        </div>
      </GlassPanel>
    </div>
  );
}
