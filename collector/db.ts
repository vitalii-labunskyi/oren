import { createClient } from "@supabase/supabase-js";
import type { PollResult } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Потрібні SUPABASE_URL (або NEXT_PUBLIC_SUPABASE_URL) і SUPABASE_SERVICE_ROLE_KEY",
  );
}

export const db = createClient(url, serviceRoleKey, {
  db: { schema: "oren" },
  auth: { persistSession: false },
});

export async function writePollResult(serviceId: string, result: PollResult) {
  const now = new Date().toISOString();

  const { error: statusError } = await db.from("service_status").upsert({
    service_id: serviceId,
    status: result.status,
    summary: result.summary,
    checked_at: now,
  });
  if (statusError) throw statusError;

  if (result.metrics.length > 0) {
    const { error } = await db.from("metric_snapshot").insert(
      result.metrics.map((m) => ({
        service_id: serviceId,
        metric: m.metric,
        value: m.value,
        labels: m.labels ?? {},
      })),
    );
    if (error) throw error;
  }

  if (result.events.length > 0) {
    const { error } = await db.from("event").upsert(
      result.events.map((e) => ({
        service_id: serviceId,
        level: e.level,
        kind: e.kind,
        title: e.title,
        detail: e.detail ?? {},
        external_id: e.externalId ?? null,
        at: e.at.toISOString(),
      })),
      { onConflict: "service_id,kind,external_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
}

const RETENTION_DAYS = Number(process.env.METRIC_RETENTION_DAYS ?? 30);

export async function pruneOldSnapshots() {
  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { error } = await db.from("metric_snapshot").delete().lt("at", cutoff);
  if (error) throw error;
}
