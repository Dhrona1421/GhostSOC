# Release status

**Current status: RELEASE CANDIDATE — runtime certification pending.**

The application core, deterministic demos, security controls, documentation, automated regression suite, frontend production build, release hygiene, and CI workflow are implemented. A production release must still pass the Docker runtime gate on a host with Docker Engine + Compose v2.

## Verified in implementation environment

- backend imports and starts through FastAPI TestClient lifespan
- authentication and backend authorization
- normalized event → detection → alert → MITRE → correlation → incident → risk
- CTI success/failure normalization with deterministic HTTP transports
- safe evidence mocks, response policy, approval, dry-run and idempotency
- audit and real-data PDF/JSON/CSV/ZIP
- deterministic endpoint demo → reset → second demo
- 35-category web catalog, signatures, behavior, correlation, replay, DRY_RUN response, reports, reset
- live SSE pages and attack detail inspected in a real Chromium browser at desktop/tablet widths
- SOC trends, global search, notifications, attack graph, network topology, and incident graph verified with real persisted data
- analyst response context, validated targets, policy guardrails, approval/denial workflow, SSE updates, and browser DRY_RUN verification
- frontend lint, dependency audit and production build
- Python lint and automated regression suite
- separate clean local clone: documented install, SQLite migration, and `make verify`
- release artifact hygiene and CI configuration added

## Mandatory unverified release gates

These require a machine with Docker Engine and Compose v2:

- `docker compose config --quiet`
- `docker compose build --no-cache`
- PostgreSQL-backed migration and runtime
- OpenSearch container health and real indexing
- Nginx-to-backend Compose proxy health
- container restart/recovery tests
- fresh-clone Docker installation using only the documented installer
- persistence after PostgreSQL/OpenSearch/backend restart
- production-mode configuration with real TLS/secret management
- live external product/provider credentials where those integrations are advertised

Docker is unavailable in the current implementation workspace. This is an environment limitation, not evidence that the Docker stack works. Do not mark these gates passed until command output is captured on a real Docker host.

## Deliberate safety boundaries

- unrestricted command execution is not exposed
- arbitrary external URL fetching is not exposed
- arbitrary database/Velociraptor queries are not exposed
- automatic destructive containment is not enabled by default
- fake connector success is not reported as healthy
- hard-coded coverage percentages or dashboard incident counts are not used
- demo authentication bypass is disabled outside explicitly isolated demo mode
