export type EventRow = {
  id: number;
  level: "info" | "warn" | "error";
  kind: string;
  title: string;
  at: string;
};

const LEVEL_COLOR: Record<EventRow["level"], string> = {
  info: "text-neutral-400",
  warn: "text-amber-400",
  error: "text-red-400",
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 90) return `${Math.round(seconds)}с тому`;
  if (seconds < 5400) return `${Math.round(seconds / 60)}хв тому`;
  if (seconds < 129600) return `${Math.round(seconds / 3600)}год тому`;
  return `${Math.round(seconds / 86400)}д тому`;
}

export function EventList({ events }: { events: EventRow[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-neutral-500">Подій немає.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800">
      {events.map((e) => (
        <li key={e.id} className="flex items-center gap-3 bg-neutral-900 px-4 py-3">
          <span className={`text-xs font-medium ${LEVEL_COLOR[e.level]}`}>●</span>
          <span className="flex-1 truncate text-sm">{e.title}</span>
          <span className="shrink-0 text-xs text-neutral-500">{timeAgo(e.at)}</span>
        </li>
      ))}
    </ul>
  );
}
