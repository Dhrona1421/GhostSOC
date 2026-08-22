import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, login } from './api.js'
import GlobalTopbar from './GlobalTopbar.jsx'
import LiveSecurity from './LiveSecurity.jsx'
import ResponseConsole from './ResponseConsole.jsx'
import SOCAnalytics from './SecurityCharts.jsx'
import { AttackGraphPanel, IncidentRelationshipGraph, NetworkMode } from './Visualizations.jsx'

const NAV_GROUPS = [
  { label: 'Monitor', items: ['Overview', 'Live Monitor', 'Alerts', 'Attacks', 'Web Security'] },
  { label: 'Investigate', items: ['Incidents', 'Threat Intelligence', 'Hosts', 'Detection Coverage', 'Hunt'] },
  { label: 'Manage', items: ['Reports', 'Integrations', 'Audit', 'Settings'] },
]
const pageEndpoint = {
  Alerts: '/alerts',
  Incidents: '/incidents',
  'Detection Coverage': '/coverage',
  'Threat Intelligence': '/iocs',
  Hosts: '/hosts',
  Reports: '/reports',
  Integrations: '/connectors',
  Settings: '/response-policies',
  Audit: '/audit',
}

function Badge({ children, tone }) {
  const inferred = String(children).toLowerCase()
  return <span className={`badge ${tone || inferred}`}>{children}</span>
}

function Login({ onLogin, busy, error }) {
  const [email, setEmail] = useState('admin@ghostsoc.local')
  const [password, setPassword] = useState('change-this-before-non-demo-use')
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark large">G</div>
        <p className="eyebrow">UNIFIED SECURITY OPERATIONS</p>
        <h1>Welcome to GhostSOC</h1>
        <p className="muted">One incident workflow from detection through safe response.</p>
        <form onSubmit={(event) => { event.preventDefault(); onLogin(email, password) }}>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></label>
          {error && <p className="error-box">{error}</p>}
          <button className="primary full" disabled={busy}>{busy ? 'Authenticating…' : 'Open dashboard'}</button>
        </form>
        <p className="demo-note"><strong>Demo defaults shown.</strong> Change them before non-demo use.</p>
      </section>
    </main>
  )
}

function Sidebar({ page, setPage, user, onLogout, autoAccess }) {
  return (
    <aside className="sidebar">
      <header className="brand"><div className="brand-mark">G</div><div><b>GHOSTSOC</b><small>CONTROL CENTER</small></div></header>
      <nav>{NAV_GROUPS.map((group) => <div className="nav-group" key={group.label}><p>{group.label}</p>{group.items.map((item) => <button key={item} onClick={() => setPage(item)} className={page === item ? 'active' : ''} aria-current={page === item ? 'page' : undefined}>{item}</button>)}</div>)}</nav>
      <footer><div className="user-avatar">{user.email[0].toUpperCase()}</div><div className="user-copy"><b>{user.email}</b><small>{user.role}</small></div>{!autoAccess && <button className="icon-button" title="Sign out" onClick={onLogout}>↗</button>}</footer>
    </aside>
  )
}

function Metric({ label, value, accent, note, onClick }) {
  return <button className={`metric metric-${accent}`} onClick={onClick}><i aria-hidden="true" /><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div><span aria-hidden="true">›</span></button>
}

function Empty({ text = 'No records yet. Run the controlled demo to populate this view.' }) {
  return <div className="empty"><b>NO DATA</b><p>{text}</p></div>
}

function PageLoading({ label = 'Loading operational data…' }) {
  return <section className="loading-state" aria-live="polite" aria-busy="true"><header><span>LOADING</span><b>{label}</b></header><div className="loading-grid"><i /><i /><i /><i /></div><div className="loading-lines"><i /><i /><i /></div></section>
}

function Overview({ data, onDemo, demoBusy, token, onNavigate }) {
  if (!data) return <PageLoading label="Loading live backend metrics…" />
  const metrics = data.metrics
  return <>
    <section className="metrics-grid command-metrics">
      <Metric label="Critical incidents" value={metrics.critical_incidents} accent="red" note="Requires immediate attention" onClick={() => onNavigate('Incidents')} />
      <Metric label="High incidents" value={metrics.high_incidents} accent="amber" note="Active high-severity cases" onClick={() => onNavigate('Incidents')} />
      <Metric label="Live attacks" value={metrics.live_attacks} accent="red" note="Detected in last 15 minutes" onClick={() => onNavigate('Attacks')} />
      <Metric label="Events/sec" value={metrics.events_per_sec} accent="blue" note={`${metrics.events} persisted events`} onClick={() => onNavigate('Live Monitor')} />
      <Metric label="Requests/sec" value={metrics.requests_per_sec} accent="cyan" note={`${metrics.detected_attacks} attack aggregates`} onClick={() => onNavigate('Web Security')} />
      <Metric label="Investigations" value={metrics.active_investigations} accent="amber" note={`${metrics.contained_confirmed} confirmed containments`} onClick={() => onNavigate('Incidents')} />
    </section>
    <SOCAnalytics token={token} />
    <AttackGraphPanel token={token} onNavigate={onNavigate} compact />
    <section className="split-grid">
      <article className="panel wide"><div className="panel-head"><div><p className="eyebrow">LIVE FEED</p><h2>Recent security events</h2></div><button className="primary" onClick={onDemo} disabled={demoBusy}>{demoBusy ? 'Running safe demo…' : 'Run controlled demo'}</button></div>
        {data.events.length ? <div className="table-wrap"><table><thead><tr><th>Time</th><th>Event</th><th>Host</th><th>Source</th><th>Severity</th></tr></thead><tbody>{data.events.map((event) => <tr key={event.id}><td>{new Date(event.timestamp).toLocaleTimeString()}</td><td><b>{event.event_type}</b><small>{event.process || event.domain || 'Normalized event'}</small></td><td>{event.host || '—'}</td><td>{event.source}</td><td><Badge>{event.severity}</Badge></td></tr>)}</tbody></table></div> : <Empty />}
      </article>
      <article className="panel"><div className="panel-head"><div><p className="eyebrow">CONTROLLED TESTS</p><h2>ATT&CK coverage</h2></div></div>
        {data.coverage.length ? data.coverage.map((item) => <div className="coverage-row" key={item.tactic}><div><b>{item.tactic}</b><span>{item.coverage_percent}%</span></div><div className="bar"><i style={{ width: `${item.coverage_percent}%` }} /></div><small>{item.PASS} pass · {item.PARTIAL} partial · {item.MISS} miss</small></div>) : <Empty text="Coverage appears only after controlled tests execute." />}
      </article>
    </section>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">CASE QUEUE</p><h2>Active incident timeline</h2></div></div>
      {data.incidents.length ? <div className="incident-grid">{data.incidents.map((incident) => <button key={incident.id} className="incident-card" onClick={() => onNavigate('Incidents', incident.id)}><div><Badge>{incident.severity}</Badge><Badge>{incident.status}</Badge></div><h3>{incident.title}</h3><p>Risk <b>{incident.risk_level}</b> · {incident.risk_score}/100</p><small>Updated {new Date(incident.updated_at).toLocaleString()}</small></button>)}</div> : <Empty />}
    </section>
  </>
}

function Alerts({ rows }) {
  return <section className="panel"><div className="panel-head"><div><p className="eyebrow">DETECTION OUTPUT</p><h2>Alerts</h2></div><span>{rows?.length || 0} records</span></div>{rows?.length ? <div className="table-wrap"><table><thead><tr><th>Created</th><th>Detection</th><th>Rule</th><th>MITRE</th><th>Severity</th><th>Confidence</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString()}</td><td><b>{row.title}</b><small>{row.evidence_reference}</small></td><td>{row.rule_id}</td><td>{row.mitre_techniques.join(', ') || '—'}</td><td><Badge>{row.severity}</Badge></td><td>{Math.round(row.confidence * 100)}%</td></tr>)}</tbody></table></div> : <Empty />}</section>
}

function IncidentDetail({ incident, token, reload, onNavigate }) {
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState('summary')
  const [auditRows, setAuditRows] = useState([])
  const techniques = [...new Set(incident.alerts.flatMap((alert) => alert.mitre_techniques))]
  useEffect(() => {
    const related = new Set([incident.id, ...incident.alerts.map((item) => item.id), ...incident.response_actions.map((item) => item.id)])
    api('/audit?limit=200', { token }).then((rows) => setAuditRows(rows.filter((row) => related.has(row.target_id)))).catch(() => setAuditRows([]))
  }, [incident, token])
  const collect = async (type) => { setMessage('Collecting evidence…'); try { await api(`/incidents/${incident.id}/evidence`, { token, method: 'POST', body: { evidence_type: type, target: 'demo-endpoint-01' } }); setMessage('Evidence attached to incident'); reload() } catch (error) { setMessage(error.message) } }
  const exportReport = async (format) => { try { const result = await api(`/incidents/${incident.id}/reports/${format}`, { token, method: 'POST' }); setMessage(`${format.toUpperCase()} generated · SHA-256 ${result.sha256.slice(0, 12)}…`) } catch (error) { setMessage(error.message) } }
  const tabs = [
    ['summary', 'Summary', incident.alerts.length],
    ['graph', 'Attack graph', incident.alerts.length + incident.iocs.length],
    ['evidence', 'Evidence & IOCs', incident.evidence.length + incident.iocs.length],
    ['timeline', 'Timeline', incident.timeline.length],
    ['response', 'Response & audit', incident.response_actions.length + auditRows.length],
  ]
  return <div className="incident-workspace">
    <section className="incident-command"><div><p className="eyebrow">INCIDENT · {incident.id.slice(0, 8).toUpperCase()}</p><h2>{incident.title}</h2><p>{incident.description}</p></div><dl><div><dt>Severity</dt><dd><Badge>{incident.severity}</Badge></dd></div><div><dt>Status</dt><dd><Badge>{incident.status}</Badge></dd></div><div><dt>Risk</dt><dd><strong>{incident.risk_score}</strong><small>{incident.risk_level}</small></dd></div></dl></section>
    <nav className="incident-tabs" aria-label="Incident sections">{tabs.map(([id, label, count]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>{label}<span>{count}</span></button>)}</nav>
    {message && <div className={message.includes('generated') || message.includes('attached') ? 'success-box' : 'status-message'}>{message}</div>}
    {tab === 'summary' && <section className="investigation-grid"><article className="panel"><div className="section-heading"><div><p className="eyebrow">ASSESSMENT</p><h3>Risk explanation</h3></div></div><ul className="reason-list">{incident.risk_reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><div className="section-heading alert-heading"><div><p className="eyebrow">SOURCE DETECTIONS</p><h3>Related alerts</h3></div><span>{incident.alerts.length}</span></div><div className="table-wrap"><table><thead><tr><th>Detection</th><th>Rule</th><th>Severity</th><th>Confidence</th></tr></thead><tbody>{incident.alerts.map((alert) => <tr key={alert.id}><td><b>{alert.title}</b><small>{alert.evidence_reference}</small></td><td>{alert.rule_id}</td><td><Badge>{alert.severity}</Badge></td><td>{Math.round(alert.confidence * 100)}%</td></tr>)}</tbody></table></div></article><aside className="incident-side"><section className="panel"><p className="eyebrow">AUTHORIZED COLLECTION</p><h3>Investigation actions</h3><div className="action-list"><button onClick={() => collect('ENDPOINT_TRIAGE')}>Endpoint triage<span>Collect process and host context</span></button><button onClick={() => collect('YARA_SCAN')}>YARA analysis<span>Analyze selected file artifacts</span></button><button onClick={() => collect('NETWORK_CONTEXT')}>Network context<span>Attach related flow evidence</span></button></div></section><section className="panel"><p className="eyebrow">ATT&CK MAPPING</p><h3>Techniques</h3><div className="technique-list">{techniques.map((item) => <div key={item}><b>{item}</b><span>Mapped from source evidence</span></div>)}</div></section></aside></section>}
    {tab === 'graph' && <IncidentRelationshipGraph incidentId={incident.id} token={token} onNavigate={onNavigate} />}
    {tab === 'evidence' && <section className="investigation-grid"><article className="panel"><div className="section-heading"><div><p className="eyebrow">CHAIN OF CUSTODY</p><h3>Evidence records</h3></div><span>{incident.evidence.length}</span></div>{incident.evidence.length ? <div className="record-table">{incident.evidence.map((item) => <div key={item.id}><Badge>{item.status}</Badge><div><b>{item.summary}</b><small>{item.source}</small></div><code>{item.sha256 ? `${item.sha256.slice(0, 18)}…` : 'NO HASH'}</code></div>)}</div> : <Empty text="No evidence has been collected for this incident." />}</article><article className="panel"><div className="section-heading"><div><p className="eyebrow">INDICATORS</p><h3>IOCs and enrichment</h3></div><span>{incident.iocs.length}</span></div>{incident.iocs.length ? <div className="record-table ioc-records">{incident.iocs.map((ioc) => <div key={ioc.id}><Badge>{ioc.ioc_type}</Badge><div><code>{ioc.value}</code>{ioc.enrichment.map((result, index) => <small key={index}>{result.provider}: {result.summary} {result.mock && '· SIMULATED'}</small>)}</div><Badge>{ioc.verdict}</Badge></div>)}</div> : <Empty text="No indicators are associated with this incident." />}</article></section>}
    {tab === 'timeline' && <section className="panel timeline-panel"><div className="section-heading"><div><p className="eyebrow">CHRONOLOGY</p><h3>Incident timeline</h3></div><span>{incident.timeline.length} events</span></div><div className="investigation-timeline">{incident.timeline.map((event) => <div key={event.id}><time>{new Date(event.timestamp).toLocaleString()}</time><i /><div><b>{event.event_type.replaceAll('_', ' ')}</b><p>{event.summary}</p><small>{event.source}</small></div></div>)}</div></section>}
    {tab === 'response' && <section className="response-tab-layout"><ResponseConsole incident={incident} token={token} onRefresh={reload} Badge={Badge} /><aside className="incident-side"><section className="panel"><p className="eyebrow">REAL INCIDENT DATA</p><h3>Generate exports</h3><div className="export-list">{['pdf', 'json', 'csv', 'zip'].map((format) => <button key={format} onClick={() => exportReport(format)}><b>{format.toUpperCase()}</b><span>{format === 'zip' ? 'Evidence package' : `${format.toUpperCase()} incident export`}</span></button>)}</div></section><section className="panel"><div className="section-heading"><div><p className="eyebrow">ACCOUNTABILITY</p><h3>Related audit</h3></div><span>{auditRows.length}</span></div>{auditRows.length ? <div className="record-table compact-audit">{auditRows.map((row) => <div key={row.id}><time>{new Date(row.timestamp).toLocaleTimeString()}</time><div><b>{row.action}</b><small>{row.target_type} · {row.correlation_id?.slice(0, 12) || 'NO CORRELATION ID'}</small></div><Badge>{row.result}</Badge></div>)}</div> : <Empty text="No directly related audit records." />}</section></aside></section>}
  </div>
}

function Incidents({ rows, token, reloadList, initialId, onNavigate }) {
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const open = async (id) => { setBusy(true); try { setSelected(await api(`/incidents/${id}`, { token })) } finally { setBusy(false) } }
  useEffect(() => {
    if (!initialId) return
    let active = true
    setBusy(true)
    api(`/incidents/${initialId}`, { token }).then((item) => { if (active) setSelected(item) }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [initialId, token])
  const reload = () => selected && open(selected.id)
  if (selected) return <><button className="back" onClick={() => { setSelected(null); onNavigate('Incidents'); reloadList() }}>← Back to incidents</button><IncidentDetail incident={selected} token={token} reload={reload} onNavigate={onNavigate} /></>
  return <section className="panel"><div className="panel-head"><div><p className="eyebrow">CORRELATED CASES</p><h2>Incidents</h2></div></div>{busy && <p>Loading…</p>}{rows?.length ? <div className="incident-list">{rows.map((row) => <button key={row.id} onClick={() => open(row.id)}><div><Badge>{row.severity}</Badge><Badge>{row.status}</Badge></div><h3>{row.title}</h3><p>Risk <b>{row.risk_level}</b> · {row.risk_score}/100</p><span>Open investigation →</span></button>)}</div> : <Empty />}</section>
}

function Integrations({ rows, token, reload }) {
  const [working, setWorking] = useState('')
  const check = async (name) => { setWorking(name); try { await api(`/connectors/${encodeURIComponent(name)}/check`, { token, method: 'POST' }); reload() } finally { setWorking('') } }
  const toggle = async (row) => { setWorking(row.name); try { await api(`/connectors/${encodeURIComponent(row.name)}`, { token, method: 'PATCH', body: { enabled: !row.enabled } }); reload() } finally { setWorking('') } }
  return <section className="panel"><div className="panel-head"><div><p className="eyebrow">ADAPTER STATUS</p><h2>Integration hub</h2></div><span>Secrets remain server-side · optional failures are isolated</span></div><div className="integration-grid">{rows?.map((row) => <article key={row.name}><header><div className="connector-icon" aria-hidden="true">{row.name.slice(0, 2).toUpperCase()}</div><div><h3>{row.name}</h3><small>{row.connector_type} · {row.mode}</small></div><Badge>{row.status}</Badge></header><p>{row.notes}</p><div className="capabilities">{row.capabilities.map((item) => <span key={item}>{item}</span>)}</div><footer><span>{row.last_error || (row.configured ? 'CONFIGURED' : 'CONFIGURATION REQUIRED')}</span><div><button onClick={() => toggle(row)} disabled={working === row.name}>{row.enabled ? 'Disable' : 'Enable'}</button><button onClick={() => check(row.name)} disabled={working === row.name || !row.enabled}>{working === row.name ? 'Working…' : 'Test connection'}</button></div></footer></article>)}</div></section>
}

function Coverage({ data }) {
  return <div className="detail-stack"><section className="panel"><p className="eyebrow">MEASURED, NOT CLAIMED</p><h2>Detection coverage</h2><p className="muted">{data?.scope}</p>{data?.summary?.length ? data.summary.map((item) => <div className="coverage-row large" key={item.tactic}><div><b>{item.tactic}</b><span>{item.coverage_percent}%</span></div><div className="bar"><i style={{ width: `${item.coverage_percent}%` }} /></div></div>) : <Empty text="Run controlled tests to calculate coverage." />}</section><section className="panel"><h3>Executed scenarios</h3>{data?.tests?.length ? <div className="cards-list">{data.tests.map((test) => <div key={test.scenario_id}><Badge>{test.status}</Badge><b>{test.technique_id} · {test.expected_detection}</b><small>{new Date(test.executed_at).toLocaleString()}</small></div>)}</div> : <Empty />}</section></div>
}

function Audit({ rows }) {
  return <section className="panel"><div className="panel-head"><div><p className="eyebrow">ACCOUNTABILITY</p><h2>Audit trail</h2></div></div>{rows?.length ? <div className="table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Target</th><th>Result</th><th>Correlation ID</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.timestamp).toLocaleString()}</td><td>{row.action}</td><td>{row.target_type}<small>{row.target_id || '—'}</small></td><td><Badge>{row.result}</Badge></td><td><code>{row.correlation_id?.slice(0, 12) || '—'}</code></td></tr>)}</tbody></table></div> : <Empty />}</section>
}

function Hunt({ token }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const run = async (event) => { event.preventDefault(); setError(''); try { setResult(await api(`/hunt?q=${encodeURIComponent(query)}`, { token })) } catch (err) { setError(err.message) } }
  return <section className="panel"><p className="eyebrow">CONTROLLED QUERY</p><h2>Threat hunt</h2><form className="hunt-form" onSubmit={run}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Host, user, IP, domain, hash or event type" minLength="2" required /><button className="primary">Search normalized data</button></form>{error && <p className="error-box">{error}</p>}{result && <><h3>{result.events.length} event matches · {result.incidents.length} incidents</h3>{result.events.length ? <div className="cards-list">{result.events.map((item) => <div key={item.id}><Badge>{item.severity}</Badge><b>{item.event_type} on {item.host || 'unknown'}</b><small>{item.source} · {new Date(item.timestamp).toLocaleString()}</small></div>)}</div> : <Empty text="No matching normalized records." />}</>}</section>
}

function RecordsPage({ page, rows }) {
  const messages = {
    'Threat Intelligence': 'IOC records and attributed backend enrichment results.',
    Hosts: 'Host inventory derived from normalized events.',
    Reports: 'Exports generated from persisted incident data.',
    Settings: 'Active response-policy controls. Secrets remain environment-only.',
  }
  const body = () => {
    if (page === 'Threat Intelligence') return <table><thead><tr><th>Type</th><th>Indicator</th><th>Verdict</th><th>Providers</th><th>Incident</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><Badge>{row.type}</Badge></td><td><code>{row.value}</code></td><td><Badge>{row.verdict}</Badge></td><td>{row.providers.filter(Boolean).join(', ') || 'NOT ENRICHED'}</td><td>{row.incident_id.slice(0, 8)}</td></tr>)}</tbody></table>
    if (page === 'Hosts') return <table><thead><tr><th>Host</th><th>Severity</th><th>Events</th><th>Sources</th><th>Last seen</th></tr></thead><tbody>{rows.map((row) => <tr key={row.host}><td><b>{row.host}</b></td><td><Badge>{row.highest_severity}</Badge></td><td>{row.event_count}</td><td>{row.sources.join(', ')}</td><td>{new Date(row.last_seen).toLocaleString()}</td></tr>)}</tbody></table>
    if (page === 'Reports') return <table><thead><tr><th>Generated</th><th>Format</th><th>File</th><th>Incident</th><th>SHA-256</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.generated_at).toLocaleString()}</td><td><Badge>{row.format}</Badge></td><td><b>{row.file_name}</b></td><td>{row.incident_id.slice(0, 8)}</td><td><code>{row.sha256.slice(0, 18)}…</code></td></tr>)}</tbody></table>
    if (page === 'Settings') return <table><thead><tr><th>Policy</th><th>Status</th><th>Pre-approved</th><th>Approval required</th><th>Authorized targets</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><b>{row.name}</b></td><td><Badge>{row.enabled ? 'ENABLED' : 'DISABLED'}</Badge></td><td>{row.preapproved_actions.join(', ') || 'NONE'}</td><td>{row.require_approval_actions.join(', ') || 'NONE'}</td><td>{row.authorized_targets.join(', ') || 'NONE'}</td></tr>)}</tbody></table>
    return null
  }
  return <section className="panel records-page"><div className="panel-head"><div><p className="eyebrow">{page.toUpperCase()}</p><h2>{page}</h2></div><span>{messages[page]}</span></div>{rows?.length ? <div className="table-wrap">{body()}</div> : <Empty text={messages[page]} />}</section>
}

function storedUser() {
  try {
    return JSON.parse(sessionStorage.getItem('ghostsoc-user') || 'null')
  } catch {
    sessionStorage.removeItem('ghostsoc-user')
    sessionStorage.removeItem('ghostsoc-token')
    return null
  }
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('ghostsoc-token'))
  const [user, setUser] = useState(storedUser)
  const [authReady, setAuthReady] = useState(false)
  const [demoAutoAccess, setDemoAutoAccess] = useState(false)
  const [page, setPage] = useState('Overview')
  const [navigationTarget, setNavigationTarget] = useState(null)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const [error, setError] = useState('')
  const loadSequence = useRef(0)
  const endpoint = useMemo(() => page === 'Overview' ? '/dashboard' : pageEndpoint[page], [page])
  useEffect(() => {
    let active = true
    api('/auth/demo-access')
      .then((result) => {
        if (!active) return
        sessionStorage.removeItem('ghostsoc-token')
        sessionStorage.removeItem('ghostsoc-user')
        setToken(null)
        setUser(result.user)
        setDemoAutoAccess(true)
      })
      .catch(() => {})
      .finally(() => { if (active) setAuthReady(true) })
    return () => { active = false }
  }, [])
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current
    if (!authReady || !user || !endpoint) { if (sequence === loadSequence.current) setBusy(false); return }
    setBusy(true); setError('')
    try {
      const result = await api(endpoint, { token })
      if (sequence === loadSequence.current) setData(result)
    } catch (err) {
      if (sequence !== loadSequence.current) return
      if (err.message.includes('Authentication') || err.message.includes('access token')) { sessionStorage.clear(); setToken(null); setUser(null); setError(`Session rejected: ${err.message}`) } else setError(err.message)
    } finally {
      if (sequence === loadSequence.current) setBusy(false)
    }
  }, [authReady, user, token, endpoint])
  useEffect(() => { load() }, [load])
  const doLogin = async (email, password) => { setBusy(true); setError(''); try { const result = await login(email, password); sessionStorage.setItem('ghostsoc-token', result.access_token); sessionStorage.setItem('ghostsoc-user', JSON.stringify(result.user)); setToken(result.access_token); setUser(result.user) } catch (err) { setError(err.message) } finally { setBusy(false) } }
  const runDemo = async () => { setDemoBusy(true); setError(''); try { const result = await api('/demo/run', { token, method: 'POST' }); setError(`Safe demo completed: incident ${result.incident_id.slice(0, 8)}. No external action executed.`); await load() } catch (err) { setError(err.message) } finally { setDemoBusy(false) } }
  const logout = async () => { try { await api('/auth/logout', { token, method: 'POST' }) } finally { sessionStorage.clear(); setToken(null); setUser(null) } }
  const navigate = useCallback((nextPage, targetId = null) => {
    loadSequence.current += 1
    setData(null)
    setNavigationTarget(targetId)
    setPage(nextPage)
  }, [])
  if (!authReady) return <main className="login-shell"><PageLoading label="Opening GhostSOC workspace…" /></main>
  if (!user) return <Login onLogin={doLogin} busy={busy} error={error} />
  let content
  if (page === 'Overview') content = <Overview data={data} onDemo={runDemo} demoBusy={demoBusy} token={token} onNavigate={navigate} />
  else if (page === 'Network') content = <NetworkMode token={token} onNavigate={navigate} />
  else if (['Live Monitor', 'Attacks', 'Web Security'].includes(page)) content = <LiveSecurity page={page} token={token} Badge={Badge} focusId={page === 'Attacks' ? navigationTarget : null} onNavigate={navigate} />
  else if (page === 'Alerts') content = <Alerts rows={data} />
  else if (page === 'Incidents') content = <Incidents rows={data} token={token} reloadList={load} initialId={navigationTarget} onNavigate={navigate} />
  else if (page === 'Integrations') content = <Integrations rows={data} token={token} reload={load} />
  else if (page === 'Detection Coverage') content = <Coverage data={data} />
  else if (page === 'Audit') content = <Audit rows={data} />
  else if (page === 'Hunt') content = <Hunt token={token} />
  else content = <RecordsPage page={page} rows={data} />
  return <div className="app-shell"><Sidebar page={page} setPage={navigate} user={user} onLogout={logout} autoAccess={demoAutoAccess} /><main className="workspace"><GlobalTopbar page={page} user={user} token={token} demoMode={demoAutoAccess} onNavigate={navigate} />{error && <div className={error.startsWith('Safe demo') ? 'success-box' : 'error-box'}>{error}</div>}{busy && !data ? <PageLoading /> : content}</main></div>
}
