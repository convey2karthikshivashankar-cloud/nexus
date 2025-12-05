import { useState } from 'react'
import { Zap, Play, BarChart2, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  onTest: (data: any) => Promise<any>
  onComplete: () => void
}

interface TestResult {
  success: boolean
  latency: number
}

const styles = {
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '32px',
    marginBottom: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  iconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 30px rgba(249, 115, 22, 0.4)',
  },
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 500,
    outline: 'none',
  },
  progressBar: {
    height: '12px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316, #ea580c)',
    transition: 'width 0.3s',
  },
  btn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 24px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '8px',
  },
}

export default function LoadTester({ onTest, onComplete }: Props) {
  const [isRunning, setIsRunning] = useState(false)
  const [requestCount, setRequestCount] = useState(10)
  const [concurrency, setConcurrency] = useState(2)
  const [results, setResults] = useState<TestResult[]>([])
  const [progress, setProgress] = useState(0)

  const runLoadTest = async () => {
    setIsRunning(true)
    setResults([])
    setProgress(0)

    const testResults: TestResult[] = []
    const batches = Math.ceil(requestCount / concurrency)

    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, requestCount - batch * concurrency)
      const promises = Array(batchSize).fill(null).map(async () => {
        const result = await onTest({
          customerId: `load-test-${Date.now()}`,
          items: [{ productId: 'test-product', quantity: 1, price: 10 }],
          totalAmount: 10,
        })
        return { success: result.success, latency: result.latency || 0 }
      })

      const batchResults = await Promise.all(promises)
      testResults.push(...batchResults)
      setResults([...testResults])
      setProgress(((batch + 1) / batches) * 100)
    }

    setIsRunning(false)
    onComplete()
  }

  const avgLatency = results.length > 0 ? results.reduce((sum, r) => sum + r.latency, 0) / results.length : 0
  const successRate = results.length > 0 ? (results.filter(r => r.success).length / results.length) * 100 : 0

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconBox}>
            <Zap size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Load Tester</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>Stress test your event-sourced system</p>
          </div>
        </div>

        <div style={styles.inputGrid}>
          <div>
            <label style={styles.label}>Total Requests</label>
            <input type="number" value={requestCount} onChange={(e) => setRequestCount(parseInt(e.target.value) || 1)} min="1" max="100" disabled={isRunning} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Concurrency</label>
            <input type="number" value={concurrency} onChange={(e) => setConcurrency(parseInt(e.target.value) || 1)} min="1" max="10" disabled={isRunning} style={styles.input} />
          </div>
        </div>

        {isRunning && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Progress</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>{progress.toFixed(0)}%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button
          onClick={runLoadTest}
          disabled={isRunning}
          style={{
            ...styles.btn,
            background: isRunning ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white',
            boxShadow: isRunning ? 'none' : '0 4px 20px rgba(249, 115, 22, 0.4)',
            cursor: isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunning ? (
            <>
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Running Test...
            </>
          ) : (
            <>
              <Play size={20} />
              Start Load Test
            </>
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div style={styles.card}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '20px' }}>Test Results</h3>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <BarChart2 size={18} color="#3b82f6" />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Total</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{results.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle size={18} color="#22c55e" />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Success</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{successRate.toFixed(1)}%</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={18} color="#a855f7" />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Avg Latency</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{avgLatency.toFixed(0)}ms</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <XCircle size={18} color="#ef4444" />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Failed</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{results.filter(r => !r.success).length}</div>
            </div>
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {results.map((result, index) => (
              <div key={index} style={{
                ...styles.resultItem,
                background: result.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${result.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {result.success ? <CheckCircle size={18} color="#22c55e" /> : <XCircle size={18} color="#ef4444" />}
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Request #{index + 1}</span>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{result.latency}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
