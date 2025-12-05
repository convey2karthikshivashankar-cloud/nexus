import { Database, Server, Zap, HardDrive, Globe, Layers, ArrowRight, Thermometer, AlertTriangle } from 'lucide-react'

export default function ArchitectureDiagram() {
  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}>
            <Database size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>IoT CQRS Architecture</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>Event-Sourced architecture for IoT sensor data</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 28px' }}>
        {/* Architecture Diagram */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '20px', alignItems: 'center', marginBottom: '40px' }}>
          {/* IoT Sensors */}
          <ArchBox title="IoT Sensors" subtitle="Data Sources" color="#06b6d4" icon={<Thermometer size={24} />}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
              Temperature, Humidity, Motion sensors sending readings
            </div>
          </ArchBox>
          <ArrowRight size={24} color="rgba(255,255,255,0.3)" />
          
          {/* Command Side */}
          <ArchBox title="Command Handler" subtitle="Write Path" color="#22c55e" icon={<Server size={24} />}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
              • RegisterSensor<br/>• RecordReading<br/>• TriggerAlert
            </div>
          </ArchBox>
          <ArrowRight size={24} color="rgba(255,255,255,0.3)" />
          
          {/* Event Store */}
          <ArchBox title="Event Store" subtitle="Source of Truth" color="#a855f7" icon={<HardDrive size={24} />}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
              DynamoDB<br/>Append-only log
            </div>
          </ArchBox>
        </div>

        {/* Stream Processing */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '2px', height: '40px', background: 'rgba(168, 85, 247, 0.3)' }} />
            <ArchBox title="Stream Processor" subtitle="DynamoDB Streams" color="#ec4899" icon={<Zap size={24} />} small>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                Updates read models
              </div>
            </ArchBox>
            <div style={{ width: '2px', height: '40px', background: 'rgba(236, 72, 153, 0.3)' }} />
          </div>
        </div>

        {/* Read Models */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
          <ReadModelBox title="Sensors" description="Active sensor registry" color="#06b6d4" />
          <ReadModelBox title="Readings" description="Recent sensor data" color="#22c55e" />
          <ReadModelBox title="Alerts" description="Active alerts" color="#f97316" />
          <ReadModelBox title="Analytics" description="Aggregated metrics" color="#a855f7" />
        </div>

        {/* Query Side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
          <ArchBox title="Dashboard UI" subtitle="React Application" color="#3b82f6" icon={<Globe size={24} />}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
              Real-time sensor monitoring
            </div>
          </ArchBox>
          <ArrowRight size={24} color="rgba(255,255,255,0.3)" style={{ transform: 'rotate(180deg)' }} />
          
          <ArchBox title="Query Handler" subtitle="Read Path" color="#10b981" icon={<Layers size={24} />}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
              • GetSensors<br/>• GetReadings<br/>• GetAlerts
            </div>
          </ArchBox>
          <ArrowRight size={24} color="rgba(255,255,255,0.3)" style={{ transform: 'rotate(180deg)' }} />
          
          <ArchBox title="Read Models" subtitle="Optimized Views" color="#06b6d4" icon={<Database size={24} />}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
              DynamoDB Tables<br/>Eventually consistent
            </div>
          </ArchBox>
        </div>

        {/* Key Benefits */}
        <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '16px' }}>Key Benefits for IoT</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <BenefitCard title="High Throughput" description="Handle millions of sensor readings per second" color="#06b6d4" />
            <BenefitCard title="Complete History" description="Every reading preserved for analysis and compliance" color="#22c55e" />
            <BenefitCard title="Real-time Alerts" description="Stream processing enables instant threshold detection" color="#f97316" />
          </div>
        </div>
      </div>
    </div>
  )
}


function ArchBox({ title, subtitle, color, icon, children, small = false }: { title: string; subtitle: string; color: string; icon: React.ReactNode; children?: React.ReactNode; small?: boolean }) {
  return (
    <div style={{
      background: `${color}08`,
      border: `2px solid ${color}30`,
      borderRadius: '16px',
      padding: small ? '16px' : '24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: small ? '40px' : '56px',
        height: small ? '40px' : '56px',
        borderRadius: '12px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px',
        color,
      }}>
        {icon}
      </div>
      <div style={{ fontWeight: 700, color: 'white', fontSize: small ? '0.95rem' : '1.1rem', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{subtitle}</div>
      {children}
    </div>
  )
}

function ReadModelBox({ title, description, color }: { title: string; description: string; color: string }) {
  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}20`,
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center',
    }}>
      <div style={{ fontWeight: 700, color, fontSize: '0.95rem', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{description}</div>
    </div>
  )
}

function BenefitCard({ title, description, color }: { title: string; description: string; color: string }) {
  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}20`,
      borderRadius: '12px',
      padding: '16px',
    }}>
      <div style={{ fontWeight: 700, color, marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{description}</div>
    </div>
  )
}
