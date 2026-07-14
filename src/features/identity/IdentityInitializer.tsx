"use client";

import { useEffect } from "react";

export default function IdentityInitializer() {
  useEffect(() => {
    if (!localStorage.getItem("identifier")) {
      const user = localStorage.getItem("user");
      localStorage.setItem("identifier", user ?? `anon_${crypto.randomUUID()}`);
    }
  }, []);
  return null;
}
