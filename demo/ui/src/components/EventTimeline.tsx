import { GitBranch, RefreshCw, Clock, Hash, FileJson, Zap } from 'lucide-react'
import { Event } from '../App'

interface Props {
  events: Event[]
  onRefresh: () => void
}

export default function EventTimeline({ events, onRefresh }: Props) {
  const getEventColor = (type: string) => {
    switch (type) {
      case 'OrderPlaced': return { gradient: 'from-green-500 to-emerald-400', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' }
      case 'OrderCancelled': return { gradient: 'from-red-500 to-pink-400', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
      case 'OrderShipped': return { gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' }
      default: return { gradient: 'from-purple-500 to-pink-400', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' }
    }
  }

  return (
    <div className="glass-card p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center glow-purple">
            <GitBranch className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Event Stream</h2>
            <p className="text-white/50">Real-time event sourcing timeline</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold hover:bg-white/10 hover:text-white transition-all duration-300 flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {events.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-10 h-10 text-white/30" />
          </div>
          <h3 className="text-xl font-bold text-white/70 mb-2">No Events Yet</h3>
          <p className="text-white/40">Events will appear here as they occur</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-transparent"></div>

          <div className="space-y-6">
            {events.map((event, index) => {
              const colors = getEventColor(event.eventType)
              return (
                <div
                  key={event.eventId}
                  className="relative pl-16 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Timeline Dot */}
                  <div className={`absolute left-4 w-5 h-5 rounded-full bg-gradient-to-br ${colors.gradient} border-4 border-[#0c0c1d] z-10`}></div>

                  <div className="order-card">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {event.eventType}
                          </span>
                          <span className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm font-mono">
                            v{event.version}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <Hash className="w-5 h-5 text-indigo-400" />
                            <div>
                              <div className="text-xs text-white/40 font-medium">Event ID</div>
                              <code className="text-white/80 text-sm">{event.eventId.substring(0, 16)}...</code>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <Clock className="w-5 h-5 text-cyan-400" />
                            <div>
                              <div className="text-xs text-white/40 font-medium">Timestamp</div>
                              <div className="text-white/80 text-sm">{new Date(event.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>

                        {/* Payload Preview */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <FileJson className="w-4 h-4 text-white/40" />
                            <span className="text-xs text-white/40 font-semibold uppercase">Payload</span>
                          </div>
                          <pre className="text-xs text-white/60 font-mono overflow-x-auto">
                            {JSON.stringify(event.payload, null, 2).substring(0, 200)}
                            {JSON.stringify(event.payload).length > 200 && '...'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
