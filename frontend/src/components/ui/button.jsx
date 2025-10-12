import React from "react";

// Minimal reusable Button used across the app.
// Exports a named `Button` to match existing imports: { Button } from "@/components/ui/button"
export const Button = ({ children, className = "", variant, ...props }) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition";
  const variants = {
    outline: "bg-transparent border border-gray-500 text-gray-300",
    default: "bg-blue-600 text-white hover:bg-blue-700",
  };

  const applied = `${base} ${variant ? variants[variant] || variants.default : variants.default} ${className}`;

  return (
    <button className={applied} {...props}>
      {children}
    </button>
  );
};

export default Button;
