import type {
  CollectedEvent,
  Metric,
  PollResult,
  Provider,
  Status,
} from "../types";

const N8N_API_URL = process.env.N8N_API_URL; // напр. https://n8n.example.com/api/v1
const N8N_API_KEY = process.env.N8N_API_KEY;

type N8nWorkflow = { id: string; name: string; active: boolean };
type N8nExecution = {
  id: string | number;
  workflowId: string;
  status?: string; // новіші n8n: 'success' | 'error' | 'running' | 'waiting'
  finished?: boolean; // старіші n8n
  startedAt?: string;
  stoppedAt?: string;
};

async function n8nFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${N8N_API_URL}${path}`, {
    headers: { "X-N8N-API-KEY": N8N_API_KEY! },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`n8n API ${path} -> HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function isFailed(e: N8nExecution): boolean {
  if (e.status) return e.status === "error";
  return e.finished === false;
}

async function poll(): Promise<PollResult> {
  if (!N8N_API_URL || !N8N_API_KEY) {
    return {
      status: "unknown",
      summary: { headline: "N8N_API_URL / N8N_API_KEY не задані" },
      metrics: [],
      events: [],
    };
  }

  const [workflows, executions] = await Promise.all([
    n8nFetch<{ data: N8nWorkflow[] }>("/workflows?limit=250"),
    n8nFetch<{ data: N8nExecution[] }>("/executions?limit=50"),
  ]);

  const activeCount = workflows.data.filter((w) => w.active).length;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const last24h = executions.data.filter(
    (e) => e.startedAt && new Date(e.startedAt).getTime() >= dayAgo,
  );
  const failed24h = last24h.filter(isFailed);

  const metrics: Metric[] = [
    { metric: "workflows_active", value: activeCount },
    { metric: "exec_count_24h", value: last24h.length },
    { metric: "exec_error_count_24h", value: failed24h.length },
  ];

  const events: CollectedEvent[] = failed24h.slice(0, 20).map((e) => ({
    level: "error",
    kind: "n8n_execution_failed",
    title: `Execution ${e.id} (workflow ${e.workflowId}) впала`,
    detail: { workflowId: e.workflowId, startedAt: e.startedAt },
    externalId: String(e.id),
    at: e.stoppedAt
      ? new Date(e.stoppedAt)
      : new Date(e.startedAt ?? Date.now()),
  }));

  let status: Status = "ok";
  if (failed24h.length > 0) status = "warn";
  if (failed24h.length >= 5) status = "error";

  return {
    status,
    summary: {
      headline: `${activeCount} активних · ${last24h.length} запусків (24г) · ${failed24h.length} падінь`,
      active_workflows: activeCount,
      total_workflows: workflows.data.length,
      exec_count_24h: last24h.length,
      exec_error_count_24h: failed24h.length,
      recent_failures: failed24h.slice(0, 10).map((e) => ({
        id: e.id,
        workflowId: e.workflowId,
        startedAt: e.startedAt,
      })),
      recent_executions: last24h.slice(0, 10).map((e) => ({
        id: e.id,
        workflowId: e.workflowId,
        status: e.status ?? (e.finished ? "success" : "unknown"),
        startedAt: e.startedAt,
      })),
    },
    metrics,
    events,
  };
}

export const n8nProvider: Provider = {
  serviceId: process.env.N8N_SERVICE_ID ?? "n8n-unowa",
  intervalMs: 3 * 60_000,
  poll,
};
