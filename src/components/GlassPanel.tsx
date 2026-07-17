"use client";

import { ReactNode, useEffect, useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useTenant } from "@/features/tenant";
import NavButton from "./NavButton";

import darkImg from "@/app/assets/images/dark/system-image.webp";
import dpwApacImg from "@/app/assets/images/dpw-apac/system-image.webp";
import dpwEuImg from "@/app/assets/images/dpw-eu/system-image.webp";
import dpwGblImg from "@/app/assets/images/dpw-gbl/system-image.webp";
import nedbankImg from "@/app/assets/images/nedbank/system-image.webp";
import urupImg from "@/app/assets/images/urup/system-image.webp";

const SYSTEM_IMAGES: Record<string, StaticImageData> = {
  dark: darkImg,
  "dpw-apac": dpwApacImg,
  "dpw-eu": dpwEuImg,
  "dpw-gbl": dpwGblImg,
  nedbank: nedbankImg,
  urup: urupImg,
};

export interface ButtonConfig {
  type: string;
  label: string;
  href: string;
  show?: boolean;
  style?: "primary" | "secondary" | string;
  position?: "center" | "left" | "right";
  onClick?: () => Promise<boolean | void> | boolean | void;
  loading?: boolean;
}

export interface NavigationConfig {
  buttons: ButtonConfig[];
}

interface GlassPanelProps {
  children?: ReactNode;
  showTitle?: boolean;
  navigation?: NavigationConfig;
  layout?: "floating" | "admin";
}

function effectivePosition(btn: ButtonConfig): "left" | "center" | "right" {
  if (btn.position) return btn.position;
  if (btn.type === "back") return "left";
  return "right";
}

function Title() {
  const { tenant } = useTenant();
  const { lang, isHydrated } = useGlobalState();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated || !tenant) return;
    fetch(`/api/app-data/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant, language: lang ?? "en", type: "title" }),
    })
      .then((r) => r.json())
      .then((data: { message: string }) => setName(data.message))
      .catch(() => {});
  }, [tenant, lang, isHydrated]);

  const image = SYSTEM_IMAGES[tenant ?? "dark"] ?? darkImg;

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-4 w-full border-b border-light/20 sm:flex-row sm:items-center sm:gap-10">
      <Image
        src={image}
        alt="Title image"
        style={{ height: "5rem", width: "auto" }}
        className="object-contain"
      />
      {name && (
        <h1 className="text-4xl font-bold text-light drop-shadow-lg tracking-wide font-custom text-center sm:text-left">
          {name}
        </h1>
      )}
    </div>
  );
}

function Navigation({ buttons }: NavigationConfig) {
  const visible = buttons.filter((b) => b.show !== false);

  const left = visible.filter((b) => effectivePosition(b) === "left");
  const center = visible.filter((b) => effectivePosition(b) === "center");
  const right = [...visible.filter((b) => effectivePosition(b) === "right")].sort(
    (a, b) => (a.type === "submit" ? 1 : 0) - (b.type === "submit" ? 1 : 0)
  );

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-t border-white/20">
      <div className="flex-1 flex justify-start gap-2">
        {left.map((btn) => (
          <NavButton key={btn.type} {...btn} />
        ))}
      </div>
      <div className="flex-1 flex justify-center gap-2">
        {center.map((btn) => (
          <NavButton key={btn.type} {...btn} />
        ))}
      </div>
      <div className="flex-1 flex justify-end gap-2">
        {right.map((btn) => (
          <NavButton key={btn.type} {...btn} />
        ))}
      </div>
    </nav>
  );
}

export default function GlassPanel({
  children,
  showTitle = false,
  navigation,
  layout = "floating",
}: GlassPanelProps) {
  const isAdmin = layout === "admin";

  return (
    <div
      className={
        isAdmin
          ? "bg-white/20 backdrop-blur-sm w-full flex-1 min-h-0 flex flex-col overflow-hidden"
          : "rounded-2xl bg-white/20 backdrop-blur-sm w-[95vw] h-[95vh] md:w-[75%] md:h-[90vh] flex flex-col overflow-hidden"
      }
    >
      {showTitle && <Title />}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
        {isAdmin ? <div className="max-w-[80%] mx-auto w-full">{children}</div> : children}
      </div>
      {navigation && <Navigation {...navigation} />}
    </div>
  );
}
