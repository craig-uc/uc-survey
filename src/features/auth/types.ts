export interface AuthAppSettings {
  show_tag_line: boolean;
  show_footer: boolean;
  show_menu: boolean;
  show_person_name: boolean;
  show_user_name: boolean;
  first_name: string;
  full_name: string;
  known_as: string;
  last_name: string;
  tag_line: string;
  application_title: string;
}

export interface AuthSessionData {
  user: string;
  tenant_code: string;
  app_settings: AuthAppSettings;
}

import React from "react";

export interface AuthFlowHandle {
  submitLogin: () => Promise<false>;
}

export interface AuthFlowProps {
  code?: string;
  tenantCode?: string;
  logo?: React.ReactNode;
  hideLoginButton?: boolean;
  onSignInSuccess?: (data: AuthSessionData) => void;
  onSignInError?: () => void;
}
