import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Zap, Shield, Database, GitBranch, 
  TrendingUp, Clock, CheckCircle, AlertCircle,
  BarChart3, Layers, Cpu, Network
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import PerformanceDemo from './components/PerformanceDemo';
import ArchitectureView from './components/ArchitectureView';
import LiveMetrics from './components/LiveMetrics';
import GovernanceView from './components/GovernanceView';

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'performance' | 'architecture' | 'governance'>('dashboard');
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto-rotate views for self-pitching demo
  useEffect(() => {
    if (!isAutoPlay) return;
    
    const views: typeof activeView[] = ['dashboard', 'performance', 'architecture', 'governance'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % views.length;
      setActiveView(views[currentIndex]);
    }, 15000); // 15 seconds per view
    
    return () => clearInterval(interval);
  }, [isAutoPlay]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Nexus Blueprint 3.0</h1>
                <p className="text-sm text-purple-300">Event-Sourced Microservices Platform</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAutoPlay 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isAutoPlay ? '⏸ Pause Demo' : '▶ Auto Play'}
              </motion.button>
              
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 text-sm font-medium">Production Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { id: 'dashboard', label: 'Live Dashboard', icon: Activity },
              { id: 'performance', label: 'Performance Demo', icon: TrendingUp },
              { id: 'architecture', label: 'Architecture', icon: Layers },
              { id: 'governance', label: 'Governance', icon: Shield }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setActiveView(tab.id as typeof activeView);
                  setIsAutoPlay(false);
                }}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all ${
                  activeView === tab.id
                    ? 'text-white border-b-2 border-purple-500 bg-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'dashboard' && <Dashboard />}
            {activeView === 'performance' && <PerformanceDemo />}
            {activeView === 'architecture' && <ArchitectureView />}
            {activeView === 'governance' && <GovernanceView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Live Metrics Sidebar */}
      <LiveMetrics />

      {/* Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="grid grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">99.99%</div>
              <div className="text-xs text-gray-400">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">&lt;200ms</div>
              <div className="text-xs text-gray-400">Latency (p99)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">10K+</div>
              <div className="text-xs text-gray-400">Events/sec</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">73%</div>
              <div className="text-xs text-gray-400">Cost Savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400">100%</div>
              <div className="text-xs text-gray-400">Audit Trail</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">&lt;5s</div>
              <div className="text-xs text-gray-400">Snapshot Time</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
