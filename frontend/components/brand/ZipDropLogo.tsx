"use client";

import Image from "next/image";

export type LogoSize = "small" | "medium" | "large";

interface ZipDropLogoProps {
  size?: LogoSize;
  className?: string;
}

const SIZE_DIMENSIONS: Record<LogoSize, { width: number; height: number }> = {
  small: { width: 125, height: 48 },
  medium: { width: 190, height: 72 },
  large: { width: 320, height: 122 },
};

export default function ZipDropLogo({
  size = "medium",
  className = "",
}: ZipDropLogoProps) {
  const { width, height } = SIZE_DIMENSIONS[size];

  return (
    <Image
      src="/images/zipdrop-logo.png"
      alt="ZipDrop"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority={size === "large"}
      quality={100}
    />
  );
}