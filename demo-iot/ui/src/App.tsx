import { useState, useEffect } from 'react'
import { Activity, Zap, Database, GitBranch, BarChart3, Sparkles, Shield, Cpu, Globe, Layers, Thermometer, AlertTriangle } from 'lucide-react'
import SensorDashboard from './components/SensorDashboard'
import EventTimeline from './components/EventTimeline'
import PerformanceMetrics from './components/PerformanceMetrics'
import LoadTester from './components/LoadTester'
import ArchitectureDiagram from './components/ArchitectureDiagram'
import CQRSDemo from './components/CQRSDemo'

const API_URL = 'https://uvxdbghsvi.execute-api.us-east-2.amazonaws.com/prod'

export interface Sensor {
  sensorId: string
  sensorType: string
  location: string
  status: string
  lastReading: number | null
  lastReadingAt: string | null
  readingCount: number
  thresholds: { min: number; max: number }
  unit: string
  createdAt: string
  updatedAt: string
}

export interface Reading {
  sensorId: string
  readingId: string
  value: number
  unit: string
  quality: string
  timestamp: string
}

export interface Alert {
  alertId: string
  sensorId: string
  alertType: string
  severity: string
  message: string
  value: number
  threshold: number
  status: string
  triggeredAt: string
  acknowledgedAt: string | null
}

export interface Event {
  eventId: string
  eventType: string
  aggregateId: string
  version: number
  timestamp: string
  payload: any
  metadata: any
}

export interface Metrics {
  totalSensors: number
  totalReadings: number
  totalEvents: number
  activeAlerts: number
  avgReading: number
}

function App() {
  const [activeTab, setActiveTab] = useState('cqrs')
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [metrics, setMetrics] = useState<Metrics>({
    totalSensors: 0,
    totalReadings: 0,
    totalEvents: 0,
    activeAlerts: 0,
    avgReading: 0,
  })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [avgLatency, setAvgLatency] = useState(0)

  const fetchSensors = async () => {
    try {
      const response = await fetch(`${API_URL}/queries`)
      const data = await response.json()
      setSensors(data.items || [])
      if (data.stats) {
        setMetrics(data.stats)
      }
    } catch (error) {
      console.error('Error fetching sensors:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events`)
      const data = await response.json()
      setEvents(data.items || [])
      setMetrics(prev => ({ ...prev, totalEvents: data.total || 0 }))
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts`)
      const data = await response.json()
      setAlerts(data.items || [])
      const active = (data.items || []).filter((a: Alert) => a.status !== 'acknowledged').length
      setMetrics(prev => ({ ...prev, activeAlerts: active }))
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const registerSensor = async (sensorData: any) => {
    const startTime = Date.now()
    try {
      const response = await fetch(`${API_URL}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandType: 'RegisterSensor', ...sensorData }),
      })
      const data = await response.json()
      const latency = Date.now() - startTime
      setAvgLatency(prev => prev === 0 ? latency : (prev + latency) / 2)
      setTimeout(() => { fetchSensors(); fetchEvents() }, 500)
      return { success: true, data, latency }
    } catch (error) {
      return { success: false, error }
    }
  }

  const recordReading = async (readingData: any) => {
    const startTime = Date.now()
    try {
      const response = await fetch(`${API_URL}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandType: 'RecordReading', ...readingData }),
      })
      const data = await response.json()
      const latency = Date.now() - startTime
      setAvgLatency(prev => prev === 0 ? latency : (prev + latency) / 2)
      setTimeout(() => { fetchSensors(); fetchEvents() }, 500)
      return { success: true, data, latency }
    } catch (error) {
      return { success: false, error }
    }
  }

  const triggerAlert = async (alertData: any) => {
    const startTime = Date.now()
    try {
      const response = await fetch(`${API_URL}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandType: 'TriggerAlert', ...alertData }),
      })
      const data = await response.json()
      const latency = Date.now() - startTime
      setTimeout(() => { fetchAlerts(); fetchEvents() }, 500)
      return { success: true, data, latency }
    } catch (error) {
      return { success: false, error }
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`${API_URL}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandType: 'AcknowledgeAlert', alertId }),
      })
      setTimeout(() => { fetchAlerts(); fetchEvents() }, 500)
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  useEffect(() => {
    fetchSensors()
    fetchEvents()
    fetchAlerts()
    if (autoRefresh) {
      const interval = setInterval(() => { fetchSensors(); fetchEvents(); fetchAlerts() }, 3000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const tabs = [
    { id: 'cqrs', label: 'CQRS Demo', icon: Layers, color: '#ec4899' },
    { id: 'dashboard', label: 'Sensors', icon: Thermometer, color: '#3b82f6' },
    { id: 'events', label: 'Event Stream', icon: GitBranch, color: '#a855f7' },
    { id: 'performance', label: 'Metrics', icon: BarChart3, color: '#22c55e' },
    { id: 'loadtest', label: 'Load Test', icon: Zap, color: '#f97316' },
    { id: 'architecture', label: 'Architecture', icon: Database, color: '#6366f1' },
  ]

  const stats = [
    { label: 'Total Sensors', value: metrics.totalSensors, icon: Thermometer, color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { label: 'Event Stream', value: metrics.totalEvents, icon: GitBranch, color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)' },
    { label: 'Avg Latency', value: `${avgLatency.toFixed(0)}ms`, icon: Zap, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #10b981)' },
    { label: 'Active Alerts', value: metrics.activeAlerts, icon: AlertTriangle, color: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #eab308)' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f2d 100%)',
      color: 'white',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Background Effects */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)', top: '-200px', right: '-200px' }} />
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%)', bottom: '-150px', left: '-150px' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        
        {/* Header Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '24px',
        }}>
          {/* Top Row: Logo + Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #06b6d4, #22c55e, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
                position: 'relative',
              }}>
                <Thermometer size={36} color="white" />
                <div style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e, #10b981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={14} color="white" />
                </div>
              </div>
              <div>
                <h1 style={{
                  fontSize: '2.25rem', fontWeight: 900, marginBottom: '6px',
                  background: 'linear-gradient(135deg, #06b6d4, #22c55e, #3b82f6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>Nexus IoT Demo</h1>
                <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
                  Event-Sourced CQRS for IoT Sensor Data
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                    <Shield size={14} /> Governance-First
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                    <Cpu size={14} /> Serverless
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                    <Globe size={14} /> Real-time
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)',
                color: '#22c55e', fontWeight: 600, fontSize: '0.9rem',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                LIVE
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  padding: '12px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                  background: autoRefresh ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.08)',
                  color: 'white', boxShadow: autoRefresh ? '0 4px 20px rgba(34, 197, 94, 0.3)' : 'none',
                }}
              >
                {autoRefresh ? '🔄 Auto-Refresh' : '⏸️ Paused'}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '16px', padding: '20px',
                  transition: 'all 0.3s', cursor: 'default',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: stat.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '14px', boxShadow: `0 4px 20px ${stat.color}30`,
                  }}>
                    <Icon size={24} color="white" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', marginBottom: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px', padding: '8px', marginBottom: '24px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, gap: '8px' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '14px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem',
                    border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                    background: isActive ? tab.color : 'transparent',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                    boxShadow: isActive ? `0 4px 20px ${tab.color}40` : 'none',
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div>
          {activeTab === 'cqrs' && (
            <CQRSDemo
              onRegisterSensor={registerSensor}
              onRecordReading={recordReading}
              sensors={sensors}
              events={events}
              onRefresh={() => { fetchSensors(); fetchEvents() }}
            />
          )}
          {activeTab === 'dashboard' && (
            <SensorDashboard
              sensors={sensors}
              alerts={alerts}
              onRegisterSensor={registerSensor}
              onRecordReading={recordReading}
              onTriggerAlert={triggerAlert}
              onAcknowledgeAlert={acknowledgeAlert}
              onRefresh={() => { fetchSensors(); fetchAlerts(); fetchEvents() }}
            />
          )}
          {activeTab === 'events' && <EventTimeline events={events} onRefresh={fetchEvents} />}
          {activeTab === 'performance' && <PerformanceMetrics metrics={metrics} events={events} avgLatency={avgLatency} />}
          {activeTab === 'loadtest' && <LoadTester onTest={recordReading} onComplete={() => { fetchSensors(); fetchEvents() }} />}
          {activeTab === 'architecture' && <ArchitectureDiagram />}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '24px' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px', padding: '14px 28px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500, fontSize: '0.9rem' }}>
              🌡️ Nexus IoT Demo — CQRS + Event Sourcing for Sensor Data
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '4px' }}>
              AWS Lambda • DynamoDB • API Gateway • EventBridge • React
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
