import { useState, useEffect } from 'react'
import { Search, Database, Clock, RefreshCw, User, Package, DollarSign, CheckCircle, XCircle, Activity } from 'lucide-react'

// Configure your API URL here after deployment
const API_URL = 'YOUR_QUERY_API_URL'

interface Order {
  orderId: string
  customerId: string
  customerName?: string
  items?: any[]
  totalAmount: number
  status: 'PLACED' | 'CANCELLED'
  createdAt: string
  cancelledAt?: string
}

interface Event {
  eventId: string
  eventType: string
  orderId: string
  customerId: string
  totalAmount: number
  timestamp: string
}

export default function App() {
  const [orders, setOrders] = useState<Order[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'orders' | 'events'>('orders')
  const [customerFilter, setCustomerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PLACED' | 'CANCELLED'>('all')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      let url = `${API_URL}/orders`
      if (customerFilter) url += `?customerId=${encodeURIComponent(customerFilter)}`
      else if (statusFilter !== 'all') url += `?status=${statusFilter}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
    setLoading(false)
    setLastRefresh(new Date())
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/events?limit=50`)
      const data = await response.json()
      
      if (data.success) {
        setEvents(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
    setLoading(false)
    setLastRefresh(new Date())
  }

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
    else fetchEvents()
  }, [activeTab])

  const stats = {
    totalOrders: orders.length,
    placedOrders: orders.filter(o => o.status === 'PLACED').length,
    cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length,
    totalValue: orders.filter(o => o.status === 'PLACED').reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)' }}>
            <Search size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #22c55e, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Query Service
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>Skeleton Crew App #2 - Read Operations (CQRS)</p>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Total Orders" value={stats.totalOrders} icon={<Database size={20} />} color="#3b82f6" />
        <StatCard label="Active Orders" value={stats.placedOrders} icon={<CheckCircle size={20} />} color="#22c55e" />
        <StatCard label="Cancelled" value={stats.cancelledOrders} icon={<XCircle size={20} />} color="#ef4444" />
        <StatCard label="Total Value" value={`$${stats.totalValue.toFixed(2)}`} icon={<DollarSign size={20} />} color="#f59e0b" />
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<Database size={18} />} label="Orders" />
          <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={<Activity size={18} />} label="Event Stream" />
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {lastRefresh && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button onClick={activeTab === 'orders' ? fetchOrders : fetchEvents} disabled={loading} style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Filters (Orders tab only) */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Filter by customer ID..."
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
            >
              <option value="all" style={{ background: '#1a1a3e' }}>All Status</option>
              <option value="PLACED" style={{ background: '#1a1a3e' }}>Placed</option>
              <option value="CANCELLED" style={{ background: '#1a1a3e' }}>Cancelled</option>
            </select>
            <button onClick={fetchOrders} style={{ padding: '12px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
              <Search size={16} /> Search
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', minHeight: '400px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
          ) : activeTab === 'orders' ? (
            orders.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {orders.map(order => (
                  <OrderCard key={order.orderId} order={order} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>No orders found</div>
            )
          ) : (
            events.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {events.map(event => (
                  <EventCard key={event.eventId} event={event} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>No events found</div>
            )
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
        <p>Nexus Blueprint - Skeleton Crew App #2</p>
        <p style={{ marginTop: '4px' }}>Subscribes to events from Command Service via EventBridge</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ background: `rgba(${color === '#3b82f6' ? '59,130,246' : color === '#22c55e' ? '34,197,94' : color === '#ef4444' ? '239,68,68' : '245,158,11'}, 0.1)`, border: `1px solid rgba(${color === '#3b82f6' ? '59,130,246' : color === '#22c55e' ? '34,197,94' : color === '#ef4444' ? '239,68,68' : '245,158,11'}, 0.2)`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
      <div style={{ color, marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{label}</div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{ padding: '12px 20px', borderRadius: '8px', background: active ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.05)', border: active ? 'none' : '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
      {icon} {label}
    </button>
  )
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: order.status === 'PLACED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: order.status === 'PLACED' ? '#22c55e' : '#ef4444' }}>
            {order.status}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{order.orderId}</span>
        </div>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>${(order.totalAmount || 0).toFixed(2)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {order.customerName || order.customerId}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Package size={14} /> {order.items?.length || 0} items</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date(order.createdAt).toLocaleString()}</div>
      </div>
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  const isPlaced = event.eventType === 'OrderPlaced'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${isPlaced ? '#22c55e' : '#ef4444'}` }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isPlaced ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isPlaced ? <CheckCircle size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>{event.eventType}</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{event.orderId}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 600, color: '#22c55e' }}>${(event.totalAmount || 0).toFixed(2)}</div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(event.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  )
}
