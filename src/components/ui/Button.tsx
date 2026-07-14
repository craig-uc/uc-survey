"use client"; // Required for interactive components in Next.js App Router

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // Text to display
  variant?: "primary" | "secondary"; // Button variant
}

const Button: React.FC<ButtonProps> = ({
  label,
  type = "button",
  variant,
  disabled = false,
  className = "",
  ...props
}) => {
  // Determine variant based on variant prop or type
  const activeVariant = variant || (type === "submit" ? "primary" : "secondary");

  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors font-bold float-right text-sm uppercase tracking-widest";

  const variantStyles = {
    primary: "bg-primary text-on-primary hover:bg-on-primary hover:text-primary hover:border-1 hover:border-primary",
    secondary: "bg-secondary text-on-secondary hover:bg-on-secondary hover:text-secondary hover:border-1 hover:border-secondary",
  };

  const disabledStyles = "bg-gray-400 cursor-not-allowed";

  const combinedClassName = [
    baseStyles,
    disabled ? disabledStyles : variantStyles[activeVariant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      disabled={disabled}
      className={combinedClassName}
      {...props}
    >
      {label}
    </button>
  );
};

export default Button;
