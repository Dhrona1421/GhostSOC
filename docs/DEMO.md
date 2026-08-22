# Deterministic controlled demo

## Safety statement

The demo submits JSON. It does not execute Atomic Red Team, PowerShell, malware, network scanning, YARA against an uploaded file, or endpoint containment. Mock evidence and CTI are labeled `DEMO_MOCK`; dry-run responses say `executed: false`.

## Endpoint scenario

| Field | Value |
|---|---|
| ATT&CK | T1059.001 PowerShell / Execution |
| Fixture | `demo/powershell-event.json` |
| Expected rule | `GS-SIGMA-001` |
| Expected evidence | source event reference, endpoint triage mock, YARA mock, network context mock |
| Expected policy | `Safe default` |
| Expected response | evidence collection and approved isolation simulation |
| Expected outputs | audit, PDF, JSON, CSV, evidence ZIP |

The IP/domain/file values are documentation-only/reserved or `.invalid` values.

## Optional login-free judge preview

For an isolated local demonstration only, set `GHOSTSOC_DEMO_AUTO_ACCESS=true`. The backend accepts this only while `GHOSTSOC_DEMO_MODE=true` and `GHOSTSOC_DRY_RUN=true`; production configuration rejects it. The normal default remains authenticated.

## Run from UI

1. Start core services and open <http://localhost:8080>.
2. Sign in with the configured bootstrap admin.
3. Confirm the top bar says `DRY RUN`.
4. Select **Run controlled demo**.
5. Open **Alerts** and confirm `GS-SIGMA-001` / `T1059.001`.
6. Open **Incidents** and inspect risk reasons, IOCs, clearly labeled mock evidence, timeline, and response state.
7. Open **Detection Coverage** and confirm the executed scenario is `PASS`.
8. Open **Audit** and confirm response/demo records.
9. Generate/download PDF, JSON, CSV, and ZIP from the incident.

## Run from CLI

```bash
export GHOSTSOC_API_URL=http://localhost:8080/api/v1
export GHOSTSOC_DEMO_EMAIL=admin@ghostsoc.local
export GHOSTSOC_DEMO_PASSWORD='<password from .env>'
python3 scripts/demo_client.py run
python3 scripts/demo_client.py reset
python3 scripts/demo_client.py run
```

Or with Compose:

```bash
docker compose --profile demo run --rm demo-runner
```

## Verified chain

```text
fixture → EventCreate validation → SecurityEvent
→ Sigma-compatible rule → Alert → T1059.001
→ IOC extraction → attributed demo CTI mock
→ deterministic correlation → Incident → explainable risk
→ 3 evidence records → timeline
→ typed policy → dry-run collection
→ explicit approval → dry-run isolation
→ audit → PDF + JSON + CSV + ZIP
```

The automated `test_complete_demo_reset_and_repeat` verifies the chain, reset, and second run.

## Controlled web-security replay

Open **Web Security** and select **Start controlled web demo**, or call `POST /api/v1/demo/web-run`. Eleven inert access-log records appear through the SSE live stream and cover normal traffic, SQL injection, XSS, traversal/LFI, repeated login failures/password spray, GraphQL introspection, and SSRF. Different detections from `198.51.100.23` against `demo-web.local` correlate into one incident. A pre-approved source rate-limit request ends in `DRY_RUN`; no network control changes. PDF, JSON, CSV, and ZIP reports are generated from the incident.

Use **Reset web demo** or `POST /api/v1/demo/web-reset` to remove the controlled web records and repeat. The 35-category matrix and truth model are in `docs/WEB_SECURITY.md`.

## Authorized Atomic Red Team use

GhostSOC only documents the expected T1059.001 mapping. If operators later use Atomic Red Team, they must review the exact test, run it solely on an authorized isolated endpoint, validate expected telemetry, and reset the lab. The delivered software does not launch Atomic tests.
