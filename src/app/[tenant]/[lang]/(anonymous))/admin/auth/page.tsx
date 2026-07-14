"use client";

import { useRef } from "react";
import GlassPanel from "@/components/GlassPanel";
import { AuthFlow, AuthFlowHandle } from "@/features/auth";

const page = "auth";
const version = "1";

export default function AuthPage() {
  const authRef = useRef<AuthFlowHandle>(null);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <GlassPanel
        showTitle
        navigation={{
          buttons: [
            { type: "submit", label: "Login", href: "#", onClick: () => authRef.current?.submitLogin() },
          ],
        }}
      >
        <div className="min-h-full flex items-center justify-center">
          <AuthFlow
            ref={authRef}
            hideLoginButton
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
