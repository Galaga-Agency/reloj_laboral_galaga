import React, { ReactNode } from "react";

type Size = "sm" | "md" | "lg";
type BorderColor = "teal" | "white";

interface SecondaryButtonProps {
  children: ReactNode;
  className?: string;
  size?: Size;
  disabled?: boolean;
  href?: string;
  external?: boolean;
  darkBg?: boolean;
  borderColor?: BorderColor;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  style?: React.CSSProperties;
}

export default function SecondaryButton({
  children,
  className = "",
  size = "md",
  disabled = false,
  href,
  external = false,
  darkBg = false,
  borderColor = "teal",
  onClick,
  style,
}: SecondaryButtonProps) {
  const sizeStyles: Record<Size, string> = {
    sm: "px-6 py-2 !text-sm",
    md: "px-8 py-3 !text-lg",
    lg: "px-12 py-5 !text-xl",
  };

  const colorStyles =
    borderColor === "white"
      ? `
      text-white
      border-white
      hover:border-white
      hover:text-white
      hover:bg-white/10
      focus:ring-white/30
    `
      : `
      text-teal
      border-teal/30
      hover:border-teal
      hover:text-teal
      hover:bg-teal/10
      focus:ring-teal/30
    `;

  const baseStyles = `
    ${sizeStyles[size]}
    ${colorStyles}
    !font-bold
    rounded-xl
    bg-transparent
    border-2
    shadow-md
    hover:-translate-y-1
    hover:shadow-lg
    focus:outline-none
    focus:ring-4
    text-nowrap
    transition-all
    duration-300
    transform
    cursor-pointer
    active:scale-95
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:transform-none
    inline-flex
    items-center
    justify-center
    gap-2
  `;

  const classes = `${baseStyles} ${className}`.trim();

  if (href) {
    return (
      
       <a href={href}
        className={classes}
        onClick={onClick}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-disabled={disabled || undefined}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <button disabled={disabled} onClick={onClick} className={classes} style={style}>
      {children}
    </button>
  );
}