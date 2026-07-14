export type LogoutVariant = "button" | "link" | "menu";

export interface LogoutButtonProps {
  variant?: LogoutVariant;
  label?: string;
  style?: string;
  className?: string;
}
