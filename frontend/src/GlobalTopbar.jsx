import { useEffect, useRef, useState } from 'react'
import { api } from './api.js'

export default function GlobalTopbar({ page, user, token, demoMode, onNavigate }) {
  const [health, setHealth] = useState('CHECKING')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dashboard, setDashboard] = useState(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const response = await fetch('/api/v1/health', { cache: 'no-store' })
        if (!response.ok) throw new Error('health check failed')
        if (active) setHealth('LIVE')
      } catch { if (active) setHealth('DEGRADED') }
    }
    check(); const interval = setInterval(check, 30_000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  useEffect(() => {
    let active = true
    const load = () => api('/dashboard', { token }).then((data) => { if (active) setDashboard(data) }).catch(() => {})
    load(); const interval = setInterval(load, 30_000)
    return () => { active = false; clearInterval(interval) }
  }, [token])

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setSearchError(''); setSearching(false); return }
    setSearching(true); setSearchError('')
    const timer = setTimeout(() => {
      api(`/search/global?q=${encodeURIComponent(query.trim())}&limit=20`, { token })
        .then((data) => { setResults(data.results); setSelectedIndex(-1) })
        .catch((error) => { setResults([]); setSearchError(error.message) })
        .finally(() => setSearching(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, token])

  const choose = (item) => {
    onNavigate(item.page, item.id)
    setQuery(''); setResults([]); setSelectedIndex(-1)
  }
  const keyDown = (event) => {
    if (event.key === 'Escape') { setQuery(''); setResults([]); searchRef.current?.blur() }
    if (event.key === 'ArrowDown') { event.preventDefault(); setSelectedIndex((index) => Math.min(results.length - 1, index + 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setSelectedIndex((index) => Math.max(-1, index - 1)) }
    if (event.key === 'Enter' && selectedIndex >= 0) { event.preventDefault(); choose(results[selectedIndex]) }
  }
  const mode = page === 'Network' ? 'NETWORK' : page === 'Incidents' ? 'INVESTIGATE' : 'SOC'
  const critical = dashboard?.metrics?.critical_alerts || 0
  return <><header className="global-topbar"><div className="page-identity"><p className="eyebrow">GHOSTSOC / {page.toUpperCase()}</p><h1>{page}</h1></div><div className="global-controls">
    <div className={`live-indicator ${health.toLowerCase()}`}><i /><span>{health}</span></div>
    <div className="global-search"><label><span className="sr-only">Global search</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={keyDown} placeholder="Search incidents, IPs, hosts, hashes…" aria-expanded={query.length >= 2} aria-controls="global-search-results" /></label>{query.length >= 2 && <div className="search-results" id="global-search-results">{searching && <p>Searching persisted security data…</p>}{searchError && <div className="search-error"><b>SEARCH FAILED</b><span>{searchError}</span></div>}{!searching && !searchError && !results.length && <p>No matching security records.</p>}{results.map((item, index) => <button key={`${item.type}-${item.id}`} className={selectedIndex === index ? 'selected' : ''} onMouseEnter={() => setSelectedIndex(index)} onClick={() => choose(item)}><span className={`result-type severity-${item.severity.toLowerCase()}`}>{item.type}</span><div><b>{item.title}</b><small>{item.subtitle}</small></div>{item.status && <em>{item.status.replaceAll('_', ' ')}</em>}</button>)}</div>}</div>
    <button className="notification-button" onClick={() => setNotificationsOpen((open) => !open)} aria-expanded={notificationsOpen}><span>Alerts</span><b>{critical}</b></button>
    <div className="environment-indicator">{demoMode ? 'DEMO' : 'SECURE'}</div>
    <div className="topbar-user"><b>{user.email}</b><span>{user.role}</span></div>
  </div>{notificationsOpen && <aside className="notification-panel"><header><b>Operational attention</b><button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">×</button></header>{dashboard?.incidents?.length ? dashboard.incidents.slice(0, 5).map((item) => <button key={item.id} onClick={() => { onNavigate('Incidents', item.id); setNotificationsOpen(false) }}><span className={`severity-dot severity-${item.severity.toLowerCase()}`} /><div><b>{item.title}</b><small>{item.risk_level} risk · {item.status}</small></div></button>) : <p>No active incident notifications.</p>}</aside>}</header>
  <nav className="mode-switcher" aria-label="Visualization mode"><button className={mode === 'SOC' ? 'active' : ''} onClick={() => onNavigate('Overview')}>SOC<span>What is happening now</span></button><button className={mode === 'NETWORK' ? 'active' : ''} onClick={() => onNavigate('Network')}>Network<span>Communication topology</span></button><button className={mode === 'INVESTIGATE' ? 'active' : ''} onClick={() => onNavigate('Incidents')}>Investigate<span>Incident relationships</span></button></nav></>
}
