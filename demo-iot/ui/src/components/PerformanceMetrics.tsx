import { useMemo } from 'react'
import { BarChart3, Zap, Activity, Clock, TrendingUp, Thermometer, AlertTriangle } from 'lucide-react'
import { Metrics, Event } from '../App'

interface Props {
  metrics: Metrics
  events: Event[]
  avgLatency: number
}

export default function PerformanceMetrics({ metrics, events, avgLatency }: Props) {
  const eventsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach(e => {
      counts[e.eventType] = (counts[e.eventType] || 0) + 1
    })
    return Object.entries(counts).map(([type, count]) => ({ type, count }))
  }, [events])

  const recentEvents = useMemo(() => {
    return events.slice(0, 10).map(e => ({
      type: e.eventType,
      time: new Date(e.timestamp).toLocaleTimeString(),
    }))
  }, [events])

  const getEventColor = (type: string) => {
    switch (type) {
      case 'SensorRegistered': return '#22c55e'
      case 'ReadingRecorded': return '#06b6d4'
      case 'AlertTriggered': return '#f97316'
      case 'AlertAcknowledged': return '#a855f7'
      default: return '#6366f1'
    }
  }

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))', borderBottom: '1px solid rgba(34, 197, 94, 0.2)', padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #22c55e, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)' }}>
            <BarChart3 size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>IoT Performance Metrics</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>Real-time system performance and event analytics</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <MetricCard icon={<Thermometer size={24} />} label="Total Sensors" value={metrics.totalSensors} color="#06b6d4" />
          <MetricCard icon={<Activity size={24} />} label="Total Readings" value={metrics.totalReadings} color="#22c55e" />
          <MetricCard icon={<Zap size={24} />} label="Avg Latency" value={`${avgLatency.toFixed(0)}ms`} color="#f97316" />
          <MetricCard icon={<AlertTriangle size={24} />} label="Active Alerts" value={metrics.activeAlerts} color="#ef4444" />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Event Distribution */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={18} color="#22c55e" /> Event Distribution
            </h3>
            {eventsByType.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                No events recorded yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {eventsByType.map(({ type, count }) => {
                  const maxCount = Math.max(...eventsByType.map(e => e.count))
                  const percentage = (count / maxCount) * 100
                  const color = getEventColor(type)
                  return (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 500 }}>{type}</span>
                        <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{count}</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percentage}%`, background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} color="#a855f7" /> Recent Activity
            </h3>
            {recentEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                No recent activity
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {recentEvents.map((event, idx) => {
                  const color = getEventColor(event.type)
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: '10px' }}>
                      <span style={{ color, fontWeight: 600, fontSize: '0.85rem' }}>{event.type}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{event.time}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div style={{ marginTop: '24px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '20px' }}>System Health</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <HealthIndicator label="Event Store" status="healthy" />
            <HealthIndicator label="Read Models" status="healthy" />
            <HealthIndicator label="Stream Processor" status="healthy" />
            <HealthIndicator label="API Gateway" status="healthy" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '20px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color }}>
        {icon}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function HealthIndicator({ label, status }: { label: string; status: 'healthy' | 'warning' | 'error' }) {
  const colors = { healthy: '#22c55e', warning: '#f97316', error: '#ef4444' }
  const color = colors[status]
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: '12px' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
      <div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
        <div style={{ color, fontSize: '0.75rem', fontWeight: 500, textTransform: 'capitalize' }}>{status}</div>
      </div>
    </div>
  )
}
