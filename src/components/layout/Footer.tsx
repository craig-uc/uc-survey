"use client";

import React from "react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import Link from "next/link";

export interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  links?: FooterLink[];
  copyright?: string;
  poweredBy?: string;
  tagline?: string;
}

export const Footer = ({
  links = [],
  copyright = `© ${new Date().getFullYear()} U·R·UP Connect`,
  poweredBy = `Powered by U·R·UP Connect`,
  tagline = "simab chips",
}: FooterProps) => {
  const { user, showFooter, showTag } = useGlobalState();

  if (!user || !showFooter) {
    return null;
  }

  const tagLineEntry = localStorage.getItem("tag") || tagline;

  return (
    <footer className="w-full bg-dark/20 backdrop-blur-md border-t border-light/10 py-6 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Copyright and Links */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-xs text-light/50 font-custom tracking-wider uppercase">
              {poweredBy}
            </span>
            <span className="text-xs text-light/50 font-custom tracking-wider uppercase">
              {copyright}
            </span>
          </div>

          {links.length > 0 && (
            <nav className="flex items-center gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-light/60 hover:text-light transition-colors font-custom uppercase tracking-widest"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Tagline */}
        <div className="text-right">
          <p className="text-xs text-light/50 italic font-custom tracking-wider uppercase">
            {showTag ? tagLineEntry : ''}
          </p>
        </div>
      </div>
    </footer>
  );
};
