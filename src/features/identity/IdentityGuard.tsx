"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function IdentityGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("identifier")) {
      setReady(true);
    } else {
      const tenant = params?.tenant as string | undefined;
      router.replace(tenant ? `/${tenant}` : "/");
    }
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
