import Image from "next/image";

export function MascotLogo() {
  return (
    <Image
      src="/images/mascot.png"
      alt=""
      width={44}
      height={44}
      priority
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "contain"
      }}
    />
  );
}
