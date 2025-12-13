import { useState, useMemo } from 'react'
import { ShoppingCart, Plus, RefreshCw, X, CheckCircle, XCircle, User, DollarSign, Clock, Package, ArrowUpDown, Search, Calendar, TrendingUp } from 'lucide-react'
import { Order } from '../App'

interface Props {
  orders: Order[]
  onPlaceOrder: (data: any) => Promise<any>
  onCancelOrder: (orderId: string) => Promise<any>
  onRefresh: () => void
}

type ViewMode = 'table' | 'chronology'
type SortField = 'createdAt' | 'status' | 'totalAmount'

export default function OrderDashboard({ orders, onPlaceOrder, onCancelOrder, onRefresh }: Props) {
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [customerName, setCustomerName] = useState('John Doe')
  const [productName, setProductName] = useState('Premium Widget')
  const [quantity, setQuantity] = useState(2)
  const [unitPrice, setUnitPrice] = useState(49.99)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('chronology')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PLACED' | 'CANCELLED'>('all')

  const totalAmount = useMemo(() => quantity * unitPrice, [quantity, unitPrice])

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || quantity < 1 || unitPrice <= 0) {
      setMessage({ type: 'error', text: 'Please fill all fields correctly' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setLoading(true)
    const orderData = {
      customerId: customerName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36),
      customerName,
      items: [{ productId: productName.toLowerCase().replace(/\s+/g, '-'), productName, quantity, price: unitPrice }],
      totalAmount: totalAmount
    }
    const result = await onPlaceOrder(orderData)
    setLoading(false)
    if (result.success) {
      setMessage({ type: 'success', text: `Order placed! Total: $${totalAmount.toFixed(2)} (Latency: ${result.latency}ms)` })
      setShowNewOrder(false)
      setCustomerName('John Doe')
      setProductName('Premium Widget')
      setQuantity(2)
      setUnitPrice(49.99)
    } else {
      setMessage({ type: 'error', text: 'Failed to place order' })
    }
    setTimeout(() => setMessage(null), 4000)
  }

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId)
    const result = await onCancelOrder(orderId)
    setCancellingId(null)
    if (result.success) {
      setMessage({ type: 'success', text: 'Order cancelled successfully!' })
    } else {
      setMessage({ type: 'error', text: 'Failed to cancel order' })
    }
    setTimeout(() => setMessage(null), 4000)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = searchTerm === '' || 
        o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (o.customerId || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      return matchesSearch && matchesStatus
    }).sort((a, b) => {
      let cmp = 0
      if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      else if (sortField === 'status') cmp = (a.status || '').localeCompare(b.status || '')
      else if (sortField === 'totalAmount') cmp = (a.totalAmount || 0) - (b.totalAmount || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [orders, searchTerm, statusFilter, sortField, sortDir])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Order[]> = {}
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      if (!groups[date]) groups[date] = []
      groups[date].push(order)
    })
    return groups
  }, [filteredOrders])

  const stats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status === 'PLACED')
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED')
    const totalValue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    const avgValue = activeOrders.length > 0 ? totalValue / activeOrders.length : 0
    return { total: orders.length, active: activeOrders.length, cancelled: cancelledOrders.length, totalValue, avgValue }
  }, [orders])

  return (
    <div>
      {message && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '14px', marginBottom: '20px', background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: message.type === 'success' ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {message.type === 'success' ? <CheckCircle size={20} color="white" /> : <XCircle size={20} color="white" />}
          </div>
          <span style={{ color: 'white', fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}>
              <ShoppingCart size={28} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Order Management</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>Track and manage all orders</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onRefresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer' }}>
              <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
            </button>
            <button onClick={() => setShowNewOrder(!showNewOrder)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}>
              <Plus size={18} /> New Order
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          <StatCard icon={<Package size={18} />} label="Total Orders" value={stats.total} color="#3b82f6" />
          <StatCard icon={<CheckCircle size={18} />} label="Active" value={stats.active} color="#22c55e" />
          <StatCard icon={<XCircle size={18} />} label="Cancelled" value={stats.cancelled} color="#ef4444" />
          <StatCard icon={<DollarSign size={18} />} label="Total Value" value={`$${stats.totalValue.toFixed(2)}`} color="#a855f7" />
          <StatCard icon={<TrendingUp size={18} />} label="Avg Order" value={`$${stats.avgValue.toFixed(2)}`} color="#f97316" />
        </div>

        {showNewOrder && (
          <div style={{ marginTop: '24px', padding: '24px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color="white" /></div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Create New Order</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <InputField label="Customer Name" value={customerName} onChange={setCustomerName} placeholder="John Doe" />
              <InputField label="Product Name" value={productName} onChange={setProductName} placeholder="Premium Widget" />
              <InputField label="Quantity" value={quantity} onChange={(v) => setQuantity(Math.max(1, parseInt(v) || 1))} type="number" />
              <InputField label="Unit Price ($)" value={unitPrice} onChange={(v) => setUnitPrice(Math.max(0.01, parseFloat(v) || 0.01))} type="number" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>Total: ${totalAmount.toFixed(2)}</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handlePlaceOrder} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: loading ? 'wait' : 'pointer', background: loading ? 'rgba(34, 197, 94, 0.3)' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)' }}>
                  {loading ? 'Processing...' : `Place Order ($${totalAmount.toFixed(2)})`}
                </button>
                <button onClick={() => setShowNewOrder(false)} style={{ padding: '12px 20px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setViewMode('chronology')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === 'chronology' ? 'rgba(59, 130, 246, 0.3)' : 'transparent', color: viewMode === 'chronology' ? '#3b82f6' : 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} />Chronology
              </button>
              <button onClick={() => setViewMode('table')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === 'table' ? 'rgba(59, 130, 246, 0.3)' : 'transparent', color: viewMode === 'table' ? '#3b82f6' : 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={14} />Table
              </button>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} style={{ appearance: 'none', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', outline: 'none' }}>
              <option value="all" style={{ background: '#1a1a3e' }}>All Status</option>
              <option value="PLACED" style={{ background: '#1a1a3e' }}>Active Only</option>
              <option value="CANCELLED" style={{ background: '#1a1a3e' }}>Cancelled Only</option>
            </select>
          </div>
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input type="text" placeholder="Search by Order ID or Customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '0.9rem', outline: 'none' }} />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShoppingCart size={40} color="rgba(255,255,255,0.2)" />
            </div>
            <h3 style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '8px' }}>
              {orders.length === 0 ? 'No Orders Yet' : 'No Matching Orders'}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.35)' }}>
              {orders.length === 0 ? 'Place your first order to see the magic!' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : viewMode === 'chronology' ? (
          <div style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
            {Object.entries(groupedByDate).map(([date, dateOrders]) => {
              const dateTotal = dateOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
              return (
                <div key={date} style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={22} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem' }}>{date}</div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{dateOrders.length} orders - Total: ${dateTotal.toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{ marginLeft: '22px', borderLeft: '2px solid rgba(59, 130, 246, 0.2)', paddingLeft: '24px' }}>
                    {dateOrders.map((order, idx) => (
                      <OrderCard key={order.orderId} order={order} onCancel={handleCancelOrder} cancelling={cancellingId === order.orderId} isLast={idx === dateOrders.length - 1} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <TableView orders={filteredOrders} toggleSort={toggleSort} sortField={sortField} onCancel={handleCancelOrder} cancellingId={cancellingId} />
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}


function TableView({ orders, toggleSort, sortField, onCancel, cancellingId }: { orders: Order[]; toggleSort: (f: SortField) => void; sortField: SortField; onCancel: (id: string) => void; cancellingId: string | null }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <div style={{ width: '50px' }}>#</div>
        <div style={{ flex: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => toggleSort('createdAt')}>Order ID <ArrowUpDown size={14} color={sortField === 'createdAt' ? '#3b82f6' : 'rgba(255,255,255,0.3)'} /></div>
        <div style={{ flex: 1 }}>Customer</div>
        <div style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => toggleSort('totalAmount')}>Amount <ArrowUpDown size={14} color={sortField === 'totalAmount' ? '#3b82f6' : 'rgba(255,255,255,0.3)'} /></div>
        <div style={{ width: '80px' }}>Items</div>
        <div style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => toggleSort('status')}>Status <ArrowUpDown size={14} color={sortField === 'status' ? '#3b82f6' : 'rgba(255,255,255,0.3)'} /></div>
        <div style={{ flex: 1 }}>Date/Time</div>
        <div style={{ width: '100px', textAlign: 'center' }}>Actions</div>
      </div>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {orders.map((order, index) => (
          <div key={order.orderId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
            <div style={{ width: '50px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{index + 1}</div>
            <div style={{ flex: 2, fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>{order.orderId.substring(0, 20)}...</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} color="#60a5fa" /><span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{order.customerId?.split('-')[0] || 'N/A'}</span></div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14} color="#22c55e" /><span style={{ color: '#22c55e', fontWeight: 700 }}>{(order.totalAmount || 0).toFixed(2)}</span></div>
            <div style={{ width: '80px', display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={14} color="#a855f7" /><span style={{ color: 'rgba(255,255,255,0.7)' }}>{order.items?.length || 0}</span></div>
            <div style={{ flex: 1 }}><span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: order.status === 'PLACED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: order.status === 'PLACED' ? '#22c55e' : '#ef4444' }}>{order.status === 'PLACED' ? 'Active' : 'Cancelled'}</span></div>
            <div style={{ flex: 1, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}><div>{new Date(order.createdAt).toLocaleDateString()}</div><div style={{ color: 'rgba(255,255,255,0.4)' }}>{new Date(order.createdAt).toLocaleTimeString()}</div></div>
            <div style={{ width: '100px', textAlign: 'center' }}>
              {order.status === 'PLACED' ? (
                <button onClick={() => onCancel(order.orderId)} disabled={cancellingId === order.orderId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, background: cancellingId === order.orderId ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: cancellingId === order.orderId ? 'wait' : 'pointer' }}>
                  <X size={12} /> {cancellingId === order.orderId ? '...' : 'Cancel'}
                </button>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


function OrderCard({ order, onCancel, cancelling, isLast }: { order: Order; onCancel: (id: string) => void; cancelling: boolean; isLast: boolean }) {
  const isActive = order.status === 'PLACED'
  return (
    <div style={{ position: 'relative', marginBottom: isLast ? 0 : '16px' }}>
      <div style={{ position: 'absolute', left: '-33px', top: '20px', width: '16px', height: '16px', borderRadius: '50%', background: isActive ? '#22c55e' : '#ef4444', border: '3px solid #1a1a3e' }} />
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isActive ? '#22c55e' : '#ef4444' }}>{isActive ? 'Active' : 'Cancelled'}</span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString()}</span>
          </div>
          {isActive && (
            <button onClick={() => onCancel(order.orderId)} disabled={cancelling} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, background: cancelling ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: cancelling ? 'wait' : 'pointer' }}>
              <X size={14} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Order ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>{order.orderId.substring(0, 16)}...</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Customer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}><User size={14} color="#60a5fa" /> {order.customerId?.split('-')[0] || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Items</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}><Package size={14} color="#a855f7" /> {order.items?.length || 0} items</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Total</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontWeight: 700, fontSize: '1rem' }}><DollarSign size={16} /> {(order.totalAmount || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: '14px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color }}>{icon}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{label}</span></div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: any; onChange: (v: any) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '0.95rem', fontWeight: 500, outline: 'none' }} />
    </div>
  )
}
