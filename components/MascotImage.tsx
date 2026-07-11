import Image from "next/image";
import type { CSSProperties } from "react";

type MascotImageProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  width?: number;
  style?: CSSProperties;
};

const MASCOT_RATIO = 996 / 913;

export function MascotImage({
  alt = "",
  className,
  priority = false,
  width = 96,
  style
}: MascotImageProps) {
  return (
    <Image
      src="/images/mascot-user-new.svg"
      alt={alt}
      width={width}
      height={Math.round(width * MASCOT_RATIO)}
      priority={priority}
      className={className}
      style={{ display: "block", objectFit: "contain", ...style }}
    />
  );
}
