"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  value?: string;
}

export interface SelectFieldHandle {
  validate: () => boolean;
}

const SelectField = forwardRef<SelectFieldHandle, SelectFieldProps>((
  {
    label,
    name,
    options,
    placeholder = "Select an option",
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
    if (required && (val === "" || val === undefined)) {
      setError(`${label} is required`);
      return false;
    }
    setError("");
    return true;
  };

  useImperativeHandle(ref, () => ({
    validate: () => validate(value),
  }));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
        className="block text-sm font-medium text-light/70 mb-1"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 bg-dark/20 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-light transition-colors ${
          error ? "border-danger" : "border-light/10"
        } appearance-none cursor-pointer`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff80' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: `right 0.5rem center`,
          backgroundSize: `1.5em 1.5em`,
          backgroundRepeat: `no-repeat`,
          paddingRight: `2.5rem`
        }}
      >
        <option value="" disabled className="bg-dark text-light/50">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-dark text-light">
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
});

SelectField.displayName = "SelectField";

export default SelectField;
