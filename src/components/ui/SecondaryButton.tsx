import React, { ReactNode } from "react";

type Size = "sm" | "md" | "lg";
type BorderColor = "teal" | "white";

interface SecondaryButtonProps {
  children: ReactNode;
  className?: string;
  size?: Size;
  disabled?: boolean;
  /** If provided, renders an <a>; otherwise a <button> */
  href?: string;
  /** open href in new tab */
  external?: boolean;
  /** for dark background contexts */
  darkBg?: boolean;
  /** border color style */
  borderColor?: BorderColor;
  /** optional click handler (works for both <a> and <button>) */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
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
}: SecondaryButtonProps) {
  const sizeStyles: Record<Size, string> = {
    sm: "px-6 py-2 !text-sm",
    md: "px-8 py-3 !text-lg",
    lg: "px-12 py-5 !text-xl",
  };

  // Mirrors your provided styles
  const colorStyles =
    borderColor === "white"
      ? `
      text-blanco
      border-blanco
      hover:border-blanco
      hover:text-blanco
      hover:bg-blanco/10
      focus:ring-blanco/30
    `
      : darkBg
      ? `
      text-blanco
      border-blanco/30
      hover:border-blanco
      hover:text-blanco
      hover:bg-blanco/10
      focus:ring-blanco/30
    `
      : `
      text-grafito
      border-hielo
      hover:border-teal
      hover:text-teal
      hover:bg-teal/5
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
