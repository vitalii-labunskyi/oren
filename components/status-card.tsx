export type ServiceStatusRow = {
  service_id: string;
  status: "ok" | "warn" | "error" | "unknown";
  summary: Record<string, unknown>;
  checked_at: string;
  service: { name: string; kind: string } | null;
};

const DOT_COLOR: Record<ServiceStatusRow["status"], string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  error: "bg-red-500",
  unknown: "bg-neutral-500",
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 90) return `${Math.round(seconds)}с тому`;
  if (seconds < 5400) return `${Math.round(seconds / 60)}хв тому`;
  return `${Math.round(seconds / 3600)}год тому`;
}

export function StatusCard({ row }: { row: ServiceStatusRow }) {
  const headline =
    typeof row.summary?.headline === "string" ? row.summary.headline : null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {row.service?.name ?? row.service_id}
        </span>
        <span
          className={`inline-block size-2.5 rounded-full ${DOT_COLOR[row.status]}`}
        />
      </div>
      {headline && (
        <p className="pt-2 text-lg font-semibold tracking-tight">{headline}</p>
      )}
      <p className="pt-1 text-xs text-neutral-500">
        перевірено {timeAgo(row.checked_at)}
      </p>
    </div>
  );
}
