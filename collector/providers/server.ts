import si from "systeminformation";
import Docker from "dockerode";
import fs from "node:fs";
import type { Metric, PollResult, Provider, Status } from "../types";

const DOCKER_SOCK = "/var/run/docker.sock";
const docker = fs.existsSync(DOCKER_SOCK)
  ? new Docker({ socketPath: DOCKER_SOCK })
  : null;

const DISK_WARN_PCT = 85;
const DISK_ERROR_PCT = 95;

async function poll(): Promise<PollResult> {
  const [load, mem, disks, time] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.time(),
  ]);

  const cpuPct = Math.round(load.currentLoad);
  const memPct = Math.round(((mem.total - mem.available) / mem.total) * 100);
  const rootDisk = disks.find((d) => d.mount === "/") ?? disks[0];
  const diskPct = rootDisk ? Math.round(rootDisk.use) : 0;

  const metrics: Metric[] = [
    { metric: "cpu_pct", value: cpuPct },
    { metric: "mem_pct", value: memPct },
    { metric: "uptime_s", value: time.uptime },
    ...disks.map((d) => ({
      metric: "disk_pct",
      value: Math.round(d.use),
      labels: { mount: d.mount },
    })),
  ];

  let containers: { name: string; state: string; status: string }[] = [];
  if (docker) {
    const list = await docker.listContainers({ all: true });
    containers = list.map((c) => ({
      name: c.Names[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12),
      state: c.State,
      status: c.Status,
    }));
    metrics.push({
      metric: "containers_running",
      value: containers.filter((c) => c.state === "running").length,
    });
  }

  const stopped = containers.filter((c) => c.state !== "running");

  let status: Status = "ok";
  if (diskPct >= DISK_WARN_PCT || stopped.length > 0) status = "warn";
  if (diskPct >= DISK_ERROR_PCT) status = "error";

  const events: PollResult["events"] = [];
  if (diskPct >= DISK_ERROR_PCT) {
    events.push({
      level: "error",
      kind: "disk_high",
      title: `Диск ${rootDisk?.mount ?? "/"} заповнений на ${diskPct}%`,
      externalId: `${rootDisk?.mount ?? "/"}:${new Date().toISOString().slice(0, 10)}`,
      at: new Date(),
    });
  }

  return {
    status,
    summary: {
      headline: `CPU ${cpuPct}% · RAM ${memPct}% · Disk ${diskPct}%`,
      cpu_pct: cpuPct,
      mem_pct: memPct,
      disk_pct: diskPct,
      uptime_s: time.uptime,
      containers,
    },
    metrics,
    events,
  };
}

export const serverProvider: Provider = {
  serviceId: process.env.SERVER_SERVICE_ID ?? "srv-main",
  intervalMs: 60_000,
  poll,
};
