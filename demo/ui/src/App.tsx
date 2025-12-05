// Updated: Force rebuild v3 - Fixed Orders and Events tabs
import { useState, useEffect } from 'react'
import { Activity, Zap, Database, GitBranch, BarChart3, Sparkles, Shield, Cpu, Globe, Layers } from 'lucide-react'
import OrderDashboard from './components/OrderDashboard'
import EventTimeline from './components/EventTimeline'
import PerformanceMetrics from './components/PerformanceMetrics'
import LoadTester from './components/LoadTester'
import ArchitectureDiagram from './components/ArchitectureDiagram'
import CQRSDemo from './components/CQRSDemo.tsx'

const API_URL = 'https://6lo5q41e31.execute-api.us-east-2.amazonaws.com/prod'

export interface Order {
  orderId: string
  customerId: string
  status: string
  totalAmount: number
  items: any[]
  createdAt: string
  updatedAt: string
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
  totalOrders: number
  totalEvents: number
  avgLatency: number
  successRate: number
}

function App() {
  const [activeTab, setActiveTab] = useState('cqrs')
  const [orders, setOrders] = useState<Order[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrders: 0,
    totalEvents: 0,
    avgLatency: 0,
    successRate: 100,
  })
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/queries`)
      const data = await response.json()
      setOrders(data.items || [])
      setMetrics(prev => ({ ...prev, totalOrders: data.total || 0 }))
    } catch (error) {
      console.error('Error fetching orders:', error)
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

  const placeOrder = async (orderData: any) => {
    const startTime = Date.now()
    try {
      const response = await fetch(`${API_URL}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandType: 'OrderPlaced', ...orderData }),
      })
      const data = await response.json()
      const latency = Date.now() - startTime
      setMetrics(prev => ({
        ...prev,
        avgLatency: prev.avgLatency === 0 ? latency : (prev.avgLatency + latency) / 2,
      }))
      setTimeout(() => { fetchOrders(); fetchEvents() }, 500)
      return { success: true, data, latency }
    } catch (error) {
      return { success: false, error }
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      await fetch(`${API_URL}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandType: 'OrderCancelled', aggregateId: orderId }),
      })
      setTimeout(() => { fetchOrders(); fetchEvents() }, 500)
      return { success: true }
    } catch (error) {
      return { success: false, error }
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchEvents()
    if (autoRefresh) {
      const interval = setInterval(() => { fetchOrders(); fetchEvents() }, 3000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const tabs = [
    { id: 'cqrs', label: 'CQRS Demo', icon: Layers, color: '#ec4899' },
    { id: 'dashboard', label: 'Orders', icon: Activity, color: '#3b82f6' },
    { id: 'events', label: 'Event Stream', icon: GitBranch, color: '#a855f7' },
    { id: 'performance', label: 'Metrics', icon: BarChart3, color: '#22c55e' },
    { id: 'loadtest', label: 'Load Test', icon: Zap, color: '#f97316' },
    { id: 'architecture', label: 'Architecture', icon: Database, color: '#6366f1' },
  ]

  const stats = [
    { label: 'Total Orders', value: metrics.totalOrders, icon: Activity, color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
    { label: 'Event Stream', value: metrics.totalEvents, icon: GitBranch, color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)' },
    { label: 'Avg Latency', value: `${metrics.avgLatency.toFixed(0)}ms`, icon: Zap, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #10b981)' },
    { label: 'Success Rate', value: `${metrics.successRate}%`, icon: Shield, color: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #eab308)' },
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
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', top: '-200px', right: '-200px' }} />
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%)', bottom: '-150px', left: '-150px' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
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
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)',
                position: 'relative',
              }}>
                <Database size={36} color="white" />
                <div style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fbbf24, #f97316)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={14} color="white" />
                </div>
              </div>
              <div>
                <h1 style={{
                  fontSize: '2.25rem', fontWeight: 900, marginBottom: '6px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>Nexus Blueprint 3.0</h1>
                <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
                  Event-Sourced CQRS Microservice Architecture
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
              onPlaceOrder={placeOrder}
              onCancelOrder={cancelOrder}
              orders={orders}
              events={events}
              onRefresh={() => { fetchOrders(); fetchEvents() }}
            />
          )}
          {activeTab === 'dashboard' && (
            <OrderDashboard
              orders={orders}
              onPlaceOrder={placeOrder}
              onCancelOrder={cancelOrder}
              onRefresh={() => { fetchOrders(); fetchEvents() }}
            />
          )}
          {activeTab === 'events' && <EventTimeline events={events} onRefresh={fetchEvents} />}
          {activeTab === 'performance' && <PerformanceMetrics metrics={metrics} events={events} />}
          {activeTab === 'loadtest' && <LoadTester onTest={placeOrder} onComplete={() => { fetchOrders(); fetchEvents() }} />}
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
              🚀 Nexus Blueprint 3.0 — Next-Generation Event Architecture
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '4px' }}>
              AWS Lambda • DynamoDB • API Gateway • EventBridge • React
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; }
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default App
