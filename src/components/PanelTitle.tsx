"use client";

import Image, { StaticImageData } from "next/image";
import {Suspense, useEffect, useState} from "react";
import { useGlobalState } from "@/app/context/GlobalStateContext";

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

export default function PanelTitle({tenant}: {tenant?: string}) {
  const { lang, isHydrated } = useGlobalState();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    fetch(`/api/app-data/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ language: lang ?? "en", type: "title" }),
    })
      .then((r) => r.json())
      .then((data: { message: string }) => setName(data.message))
      .catch(() => {});
  }, [lang, isHydrated]);

  const image = SYSTEM_IMAGES[tenant ?? "dark"] ?? darkImg;

  return (
    <Suspense fallback={<div><h1>Game On</h1></div>}>
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
    </Suspense>
  );
}
