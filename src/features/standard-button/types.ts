export interface StandardButtonProps {
  label: string;
  lang: string;
  tenantCode: string;
  application: string;
  onClick: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}
