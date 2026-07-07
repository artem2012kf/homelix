export function MascotLogo() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "inherit",
        lineHeight: 0
      }}
    >
      <img
        src="/images/mascot.png"
        alt=""
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain"
        }}
      />
    </span>
  );
}
