import { pruneOldSnapshots, writePollResult } from "./db";
import type { Provider } from "./types";
import { serverProvider } from "./providers/server";
// Phase 1–2: сюди додаються n8n, supabase, clickup, agents
// (інтерфейс той самий: poll() → { status, summary, metrics, events })

const providers: Provider[] = [serverProvider];

async function runOnce(provider: Provider) {
  try {
    const result = await provider.poll();
    await writePollResult(provider.serviceId, result);
    console.log(
      `[${provider.serviceId}] ${result.status} — ${result.metrics.length} metrics, ${result.events.length} events`,
    );
  } catch (err) {
    console.error(`[${provider.serviceId}] poll failed:`, err);
    try {
      await writePollResult(provider.serviceId, {
        status: "unknown",
        summary: { headline: "Помилка опитування", error: String(err) },
        metrics: [],
        events: [],
      });
    } catch (writeErr) {
      console.error(`[${provider.serviceId}] status write failed:`, writeErr);
    }
  }
}

async function main() {
  console.log(
    `OREN collector: ${providers.length} provider(s) — ${providers
      .map((p) => p.serviceId)
      .join(", ")}`,
  );

  for (const provider of providers) {
    void runOnce(provider);
    setInterval(() => void runOnce(provider), provider.intervalMs);
  }

  // Retention: раз на добу
  setInterval(
    () =>
      void pruneOldSnapshots().catch((err) =>
        console.error("retention failed:", err),
      ),
    24 * 60 * 60 * 1000,
  );
}

void main();
