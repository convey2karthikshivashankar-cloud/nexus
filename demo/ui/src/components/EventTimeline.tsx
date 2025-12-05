import { useState, useMemo } from 'react'
import { GitBranch, RefreshCw, Clock, Hash, FileJson, Zap, ChevronDown, ChevronRight, Database, Filter, Calendar, ArrowUpDown, Activity, Layers } from 'lucide-react'
import { Event } from '../App'

interface Props { events: Event[]; onRefresh: () => void }
type ViewMode = 'table' | 'timeline' | 'grouped'

export default function EventTimeline({ events, onRefresh }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(false)

  const toggleRow = (eventId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(eventId)) newExpanded.delete(eventId)
    else newExpanded.add(eventId)
    setExpandedRows(newExpanded)
  }

  const handleRefresh = async () => {
    setLoading(true)
    await onRefresh()
    setTimeout(() => setLoading(false), 500)
  }

  const getEventStyle = (type: string) => {
    if (type === 'OrderPlaced') return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' }
    if (type === 'OrderCancelled') return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
    return { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' }
  }

  const filteredEvents = useMemo(() => {
    return (filterType === 'all' ? events : events.filter(e => e.eventType === filterType))
      .sort((a, b) => {
        const cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [events, filterType, sortDir])

  const eventTypes = ['all', ...new Set(events.map(e => e.eventType))]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Event[]> = {}
    filteredEvents.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      if (!groups[date]) groups[date] = []
      groups[date].push(event)
    })
    return groups
  }, [filteredEvents])

  const groupedByAggregate = useMemo(() => {
    const groups: Record<string, Event[]> = {}
    filteredEvents.forEach(event => {
      const aggId = event.aggregateId || 'unknown'
      if (!groups[aggId]) groups[aggId] = []
      groups[aggId].push(event)
    })
    Object.values(groups).forEach(g => g.sort((a, b) => (a.version || 0) - (b.version || 0)))
    return groups
  }, [filteredEvents])

  const stats = useMemo(() => ({
    total: events.length,
    placed: events.filter(e => e.eventType === 'OrderPlaced').length,
    cancelled: events.filter(e => e.eventType === 'OrderCancelled').length,
    maxVersion: Math.max(...events.map(e => e.version || 0), 0),
    aggregates: new Set(events.map(e => e.aggregateId)).size
  }), [events])

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.1))', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', padding: '24px 28px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)' }}>
              <GitBranch size={28} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Event Stream</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>Immutable event log - {events.length} events recorded</p>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.1)', color: 'white' }}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <MiniStat label="Total Events" value={stats.total} color="#a855f7" />
          <MiniStat label="OrderPlaced" value={stats.placed} color="#22c55e" />
          <MiniStat label="OrderCancelled" value={stats.cancelled} color="#ef4444" />
          <MiniStat label="Aggregates" value={stats.aggregates} color="#3b82f6" />
          <MiniStat label="Max Version" value={'v' + stats.maxVersion} color="#f97316" />
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
            <ViewButton active={viewMode === 'timeline'} onClick={() => setViewMode('timeline')} icon={<Calendar size={14} />} label="Timeline" />
            <ViewButton active={viewMode === 'grouped'} onClick={() => setViewMode('grouped')} icon={<Layers size={14} />} label="By Aggregate" />
            <ViewButton active={viewMode === 'table'} onClick={() => setViewMode('table')} icon={<Activity size={14} />} label="Table" />
          </div>
          <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
            <ArrowUpDown size={14} /> {sortDir === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ appearance: 'none', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '8px 36px 8px 14px', color: 'white', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', outline: 'none' }}>
            {eventTypes.map(type => <option key={type} value={type} style={{ background: '#1a1a3e' }}>{type === 'all' ? 'All Event Types' : type}</option>)}
          </select>
          <Filter size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ padding: '0' }}>
        {events.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'timeline' ? (
          <TimelineView groupedByDate={groupedByDate} expandedRows={expandedRows} toggleRow={toggleRow} getEventStyle={getEventStyle} />
        ) : viewMode === 'grouped' ? (
          <AggregateView groupedByAggregate={groupedByAggregate} expandedRows={expandedRows} toggleRow={toggleRow} getEventStyle={getEventStyle} />
        ) : (
          <TableView events={filteredEvents} expandedRows={expandedRows} toggleRow={toggleRow} getEventStyle={getEventStyle} />
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function TimelineView({ groupedByDate, expandedRows, toggleRow, getEventStyle }: any) {
  return (
    <div style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
      {Object.entries(groupedByDate).map(([date, dateEvents]: [string, any]) => (
        <div key={date} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={22} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem' }}>{date}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{dateEvents.length} events</div>
            </div>
          </div>
          <div style={{ marginLeft: '22px', borderLeft: '2px solid rgba(168, 85, 247, 0.2)', paddingLeft: '24px' }}>
            {dateEvents.map((event: Event, idx: number) => {
              const style = getEventStyle(event.eventType)
              const isExpanded = expandedRows.has(event.eventId)
              return (
                <div key={event.eventId} style={{ position: 'relative', marginBottom: idx < dateEvents.length - 1 ? '12px' : 0 }}>
                  <div style={{ position: 'absolute', left: '-33px', top: '16px', width: '16px', height: '16px', borderRadius: '50%', background: style.color, border: '3px solid #1a1a3e' }} />
                  <EventCard event={event} style={style} isExpanded={isExpanded} onToggle={() => toggleRow(event.eventId)} />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function AggregateView({ groupedByAggregate, expandedRows, toggleRow, getEventStyle }: any) {
  return (
    <div style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
      {Object.entries(groupedByAggregate).map(([aggId, aggEvents]: [string, any]) => (
        <div key={aggId} style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} color="#3b82f6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>{aggId.substring(0, 32)}...</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{aggEvents.length} events - Latest: v{Math.max(...aggEvents.map((e: Event) => e.version || 0))}</div>
            </div>
          </div>
          <div style={{ padding: '12px' }}>
            {aggEvents.map((event: Event, idx: number) => {
              const style = getEventStyle(event.eventType)
              const isExpanded = expandedRows.has(event.eventId)
              return (
                <div key={event.eventId} style={{ marginBottom: idx < aggEvents.length - 1 ? '8px' : 0 }}>
                  <EventCard event={event} style={style} isExpanded={isExpanded} onToggle={() => toggleRow(event.eventId)} compact />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function TableView({ events, expandedRows, toggleRow, getEventStyle }: any) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <div style={{ width: '50px' }}>#</div>
        <div style={{ flex: 2 }}>Event Type</div>
        <div style={{ flex: 2 }}>Aggregate ID</div>
        <div style={{ width: '80px' }}>Version</div>
        <div style={{ flex: 1 }}>Date</div>
        <div style={{ flex: 1 }}>Time</div>
        <div style={{ width: '80px', textAlign: 'center' }}>Details</div>
      </div>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {events.map((event: Event, index: number) => {
          const style = getEventStyle(event.eventType)
          const isExpanded = expandedRows.has(event.eventId)
          const date = new Date(event.timestamp)
          return (
            <div key={event.eventId}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                <div style={{ width: '50px' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, background: style.bg, color: style.color }}>{events.length - index}</span></div>
                <div style={{ flex: 2 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', background: style.bg, border: '1px solid ' + style.border, color: style.color }}><Zap size={12} /> {event.eventType}</span></div>
                <div style={{ flex: 2, fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{event.aggregateId?.substring(0, 20) || 'N/A'}...</div>
                <div style={{ width: '80px', display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={12} color="rgba(255,255,255,0.3)" /><span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>v{event.version}</span></div>
                <div style={{ flex: 1, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{date.toLocaleDateString()}</div>
                <div style={{ flex: 1, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{date.toLocaleTimeString()}</div>
                <div style={{ width: '80px', textAlign: 'center' }}>
                  <button onClick={() => toggleRow(event.eventId)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', background: isExpanded ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: '1px solid ' + (isExpanded ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.1)'), color: isExpanded ? '#a855f7' : 'rgba(255, 255, 255, 0.5)' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
              {isExpanded && <PayloadView event={event} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventCard({ event, style, isExpanded, onToggle, compact = false }: { event: Event; style: any; isExpanded: boolean; onToggle: () => void; compact?: boolean }) {
  const date = new Date(event.timestamp)
  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid ' + style.border, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: compact ? '12px 16px' : '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', background: style.bg, border: '1px solid ' + style.border, color: style.color }}><Zap size={12} /> {event.eventType}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}><Clock size={12} /> {date.toLocaleTimeString()}</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>v{event.version}</span>
        </div>
        <button onClick={onToggle} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', background: isExpanded ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: '1px solid ' + (isExpanded ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.1)'), color: isExpanded ? '#a855f7' : 'rgba(255, 255, 255, 0.5)' }}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      {!compact && <div style={{ padding: '0 20px 12px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>Aggregate: {event.aggregateId?.substring(0, 32)}...</div>}
      {isExpanded && <PayloadView event={event} />}
    </div>
  )
}

function PayloadView({ event }: { event: Event }) {
  return (
    <div style={{ padding: '0 20px 16px', background: 'rgba(168, 85, 247, 0.03)', borderTop: '1px solid rgba(168, 85, 247, 0.1)' }}>
      <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(168, 85, 247, 0.15)', borderRadius: '10px', padding: '14px', marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}><FileJson size={12} /> Event Payload</div>
        <pre style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.75)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, lineHeight: 1.5 }}>{JSON.stringify(event.payload, null, 2)}</pre>
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', marginBottom: '10px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}><Database size={12} /> Metadata</div>
            <pre style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, lineHeight: 1.5 }}>{JSON.stringify(event.metadata, null, 2)}</pre>
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Database size={40} color="rgba(255,255,255,0.2)" /></div>
      <h3 style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '8px' }}>No Events Yet</h3>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>Execute commands to see events appear in the stream</p>
    </div>
  )
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: active ? 'rgba(168, 85, 247, 0.3)' : 'transparent', color: active ? '#a855f7' : 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>{icon} {label}</button>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color, marginBottom: '2px' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500, textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

