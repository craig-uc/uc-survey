"use client";

import { useCallback } from "react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useTenant } from "@/features/tenant";
import { persistSessionToStorage } from "./persistSession";
import type { AuthSessionData } from "./types";

export function useApplySession() {
  const { setUser, setShowTag, setShowFooter, setShowMenu, setShowPersonName } = useGlobalState();
  const { setTenant } = useTenant();

  return useCallback(
    (data: AuthSessionData) => {
      persistSessionToStorage(data);
      setUser(data.user);
      setTenant(data.tenant_code);
      setShowTag(data.app_settings.show_tag_line);
      setShowFooter(data.app_settings.show_footer);
      setShowMenu(data.app_settings.show_menu);
      setShowPersonName(data.app_settings.show_person_name);
    },
    [setUser, setTenant, setShowTag, setShowFooter, setShowMenu, setShowPersonName]
  );
}
