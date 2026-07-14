"use client";

import { useState, useEffect } from "react";

export function useIdentity() {
  const [identifier, setIdentifier] = useState<string | null>(null);

  useEffect(() => {
    setIdentifier(localStorage.getItem("identifier"));
  }, []);

  return {
    identifier,
    isAnonymous: !identifier || identifier.startsWith("anon_"),
  };
}
