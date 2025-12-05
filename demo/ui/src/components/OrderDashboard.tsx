import { useState } from 'react'
import { ShoppingCart, Plus, RefreshCw, X, CheckCircle, XCircle, Package, User, DollarSign, Clock } from 'lucide-react'
import { Order } from '../App'

interface Props {
  orders: Order[]
  onPlaceOrder: (data: any) => Promise<any>
  onCancelOrder: (orderId: string) => Promise<any>
  onRefresh: () => void
}

export default function OrderDashboard({ orders, onPlaceOrder, onCancelOrder, onRefresh }: Props) {
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [customerId, setCustomerId] = useState('customer-001')
  const [productId, setProductId] = useState('product-001')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(99.99)

  const handlePlaceOrder = async () => {
    setLoading(true)
    const result = await onPlaceOrder({
      customerId,
      items: [{ productId, quantity, price }],
      totalAmount: quantity * price,
    })
    setLoading(false)
    if (result.success) {
      setMessage({ type: 'success', text: `Order placed successfully! Latency: ${result.latency}ms` })
      setShowNewOrder(false)
    } else {
      setMessage({ type: 'error', text: 'Failed to place order' })
    }
    setTimeout(() => setMessage(null), 4000)
  }

  const handleCancelOrder = async (orderId: string) => {
    setLoading(true)
    const result = await onCancelOrder(orderId)
    setLoading(false)
    if (result.success) {
      setMessage({ type: 'success', text: 'Order cancelled successfully!' })
    } else {
      setMessage({ type: 'error', text: 'Failed to cancel order' })
    }
    setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Message Toast */}
      {message && (
        <div className={`glass-card p-4 flex items-center gap-4 animate-scale-in ${
          message.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            message.type === 'success' 
              ? 'bg-gradient-to-br from-green-500 to-emerald-400' 
              : 'bg-gradient-to-br from-red-500 to-pink-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-white" />}
          </div>
          <span className="text-white font-medium">{message.text}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="glass-card p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center glow-blue">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Order Management</h2>
              <p className="text-white/50">Real-time order processing with event sourcing</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold hover:bg-white/10 hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowNewOrder(!showNewOrder)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Order
            </button>
          </div>
        </div>

        {/* New Order Form */}
        {showNewOrder && (
          <div className="glass-card p-6 mb-8 border-indigo-500/20 animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Create New Order</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Customer ID</label>
                <input
                  type="text"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="customer-123"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Product ID</label>
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="product-456"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Price ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? '⏳ Processing...' : '🚀 Place Order'}
              </button>
              <button
                onClick={() => setShowNewOrder(false)}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-xl font-bold text-white/70 mb-2">No Orders Yet</h3>
              <p className="text-white/40">Place your first order to see the magic happen! ✨</p>
            </div>
          ) : (
            orders.map((order, index) => (
              <div
                key={order.orderId}
                className="order-card animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <code className="px-3 py-1.5 rounded-lg bg-white/5 text-white/80 text-sm font-mono">
                        {order.orderId.substring(0, 20)}...
                      </code>
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                        order.status === 'PLACED'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {order.status === 'PLACED' ? '✅ ACTIVE' : '❌ CANCELLED'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <User className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-xs text-white/40 font-medium">Customer</div>
                          <div className="text-white font-semibold">{order.customerId || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="text-xs text-white/40 font-medium">Amount</div>
                          <div className="text-white font-semibold">${order.totalAmount?.toFixed(2) || '0.00'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                        <Clock className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="text-xs text-white/40 font-medium">Created</div>
                          <div className="text-white font-semibold">{new Date(order.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {order.status === 'PLACED' && (
                    <button
                      onClick={() => handleCancelOrder(order.orderId)}
                      disabled={loading}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-red-500/25"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
