import { useState, useEffect } from 'react'
import { 
  Send, Search, ArrowRight, Database, Layers, Zap, CheckCircle, 
  Clock, FileJson, ChevronDown, ChevronRight, RefreshCw, Play,
  ArrowDownRight, ArrowUpRight, Server, HardDrive
} from 'lucide-react'
import { Order, Event } from '../App'

interface Props {
  onPlaceOrder: (data: any) => Promise<any>
  onCancelOrder: (orderId: string) => Promise<any>
  orders: Order[]
  events: Event[]
  onRefresh: () => void
}

interface CommandLog {
  id: string
  type: 'command' | 'event' | 'query'
  action: string
  timestamp: Date
  latency?: number
  status: 'pending' | 'success' | 'error'
  data?: any
}

export default function CQRSDemo({ onPlaceOrder, onCancelOrder, orders, events, onRefresh }: Props) {
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([])
  const [queryLogs, setQueryLogs] = useState<CommandLog[]>([])
  const [isCommandRunning, setIsCommandRunning] = useState(false)
  const [isQueryRunning, setIsQueryRunning] = useState(false)
  const [lastCommandLatency, setLastCommandLatency] = useState<number | null>(null)
  const [lastQueryLatency, setLastQueryLatency] = useState<number | null>(null)
  const [showEventFlow, setShowEventFlow] = useState(false)

  // Demo order data
  const [customerId] = useState(`customer-${Math.random().toString(36).substr(2, 6)}`)
  const [productId] = useState(`product-${Math.random().toString(36).substr(2, 4)}`)

  const addLog = (type: 'command' | 'query', log: CommandLog) => {
    if (type === 'command') {
      setCommandLogs(prev => [log, ...prev].slice(0, 10))
    } else {
      setQueryLogs(prev => [log, ...prev].slice(0, 10))
    }
  }

  const executeCommand = async () => {
    setIsCommandRunning(true)
    setShowEventFlow(true)
    
    const commandId = `cmd-${Date.now()}`
    addLog('command', {
      id: commandId,
      type: 'command',
      action: 'PlaceOrder',
      timestamp: new Date(),
      status: 'pending',
      data: { customerId, productId, quantity: 1, price: 99.99 }
    })

    const startTime = Date.now()
    const result = await onPlaceOrder({
      customerId,
      items: [{ productId, quantity: 1, price: 99.99 }],
      totalAmount: 99.99,
    })
    const latency = Date.now() - startTime
    setLastCommandLatency(latency)

    // Update command log
    setCommandLogs(prev => prev.map(log => 
      log.id === commandId 
        ? { ...log, status: result.success ? 'success' : 'error', latency }
        : log
    ))

    // Add event log after small delay
    setTimeout(() => {
      addLog('command', {
        id: `evt-${Date.now()}`,
        type: 'event',
        action: 'OrderPlaced Event',
        timestamp: new Date(),
        status: 'success',
        data: result.data
      })
    }, 300)

    setIsCommandRunning(false)
  }

  const executeQuery = async () => {
    setIsQueryRunning(true)
    
    const queryId = `qry-${Date.now()}`
    addLog('query', {
      id: queryId,
      type: 'query',
      action: 'GetOrders',
      timestamp: new Date(),
      status: 'pending',
    })

    const startTime = Date.now()
    await onRefresh()
    const latency = Date.now() - startTime
    setLastQueryLatency(latency)

    setQueryLogs(prev => prev.map(log => 
      log.id === queryId 
        ? { ...log, status: 'success', latency, data: { count: orders.length } }
        : log
    ))

    setIsQueryRunning(false)
  }

  return (
    <div>
      {/* CQRS Explanation Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '20px', padding: '24px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
              CQRS: Command Query Responsibility Segregation
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
              Watch how Commands and Queries flow through completely separate paths
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ color: '#3b82f6', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> COMMAND Side
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              Write operations → Event Store → Publishes Events
            </p>
          </div>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ color: '#a855f7', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} /> EVENT STORE
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              Immutable log of all state changes (source of truth)
            </p>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} /> QUERY Side
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              Read from optimized projections (eventually consistent)
            </p>
          </div>
        </div>
      </div>

      {/* Split Panel Demo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* COMMAND SIDE */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '20px', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.1))',
            borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
            padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Send size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>COMMAND</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Write Path (POST /commands)</p>
                </div>
              </div>
              {lastCommandLatency && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)', padding: '8px 14px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Zap size={14} color="#3b82f6" />
                  <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.9rem' }}>{lastCommandLatency}ms</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Execute Button */}
            <button
              onClick={executeCommand}
              disabled={isCommandRunning}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px',
                background: isCommandRunning 
                  ? 'rgba(59, 130, 246, 0.3)' 
                  : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                border: 'none', cursor: isCommandRunning ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                color: 'white', fontWeight: 700, fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s',
              }}
            >
              {isCommandRunning ? (
                <>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Processing Command...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Execute PlaceOrder Command
                </>
              )}
            </button>

            {/* Command Flow Visualization */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Command Flow
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FlowStep icon={<Server size={16} />} label="API Gateway" sublabel="/commands" color="#3b82f6" active={isCommandRunning} />
                <FlowArrow />
                <FlowStep icon={<Zap size={16} />} label="Command Handler" sublabel="Lambda Function" color="#06b6d4" active={isCommandRunning} />
                <FlowArrow />
                <FlowStep icon={<HardDrive size={16} />} label="Event Store" sublabel="DynamoDB (Append)" color="#a855f7" active={isCommandRunning} />
                <FlowArrow />
                <FlowStep icon={<Send size={16} />} label="EventBridge" sublabel="Publish Event" color="#ec4899" active={showEventFlow} />
              </div>
            </div>

            {/* Command Logs */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Command Activity Log
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {commandLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.3)' }}>
                    Execute a command to see activity
                  </div>
                ) : (
                  commandLogs.map(log => (
                    <LogEntry key={log.id} log={log} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* QUERY SIDE */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '2px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '20px', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))',
            borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
            padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #22c55e, #10b981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Search size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22c55e' }}>QUERY</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Read Path (GET /queries)</p>
                </div>
              </div>
              {lastQueryLatency && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.2)', padding: '8px 14px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Zap size={14} color="#22c55e" />
                  <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.9rem' }}>{lastQueryLatency}ms</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Execute Button */}
            <button
              onClick={executeQuery}
              disabled={isQueryRunning}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px',
                background: isQueryRunning 
                  ? 'rgba(34, 197, 94, 0.3)' 
                  : 'linear-gradient(135deg, #22c55e, #10b981)',
                border: 'none', cursor: isQueryRunning ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                color: 'white', fontWeight: 700, fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
                transition: 'all 0.3s',
              }}
            >
              {isQueryRunning ? (
                <>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Fetching Data...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Execute GetOrders Query
                </>
              )}
            </button>

            {/* Query Flow Visualization */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Query Flow
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FlowStep icon={<Server size={16} />} label="API Gateway" sublabel="/queries" color="#22c55e" active={isQueryRunning} />
                <FlowArrow />
                <FlowStep icon={<Search size={16} />} label="Query Handler" sublabel="Lambda Function" color="#10b981" active={isQueryRunning} />
                <FlowArrow />
                <FlowStep icon={<Database size={16} />} label="Read Model" sublabel="DynamoDB (Projection)" color="#06b6d4" active={isQueryRunning} />
              </div>
            </div>

            {/* Query Results Preview */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Query Results ({orders.length} orders)
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.3)' }}>
                    No orders in read model yet
                  </div>
                ) : (
                  orders.slice(0, 5).map(order => (
                    <div key={order.orderId} style={{
                      background: 'rgba(34, 197, 94, 0.05)',
                      border: '1px solid rgba(34, 197, 94, 0.1)',
                      borderRadius: '10px', padding: '12px', marginBottom: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                          {order.orderId.substring(0, 16)}...
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                          {order.customerId}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                        background: order.status === 'PLACED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: order.status === 'PLACED' ? '#22c55e' : '#ef4444',
                      }}>
                        {order.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px', padding: '24px',
      }}>
        <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={20} color="#a855f7" />
          Why CQRS Matters
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <InsightCard 
            title="Independent Scaling" 
            description="Scale read and write workloads separately based on actual demand"
            color="#3b82f6"
          />
          <InsightCard 
            title="Optimized Models" 
            description="Write model for consistency, read model for query performance"
            color="#22c55e"
          />
          <InsightCard 
            title="Event Sourcing" 
            description="Complete audit trail with ability to replay and rebuild state"
            color="#a855f7"
          />
        </div>
      </div>
    </div>
  )
}

function FlowStep({ icon, label, sublabel, color, active }: { icon: React.ReactNode, label: string, sublabel: string, color: string, active?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: active ? `${color}15` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${active ? `${color}40` : 'rgba(255,255,255,0.05)'}`,
      borderRadius: '10px', padding: '12px',
      transition: 'all 0.3s',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: active ? color : 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', transition: 'all 0.3s',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 600, color: active ? color : 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{sublabel}</div>
      </div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
      <ArrowDownRight size={16} color="rgba(255,255,255,0.2)" />
    </div>
  )
}

function LogEntry({ log }: { log: CommandLog }) {
  const colors = {
    command: '#3b82f6',
    event: '#a855f7',
    query: '#22c55e',
  }
  const color = colors[log.type]
  
  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}20`,
      borderRadius: '8px', padding: '10px 12px', marginBottom: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {log.status === 'success' ? (
          <CheckCircle size={16} color={color} />
        ) : log.status === 'pending' ? (
          <RefreshCw size={16} color={color} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Clock size={16} color="#ef4444" />
        )}
        <div>
          <div style={{ fontWeight: 600, color, fontSize: '0.85rem' }}>{log.action}</div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
            {log.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
      {log.latency && (
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
          {log.latency}ms
        </span>
      )}
    </div>
  )
}

function InsightCard({ title, description, color }: { title: string, description: string, color: string }) {
  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}20`,
      borderRadius: '12px', padding: '16px',
    }}>
      <div style={{ fontWeight: 700, color, marginBottom: '6px', fontSize: '0.95rem' }}>{title}</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.5 }}>{description}</p>
    </div>
  )
}
