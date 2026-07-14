"use client";

import { forwardRef, useEffect, useState } from "react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useTenant } from "@/features/tenant";
import type { StandardInputProps } from "./types";

export const StandardInput = forwardRef<HTMLInputElement, StandardInputProps>((
  { type = "text", label, name, placeholder, required, value: valueProp, onChange, validation, maxLength, className },
  ref
) => {
  const { lang, isHydrated } = useGlobalState();
  const { tenantCode } = useTenant();

  const [inputValue, setInputValue] = useState(valueProp ?? "");
  const [displayLabel, setDisplayLabel] = useState(label);
  const [displayPlaceholder, setDisplayPlaceholder] = useState(placeholder ?? "");
  const [errorType, setErrorType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hydrate from localStorage on mount only when no value prop is provided
  useEffect(() => {
    if (valueProp !== undefined) return;
    const stored = localStorage.getItem(name);
    if (stored !== null) {
      setInputValue(stored);
      onChange?.(stored);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch translated label
  useEffect(() => {
    if (!isHydrated) return;
    fetch("/api/standard-input/field", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, language: lang ?? "en", tenant_code: tenantCode }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { message: string } | null) => {
        if (data?.message) setDisplayLabel(data.message);
      })
      .catch(() => {});
  }, [isHydrated, lang, tenantCode, label]);

  // Fetch translated placeholder
  useEffect(() => {
    if (!placeholder || !isHydrated) return;
    fetch("/api/standard-input/field", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: placeholder, language: lang ?? "en", tenant_code: tenantCode }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { message: string } | null) => {
        if (data?.message) setDisplayPlaceholder(data.message);
      })
      .catch(() => {});
  }, [isHydrated, lang, tenantCode, placeholder]);

  // Fetch translated error message when errorType changes
  useEffect(() => {
    if (!errorType) {
      setErrorMessage(null);
      return;
    }
    if (!isHydrated) return;
    fetch("/api/standard-input/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: errorType, language: lang ?? "en", tenant_code: tenantCode }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { message: string } | null) => {
        setErrorMessage((data?.message ?? "").trim() || errorType);
      })
      .catch(() => {
        setErrorMessage(errorType);
      });
  }, [errorType, isHydrated, lang, tenantCode]);

  const validate = (val: string): string | null => {
    const isRequired = required || validation?.required;
    if (isRequired && val.trim() === "") return "required";
    if (maxLength !== undefined && val.length > maxLength) return "max_length";
    if (validation?.minLength !== undefined && val.length < validation.minLength) return "min_length";
    if (validation?.pattern && !validation.pattern.test(val)) return "invalid_format";
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange?.(val);
  };

  const handleBlur = () => {
    localStorage.setItem(name, inputValue);
    setErrorType(validate(inputValue));
  };

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-light mb-1">
        {displayLabel}
      </label>
      <input
        ref={ref}
        id={name}
        name={name}
        type={type}
        placeholder={displayPlaceholder}
        value={inputValue}
        maxLength={maxLength}
        required={required}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 bg-light/70 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-dark transition-colors ${
          errorMessage ? "border-danger" : "border-info/10"
        }${className ? ` ${className}` : ""}`}
      />
      {errorMessage && <p className="mt-1 text-sm text-danger">{errorMessage}</p>}
    </div>
  );
});

StandardInput.displayName = "StandardInput";
