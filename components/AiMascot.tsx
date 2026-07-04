import type { Room } from "@/types/apartment";

export function AiMascot({ room, isThinking }: { room?: Room; isThinking?: boolean }) {
  return (
    <div className="mascot-wrap" aria-live="polite">
      <div className={`mascot ${isThinking ? "mascot-thinking" : ""}`}>
        <div className="mascot-face">
          <span className="eye" />
          <span className="eye" />
        </div>
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
