"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { StandardButtonProps } from "./types";

const SPINNER_KEYFRAMES = `@keyframes sb-spin{to{transform:rotate(360deg)}}`;

function Spinner() {
  return (
    <>
      <style>{SPINNER_KEYFRAMES}</style>
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        aria-hidden="true"
        style={{ display: "inline-block", verticalAlign: "middle", animation: "sb-spin 0.75s linear infinite" }}
      >
        <path d="M12 2a10 10 0 1 0 10 10" />
      </svg>
    </>
  );
}

export function StandardButton({
  label,
  lang,
  tenantCode,
  application,
  onClick,
  className,
  disabled = false,
  loading: externalLoading = false,
}: StandardButtonProps) {
  const [displayLabel, setDisplayLabel] = useState(label);
  const [clickLoading, setClickLoading] = useState(false);
  const isBusy = clickLoading || externalLoading;
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    fetch("/api/standard-button/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.toLowerCase().trim(),
        language: lang,
        tenant_code: tenantCode,
        application,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { message: string } | null) => {
        if (data?.message) setDisplayLabel(data.message);
      })
      .catch(() => {});
  }, [label, lang, tenantCode, application]);

  // Stop spinner when navigation completes — handles the case where the button
  // lives in a persistent layout and onClick triggers a route change.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setClickLoading(false);
  }, [pathname]);

  const handleClick = async () => {
    setClickLoading(true);
    try {
      await onClick();
    } catch {
      // error handling is the caller's responsibility within onClick
    } finally {
      setClickLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isBusy}
      className={className}
    >
      {isBusy ? <Spinner /> : displayLabel}
    </button>
  );
}
