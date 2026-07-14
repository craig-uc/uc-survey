"use client";

import React from "react";
import Link from "next/link";
import { ProfileEntry } from "./ProfileEntry";

export interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

interface BreadcrumbBarProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbBar = ({ items }: BreadcrumbBarProps) => {
  return (
    <div className="w-full bg-dark/10 backdrop-blur-sm border-b border-light/5 py-2 px-6 flex items-center justify-between">
      <nav className="flex items-center" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <span className="text-light/30 mx-2 text-xs font-light">/</span>
              )}
              <Link
                href={item.href}
                className={`text-xs font-custom tracking-wider uppercase transition-colors ${
                  item.active
                    ? "text-primary font-bold"
                    : "text-light/60 hover:text-light"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <ProfileEntry />
    </div>
  );
};
