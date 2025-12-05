import { useState } from 'react'
import { 
  Send, Search, Database, Layers, Zap, CheckCircle, 
  Clock, RefreshCw, Play, ArrowDownRight, Server, HardDrive, Thermometer
} from 'lucide-react'
import { Sensor, Event } from '../App'

interface Props {
  onRegisterSensor: (data: any) => Promise<any>
  onRecordReading: (data: any) => Promise<any>
  sensors: Sensor[]
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

export default function CQRSDemo({ onRegisterSensor, onRecordReading, sensors, onRefresh }: Props) {
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([])
  const [queryLogs, setQueryLogs] = useState<CommandLog[]>([])
  const [isCommandRunning, setIsCommandRunning] = useState(false)
  const [isQueryRunning, setIsQueryRunning] = useState(false)
  const [lastCommandLatency, setLastCommandLatency] = useState<number | null>(null)
  const [lastQueryLatency, setLastQueryLatency] = useState<number | null>(null)
  const [showEventFlow, setShowEventFlow] = useState(false)
  const [queryFlash, setQueryFlash] = useState(false)
  const [commandType, setCommandType] = useState<'register' | 'reading'>('reading')

  const addLog = (log: CommandLog) => {
    setCommandLogs(prev => [log, ...prev].slice(0, 10))
  }

  const executeCommand = async () => {
    setIsCommandRunning(true)
    setShowEventFlow(true)
    
    const commandId = `cmd-${Date.now()}`
    const isRegister = commandType === 'register'
    
    addLog({
      id: commandId,
      type: 'command',
      action: isRegister ? 'RegisterSensor' : 'RecordReading',
      timestamp: new Date(),
      status: 'pending',
      data: isRegister 
        ? { sensorType: 'temperature', location: 'Building A' }
        : { sensorId: sensors[0]?.sensorId || 'demo-sensor', value: Math.random() * 100 }
    })

    const startTime = Date.now()
    let result
    
    if (isRegister) {
      result = await onRegisterSensor({
        sensorType: 'temperature',
        location: `Building ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
        thresholds: { min: 15, max: 35 },
        unit: '°C',
      })
    } else {
      result = await onRecordReading({
        sensorId: sensors[0]?.sensorId || `sensor-demo-${Date.now()}`,
        value: Math.round((Math.random() * 40 + 10) * 10) / 10,
        unit: '°C',
      })
    }
    
    const latency = Date.now() - startTime
    setLastCommandLatency(latency)

    setCommandLogs(prev => prev.map(log => 
      log.id === commandId 
        ? { ...log, status: result.success ? 'success' : 'error', latency }
        : log
    ))

    setTimeout(() => {
      addLog({
        id: `evt-${Date.now()}`,
        type: 'event',
        action: isRegister ? 'SensorRegistered Event' : 'ReadingRecorded Event',
        timestamp: new Date(),
        status: 'success',
        data: result.data
      })
    }, 300)

    setIsCommandRunning(false)
  }

  const addQueryLog = (log: CommandLog) => {
    setQueryLogs(prev => [log, ...prev].slice(0, 10))
  }

  const executeQuery = async () => {
    setIsQueryRunning(true)
    setQueryFlash(true)
    
    const queryId = `qry-${Date.now()}`
    addQueryLog({
      id: queryId,
      type: 'query',
      action: 'GetSensors',
      timestamp: new Date(),
      status: 'pending',
    })

    const startTime = Date.now()
    onRefresh()
    // Small delay to simulate network
    await new Promise(resolve => setTimeout(resolve, 200))
    const latency = Date.now() - startTime
    setLastQueryLatency(latency)

    setQueryLogs(prev => prev.map(log => 
      log.id === queryId 
        ? { ...log, status: 'success', latency, data: { count: sensors.length } }
        : log
    ))

    setIsQueryRunning(false)
    setTimeout(() => setQueryFlash(false), 500)
  }

  return (
    <div>
      {/* CQRS Explanation Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(34, 197, 94, 0.1))',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        borderRadius: '20px', padding: '24px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #06b6d4, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
              CQRS: Command Query Responsibility Segregation
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
              Watch how IoT Commands and Queries flow through completely separate paths
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ color: '#06b6d4', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> COMMAND Side
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              RegisterSensor, RecordReading → Event Store
            </p>
          </div>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ color: '#a855f7', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} /> EVENT STORE
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              Immutable log of all sensor events
            </p>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} /> QUERY Side
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              Read from optimized sensor projections
            </p>
          </div>
        </div>
      </div>

      {/* Split Panel Demo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* COMMAND SIDE */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '2px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '20px', overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(34, 197, 94, 0.1))',
            borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
            padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #06b6d4, #22c55e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Send size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#06b6d4' }}>COMMAND</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Write Path (POST /commands)</p>
                </div>
              </div>
              {lastCommandLatency && (
                <div style={{
                  background: 'rgba(6, 182, 212, 0.2)', padding: '8px 14px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Zap size={14} color="#06b6d4" />
                  <span style={{ color: '#06b6d4', fontWeight: 700, fontSize: '0.9rem' }}>{lastCommandLatency}ms</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Command Type Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setCommandType('reading')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: commandType === 'reading' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: commandType === 'reading' ? '#06b6d4' : 'rgba(255,255,255,0.5)',
                  fontWeight: 600, fontSize: '0.85rem',
                }}
              >
                📊 Record Reading
              </button>
              <button
                onClick={() => setCommandType('register')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: commandType === 'register' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: commandType === 'register' ? '#22c55e' : 'rgba(255,255,255,0.5)',
                  fontWeight: 600, fontSize: '0.85rem',
                }}
              >
                ➕ Register Sensor
              </button>
            </div>

            <button
              onClick={executeCommand}
              disabled={isCommandRunning}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px',
                background: isCommandRunning 
                  ? 'rgba(6, 182, 212, 0.3)' 
                  : 'linear-gradient(135deg, #06b6d4, #22c55e)',
                border: 'none', cursor: isCommandRunning ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                color: 'white', fontWeight: 700, fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)',
              }}
            >
              {isCommandRunning ? (
                <>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Execute {commandType === 'register' ? 'RegisterSensor' : 'RecordReading'}
                </>
              )}
            </button>

            {/* Command Flow */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Command Flow
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FlowStep icon={<Server size={16} />} label="API Gateway" sublabel="/commands" color="#06b6d4" active={isCommandRunning} />
                <FlowArrow />
                <FlowStep icon={<Zap size={16} />} label="Command Handler" sublabel="Lambda Function" color="#22c55e" active={isCommandRunning} />
                <FlowArrow />
                <FlowStep icon={<HardDrive size={16} />} label="Event Store" sublabel="DynamoDB (Append)" color="#a855f7" active={isCommandRunning} />
                <FlowArrow />
                <FlowStep icon={<Send size={16} />} label="Stream Processor" sublabel="Update Projections" color="#ec4899" active={showEventFlow} />
              </div>
            </div>

            {/* Command Logs */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Activity Log
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {commandLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.3)' }}>
                    Execute a command to see activity
                  </div>
                ) : (
                  commandLogs.map(log => <LogEntry key={log.id} log={log} />)
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

          <div style={{ padding: '24px' }}>
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
              }}
            >
              {isQueryRunning ? (
                <>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Fetching...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Execute GetSensors Query
                </>
              )}
            </button>

            {/* Query Flow */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Query Flow
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <FlowStep icon={<Server size={16} />} label="API Gateway" sublabel="/queries" color="#22c55e" active={isQueryRunning} />
                <FlowArrow />
                <FlowStep icon={<Search size={16} />} label="Query Handler" sublabel="Lambda Function" color="#10b981" active={isQueryRunning} />
                <FlowArrow />
                <FlowStep icon={<Database size={16} />} label="Read Model" sublabel="Sensor Projections" color="#06b6d4" active={isQueryRunning} />
              </div>
            </div>

            {/* Query Activity Log */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Query Activity Log
              </div>
              <div style={{ maxHeight: '100px', overflowY: 'auto', marginBottom: '16px' }}>
                {queryLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                    Execute a query to see activity
                  </div>
                ) : (
                  queryLogs.map(log => <LogEntry key={log.id} log={log} />)
                )}
              </div>
            </div>

            {/* Query Results */}
            <div style={{ 
              marginTop: '16px',
              transition: 'all 0.3s',
              background: queryFlash ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
              borderRadius: '12px',
              padding: queryFlash ? '8px' : '0',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Sensors ({sensors.length}) {queryFlash && <span style={{ color: '#22c55e' }}>✓ Updated!</span>}
              </div>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {sensors.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.3)' }}>
                    No sensors registered yet
                  </div>
                ) : (
                  sensors.slice(0, 5).map(sensor => (
                    <div key={sensor.sensorId} style={{
                      background: 'rgba(34, 197, 94, 0.05)',
                      border: '1px solid rgba(34, 197, 94, 0.1)',
                      borderRadius: '10px', padding: '12px', marginBottom: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Thermometer size={18} color="#22c55e" />
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                            {sensor.sensorId.substring(0, 16)}...
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                            {sensor.location} • {sensor.sensorType}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e' }}>
                          {sensor.lastReading !== null ? `${sensor.lastReading}${sensor.unit}` : '--'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                          {sensor.readingCount} readings
                        </div>
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
          Why CQRS for IoT?
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <InsightCard 
            title="High-Volume Ingestion" 
            description="Handle millions of sensor readings with optimized write path"
            color="#06b6d4"
          />
          <InsightCard 
            title="Time-Series Queries" 
            description="Read models optimized for historical analysis and dashboards"
            color="#22c55e"
          />
          <InsightCard 
            title="Complete Audit Trail" 
            description="Every sensor reading preserved for compliance and replay"
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
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: active ? color : 'rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
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
  const colors = { command: '#06b6d4', event: '#a855f7', query: '#22c55e' }
  const color = colors[log.type]
  
  return (
    <div style={{
      background: `${color}08`, border: `1px solid ${color}20`,
      borderRadius: '8px', padding: '10px 12px', marginBottom: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {log.status === 'success' ? <CheckCircle size={16} color={color} /> : 
         log.status === 'pending' ? <RefreshCw size={16} color={color} style={{ animation: 'spin 1s linear infinite' }} /> :
         <Clock size={16} color="#ef4444" />}
        <div>
          <div style={{ fontWeight: 600, color, fontSize: '0.85rem' }}>{log.action}</div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{log.timestamp.toLocaleTimeString()}</div>
        </div>
      </div>
      {log.latency && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{log.latency}ms</span>}
    </div>
  )
}

function InsightCard({ title, description, color }: { title: string, description: string, color: string }) {
  return (
    <div style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: '12px', padding: '16px' }}>
      <div style={{ fontWeight: 700, color, marginBottom: '6px', fontSize: '0.95rem' }}>{title}</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.5 }}>{description}</p>
    </div>
  )
}
