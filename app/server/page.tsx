import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

type Container = { name: string; state: string; status: string };

export default async function ServerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase
    .from("service_status")
    .select("status, summary, checked_at")
    .eq("service_id", process.env.SERVER_SERVICE_ID ?? "srv-main")
    .maybeSingle();

  const summary = (row?.summary ?? {}) as {
    cpu_pct?: number;
    mem_pct?: number;
    disk_pct?: number;
    uptime_s?: number;
    containers?: Container[];
  };
  const containers = summary.containers ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6">
      <PageHeader title="Сервер" />

      {!row ? (
        <p className="text-sm text-neutral-400">Даних ще немає.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 pb-6">
            <Stat label="CPU" value={summary.cpu_pct} />
            <Stat label="RAM" value={summary.mem_pct} />
            <Stat label="Disk" value={summary.disk_pct} />
          </div>

          <h2 className="pb-2 text-sm font-medium text-neutral-400">
            Контейнери
          </h2>
          <div className="overflow-hidden rounded-xl border border-neutral-800">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-neutral-800">
                {containers.map((c) => (
                  <tr key={c.name} className="bg-neutral-900">
                    <td className="px-4 py-2.5 font-medium">{c.name}</td>
                    <td className="px-4 py-2.5 text-neutral-400">{c.status}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={
                          c.state === "running"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {c.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="pt-1 text-2xl font-semibold tracking-tight">
        {value ?? "—"}
        {value != null && "%"}
      </p>
    </div>
  );
}
