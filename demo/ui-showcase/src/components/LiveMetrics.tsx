import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Zap, Database, Network, 
  TrendingUp, TrendingDown, Minus,
  ChevronRight, ChevronLeft
} from 'lucide-react';

const LiveMetrics = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [metrics, setMetrics] = useState({
    eventsProcessed: 0,
    commandsExecuted: 0,
    queriesServed: 0,
    avgLatency: 0,
    throughput: 0,
    errorRate: 0
  });

  const [trends, setTrends] = useState({
    eventsProcessed: 'up',
    commandsExecuted: 'up',
    queriesServed: 'up',
    avgLatency: 'down',
    throughput: 'up',
    errorRate: 'down'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        eventsProcessed: prev.eventsProcessed + Math.floor(Math.random() * 100) + 50,
        commandsExecuted: prev.commandsExecuted + Math.floor(Math.random() * 20) + 10,
        queriesServed: prev.queriesServed + Math.floor(Math.random() * 50) + 25,
        avgLatency: Math.max(50, Math.min(200, prev.avgLatency + (Math.random() - 0.5) * 20)),
        throughput: Math.max(5000, Math.min(15000, prev.throughput + (Math.random() - 0.5) * 500)),
        errorRate: Math.max(0, Math.min(1, prev.errorRate + (Math.random() - 0.5) * 0.1))
      }));

      // Update trends
      setTrends({
        eventsProcessed: Math.random() > 0.3 ? 'up' : 'stable',
        commandsExecuted: Math.random() > 0.3 ? 'up' : 'stable',
        queriesServed: Math.random() > 0.3 ? 'up' : 'stable',
        avgLatency: Math.random() > 0.6 ? 'down' : 'stable',
        throughput: Math.random() > 0.4 ? 'up' : 'stable',
        errorRate: Math.random() > 0.7 ? 'down' : 'stable'
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-400" />;
      default: return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string, isGoodWhenUp: boolean = true) => {
    if (trend === 'stable') return 'text-gray-400';
    if (isGoodWhenUp) {
      return trend === 'up' ? 'text-green-400' : 'text-red-400';
    } else {
      return trend === 'down' ? 'text-green-400' : 'text-red-400';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  return (
    <motion.div
      initial={{ x: 300 }}
      animate={{ x: isExpanded ? 0 : 280 }}
      className="fixed right-0 top-1/4 z-50"
    >
      <div className="relative">
        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -left-10 top-4 w-10 h-10 bg-purple-500 rounded-l-lg flex items-center justify-center text-white shadow-lg"
        >
          {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </motion.button>

        {/* Metrics Panel */}
        <div className="w-80 bg-slate-900/95 backdrop-blur-xl border-l border-t border-b border-white/10 rounded-l-2xl shadow-2xl">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Live Metrics</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">Real-time system performance</p>
          </div>

          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {/* Events Processed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Events Processed</span>
                </div>
                {getTrendIcon(trends.eventsProcessed)}
              </div>
              <div className={`text-2xl font-bold ${getTrendColor(trends.eventsProcessed)}`}>
                {formatNumber(metrics.eventsProcessed)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total since start</div>
            </motion.div>

            {/* Commands Executed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Commands Executed</span>
                </div>
                {getTrendIcon(trends.commandsExecuted)}
              </div>
              <div className={`text-2xl font-bold ${getTrendColor(trends.commandsExecuted)}`}>
                {formatNumber(metrics.commandsExecuted)}
              </div>
              <div className="text-xs text-gray-500 mt-1">CQRS write operations</div>
            </motion.div>

            {/* Queries Served */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Queries Served</span>
                </div>
                {getTrendIcon(trends.queriesServed)}
              </div>
              <div className={`text-2xl font-bold ${getTrendColor(trends.queriesServed)}`}>
                {formatNumber(metrics.queriesServed)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Read operations</div>
            </motion.div>

            {/* Average Latency */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Avg Latency</span>
                </div>
                {getTrendIcon(trends.avgLatency)}
              </div>
              <div className={`text-2xl font-bold ${getTrendColor(trends.avgLatency, false)}`}>
                {metrics.avgLatency.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-500 mt-1">p99 response time</div>
            </motion.div>

            {/* Throughput */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">Throughput</span>
                </div>
                {getTrendIcon(trends.throughput)}
              </div>
              <div className={`text-2xl font-bold ${getTrendColor(trends.throughput)}`}>
                {formatNumber(metrics.throughput)}/s
              </div>
              <div className="text-xs text-gray-500 mt-1">Events per second</div>
            </motion.div>

            {/* Error Rate */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-gray-300">Error Rate</span>
                </div>
                {getTrendIcon(trends.errorRate)}
              </div>
              <div className={`text-2xl font-bold ${getTrendColor(trends.errorRate, false)}`}>
                {metrics.errorRate.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Failed operations</div>
            </motion.div>
          </div>

          {/* Status Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">All Systems Operational</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveMetrics;
