export type Status = "ok" | "warn" | "error" | "unknown";

export type Metric = {
  metric: string;
  value: number;
  labels?: Record<string, unknown>;
};

export type CollectedEvent = {
  level: "info" | "warn" | "error";
  kind: string;
  title: string;
  detail?: Record<string, unknown>;
  externalId?: string;
  at: Date;
};

export type PollResult = {
  status: Status;
  /** kind-специфічний блоб для service_status.summary; summary.headline показує картка */
  summary: Record<string, unknown>;
  metrics: Metric[];
  events: CollectedEvent[];
};

export type Provider = {
  /** має відповідати oren.service.id */
  serviceId: string;
  intervalMs: number;
  poll: () => Promise<PollResult>;
};
