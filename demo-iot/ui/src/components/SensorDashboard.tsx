import { useState } from 'react'
import { Thermometer, Plus, RefreshCw, AlertTriangle, CheckCircle, MapPin, Activity, Clock, Gauge } from 'lucide-react'
import { Sensor, Alert } from '../App'

interface Props {
  sensors: Sensor[]
  alerts: Alert[]
  onRegisterSensor: (data: any) => Promise<any>
  onRecordReading: (data: any) => Promise<any>
  onTriggerAlert: (data: any) => Promise<any>
  onAcknowledgeAlert: (alertId: string) => Promise<any>
  onRefresh: () => void
}

export default function SensorDashboard({ sensors, alerts, onRegisterSensor, onRecordReading, onAcknowledgeAlert, onRefresh }: Props) {
  const [showNewSensor, setShowNewSensor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sensorType, setSensorType] = useState('temperature')
  const [location, setLocation] = useState('Building A')

  const handleRegisterSensor = async () => {
    setLoading(true)
    const result = await onRegisterSensor({ sensorType, location, thresholds: { min: 15, max: 35 }, unit: sensorType === 'temperature' ? '°C' : '%' })
    setLoading(false)
    if (result.success) {
      setMessage({ type: 'success', text: `Sensor registered! Latency: ${result.latency}ms` })
      setShowNewSensor(false)
    } else {
      setMessage({ type: 'error', text: 'Failed to register sensor' })
    }
    setTimeout(() => setMessage(null), 4000)
  }

  const handleRecordReading = async (sensorId: string, unit: string) => {
    setLoading(true)
    const value = Math.round((Math.random() * 40 + 10) * 10) / 10
    await onRecordReading({ sensorId, value, unit })
    setLoading(false)
    setMessage({ type: 'success', text: `Reading recorded: ${value}${unit}` })
    setTimeout(() => setMessage(null), 3000)
  }

  const activeAlerts = alerts.filter(a => a.status !== 'acknowledged')

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(34, 197, 94, 0.1))', borderBottom: '1px solid rgba(6, 182, 212, 0.2)', padding: '24px 28px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #06b6d4, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)' }}>
              <Thermometer size={28} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Sensor Dashboard</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>{sensors.length} sensors • {activeAlerts.length} active alerts</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowNewSensor(!showNewSensor)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white', boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)' }}>
              <Plus size={18} /> Register Sensor
            </button>
            <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.1)', color: 'white' }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, color: message.type === 'success' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
            {message.text}
          </div>
        )}

        {/* New Sensor Form */}
        {showNewSensor && (
          <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '16px' }}>Register New Sensor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '6px' }}>Sensor Type</label>
                <select value={sensorType} onChange={(e) => setSensorType(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem' }}>
                  <option value="temperature">🌡️ Temperature</option>
                  <option value="humidity">💧 Humidity</option>
                  <option value="pressure">📊 Pressure</option>
                  <option value="motion">🚶 Motion</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '6px' }}>Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Building A, Floor 1" style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={handleRegisterSensor} disabled={loading} style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white' }}>
                {loading ? 'Registering...' : 'Register Sensor'}
              </button>
              <button onClick={() => setShowNewSensor(false)} style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: '#f97316', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Active Alerts ({activeAlerts.length})
          </h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {activeAlerts.slice(0, 3).map(alert => (
              <div key={alert.alertId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '10px' }}>
                <div>
                  <div style={{ color: '#f97316', fontWeight: 600, fontSize: '0.9rem' }}>{alert.message}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Sensor: {alert.sensorId?.substring(0, 16)}...</div>
                </div>
                <button onClick={() => onAcknowledgeAlert(alert.alertId)} style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: '0.85rem' }}>
                  <CheckCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sensors Grid */}
      <div style={{ padding: '24px 28px' }}>
        {sensors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Thermometer size={40} color="rgba(255,255,255,0.2)" />
            </div>
            <h3 style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '8px' }}>No Sensors Registered</h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>Register your first sensor to start collecting data</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {sensors.map(sensor => (
              <SensorCard key={sensor.sensorId} sensor={sensor} onRecordReading={handleRecordReading} loading={loading} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SensorCard({ sensor, onRecordReading, loading }: { sensor: Sensor; onRecordReading: (id: string, unit: string) => void; loading: boolean }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'temperature': return '🌡️'
      case 'humidity': return '💧'
      case 'pressure': return '📊'
      case 'motion': return '🚶'
      default: return '📡'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#22c55e' : '#f97316'
  }

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', transition: 'all 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(34, 197, 94, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            {getTypeIcon(sensor.sensorType)}
          </div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>
              {sensor.sensorId.substring(0, 16)}...
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
              {sensor.sensorType}
            </div>
          </div>
        </div>
        <div style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: `${getStatusColor(sensor.status)}20`, color: getStatusColor(sensor.status), textTransform: 'uppercase' }}>
          {sensor.status}
        </div>
      </div>

      {/* Current Reading */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Current Reading</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4' }}>
              {sensor.lastReading !== null ? `${sensor.lastReading}${sensor.unit}` : '--'}
            </div>
          </div>
          <Gauge size={32} color="rgba(6, 182, 212, 0.5)" />
        </div>
      </div>

      {/* Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={14} color="rgba(255,255,255,0.4)" />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{sensor.location}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} color="rgba(255,255,255,0.4)" />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{sensor.readingCount} readings</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
          <Clock size={14} color="rgba(255,255,255,0.4)" />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            {sensor.lastReadingAt ? new Date(sensor.lastReadingAt).toLocaleString() : 'No readings yet'}
          </span>
        </div>
      </div>

      {/* Action */}
      <button onClick={() => onRecordReading(sensor.sensorId, sensor.unit)} disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #06b6d4, #22c55e)', color: 'white', fontSize: '0.9rem' }}>
        📊 Record Reading
      </button>
    </div>
  )
}
