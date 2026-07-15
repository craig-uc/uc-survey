"use client";

import { useRef, useState } from "react";
import GlassPanel from "@/components/GlassPanel";
import { AuthFlow, AuthFlowHandle, AuthStep } from "@/features/auth";

const page = "auth";
const version = "1";

export default function AuthPage() {
  const authRef = useRef<AuthFlowHandle>(null);
  const [step, setStep] = useState<AuthStep>("login");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen">
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
            onSignInSuccess={(data) => {
              // store session, redirect
            }}
            onSignInError={() => {
              // clear session, redirect
            }}
          />
        </div>
      </GlassPanel>
    </div>
  );
}
