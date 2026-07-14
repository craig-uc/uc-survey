export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  pattern?: RegExp;
}

export interface StandardInputProps {
  type?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  validation?: ValidationRules;
  maxLength?: number;
  className?: string;
}
