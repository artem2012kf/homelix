import type { Room } from "@/types/apartment";

export function RoomInfo({ room }: { room?: Room }) {
  if (!room) {
    return (
      <aside className="room-panel empty-panel">
        <h3>Выберите комнату</h3>
        <p className="muted">Наведите курсор или нажмите на зону планировки, чтобы увидеть описание.</p>
      </aside>
    );
  }

  return (
    <aside className="room-panel">
      <span className="eyebrow">Выбранная зона</span>
      <h3>{room.name}</h3>
      <p>{room.description}</p>
      <div className="room-area-large">{room.area} м²</div>
      <h4>Что можно разместить</h4>
      <ul className="nice-list">
        {room.furnitureTips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </aside>
  );
}
