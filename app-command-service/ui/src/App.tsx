import { useState } from 'react'
import { Send, Zap, User, Package, DollarSign, XCircle, CheckCircle, Clock } from 'lucide-react'

// Configure your API URL here after deployment
const API_URL = 'YOUR_COMMAND_API_URL'

interface CommandResult {
  success: boolean
  command: string
  orderId?: string
  latency: number
  message?: string
  error?: string
}

export default function App() {
  const [customerName, setCustomerName] = useState('Alice Johnson')
  const [productName, setProductName] = useState('Enterprise License')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(299.99)
  const [cancelOrderId, setCancelOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CommandResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const totalAmount = quantity * unitPrice

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const placeOrder = async () => {
    setLoading(true)
    addLog('🚀 Executing PlaceOrder command...')
    
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36),
          customerName,
          items: [{ productId: productName.toLowerCase().replace(/\s+/g, '-'), productName, quantity, price: unitPrice }],
          totalAmount
        })
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        addLog(`✅ Order placed: ${data.orderId}`)
        addLog(`💰 Total: $${totalAmount.toFixed(2)}`)
      } else {
        addLog(`❌ Failed: ${data.error}`)
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      setResult({ success: false, command: 'PlaceOrder', latency: 0, error: error.message })
    }
    
    setLoading(false)
  }

  const cancelOrder = async () => {
    if (!cancelOrderId.trim()) {
      addLog('⚠️ Please enter an Order ID')
      return
    }
    
    setLoading(true)
    addLog(`🚀 Executing CancelOrder command for ${cancelOrderId}...`)
    
    try {
      const response = await fetch(`${API_URL}/orders/${cancelOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        addLog(`✅ Order cancelled: ${cancelOrderId}`)
      } else {
        addLog(`❌ Failed: ${data.error}`)
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      setResult({ success: false, command: 'CancelOrder', latency: 0, error: error.message })
    }
    
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}>
            <Send size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Command Service
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>Skeleton Crew App #1 - Write Operations (CQRS)</p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Place Order Command */}
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ color: 'white', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={20} color="#3b82f6" /> PlaceOrder Command
          </h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <InputField icon={<User size={16} />} label="Customer Name" value={customerName} onChange={setCustomerName} />
            <InputField icon={<Package size={16} />} label="Product Name" value={productName} onChange={setProductName} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <InputField label="Quantity" value={quantity} onChange={(v) => setQuantity(Math.max(1, parseInt(v) || 1))} type="number" />
              <InputField icon={<DollarSign size={16} />} label="Unit Price" value={unitPrice} onChange={(v) => setUnitPrice(Math.max(0.01, parseFloat(v) || 0.01))} type="number" />
            </div>
            
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Total Amount</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>${totalAmount.toFixed(2)}</div>
            </div>
            
            <button onClick={placeOrder} disabled={loading} style={{ padding: '16px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: loading ? 'wait' : 'pointer', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)' }}>
              {loading ? 'Executing...' : <><Send size={18} /> Execute PlaceOrder</>}
            </button>
          </div>
        </div>

        {/* Cancel Order Command */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '20px', padding: '24px' }}>
          <h2 style={{ color: 'white', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <XCircle size={20} color="#ef4444" /> CancelOrder Command
          </h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <InputField label="Order ID to Cancel" value={cancelOrderId} onChange={setCancelOrderId} placeholder="order-xxxxx-xxxxx" />
            
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                ⚠️ This will cancel the order and publish an OrderCancelled event to the Query Service.
              </p>
            </div>
            
            <button onClick={cancelOrder} disabled={loading || !cancelOrderId.trim()} style={{ padding: '16px', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: loading || !cancelOrderId.trim() ? 'not-allowed' : 'pointer', background: cancelOrderId.trim() ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(239, 68, 68, 0.3)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: cancelOrderId.trim() ? 1 : 0.5 }}>
              {loading ? 'Executing...' : <><XCircle size={18} /> Execute CancelOrder</>}
            </button>
          </div>
        </div>
      </div>

      {/* Result & Logs */}
      <div style={{ maxWidth: '1200px', margin: '24px auto 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Command Result */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> Command Result
          </h3>
          {result ? (
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              <div style={{ color: result.success ? '#22c55e' : '#ef4444', marginBottom: '8px' }}>
                {result.success ? '✅ SUCCESS' : '❌ FAILED'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)' }}>Command: {result.command}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)' }}>Latency: {result.latency}ms</div>
              {result.orderId && <div style={{ color: '#3b82f6' }}>Order ID: {result.orderId}</div>}
              {result.error && <div style={{ color: '#ef4444' }}>Error: {result.error}</div>}
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.4)' }}>No command executed yet</div>
          )}
        </div>

        {/* Activity Log */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} /> Activity Log
          </h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontFamily: 'monospace' }}>{log}</div>
            )) : (
              <div style={{ color: 'rgba(255,255,255,0.4)' }}>No activity yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
        <p>Nexus Blueprint - Skeleton Crew App #1</p>
        <p style={{ marginTop: '4px' }}>Commands are published to EventBridge for the Query Service to consume</p>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', icon }: any) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>{icon}</div>}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', padding: icon ? '12px 16px 12px 40px' : '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
        />
      </div>
    </div>
  )
}
