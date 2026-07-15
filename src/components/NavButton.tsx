"use client";

import { useRouter } from "next/navigation";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useTenant } from "@/features/tenant";
import { StandardButton } from "@/features/standard-button";

interface NavButtonProps {
  type: string;
  label: string;
  href: string;
  style?: "primary" | "secondary" | string;
  position?: "center" | "left" | "right";
  onClick?: () => Promise<boolean | void> | boolean | void;
  loading?: boolean;
}

const BASE = "px-6 py-2 rounded-full font-medium transition-colors cursor-pointer uppercase tracking-wide";

const STYLE_CLASSES: Record<string, string> = {
  primary: "bg-primary text-on-primary hover:bg-on-primary hover:text-primary",
  secondary: "bg-secondary text-on-secondary hover:bg-on-secondary hover:text-secondary",
};

function defaultStyle(type: string): string {
  return type === "submit" ? "primary" : "secondary";
}

export default function NavButton({ type, label, href, style, onClick, loading }: NavButtonProps) {
  const { tenantCode } = useTenant();
  const { lang } = useGlobalState();
  const router = useRouter();

  const effectiveStyle = style ?? defaultStyle(type);
  const styleClass = STYLE_CLASSES[effectiveStyle] ?? effectiveStyle;

  const handleClick = async () => {
    if (onClick) {
      const result = await onClick();
      if (result === false) return;
    }
    router.push(href);
  };

  return (
    <StandardButton
      label={label}
      lang={lang ?? "en"}
      tenantCode={tenantCode ?? ""}
      application={process.env.NEXT_PUBLIC_APPLICATION ?? ""}
      onClick={handleClick}
      className={`${BASE} ${styleClass}`}
      loading={loading}
    />
  );
}
