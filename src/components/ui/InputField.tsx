"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";

interface InputFieldProps {
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  value?: string;
}

export interface InputFieldHandle {
  validate: () => boolean;
}

const InputField = forwardRef<InputFieldHandle, InputFieldProps>((
  {
    label,
    type = "text",
    name,
    placeholder = "",
    required = false,
    onChange,
    value: controlledValue,
  },
  ref
) => {
  const [internalValue, setInternalValue] = useState("");
  const [error, setError] = useState("");

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const validate = (val: string = value) => {
    if (required && val.trim() === "") {
      setError(`${label} is required`);
      return false;
    }
    setError("");
    return true;
  };

  useImperativeHandle(ref, () => ({
    validate: () => validate(value),
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(val);
    }

    validate(val);

    if (onChange) onChange(val);
  };

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-light mb-1"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 bg-light/70 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-dark transition-colors ${
          error ? "border-danger" : "border-info/10"
        }`}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
});

InputField.displayName = "InputField";

export default InputField;
