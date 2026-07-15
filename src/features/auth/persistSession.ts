import type { AuthSessionData } from "./types";

export function persistSessionToStorage({ user, app_settings }: AuthSessionData): void {
  localStorage.setItem("user", user);
  localStorage.setItem("f", app_settings.first_name);
  localStorage.setItem("l", app_settings.last_name);
  localStorage.setItem("fn", app_settings.full_name);
  localStorage.setItem("k", app_settings.known_as);
  localStorage.setItem("tagLine", app_settings.show_tag_line ? "1" : "0");
  localStorage.setItem("tag", app_settings.tag_line);
  localStorage.setItem("footer", app_settings.show_footer ? "1" : "0");
  localStorage.setItem("menu", app_settings.show_menu ? "1" : "0");
  localStorage.setItem("personName", app_settings.show_person_name ? "1" : "0");
  localStorage.setItem("title", app_settings.application_title);

  // TEMPORARY: AuthSessionData has no language field yet. Force "en" so LangGuard
  // (src/app/[tenant]/[lang]/LangGuard.tsx) never finds a stale/invalid "lang" from a
  // previous tenant/session and bounces the freshly-authenticated user to language selection.
  localStorage.setItem("lang", "en");
}
