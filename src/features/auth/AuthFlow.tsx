"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import Button from "@/components/ui/Button";
import { StandardInput } from "@/features/standard-input";
import { AuthFlowProps, AuthFlowHandle, AuthSessionData, AuthStep } from "./types";

const LOGIN_API = "/api/auth/login";
const SIGNIN_API = "/api/auth/signin";

const AuthFlow = forwardRef<AuthFlowHandle, AuthFlowProps>(function AuthFlow(
  {
    code,
    tenantCode,
    lang,
    logo,
    hideLoginButton = false,
    onSignInSuccess,
    onSignInError,
    onStepChange,
    onSubmittingChange,
  },
  ref
) {
  const [step, setStep] = useState<AuthStep>(code ? "signing-in" : "login");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const hasSignedIn = useRef(false);

  useEffect(() => {
    if (code && !hasSignedIn.current) {
      hasSignedIn.current = true;
      performSignIn(code);
    }
  }, [code]);

  useEffect(() => {
    onStepChange?.(step);
  }, [step]);

  useEffect(() => {
    onSubmittingChange?.(status === "Submitting...");
  }, [status]);

  const performSignIn = async (authCode: string) => {
    try {
      const res = await fetch(SIGNIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode, tenantCode, lang }),
      });
      const data = await res.json();
      if (res.ok) {
        onSignInSuccess?.(data as AuthSessionData);
      } else {
        onSignInError?.();
      }
    } catch {
      onSignInError?.();
    }
  };

  const submitLogin = async (): Promise<false> => {
    if (status === "Submitting...") return false;
    if (!email.trim()) return false;

    setStatus("Submitting...");
    try {
      const basePath = window.location.pathname.endsWith("/")
        ? window.location.pathname.slice(0, -1)
        : window.location.pathname;
      const redirectUrl = `${window.location.origin}${basePath}/signIn`;

      const res = await fetch(LOGIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tenantCode, redirectUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(null);
        setEmail("");
        setStep("sent");
      } else {
        setStatus(`Error: ${data.error || res.statusText}`);
      }
    } catch {
      setStatus("Network error. Please try again.");
    }
    return false;
  };

  useImperativeHandle(ref, () => ({ submitLogin }));

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitLogin();
  };

  const handleFormKeyDown = async (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    await submitLogin();
  };

  const isSubmitting = status === "Submitting...";

  return (
    <div className="flex flex-col items-start gap-4 md:w-[75%] sm:w-full">

      {logo && <div className="mb-2">{logo}</div>}

      {step === "login" && (
        <>
          <h2 className="text-start text-2xl font-bold leading-9 tracking-tight text-primary">
            Sign into your account
          </h2>
          {status && !isSubmitting && (
            <p
              className={`text-start text-sm ${
                status.startsWith("Error") || status.startsWith("Network")
                  ? "text-danger"
                  : "text-dark"
              }`}
            >
              {status}
            </p>
          )}
          <form
            className="w-full space-y-6"
            onSubmit={handleSubmit}
            onKeyDown={handleFormKeyDown}
            method="POST"
          >
            <StandardInput
              ref={emailRef}
              label="email"
              name="email"
              type="email"
              placeholder="emailPlaceholder"
              required
              onChange={setEmail}
            />
            {!hideLoginButton && (
              <Button
                label={isSubmitting ? "Logging in..." : "Login"}
                type="submit"
                disabled={isSubmitting}
              />
            )}
          </form>
        </>
      )}

      {step === "sent" && (
        <>
          <p className="pt-5">An email with the login link has been sent to your email address.</p>
          <p>Please check your inbox.</p>
          <p>You can close this page</p>
        </>
      )}

      {step === "signing-in" && (
        <>
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
            role="status"
          >
            <span className="absolute! -m-px! h-px! w-px! overflow-hidden! whitespace-nowrap! border-0! p-0! [clip:rect(0,0,0,0)]!">
              Loading...
            </span>
          </div>
          <p>Finalizing...</p>
        </>
      )}
    </div>
  );
});

export default AuthFlow;
