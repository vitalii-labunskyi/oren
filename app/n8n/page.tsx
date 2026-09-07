import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

type Execution = {
  id: string | number;
  workflowId: string;
  status?: string;
  startedAt?: string;
};

export default async function N8nPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceId = process.env.N8N_SERVICE_ID ?? "n8n-unowa";

  const [{ data: row }, { data: service }] = await Promise.all([
    supabase
      .from("service_status")
      .select("status, summary, checked_at")
      .eq("service_id", serviceId)
      .maybeSingle(),
    supabase
      .from("service")
      .select("base_url")
      .eq("id", serviceId)
      .maybeSingle(),
  ]);

  const summary = (row?.summary ?? {}) as {
    active_workflows?: number;
    total_workflows?: number;
    exec_count_24h?: number;
    exec_error_count_24h?: number;
    recent_executions?: Execution[];
  };
  const baseUrl = service?.base_url?.replace(/\/$/, "");
  const executions = summary.recent_executions ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6">
      <PageHeader title="n8n" />

      {!row ? (
        <p className="text-sm text-neutral-400">Даних ще немає.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 pb-6">
            <Stat
              label="Активні workflows"
              value={`${summary.active_workflows ?? "—"}/${summary.total_workflows ?? "—"}`}
            />
            <Stat label="Запусків (24г)" value={summary.exec_count_24h ?? "—"} />
            <Stat
              label="Падінь (24г)"
              value={summary.exec_error_count_24h ?? "—"}
              warn={(summary.exec_error_count_24h ?? 0) > 0}
            />
          </div>

          <h2 className="pb-2 text-sm font-medium text-neutral-400">
            Останні виконання
          </h2>
          <div className="overflow-hidden rounded-xl border border-neutral-800">
            {executions.length === 0 ? (
              <p className="bg-neutral-900 p-4 text-sm text-neutral-500">
                Немає виконань за 24 години.
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-neutral-800">
                  {executions.map((e) => (
                    <tr key={e.id} className="bg-neutral-900">
                      <td className="px-4 py-2.5 text-neutral-400">
                        #{e.id}
                      </td>
                      <td className="px-4 py-2.5">{e.workflowId}</td>
                      <td className="px-4 py-2.5 text-right">
                        <StatusBadge status={e.status} />
                      </td>
                      {baseUrl && (
                        <td className="px-4 py-2.5 text-right">
                          <a
                            href={`${baseUrl}/execution/${e.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline"
                          >
                            відкрити
                          </a>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p
        className={`pt-1 text-2xl font-semibold tracking-tight ${warn ? "text-amber-400" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const color =
    status === "error"
      ? "text-red-400"
      : status === "success"
        ? "text-emerald-400"
        : "text-neutral-400";
  return <span className={color}>{status ?? "—"}</span>;
}
