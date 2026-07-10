import type { Apartment } from "@/types/apartment";
import {
  getApartmentVisualRooms,
  getPlanBounds,
  getVisualFixtures,
  getVisualWindows,
  isBalcony,
  roomFill,
  type VisualFixture
} from "@/lib/apartment-plan-visuals";

function MiniFixture({ fixture }: { fixture: VisualFixture }) {
  if (fixture.kind === "toilet") {
    return (
      <ellipse
        cx={fixture.x + fixture.width / 2}
        cy={fixture.y + fixture.height / 2}
        rx={fixture.width / 2}
        ry={fixture.height / 2}
        fill="#f7f8fa"
        stroke="#87909b"
        strokeWidth="2"
      />
    );
  }

  if (fixture.kind === "sink" || fixture.kind === "hob") {
    return (
      <rect
        x={fixture.x}
        y={fixture.y}
        width={fixture.width}
        height={fixture.height}
        rx="4"
        fill="none"
        stroke="#87909b"
        strokeWidth="2"
      />
    );
  }

  const fill = fixture.kind === "column" || fixture.kind === "shaft" ? "#9a958c" : "rgba(180, 160, 128, 0.18)";

  return (
    <rect
      x={fixture.x}
      y={fixture.y}
      width={fixture.width}
      height={fixture.height}
      rx={fixture.kind === "bath" || fixture.kind === "shower" ? 7 : 3}
      fill={fill}
      stroke="#9a8d78"
      strokeWidth="2"
    />
  );
}

export function ApartmentMiniPlan({ apartment }: { apartment: Apartment }) {
  const visualRooms = getApartmentVisualRooms(apartment.id, apartment.rooms);
  const bounds = getPlanBounds(visualRooms);
  const windows = getVisualWindows(visualRooms, apartment.id);
  const fixtures = getVisualFixtures(apartment.id, visualRooms);

  return (
    <div className="card-mini-plan" aria-label={`Мини-план квартиры ${apartment.title}`}>
      <svg viewBox="0 0 785 600" role="img" style={{ display: "block", width: "100%" }}>
        <defs>
          <pattern id={`balcony-hatch-${apartment.id}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(91, 143, 184, 0.2)" strokeWidth="3" />
          </pattern>
        </defs>

        <rect x="34" y="34" width="720" height="530" rx="24" fill="#fffdf8" stroke="rgba(0, 59, 166, 0.12)" strokeWidth="2" />

        {visualRooms.map((room) => (
          <g key={room.id}>
            <rect
              x={room.visualX}
              y={room.visualY}
              width={room.visualWidth}
              height={room.visualHeight}
              fill={roomFill(room)}
              stroke="#c9ba9a"
              strokeWidth="4"
            />
            {isBalcony(room) ? (
              <rect
                x={room.visualX + 3}
                y={room.visualY + 3}
                width={Math.max(0, room.visualWidth - 6)}
                height={Math.max(0, room.visualHeight - 6)}
                fill={`url(#balcony-hatch-${apartment.id})`}
                pointerEvents="none"
              />
            ) : null}
          </g>
        ))}

        <g pointerEvents="none" opacity="0.82">
          {fixtures.map((fixture) => (
            <MiniFixture key={fixture.id} fixture={fixture} />
          ))}
        </g>

        <rect
          x={bounds.minX}
          y={bounds.minY}
          width={bounds.maxX - bounds.minX}
          height={bounds.maxY - bounds.minY}
          fill="none"
          stroke="#3f362c"
          strokeWidth="8"
          strokeLinejoin="round"
        />

        <g pointerEvents="none">
          {windows.map((window) => (
            <g key={window.id}>
              <line x1={window.x1} y1={window.y1} x2={window.x2} y2={window.y2} stroke="#fffdf8" strokeWidth="13" strokeLinecap="round" />
              <line
                x1={window.x1}
                y1={window.y1}
                x2={window.x2}
                y2={window.y2}
                stroke={window.kind === "glazing" ? "#62aadd" : "#8fc5ec"}
                strokeWidth={window.kind === "glazing" ? 7 : 6}
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
