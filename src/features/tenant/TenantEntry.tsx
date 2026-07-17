"use client";

import { useRouter } from "next/navigation";
import { useTenant } from "./useTenant";
import { Tenant } from "./types";

interface TenantEntryProps {
  tenant: Tenant;
}

export default function TenantEntry({ tenant }: TenantEntryProps) {
  const { setTenant } = useTenant();
  const router = useRouter();

  function handleClick() {
    setTenant(tenant.slug);
    router.push("/admin/surveys");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group bg-dark/40 backdrop-blur-sm border border-light/10 rounded-xl p-4 text-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col items-center justify-center min-h-[100px]"
    >
      <h3 className="text-sm font-bold text-light group-hover:text-primary transition-colors line-clamp-2">
        {tenant.name}
      </h3>
    </button>
  );
}
