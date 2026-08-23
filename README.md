# GhostSOC

GhostSOC is a unified security-operations dashboard and safe response orchestrator. It accepts normalized endpoint, network, and allowlisted web telemetry; applies validated Sigma-compatible and 35-category web detections; streams live activity with Server-Sent Events; maps alerts to MITRE ATT&CK; correlates incidents; explains risk; provides SOC trends, attack graphs, network topology, incident relationships, and global search; attaches investigation evidence; enforces allowlisted response policy; audits actions; and exports real incident data.

> **Truthful status:** the self-contained core and deterministic demo are implemented and covered by automated tests. External Wazuh, Velociraptor, Arkime, MISP, OpenCTI, Shuffle, and live CTI services require their own authorized deployment and credentials. They are never reported healthy without a successful check. Real containment is intentionally disabled; response defaults to verified dry-run simulation.

## Easy install

Download and extract the easy-install bundle, then run:

```bash
# Linux or macOS
chmod +x install.sh start.sh stop.sh
./install.sh
```

```powershell
# Windows PowerShell with Docker Desktop running
Set-ExecutionPolicy -Scope Process Bypass
.\install.ps1
```

The installer generates local credentials when `.env` is absent, validates Docker Compose, builds the stack, waits for health, and prints the URL/password. It never overwrites an existing `.env`. See `INSTALL.md`.

## Manual Docker start

Prerequisites: Docker Engine with Compose v2, at least 4 GB available RAM, and on Linux `vm.max_map_count=262144` for OpenSearch.

```bash
git clone https://github.com/Dhrona1421/GhostSOC
cd GhostSOC
cp .env.example .env
# Change GHOSTSOC_SECRET_KEY, POSTGRES_PASSWORD, and the bootstrap password.
docker compose build
docker compose up -d
docker compose ps
curl http://localhost:8080/api/v1/health
```

Open <http://localhost:8080>. The `.env.example` demo login is `admin@ghostsoc.local`; use the password you placed in `.env`. Do not use demo defaults outside an isolated demonstration.

Run the one-shot controlled demo:

```bash
docker compose --profile demo run --rm demo-runner
# Web-security replay:
docker compose --profile demo run --rm web-demo-runner
# or use the corresponding dashboard buttons
```

The demos do **not** run PowerShell, Atomic Red Team, malware, web exploits, or containment commands. The endpoint demo submits an ATT&CK-mapped event fixture. The web demo replays inert access-log records for SQL injection, XSS, traversal/LFI, authentication abuse, GraphQL, and SSRF, then records an explicit `DRY_RUN` rate-limit response. Mock/simulated data is visibly attributed.

For an isolated login-free judge preview, set `GHOSTSOC_DEMO_AUTO_ACCESS=true`. This is rejected unless demo mode and dry-run are both enabled, is rejected in production, and must never be used for a normal deployment.

## Local development

Python 3.11–3.13 and Node 20.19+ are supported.

```bash
make install
cp .env.example .env
# For local SQLite development, set:
# GHOSTSOC_DATABASE_URL=sqlite:///./ghostsoc.db
make migrate
make run
# in another shell
cd frontend && npm run dev
```

Backend API: <http://localhost:8000/docs>  
Frontend development server: <http://localhost:5173>

## Verification

```bash
make verify
```

This runs Ruff, the backend test suite, Alembic upgrade/downgrade, frontend ESLint/build, and a tracked-file secret-pattern scan. Docker build/start/health must additionally be run on a host with Docker; Docker was not available in the implementation workspace and is therefore not falsely marked verified.

## Deployment modes

| Mode | Command / configuration | Reality |
|---|---|---|
| CORE | `docker compose up -d` | PostgreSQL, OpenSearch, API, dashboard. No external API key required. |
| DEMO | `docker compose --profile demo run --rm demo-runner` | Safe deterministic fixture and dry-run response. |
| ENDPOINT | Core + configure Wazuh/Velociraptor and send Sysmon-compatible events | External products are not bundled. |
| NETWORK | Core + send Zeek JSON / Suricata EVE JSON | Sensors are external and optional. |
| FULL | `docker compose --profile full up -d` plus configured endpoint/network/CTI products | Core plus demo runner; external products still require separate authorized deployments. |
| EXISTING SOC | Configure connector URLs/tokens in `.env` | GhostSOC orchestrates existing services. |

Optional service failure does not block PostgreSQL-backed event and incident processing. OpenSearch indexing is best-effort and reports degradation.

## Implemented API areas

- `/api/v1/auth` — JWT login, current user, backend RBAC
- `/api/v1/events` — normalized ingestion, filters, source normalizers
- `/api/v1/web` — allowlisted web requests, 35-category attack catalog, aggregates, detail, replay, and backend-derived statistics
- `/api/v1/live` — SSE stream and bounded notification history
- `/api/v1/visualizations` — backend-derived trends, attack graph, network topology, and incident relationships
- `/api/v1/search/global` — typed search across incidents, attacks, alerts, events, IOCs, and users
- `/api/v1/alerts`, `/detections` — traceable detection output and rules
- `/api/v1/incidents` — incident detail, evidence, IOC, timeline, risk
- `/api/v1/threat-intelligence/enrich` — backend-only provider-neutral enrichment
- `/api/v1/connectors` — truthful inventory and health state
- `/api/v1/response-actions` — allowlist, target policy, approval, idempotency, dry-run
- `/api/v1/audit` — actor/action/result/correlation trail
- `/api/v1/coverage` — calculated controlled-test coverage only
- `/api/v1/reports` — PDF, JSON, CSV, ZIP generated from persisted incidents
- `/api/v1/demo` — deterministic run/reset (admin-class permissions, demo mode only)
- `/api/v1/health`, `/ready` — liveness and dependency readiness

## Security defaults

- Argon2id-compatible password hashes and short-lived signed JWTs
- backend-enforced `ADMIN`, `ANALYST`, and `VIEWER` permissions
- no command or arbitrary query execution endpoint
- typed response actions and exact target validation
- explicit `GHOSTSOC_WEB_ALLOWED_HOSTS`; non-allowlisted web targets are rejected
- sensitive web headers are discarded, likely secrets are redacted, and session IDs are hashed
- `DRY_RUN=true`; simulated actions stay `DRY_RUN` and never claim confirmed containment
- API keys remain backend environment variables
- SSRF controls on connector URLs; private endpoints require explicit opt-in
- non-root application containers and no direct database/search host ports
- structured logs and request correlation IDs without payload/credential logging

See [Web Security](docs/WEB_SECURITY.md), [UI Design](docs/UI.md), [Security](docs/SECURITY.md), [Architecture](docs/ARCHITECTURE.md), [Demo](docs/DEMO.md), [Testing](docs/TESTING.md), [Release Checklist](docs/RELEASE_CHECKLIST.md), [Connectors](docs/CONNECTORS.md), and [Troubleshooting](docs/TROUBLESHOOTING.md).

## Known limitations

- The bundled Sigma engine intentionally supports a safe deterministic subset: named selections joined by `and`/`or`, equality, `contains`, `startswith`, and `endswith`. Unsupported conditions are rejected rather than misinterpreted.
- MITRE metadata is a curated subset for bundled rules, not a complete ATT&CK mirror.
- Live external product integrations are boundary implementations/configuration health checks unless the connector matrix says otherwise; no external deployment was available for runtime verification.
- Local YARA and real endpoint/network response execution are not enabled by default. Demo results are visibly marked mocks.
- Context-dependent web categories such as CSRF, IDOR, business-logic abuse, cache deception, and CORS misconfiguration require explicit application/WAF signals; GhostSOC does not pretend an access log alone proves them.
- SSE fan-out is in-process and notification-only; multi-replica production needs a shared broker while the database remains authoritative.
- Docker artifacts were authored but could not be executed in the implementation environment because the Docker CLI/daemon was unavailable.

## Safe reset

`POST /api/v1/demo/reset` resets the endpoint scenario; `POST /api/v1/demo/web-reset` resets controlled web replay records. Both preserve users, rules, policies, connector configuration, and audit accountability, and are disabled when demo mode is off.
