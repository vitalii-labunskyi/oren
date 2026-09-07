import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusCard, type ServiceStatusRow } from "@/components/status-card";
import { EventList, type EventRow } from "@/components/event-list";
import { signOut } from "@/app/actions";

const DETAIL_HREF: Record<string, string> = {
  server: "/server",
  n8n: "/n8n",
};

export default async function OverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: statuses }, { data: events }] = await Promise.all([
    supabase
      .from("service_status")
      .select("service_id, status, summary, checked_at, service(name, kind)")
      .order("service_id"),
    supabase
      .from("event")
      .select("id, level, kind, title, at")
      .order("at", { ascending: false })
      .limit(20),
  ]);

  const rows = (statuses ?? []) as unknown as ServiceStatusRow[];
  const eventRows = (events ?? []) as EventRow[];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
      <header className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <span className="inline-block size-3 rounded-full bg-emerald-400" />
          <h1 className="text-xl font-semibold tracking-tight">OREN</h1>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-100"
          >
            Вийти
          </button>
        </form>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <p className="text-lg font-medium">Hello OREN 👋</p>
          <p className="pt-2 text-sm text-neutral-400">
            Колектор ще не записав жодного статусу. Запусти{" "}
            <code className="rounded bg-neutral-800 px-1.5 py-0.5">
              oren-collector
            </code>{" "}
            і онови сторінку.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {rows.map((row) => {
            const href = row.service?.kind
              ? DETAIL_HREF[row.service.kind]
              : undefined;
            const card = <StatusCard row={row} />;
            return href ? (
              <Link key={row.service_id} href={href}>
                {card}
              </Link>
            ) : (
              <div key={row.service_id}>{card}</div>
            );
          })}
        </div>
      )}

      <h2 className="pb-2 pt-8 text-sm font-medium text-neutral-400">
        Останні події
      </h2>
      <EventList events={eventRows} />
    </main>
  );
}
