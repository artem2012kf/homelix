import { MascotImage } from "@/components/MascotImage";

export function MascotLogo() {
  return (
    <MascotImage
      width={44}
      priority
      style={{
        width: "100%",
        height: "100%"
      }}
    />
  );
}
