import { useState } from 'react'
import { Zap, Play, Square, BarChart3, Clock, CheckCircle, XCircle, Thermometer } from 'lucide-react'

interface Props {
  onTest: (data: any) => Promise<any>
  onComplete: () => void
}

interface TestResult {
  id: number
  success: boolean
  latency: number
  timestamp: Date
}

export default function LoadTester({ onTest, onComplete }: Props) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [totalRequests, setTotalRequests] = useState(10)
  const [concurrency, setConcurrency] = useState(2)
  const [progress, setProgress] = useState(0)

  const runLoadTest = async () => {
    setIsRunning(true)
    setResults([])
    setProgress(0)

    const newResults: TestResult[] = []
    let completed = 0

    // Run in batches based on concurrency
    for (let i = 0; i < totalRequests; i += concurrency) {
      const batch = []
      for (let j = 0; j < concurrency && i + j < totalRequests; j++) {
        const testId = i + j + 1
        batch.push(
          onTest({
            sensorId: `load-test-sensor-${Math.floor(Math.random() * 5) + 1}`,
            value: Math.round((Math.random() * 50 + 10) * 10) / 10,
            unit: '°C',
          }).then(result => {
            const testResult: TestResult = {
              id: testId,
              success: result.success,
              latency: result.latency || 0,
              timestamp: new Date(),
            }
            newResults.push(testResult)
            completed++
            setProgress(Math.round((completed / totalRequests) * 100))
            setResults([...newResults])
            return testResult
          })
        )
      }
      await Promise.all(batch)
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setIsRunning(false)
    onComplete()
  }

  const stopTest = () => {
    setIsRunning(false)
  }

  const stats = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    avgLatency: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.latency, 0) / results.length) : 0,
    minLatency: results.length > 0 ? Math.min(...results.map(r => r.latency)) : 0,
    maxLatency: results.length > 0 ? Math.max(...results.map(r => r.latency)) : 0,
  }

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 179, 8, 0.1))', borderBottom: '1px solid rgba(249, 115, 22, 0.2)', padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #f97316, #eab308)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(249, 115, 22, 0.4)' }}>
            <Zap size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>IoT Load Tester</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>Stress test sensor reading ingestion</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
              <Thermometer size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Total Readings to Record
            </label>
            <input
              type="number"
              value={totalRequests}
              onChange={(e) => setTotalRequests(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isRunning}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', fontWeight: 600 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
              <Zap size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Concurrent Requests
            </label>
            <input
              type="number"
              value={concurrency}
              onChange={(e) => setConcurrency(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              disabled={isRunning}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={isRunning ? stopTest : runLoadTest}
            style={{
              flex: 1, padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
              border: 'none', cursor: 'pointer',
              background: isRunning ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f97316, #eab308)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: isRunning ? '0 4px 20px rgba(239, 68, 68, 0.3)' : '0 4px 20px rgba(249, 115, 22, 0.3)',
            }}
          >
            {isRunning ? <><Square size={20} /> Stop Test</> : <><Play size={20} /> Start Load Test</>}
          </button>
        </div>

        {/* Progress Bar */}
        {(isRunning || results.length > 0) && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Progress</span>
              <span style={{ color: '#f97316', fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #f97316, #eab308)', borderRadius: '6px', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* Stats */}
        {results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard icon={<CheckCircle size={20} />} label="Successful" value={stats.successful} color="#22c55e" />
            <StatCard icon={<XCircle size={20} />} label="Failed" value={stats.failed} color="#ef4444" />
            <StatCard icon={<Clock size={20} />} label="Avg Latency" value={`${stats.avgLatency}ms`} color="#f97316" />
          </div>
        )}

        {/* Latency Distribution */}
        {results.length > 0 && (
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={18} color="#f97316" /> Latency Distribution
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
              {results.slice(-30).map((result, idx) => {
                const maxLatency = Math.max(...results.map(r => r.latency), 1)
                const height = (result.latency / maxLatency) * 100
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: `${height}%`,
                      minHeight: '4px',
                      background: result.success ? 'linear-gradient(180deg, #22c55e, #16a34a)' : 'linear-gradient(180deg, #ef4444, #dc2626)',
                      borderRadius: '2px 2px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                    title={`${result.latency}ms`}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              <span>Min: {stats.minLatency}ms</span>
              <span>Avg: {stats.avgLatency}ms</span>
              <span>Max: {stats.maxLatency}ms</span>
            </div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div style={{ marginTop: '24px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ color: 'white', fontWeight: 700 }}>Recent Results</h3>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {results.slice(-10).reverse().map(result => (
                <div key={result.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {result.success ? <CheckCircle size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Reading #{result.id}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: result.success ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
                      {result.latency}ms
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ color }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      </div>
    </div>
  )
}
