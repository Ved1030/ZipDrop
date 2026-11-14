"use client";

import { forwardRef } from "react";

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
  showText?: boolean;
}

export const BrandLogo = forwardRef<HTMLImageElement, BrandLogoProps>(
  ({ size = 40, showText = false, className, style, ...props }, ref) => {
    const logoStyle: React.CSSProperties = {
      width: size,
      height: size,
      objectFit: "contain",
      display: "block",
      ...style,
    };

    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: showText ? 10 : 0 }}>
        <img
          ref={ref}
          src="/favicon.ico"
          alt="ZipDrop"
          width={size}
          height={size}
          style={logoStyle}
          className={className}
          {...props}
        />
        {showText && (
          <span style={{ fontSize: size * 0.55, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            ZipDrop
          </span>
        )}
      </span>
    );
  }
);

BrandLogo.displayName = "BrandLogo";

export default BrandLogo;