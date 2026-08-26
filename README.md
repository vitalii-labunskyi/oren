# OREN

Особистий дашборд екосистеми: сервери, n8n, Supabase, витрачений час (ClickUp), активність AI-агентів. Read-only моніторинг, self-hosted, PWA.

План і рішення: `claudecodemob/projects/oren/PLAN.md`.

## Архітектура

- **oren-web** — Next.js (App Router, standalone) за Supabase Auth. Читає `oren.service_status` + снапшоти.
- **oren-collector** — один Node-процес на `setInterval`, полить джерела і пише в Supabase (service-role key). Провайдери: `collector/providers/*` з єдиним інтерфейсом `poll() → { status, summary, metrics, events }`.
- **Supabase** (схема `oren`) — сховище + auth. Міграції в `supabase/migrations/`.

## Локальна розробка

```bash
cp .env.example .env   # заповнити Supabase URL/ключі
npm install
npm run dev            # веб на http://localhost:3000
npm run collector      # колектор (окремий термінал)
```

## Деплой (Docker, на сервері)

1. **БД:** `psql "$OREN_DB_URL" -f supabase/migrations/0001_init.sql`, потім відредагувати і застосувати `supabase/seed.sql`.
2. **Expose схеми:** додати `oren` до `PGRST_DB_SCHEMAS` (self-hosted: env Kong/PostgREST у docker-compose Supabase) або Dashboard → Settings → API → Exposed schemas. Без цього supabase-js схему не бачить.
3. **Auth:** створити користувача (Dashboard → Auth → Add user), вимкнути реєстрацію (`GOTRUE_DISABLE_SIGNUP=true`).
4. **Env:** `cp .env.example .env`, заповнити, `chmod 600 .env`.
5. **Запуск:** `docker compose up -d --build`.
6. **Caddy:** додати `deploy/Caddyfile.snippet` у свій Caddyfile (веб слухає тільки `127.0.0.1:3100`).
7. Відкрити `https://oren.<домен>`, залогінитись, поставити як PWA (Add to Home Screen).

## Статус фаз

- [x] Phase 0 — скелет: auth, «Hello OREN», міграції, колектор із server-провайдером, Docker
- [ ] Phase 1 — провайдер n8n, сторінки `/server`, `/n8n`, Overview з подіями
- [ ] Phase 2 — провайдери supabase/clickup/agents, сторінки `/supabase`, `/time`, `/agents`
- [ ] Phase 3 — алерти (n8n → Telegram), dead-man's switch, PWA-іконки
