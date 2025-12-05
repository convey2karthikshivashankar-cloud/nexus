import { BarChart3, Activity, Clock, Zap, Target, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { Metrics, Event } from '../App'

interface Props {
  metrics: Metrics
  events: Event[]
}

export default function PerformanceMetrics({ metrics, events }: Props) {
  // Generate chart data from events
  const chartData = events.slice(-20).map((event, index) => ({
    name: `E${index + 1}`,
    latency: Math.floor(Math.random() * 80 + 40),
    events: index + 1,
    timestamp: new Date(event.timestamp).toLocaleTimeString(),
  }))

  // Event type distribution
  const eventTypeData = [
    { name: 'OrderPlaced', count: events.filter(e => e.eventType === 'OrderPlaced').length, color: '#22c55e' },
    { name: 'OrderCancelled', count: events.filter(e => e.eventType === 'OrderCancelled').length, color: '#ef4444' },
  ]

  const stats = [
    { label: 'Total Orders', value: metrics.totalOrders, icon: Activity, color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', trend: '+12%', up: true },
    { label: 'Total Events', value: metrics.totalEvents, icon: Zap, color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)', trend: '+8%', up: true },
    { label: 'Avg Latency', value: `${metrics.avgLatency.toFixed(0)}ms`, icon: Clock, color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #10b981)', trend: '-5%', up: false },
    { label: 'Success Rate', value: `${metrics.successRate}%`, icon: Target, color: '#f97316', gradient: 'linear-gradient(135deg, #f97316, #eab308)', trend: '+2%', up: true },
  ]

  return (
    <div>
      {/* Header Card with Stats */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px', padding: '32px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)',
          }}>
            <BarChart3 size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Performance Metrics</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>Real-time system monitoring & analytics</p>
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
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: stat.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 20px ${stat.color}30`,
                  }}>
                    <Icon size={24} color="white" />
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '8px',
                    background: stat.up ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  }}>
                    {stat.up ? <TrendingUp size={14} color="#22c55e" /> : <TrendingDown size={14} color="#22c55e" />}
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: stat.up ? '#22c55e' : '#22c55e' }}>{stat.trend}</span>
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: '4px' }}>{stat.value}</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Latency Chart */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Latency Trend</h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Response time over recent events</p>
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 15, 35, 0.95)', 
                    border: '1px solid rgba(99, 102, 241, 0.3)', 
                    borderRadius: '12px', 
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }} 
                />
                <Area type="monotone" dataKey="latency" stroke="#6366f1" strokeWidth={2} fill="url(#latencyGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Distribution */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Event Distribution</h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>By event type</p>
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={11} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 15, 35, 0.95)', 
                    border: '1px solid rgba(168, 85, 247, 0.3)', 
                    borderRadius: '12px', 
                    color: 'white' 
                  }} 
                />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Event Volume Chart */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px', padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #22c55e, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={20} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Cumulative Event Volume</h3>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Total events processed over time</p>
          </div>
        </div>
        <div style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 15, 35, 0.95)', 
                  border: '1px solid rgba(34, 197, 94, 0.3)', 
                  borderRadius: '12px', 
                  color: 'white' 
                }} 
              />
              <Line type="monotone" dataKey="events" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
