import { Database, Cloud, Server, GitBranch, Shield, Zap, Globe, ArrowRight, ArrowDown, Send, Search, HardDrive, Layers } from 'lucide-react'

export default function ArchitectureDiagram() {
  return (
    <div>
      {/* CQRS Architecture Visualization */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px', padding: '32px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
          }}>
            <Layers size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>CQRS Architecture</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>Command Query Responsibility Segregation with Event Sourcing</p>
          </div>
        </div>

        {/* Main CQRS Diagram */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '20px', padding: '32px',
        }}>
          {/* Client Layer */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '16px', padding: '16px 32px',
            }}>
              <Globe size={24} color="#6366f1" />
              <div>
                <div style={{ fontWeight: 800, color: '#6366f1', fontSize: '1.1rem' }}>Client Application</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>React UI / Mobile / External Services</div>
              </div>
            </div>
          </div>

          {/* Split Arrow */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '120px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ArrowDown size={24} color="#3b82f6" />
              <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>WRITE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ArrowDown size={24} color="#22c55e" />
              <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>READ</span>
            </div>
          </div>

          {/* Command and Query Sides */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* COMMAND SIDE */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '2px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '16px', padding: '24px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '20px', paddingBottom: '16px',
                borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
              }}>
                <Send size={20} color="#3b82f6" />
                <span style={{ fontWeight: 800, color: '#3b82f6', fontSize: '1.1rem' }}>COMMAND SIDE</span>
              </div>
              
              <ArchBox icon={<Server size={18} />} label="API Gateway" sublabel="POST /commands" color="#3b82f6" />
              <FlowArrow color="#3b82f6" />
              <ArchBox icon={<Zap size={18} />} label="Command Handler" sublabel="Lambda Function" color="#06b6d4" />
              <FlowArrow color="#06b6d4" />
              <ArchBox icon={<Shield size={18} />} label="Domain Logic" sublabel="Validation & Business Rules" color="#8b5cf6" />
              <FlowArrow color="#8b5cf6" />
              <ArchBox icon={<HardDrive size={18} />} label="Event Store" sublabel="DynamoDB (Append-Only)" color="#a855f7" highlight />
            </div>

            {/* CENTER - Event Bus */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
                marginBottom: '12px',
              }}>
                <GitBranch size={40} color="white" />
              </div>
              <div style={{ fontWeight: 800, color: '#a855f7', textAlign: 'center' }}>EventBridge</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Event Bus</div>
              
              {/* Arrows from Event Store to EventBridge and to Read Model */}
              <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Publish</span>
                  <ArrowRight size={14} color="rgba(255,255,255,0.3)" style={{ transform: 'rotate(180deg)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowRight size={14} color="rgba(255,255,255,0.3)" />
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Subscribe</span>
                </div>
              </div>
            </div>

            {/* QUERY SIDE */}
            <div style={{
              background: 'rgba(34, 197, 94, 0.05)',
              border: '2px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '16px', padding: '24px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '20px', paddingBottom: '16px',
                borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
              }}>
                <Search size={20} color="#22c55e" />
                <span style={{ fontWeight: 800, color: '#22c55e', fontSize: '1.1rem' }}>QUERY SIDE</span>
              </div>
              
              <ArchBox icon={<Server size={18} />} label="API Gateway" sublabel="GET /queries" color="#22c55e" />
              <FlowArrow color="#22c55e" />
              <ArchBox icon={<Search size={18} />} label="Query Handler" sublabel="Lambda Function" color="#10b981" />
              <FlowArrow color="#10b981" />
              <ArchBox icon={<Database size={18} />} label="Read Model" sublabel="DynamoDB (Projections)" color="#06b6d4" highlight />
              
              <div style={{
                marginTop: '16px', padding: '12px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px dashed rgba(34, 197, 94, 0.3)',
                borderRadius: '10px', fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)', textAlign: 'center',
              }}>
                📊 Optimized for fast reads<br/>
                Eventually consistent with Event Store
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px', padding: '32px', marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '24px' }}>Why This Architecture?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <BenefitCard 
            emoji="⚡" 
            title="Independent Scaling" 
            description="Scale read and write workloads separately based on actual demand patterns"
            color="#3b82f6"
          />
          <BenefitCard 
            emoji="📜" 
            title="Complete Audit Trail" 
            description="Every state change is recorded as an immutable event - perfect for compliance"
            color="#a855f7"
          />
          <BenefitCard 
            emoji="🔄" 
            title="Temporal Queries" 
            description="Replay events to reconstruct state at any point in time"
            color="#22c55e"
          />
          <BenefitCard 
            emoji="🛡️" 
            title="Governance-First" 
            description="Schema validation and policy enforcement at every layer"
            color="#f97316"
          />
        </div>
      </div>

      {/* Tech Stack */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px', padding: '32px',
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '24px' }}>Technology Stack</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
          <TechCard name="AWS Lambda" category="Compute" color="#f97316" />
          <TechCard name="DynamoDB" category="Database" color="#3b82f6" />
          <TechCard name="EventBridge" category="Events" color="#a855f7" />
          <TechCard name="API Gateway" category="API" color="#22c55e" />
          <TechCard name="Glue Schema" category="Governance" color="#eab308" />
          <TechCard name="CloudWatch" category="Monitoring" color="#ec4899" />
        </div>
      </div>
    </div>
  )
}

function ArchBox({ icon, label, sublabel, color, highlight }: { icon: React.ReactNode, label: string, sublabel: string, color: string, highlight?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: highlight ? `${color}15` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${highlight ? `${color}40` : 'rgba(255,255,255,0.05)'}`,
      borderRadius: '10px', padding: '12px',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{sublabel}</div>
      </div>
    </div>
  )
}

function FlowArrow({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
      <ArrowDown size={16} color={color} style={{ opacity: 0.5 }} />
    </div>
  )
}

function BenefitCard({ emoji, title, description, color }: { emoji: string, title: string, description: string, color: string }) {
  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}20`,
      borderRadius: '14px', padding: '20px',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{emoji}</div>
      <div style={{ fontWeight: 700, color, marginBottom: '8px', fontSize: '0.95rem' }}>{title}</div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.5 }}>{description}</p>
    </div>
  )
}

function TechCard({ name, category, color }: { name: string, category: string, color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '16px', textAlign: 'center',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: color, margin: '0 auto 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Cloud size={20} color="white" />
      </div>
      <div style={{ fontWeight: 700, color: 'white', fontSize: '0.85rem', marginBottom: '4px' }}>{name}</div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{category}</div>
    </div>
  )
}
