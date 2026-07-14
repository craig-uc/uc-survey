"use client";

import React from "react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useTenant } from "@/features/tenant";
import { DynamicImage } from "@/components/ui/DynamicImage";
import { useTheme } from "next-themes";

import { LogoutButton } from "@/features/logout";

export const Header = () => {
  const { user } = useGlobalState();
  const { tenant } = useTenant();
  const { theme } = useTheme();

  // Determine the account/folder name for the logo
  // If tenant is set, use it; otherwise use the current theme; fallback to 'dark'
  const account = tenant || theme || "dark";
  const appTitle = localStorage.getItem("title") || "UC Survey";

  if (!user) {
    return null;
  }
  return (
    <header className="w-full bg-dark/20 backdrop-blur-md border-b border-light/10 py-4 px-6 flex items-center justify-between top-0 z-50">
      <div className="flex items-center gap-4">
        <DynamicImage
          account={account}
          imageName="system-image.webp"
          alt="Logo"
          height={40}
          className="object-contain shadow-none! rounded-none!"
        />
        <span className="text-xl font-bold text-light font-custom tracking-wider">
          {appTitle}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <LogoutButton />
      </div>
    </header>
  );
};
