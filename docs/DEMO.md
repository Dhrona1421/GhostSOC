# NovaBank — synthetic memory demonstration (5 minutes)

**Synthetic security incidents inspired by publicly documented attack patterns and incident-response lessons.** NovaBank is a fictional organization. This is a simulation; no actual account is disabled, no real containment occurs, and GhostSOC does not claim to have prevented any real-world incident. This scenario is inspired by public incident reporting and demonstrates how institutional memory could have been useful in a similar investigation.

## Prerequisites and cold start

1. Install/start the existing stack per `INSTALL.md`. Docker and Compose must be present; this repository's development workspace did **not** have Docker, so the complete live stack was not verified here.
2. Supply a real Hindsight server and working inference keys via private `.env`, never source. For self-hosted memory set `HINDSIGHT_API_LLM_API_KEY` and `GHOSTSOC_HINDSIGHT_URL=http://hindsight:8888`, then `docker compose --profile memory up -d --build`. See the provider's [server setup](https://hindsight.vectorize.io/developer/api/quickstart); its LLM must support structured extraction. For a compatible inference service set `GHOSTSOC_LLM_BASE_URL` (e.g. `https://api.groq.com/openai/v1`), `GHOSTSOC_LLM_API_KEY`, and `GHOSTSOC_LLM_MODEL` (default `openai/gpt-oss-120b`); confirm the selected provider/model supports JSON output. Set unique `GHOSTSOC_HINDSIGHT_BANK_ID` for this synthetic demo, separate from real tenant banks. Restart backend after changes.
3. Log in as a demo administrator while `GHOSTSOC_DEMO_MODE=true`, `GHOSTSOC_DRY_RUN=true` and `demo-web.local` is in `GHOSTSOC_WEB_ALLOWED_HOSTS`. These are hard endpoint preconditions. On Overview click **Load NovaBank memory demo (synthetic · dry run)**; or run `docker compose --profile demo run --rm demo-runner python /scripts/demo_client.py novabank` (after the stack starts). This extends the existing authorized demo runner; it uses the real five-failed-login behavioral web ingestion/detection/correlation pipeline for each of three source addresses in reserved documentation ranges. Existing runs are returned without duplicate insertion. No attack traffic is sent anywhere, and no response action is executed.
4. If the loader says `memory_status=unavailable`, stop claiming a working memory demonstration. Existing incidents still open, but check Hindsight URL/key and provider logs. If the recommendation says `unavailable`, check inference credentials/model; do not show a canned replacement as AI output. Loading three incidents alone does not prove the inference reasoning is good; inspect its actual output below. If the desired order is not present, say so honestly.

## Five-minute walkthrough

| Time | Show and say |
|---|---|
| 0:00–0:30 | SOC findings are recorded in separate cases; human knowledge rarely informs the next case. Introduce GhostSOC's incident page, policy and approvals. |
| 0:30–1:00 | Open **NovaBank · 01**. It came from real GhostSOC behavioral detections on *synthetic* web-request fixtures. Security Memory says **No relevant historical experience found.** for this first case because it excludes its own source record. If enabled, current-only inference has no historical citations. |
| 1:00–1:30 | Show the **synthetic exercise** outcome: the analyst *reported* early account disable and lost session evidence. This did **not** execute in GhostSOC. View its failure, side effect and explicit lesson: “Preserve critical authentication evidence before destructive containment when operationally safe.” |
| 1:30–2:00 | Show Hindsight retain status on the loader. The experience has five structured categories with a stable incident document ID. Hindsight extracts facts and connects memories; the PostgreSQL source projection alone cannot be recalled. Do not call the demo successful if memory was unavailable. |
| 2:00–3:00 | Open **NovaBank · 02**. Its Security Memory panel should cite Incident 01 and show what failed and why. Compare the **Without memory comparison** checkbox to the normal recommendation: each mode makes a *new real inference call*. Without memory must show no historical citation; with memory should cite Incident 01. |
| 3:00–3:45 | Expand **Why?**; check source incident ID, evidence and plain-language explanation. Look for evidence preservation → session capture → analyst escalation to revoke/disable → further investigation **if the actual model recommended it**. These account actions are *not executable GhostSOC action types*: describe them as analyst escalation only. |
| 3:45–4:15 | Choose **Accept** (or honestly Modify/Reject if output is poor), enter a reason, observed *synthetic exercise* outcome and the lesson “Correlate source IP across related accounts before containment” with condition “When spraying spans accounts”, then press **Save Learning**. Confirm the UI says the experience was retained, not merely saved locally. This never invokes an action endpoint. To show actual policy/approval use the existing Response & audit tab; any displayed result remains `DRY_RUN` and `executed=false`. |
| 4:15–4:45 | Reopen the second case if desired to show persisted feedback/learning. Explain that recommendation acceptance is not verified containment. |
| 4:45–5:00 | Open **NovaBank · 03** (password-spraying across accounts). Hindsight should now return both Incident 01's failure and Incident 02's analyst feedback/outcome. Inspect the actual recommendation's conflict explanation and source-IP correlation. If it does not synthesize the two, report that as a failure, not as measured improvement. |

Close: **“GhostSOC doesn't just respond to incidents. It remembers what happened, learns from it, and makes that experience available when the next incident arrives.”**

## Verification and limitations

The automated seven-case tests in `backend/tests/test_agent_contract.py` cover relevant/no memory, failure, success, analyst rejection, conflict, and later-outcome impact. `backend/tests/test_novabank_demo.py` checks the seeded three-incident arc, provider-document provenance and memory/no-memory contrast through the same backend API. `backend/tests/test_memory_transport.py` adds a real loopback TCP connection to local Hindsight/inference **test doubles**, then stops them to assert fail-closed outage behavior. These tests use explicit **emulators**, not production providers; they do **not** prove real Hindsight quality or real LLM behavior. Run `make verify` for local regressions and then repeat the flow with real configured providers and a browser. The local development workspace has neither Docker nor inference credentials, so no live-provider retrieval relevance, recommendation consistency, analyst acceptance rate, or investigation-time metric is claimed. Confirm provider-side document/fact counts and output manually before presenting a real deployment. `npm audit` dependency status must also be checked separately.

**Measured local check (2026-09-27):** `make verify` completed with 60 backend tests passed (one Starlette deprecation warning), SQLite Alembic upgrade/check/downgrade passed, Ruff and frontend lint/build passed, and `npm audit` found 0 known vulnerabilities after updating the transitive `js-yaml` lockfile. `pip-audit -r backend/requirements.lock` reported no known vulnerabilities after updating the pinned FastAPI/Starlette, PyJWT and pytest dependencies. A live local FastAPI + Vite HTTP smoke test (without either external provider) loaded 3 synthetic incidents, found 3 alerts and 3 timeline entries on Incident 02, and correctly returned `memory_status=unavailable` and `agent_status=unavailable`. A subsequent authenticated same-origin Vite-proxy HTTP check returned Incident 01's source-authored failure and lesson with `provider_status=unavailable`, and a distinct `recall.status=unavailable` (not fabricated history); unauthenticated source access returned 401. On this checkout, an additional isolated local FastAPI instance, real HTTP sockets and deterministic provider **test doubles** passed the Incident 1→2→3 retain/recall/recommend/feedback/conflict flow, including idempotent reload and a deliberate provider shutdown. A temporary JSDOM + Vite SSR harness rendered the actual React `IncidentMemory` component against these HTTP endpoints, selected Accept, entered an optional conditional lesson, saved feedback, displayed the persisted decision and then displayed two recalled sources/conflict on Incident 3. A separate JSDOM check rendered the real unconfigured API's unavailable states and Incident 1's own reported failure/lesson. **Real Chromium/Playwright browser checks** also passed: login/navigation and distinct unavailable/source states against the unconfigured local API; and, against an isolated HTTP-emulated provider stack, NovaBank load, historical recall, genuine inference HTTP calls to the test double, memory-bypass toggle, feedback form and persisted lesson, two recalled sources and conflict on Incident 3. No page errors or AI-triggered `/response-actions` POST occurred; the 390px mobile viewport had no horizontal overflow. Playwright's CDN browser download failed, so a Chromium binary packaged through npm was used with local shared libraries. These are real-browser tests of the **application using provider test doubles**, **not** live Hindsight/LLM quality, Docker, or a production deployment. The seven scenario test cases pass against **emulated** provider responses only; none of the seven has been verified against a real Hindsight + LLM deployment here.

Do not use the old `/demo/reset` as a NovaBank-only cleanup operation: it removes all operational incidents; Hindsight itself needs separate bank lifecycle management. Use an isolated demo bank/stack instead. See `docs/MEMORY_ARCHITECTURE.md` for the data flow.

---

## Existing controlled demos (independent of NovaBank)

### Safety statement

The demo submits JSON. It does not execute Atomic Red Team, PowerShell, malware, network scanning, YARA against an uploaded file, or endpoint containment. Mock evidence and CTI are labeled `DEMO_MOCK`; dry-run responses say `executed: false`.

### Endpoint scenario

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

### Optional login-free judge preview

For an isolated local demonstration only, set `GHOSTSOC_DEMO_AUTO_ACCESS=true`. The backend accepts this only while `GHOSTSOC_DEMO_MODE=true` and `GHOSTSOC_DRY_RUN=true`; production configuration rejects it. The normal default remains authenticated.

### Run from UI

1. Start core services and open <http://localhost:8080>.
2. Sign in with the configured bootstrap admin.
3. Confirm the top bar says `DRY RUN`.
4. Select **Run controlled demo**.
5. Open **Alerts** and confirm `GS-SIGMA-001` / `T1059.001`.
6. Open **Incidents** and inspect risk reasons, IOCs, clearly labeled mock evidence, timeline, and response state.
7. Open **Detection Coverage** and confirm the executed scenario is `PASS`.
8. Open **Audit** and confirm response/demo records.
9. Generate/download PDF, JSON, CSV, and ZIP from the incident.

### Run from CLI

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

### Verified chain

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

### Controlled web-security replay

Open **Web Security** and select **Start controlled web demo**, or call `POST /api/v1/demo/web-run`. Eleven inert access-log records appear through the SSE live stream and cover normal traffic, SQL injection, XSS, traversal/LFI, repeated login failures/password spray, GraphQL introspection, and SSRF. Different detections from `198.51.100.23` against `demo-web.local` correlate into one incident. A pre-approved source rate-limit request ends in `DRY_RUN`; no network control changes. PDF, JSON, CSV, and ZIP reports are generated from the incident.

Use **Reset web demo** or `POST /api/v1/demo/web-reset` to remove the controlled web records and repeat. The 35-category matrix and truth model are in `docs/WEB_SECURITY.md`.

### Authorized Atomic Red Team use

GhostSOC only documents the expected T1059.001 mapping. If operators later use Atomic Red Team, they must review the exact test, run it solely on an authorized isolated endpoint, validate expected telemetry, and reset the lab. The delivered software does not launch Atomic tests.
