import React, { ReactNode } from "react";

type Size = "sm" | "md" | "lg";
type BgColor = "teal" | "white";

interface PrimaryButtonProps {
  children: ReactNode;
  className?: string;
  size?: Size;
  disabled?: boolean;
  /** If provided, renders an <a>; otherwise a <button> */
  href?: string;
  /** open href in new tab */
  external?: boolean;
  /** background color style */
  bgColor?: BgColor;
  /** optional click handler (works for both <a> and <button>) */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

export default function PrimaryButton({
  children,
  className = "",
  size = "md",
  disabled = false,
  href,
  external = false,
  bgColor = "teal",
  onClick,
}: PrimaryButtonProps) {
  const sizeStyles: Record<Size, string> = {
    sm: "px-6 py-2 !text-sm",
    md: "px-8 py-3 !text-lg",
    lg: "px-12 py-5 !text-xl",
  };

  const colorStyles =
    bgColor === "white"
      ? `
      bg-blanco
      text-teal
      hover:bg-blanco/90
      hover:text-teal/90
    `
      : `
      bg-teal
      text-blanco
      hover:bg-teal/90
    `;

  const baseStyles = `
    ${sizeStyles[size]}
    ${colorStyles}
    !font-bold
    rounded-lg
    cursor-pointer
    shadow-md
    hover:-translate-y-1
    hover:shadow-lg        
    focus:outline-none
    transition-all
    duration-300
    inline-flex
    text-nowrap
    items-center
    justify-center
    gap-2
    disabled:opacity-50
    disabled:cursor-not-allowed
  `;

  const classes = `${baseStyles} ${className}`.trim();

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-disabled={disabled || undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <button disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
