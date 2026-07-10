import { MascotImage } from "@/components/MascotImage";
import type { Room } from "@/types/apartment";

export function AiMascot({ room, isThinking }: { room?: Room; isThinking?: boolean }) {
  return (
    <div className="mascot-wrap" aria-live="polite">
      <div
        aria-hidden="true"
        style={{
          display: "grid",
          width: 74,
          minHeight: 92,
          placeItems: "center",
          filter: isThinking ? "drop-shadow(0 18px 26px rgba(249, 62, 62, 0.28))" : "drop-shadow(0 14px 22px rgba(0, 59, 166, 0.18))",
          animation: "mascotFloat 3.2s ease-in-out infinite"
        }}
      >
        <MascotImage width={68} style={{ width: 68, height: "auto" }} />
      </div>
      <div className="mascot-bubble">
        {isThinking ? (
          <span>Анализирую данные квартиры...</span>
        ) : room ? (
          <span>
            Вы выбрали <strong>{room.name.toLowerCase()}</strong>, {room.area} м². Могу проконсультировать по возможному использованию помещения.
          </span>
        ) : (
          <span>Наведите курсор на комнату, чтобы получить консультацию по ее возможному использованию.</span>
        )}
      </div>
    </div>
  );
}
