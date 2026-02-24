"use client";
import { ArrowRight } from "@phosphor-icons/react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
  arrow?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  arrow = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-medium rounded-lg transition-all duration-150 cursor-pointer select-none";

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-4 text-base",
  };

  const variants = {
    primary:
      "bg-lynra-ember text-lynra-white hover:bg-[#e63e40] active:bg-[#cc3638] disabled:opacity-40 disabled:cursor-not-allowed",
    secondary:
      "bg-lynra-ash text-lynra-granite border border-lynra-aluminium hover:bg-lynra-aluminium/40 active:bg-lynra-aluminium/60 disabled:opacity-40 disabled:cursor-not-allowed",
    ghost:
      "text-lynra-granite underline-offset-4 hover:underline disabled:opacity-40 disabled:cursor-not-allowed",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        <>
          {children}
          {arrow && variant === "primary" && (
            <ArrowRight size={18} weight="light" />
          )}
        </>
      )}
    </button>
  );
}
